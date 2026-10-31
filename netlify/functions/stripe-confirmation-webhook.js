const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { isPaidFormationSession } = require('./_stripe-access');

// Configure STRIPE_WEBHOOK_SECRET, RESEND_API_KEY and CONFIRMATION_FROM_EMAIL
// in Netlify before enabling the Stripe checkout.session.completed endpoint.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return { statusCode: 503, body: 'Webhook not configured' };
  let stripeEvent;
  try {
    const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    const payload = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
    stripeEvent = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    return { statusCode: 400, body: 'Invalid Stripe signature' };
  }
  if (stripeEvent.type !== 'checkout.session.completed') return { statusCode: 200, body: 'Ignored' };
  const session = stripeEvent.data.object;
  if (!isPaidFormationSession(session)) return { statusCode: 200, body: 'Not a completed Formation Package checkout' };
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONFIRMATION_FROM_EMAIL;
  const siteUrl = process.env.SITE_URL || process.env.URL;
  if (!apiKey || !from || !siteUrl) return { statusCode: 503, body: 'Confirmation email not configured' };
  const recipient = session.customer_details?.email || session.customer_email;
  if (!recipient || !session.customer) return { statusCode: 200, body: 'Customer email unavailable' };
  try {
    const customer = await stripe.customers.retrieve(session.customer);
    if (customer.deleted) return { statusCode: 200, body: 'Customer deleted' };
    const marker = 'syc_confirmation_' + session.id;
    if (customer.metadata?.syc_last_confirmation_session === session.id) {
      return { statusCode: 200, body: 'Already confirmed' };
    }
    const origin = new URL(siteUrl).origin;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'Idempotency-Key': marker },
      body: JSON.stringify({
        from, to: [recipient],
        subject: 'Your Start Your Cause Formation Package is ready',
        text: [
          'Your Start Your Cause Formation Package checkout is complete.',
          'You have 12 months of access to your formation documents and saved questionnaire. No automatic renewal.',
          'Log in using the same email address you used at checkout: ' + origin + '/',
          'If you need help accessing your account, reply to this email or contact hello@startyourcause.org.',
          'Start Your Cause',
        ].join(String.fromCharCode(10, 10)),
      }),
    });
    if (!response.ok) {
      console.error('Confirmation provider returned', response.status);
      return { statusCode: 502, body: 'Email provider unavailable' };
    }
    await stripe.customers.update(session.customer, {
      metadata: { syc_last_confirmation_session: session.id },
    });
    return { statusCode: 200, body: 'Confirmation accepted' };
  } catch (error) {
    console.error('Unable to process purchase confirmation', error.message);
    return { statusCode: 500, body: 'Confirmation processing failed' };
  }
};
