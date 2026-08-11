const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1TMAwiRyNZ1TUldSZ7tIW7wi',
  },
  annual: {
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID || 'price_1TMAyDRyNZ1TUldSuM557LTK',
  },
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
    const planId = body.planId;
    const plan = PLANS[planId];

    if (!plan) {
      return json(400, { error: 'Invalid subscription plan' });
    }

    const siteUrl = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: siteUrl + '/?checkout_session_id={CHECKOUT_SESSION_ID}',
      cancel_url: siteUrl + '/?checkout_canceled=true',
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      metadata: { planId },
      subscription_data: { metadata: { planId } },
    });

    return json(200, { url: session.url });
  } catch (error) {
    console.error('Unable to create Stripe Checkout Session:', error.message);
    return json(500, { error: 'Unable to start checkout. Please try again.' });
  }
};
