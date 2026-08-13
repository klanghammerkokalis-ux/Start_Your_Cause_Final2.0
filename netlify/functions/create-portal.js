const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PRICES = new Set([
  process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1TMAwiRyNZ1TUldSZ7tIW7wi',
  process.env.STRIPE_ANNUAL_PRICE_ID || 'price_1TMAyDRyNZ1TUldSuM557LTK',
]);

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

function assertSafeStripeMode() {
  const context = process.env.CONTEXT || 'production';
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  const isPreview = context === 'deploy-preview' || context === 'branch-deploy';

  if (isPreview && secretKey.startsWith('sk_live_')) {
    throw new Error('Deploy previews require a Stripe test secret key');
  }
  if (context === 'production' && secretKey.startsWith('sk_test_')) {
    throw new Error('Production requires a Stripe live secret key');
  }
}

function getSiteUrl() {
  const context = process.env.CONTEXT || 'production';
  const isPreview = context === 'deploy-preview' || context === 'branch-deploy';
  const configured = isPreview
    ? process.env.DEPLOY_PRIME_URL
    : process.env.SITE_URL || process.env.URL;

  if (!configured) {
    throw new Error(isPreview ? 'DEPLOY_PRIME_URL is not configured' : 'SITE_URL is not configured');
  }
  const url = new URL(configured);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Site URL must use HTTP or HTTPS');
  }
  return url.origin;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    assertSafeStripeMode();
    const body = JSON.parse(event.body || '{}');
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

    if (!sessionId.startsWith('cs_')) {
      return json(400, { error: 'Invalid checkout session' });
    }

    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price'],
    });
    const purchasedPriceId = checkout.line_items
      && checkout.line_items.data
      && checkout.line_items.data[0]
      && checkout.line_items.data[0].price
      ? checkout.line_items.data[0].price.id
      : null;
    const paidCheckout = checkout.payment_status === 'paid'
      || checkout.payment_status === 'no_payment_required';
    const customerId = typeof checkout.customer === 'string'
      ? checkout.customer
      : checkout.customer && checkout.customer.id;

    if (!paidCheckout || !customerId || !ALLOWED_PRICES.has(purchasedPriceId)) {
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
