const test = require('node:test');
const assert = require('node:assert/strict');
const { isPaidFormationSession } = require('../netlify/functions/_stripe-access');

test('fully discounted Formation Package is eligible for access', () => {
  const session = { status: 'complete', mode: 'payment', currency: 'usd', payment_status: 'paid', amount_subtotal: 7900, amount_total: 0, metadata: { planId: 'annual' } };
  assert.equal(isPaidFormationSession(session), true);
  assert.equal(isPaidFormationSession({ ...session, payment_status: 'unpaid' }), false);
  assert.equal(isPaidFormationSession({ ...session, status: 'open' }), false);
});
