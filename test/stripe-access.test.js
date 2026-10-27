const test = require('node:test');
const assert = require('node:assert/strict');

const {
  FORMATION_PACKAGE_AMOUNT,
  isPaidFormationSession,
} = require('../netlify/functions/_stripe-access');

function formationSession(overrides = {}) {
  return {
    status: 'complete',
    payment_status: 'paid',
    mode: 'payment',
    metadata: { planId: 'annual' },
    currency: 'usd',
    amount_subtotal: FORMATION_PACKAGE_AMOUNT,
    amount_total: FORMATION_PACKAGE_AMOUNT,
    ...overrides,
  };
}

test('full-price formation checkout grants access', () => {
  assert.equal(isPaidFormationSession(formationSession()), true);
});

test('Stripe promotion code can reduce the total without blocking access', () => {
  assert.equal(isPaidFormationSession(formationSession({ amount_total: 4900 })), true);
});

test('a valid 100-percent Stripe discount can grant access', () => {
  assert.equal(isPaidFormationSession(formationSession({
    payment_status: 'no_payment_required',
    amount_total: 0,
  })), true);
});

test('unpaid, canceled, and incomplete checkouts do not grant access', () => {
  assert.equal(isPaidFormationSession(formationSession({ payment_status: 'unpaid' })), false);
  assert.equal(isPaidFormationSession(formationSession({ status: 'expired' })), false);
  assert.equal(isPaidFormationSession(formationSession({ status: 'open' })), false);
});

test('wrong product, currency, or original price does not grant access', () => {
  assert.equal(isPaidFormationSession(formationSession({ mode: 'subscription' })), false);
  assert.equal(isPaidFormationSession(formationSession({ metadata: { planId: 'monthly' } })), false);
  assert.equal(isPaidFormationSession(formationSession({ currency: 'eur' })), false);
  assert.equal(isPaidFormationSession(formationSession({ amount_subtotal: 4900 })), false);
  assert.equal(isPaidFormationSession(formationSession({ amount_total: 8000 })), false);
});
