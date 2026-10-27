const FORMATION_PACKAGE_AMOUNT = 7900;

function isPaidFormationSession(session) {
  if (!session) return false;

  const paid = session.payment_status === 'paid'
    || session.payment_status === 'no_payment_required';
  const subtotal = Number(session.amount_subtotal);
  const total = Number(session.amount_total);

  return session.status === 'complete'
    && paid
    && session.mode === 'payment'
    && session.metadata?.planId === 'annual'
    && session.currency === 'usd'
    // Stripe reports amount_subtotal before promotion codes and amount_total after.
    // Verify the product's full price while allowing a legitimate Stripe discount.
    && subtotal === FORMATION_PACKAGE_AMOUNT
    && Number.isFinite(total)
    && total >= 0
    && total <= subtotal;
}

module.exports = {
  FORMATION_PACKAGE_AMOUNT,
  isPaidFormationSession,
};
