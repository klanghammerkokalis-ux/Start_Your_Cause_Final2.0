const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PRICES = new Set([
  process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1TMAwiRyNZ1TUldSZ7tIW7wi',
  process.env.STRIPE_ANNUAL_PRICE_ID || 'price_1TMAyDRyNZ1TUldSuM557LTK',
]);

async function getVerifiedEmail(token) {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://lehgxworaefgsvkigjza.supabase.co';
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || 'sb_publishable_jm2MRb0rbT2pJ72EMflT1Q_pEeZJBiG';
  if (!token || !supabaseUrl || !supabasePublishableKey) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabasePublishableKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user && user.email ? user.email.trim().toLowerCase() : null;
}

async function findActiveCustomer(email) {
  const customers = await stripe.customers.list({ email, limit: 100 });
  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 100,
      expand: ['data.items.data.price'],
    });
    const active = subscriptions.data.some(subscription => {
      if (!['active', 'trialing'].includes(subscription.status)) return false;
      const price = subscription.items.data[0] && subscription.items.data[0].price;
      return price && ALLOWED_PRICES.has(price.id);
    });
    if (active) return customer.id;
  }
  return null;
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

function getSiteUrl() {
  const configured = process.env.SITE_URL || process.env.URL;
  if (!configured) throw new Error('SITE_URL is not configured');
  const url = new URL(configured);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('SITE_URL must use HTTP or HTTPS');
  }
  return url.origin;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    const authorization = event.headers.authorization || event.headers.Authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    let customerId = null;

    if (sessionId.startsWith('cs_')) {
      const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items.data.price', 'subscription'],
      });
      const purchasedPriceId = checkout.line_items
        && checkout.line_items.data
        && checkout.line_items.data[0]
        && checkout.line_items.data[0].price
        ? checkout.line_items.data[0].price.id
        : null;
      const subscription = checkout.subscription;
      const active = subscription && typeof subscription === 'object'
        && ['active', 'trialing'].includes(subscription.status);
      const paidCheckout = checkout.payment_status === 'paid'
        || checkout.payment_status === 'no_payment_required';
      if (paidCheckout && active && ALLOWED_PRICES.has(purchasedPriceId)) {
        customerId = typeof checkout.customer === 'string'
          ? checkout.customer
          : checkout.customer && checkout.customer.id;
      }
    } else if (token) {
      const email = await getVerifiedEmail(token);
      if (email) customerId = await findActiveCustomer(email);
    }

    if (!customerId) {
      return json(403, { error: 'Verified customer access is required' });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: getSiteUrl() + '/?billing_return=true',
    });

    return json(200, { url: portal.url });
  } catch (error) {
    console.error('Unable to create Stripe Customer Portal Session:', error.message);
    return json(403, { error: 'Unable to open billing management' });
  }
};
