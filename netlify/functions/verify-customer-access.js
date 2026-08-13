const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PRICES = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1TMAwiRyNZ1TUldSZ7tIW7wi',
  annual: process.env.STRIPE_ANNUAL_PRICE_ID || 'price_1TMAyDRyNZ1TUldSuM557LTK',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

async function getVerifiedEmail(token) {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://lehgxworaefgsvkigjza.supabase.co';
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || 'sb_publishable_jm2MRb0rbT2pJ72EMflT1Q_pEeZJBiG';
  if (!supabaseUrl || !supabasePublishableKey) throw new Error('Account recovery is not configured');

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user && user.email ? user.email.trim().toLowerCase() : null;
}

async function findActivePlan(email) {
  const customers = await stripe.customers.list({ email, limit: 100 });
  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 100,
      expand: ['data.items.data.price'],
    });
    for (const subscription of subscriptions.data) {
      if (!['active', 'trialing'].includes(subscription.status)) continue;
      const priceId = subscription.items.data[0] && subscription.items.data[0].price
        ? subscription.items.data[0].price.id
        : null;
      const planId = Object.keys(ALLOWED_PRICES).find(key => ALLOWED_PRICES[key] === priceId);
      if (planId) return { planId, subscription };
    }
  }
  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const authorization = event.headers.authorization || event.headers.Authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!token) return json(401, { verified: false, error: 'Sign-in required' });

    const email = await getVerifiedEmail(token);
    if (!email) return json(401, { verified: false, error: 'The sign-in link is invalid or expired' });

    const match = await findActivePlan(email);
    if (!match) return json(403, { verified: false, error: 'No active subscription was found for this email' });

    return json(200, {
      verified: true,
      planId: match.planId,
      subscriptionStatus: match.subscription.status,
      currentPeriodEnd: match.subscription.current_period_end
        ? match.subscription.current_period_end * 1000
        : null,
    });
  } catch (error) {
    console.error('Unable to verify customer access:', error.message);
    return json(403, { verified: false, error: 'Unable to verify subscription' });
  }
};
