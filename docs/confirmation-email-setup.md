# Confirmation email setup

This feature is not active until configured and deployed.

1. Verify the startyourcause.org sending domain with Resend.
2. Add Netlify environment variables: RESEND_API_KEY, CONFIRMATION_FROM_EMAIL, STRIPE_WEBHOOK_SECRET, and SITE_URL.
3. Register the production Stripe webhook endpoint at https://startyourcause.org/.netlify/functions/stripe-confirmation-webhook for checkout.session.completed.
4. Use the signing secret from that specific endpoint in Netlify.
5. Test a discounted checkout and a regular checkout in an isolated test environment before merging.
6. Confirm the message is delivered and a returning customer can access saved answers.

The webhook sends only new completion events after registration. Previously completed checkouts, including Angie's, require a separate approved follow-up.
