const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PRICES = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1U3daX0dD4h0E3se5Zo5Bne0',
  annual: process.env.STRIPE_ANNUAL_PRICE_ID || 'price_1U3dbf0dD4h0E3seh4ZWKQmT',
};

async function getVerifiedEmail(event) {
  const authorization = event.headers.authorization || event.headers.Authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return null;

  const supabaseUrl = process.env.SUPABASE_URL || 'https://lehgxworaefgsvkigjza.supabase.co';
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || 'sb_publishable_jm2MRb0rbT2pJ72EMflT1Q_pEeZJBiG';
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user && user.email ? user.email.trim().toLowerCase() : null;
}

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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const authenticatedEmail = await getVerifiedEmail(event);
    if (!authenticatedEmail) {
      return json(401, { verified: false, error: 'Sign-in required' });
    }

    const body = JSON.parse(event.body || '{}');
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

    if (!sessionId.startsWith('cs_')) {
      return json(400, { error: 'Invalid checkout session' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items.data.price'],
    });

    const checkoutEmail = (session.customer_details && session.customer_details.email)
      || session.customer_email
      || null;
    if (!checkoutEmail || checkoutEmail.trim().toLowerCase() !== authenticatedEmail) {
      return json(403, {
        verified: false,
        error: 'This checkout belongs to a different account',
      });
    }

    const subscription = session.subscription;
    const subscriptionStatus = subscription && typeof subscription === 'object'
      ? subscription.status
      : null;
    const activeSubscription = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
    const paidCheckout = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
    const purchasedPriceId = session.line_items
      && session.line_items.data
      && session.line_items.data[0]
      && session.line_items.data[0].price
      ? session.line_items.data[0].price.id
      : null;
    const planId = Object.keys(ALLOWED_PRICES).find(
      (candidate) => ALLOWED_PRICES[candidate] === purchasedPriceId
    );

    if (!paidCheckout || !activeSubscription || !planId) {
      return json(403, {
        verified: false,
        error: 'No active subscription was found',
      });
    }

    const currentPeriodEnd = subscription.current_period_end
      ? subscription.current_period_end * 1000
      : null;

    return json(200, {
      verified: true,
      planId,
      subscriptionStatus,
      currentPeriodEnd,
    });
  } catch (error) {
    console.error('Unable to verify Stripe Checkout Session:', error.message);
    return json(403, {
      verified: false,
      error: 'Unable to verify subscription',
    });
  }
};
