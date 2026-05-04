const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }
  try {
    const body = JSON.parse(event.body);
    console.log('Received:', JSON.stringify(body));
    console.log('Secret key exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Secret key prefix:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'MISSING');
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: body.priceId, quantity: 1 }],
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
    });

    console.log('Session created:', session.id);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.log('Stripe error:', error.message);
    console.log('Error type:', error.type);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
