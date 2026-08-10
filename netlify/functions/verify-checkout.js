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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

    if (!sessionId.startsWith('cs_')) {
      return json(400, { error: 'Invalid checkout session' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items.data.price'],
    });

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
      customerId: typeof session.customer === 'string' ? session.customer : session.customer && session.customer.id,
    });
  } catch (error) {
    console.error('Unable to verify Stripe Checkout Session:', error.message);
    return json(403, {
      verified: false,
      error: 'Unable to verify subscription',
    });
  }
};
