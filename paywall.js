const PAYWALL_CONFIG = {
  plans: {
    monthly: {
      id: 'monthly', name: 'Monthly', price: 12, period: 'month',
      stripePriceId: 'price_1TMAwiRyNZ1TUldSZ7tIW7wi',
      features: [
        'All 8 formation documents',
        'All 4 yearly filing documents',
        'Form 990 / 990-EZ / 990-N prep guide',
        'Annual state report templates (all 56 jurisdictions)',
        'Annual board meeting minutes',
        'Donor acknowledgment letters (5 templates)',
        'State guide for all 50 states + territories',
        'Unlimited document regeneration',
        'Email support',
      ],
    },
    annual: {
      id: 'annual', name: 'Annual', price: 79, period: 'year',
      stripePriceId: 'price_1TMAyDRyNZ1TUldSuM557LTK',
      badge: 'Best value — save 45%',
      features: [
        'Everything in Monthly',
        'Priority email support',
        'New documents added automatically',
        'Annual compliance reminder emails',
        'Save $65 vs monthly',
      ],
    },
  },
  checkoutUrl: '/.netlify/functions/create-checkout',
};

const SESSION_KEY = 'syc_access';
const SESSION_EXPIRY_KEY = 'syc_access_expiry';

function hasAccess() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('subscribed') === 'true') {
    grantAccess(params.get('plan') || 'monthly');
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  }
  const token = sessionStorage.getItem(SESSION_KEY);
  const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
  if (token && token.indexOf('paid_') === 0 && expiry && Date.now() < parseInt(expiry)) return true;
  return false;
}

function grantAccess(plan) {
  const duration = plan === 'annual' ? 365*24*60*60*1000 : 31*24*60*60*1000;
  sessionStorage.setItem(SESSION_KEY, 'paid_' + Date.now());
  sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + duration).toString());
  sessionStorage.setItem('syc_plan', plan);
}

function revokeAccess() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
  sessionStorage.removeItem('syc_plan');
}

async function startCheckout(planId) {
  const plan = PAYWALL_CONFIG.plans[planId];
  if (!plan) return;
  try {
    const btn = document.getElementById('checkout-btn-' + planId);
    if (btn) { btn.textContent = 'Redirecting to payment...'; btn.disabled = true; }
    const res = await fetch(PAYWALL_CONFIG.checkoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: plan.stripePriceId,
        planId: planId,
        successUrl: window.location.origin + '/?subscribed=true&plan=' + planId,
        cancelUrl: window.location.origin + '/?canceled=true',
      }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  } catch (err) {
    console.error('Checkout error:', err);
    alert('Payment system unavailable. Please try again later.');
  }
}

function showPricingModal(context) {
  let existing = document.getElementById('pricing-modal');
  if (existing) { existing.style.display = 'flex'; return; }
  const monthly = PAYWALL_CONFIG.plans.monthly;
  const annual = PAYWALL_CONFIG.plans.annual;
  const modal = document.createElement('div');
  modal.id = 'pricing-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(44,36,24,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;font-family:DM Sans,sans-serif;';
  modal.innerHTML = `
    <div style="background:#fff9f4;border-radius:16px;max-width:680px;width:100%;padding:2.5rem 2rem;position:relative;max-height:90vh;overflow-y:auto">
      <button onclick="hidePricingModal()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:22px;cursor:pointer;color:#9e8e7e">✕</button>
      <div style="text-align:center;margin-bottom:2rem">
        <div style="font-size:12px;font-weight:500;color:#2d8f6f;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.5rem">Start Your Cause</div>
        <h2 style="font-family:Lora,serif;font-size:1.75rem;color:#2c2418;margin-bottom:.5rem">Unlock all documents</h2>
        <p style="color:#6b5c4c;font-size:15px;max-width:440px;margin:0 auto">Get access to all formation documents, yearly filing templates, and state-specific guides.</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
        <div style="background:#fff;border:1.5px solid #e2d5c6;border-radius:12px;padding:1.5rem">
          <div style="font-size:13px;font-weight:500;color:#9e8e7e;margin-bottom:.25rem;text-transform:uppercase">Monthly</div>
          <div style="font-size:2.2rem;font-family:Lora,serif;font-weight:600;color:#2c2418;line-height:1">$${monthly.price}</div>
          <div style="font-size:13px;color:#9e8e7e;margin-bottom:1.25rem">per month</div>
          <ul style="list-style:none;padding:0;margin:0 0 1.5rem;font-size:13px;color:#6b5c4c">
            ${monthly.features.map(f=>`<li style="padding:5px 0;border-bottom:1px solid #f0e9de;display:flex;gap:8px"><span style="color:#2d8f6f;flex-shrink:0">✓</span>${f}</li>`).join('')}
          </ul>
          <button id="checkout-btn-monthly" onclick="startCheckout('monthly')" style="width:100%;padding:11px;border-radius:8px;background:#fff;border:1.5px solid #c4e8d8;color:#1d6b52;font-family:DM Sans,sans-serif;font-size:14px;font-weight:500;cursor:pointer">Start monthly plan</button>
        </div>
        <div style="background:#fff;border:2px solid #2d8f6f;border-radius:12px;padding:1.5rem;position:relative">
          <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#2d8f6f;color:#fff;font-size:11px;font-weight:500;padding:4px 14px;border-radius:20px;white-space:nowrap">${annual.badge}</div>
          <div style="font-size:13px;font-weight:500;color:#2d8f6f;margin-bottom:.25rem;text-transform:uppercase">Annual</div>
          <div style="font-size:2.2rem;font-family:Lora,serif;font-weight:600;color:#2c2418;line-height:1">$${annual.price}</div>
          <div style="font-size:13px;color:#9e8e7e;margin-bottom:1.25rem">per year ($${(annual.price/12).toFixed(2)}/mo)</div>
          <ul style="list-style:none;padding:0;margin:0 0 1.5rem;font-size:13px;color:#6b5c4c">
            ${annual.features.map(f=>`<li style="padding:5px 0;border-bottom:1px solid #f0e9de;display:flex;gap:8px"><span style="color:#2d8f6f;flex-shrink:0">✓</span>${f}</li>`).join('')}
          </ul>
          <button id="checkout-btn-annual" onclick="startCheckout('annual')" style="width:100%;padding:11px;border-radius:8px;background:#2d8f6f;border:none;color:#fff;font-family:DM Sans,sans-serif;font-size:14px;font-weight:500;cursor:pointer">Start annual plan →</button>
        </div>
      </div>
      <p style="text-align:center;font-size:12px;color:#9e8e7e">🔒 Secure payment via Stripe · Cancel anytime · 7-day money-back guarantee</p>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) hidePricingModal(); });
  document.body.appendChild(modal);
}

function hidePricingModal() {
  const modal = document.getElementById('pricing-modal');
  if (modal) modal.style.display = 'none';
}

function showAccessGranted(plan) {
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:72px;left:50%;transform:translateX(-50%);background:#2d8f6f;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;z-index:9998;font-family:DM Sans,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.15)';
  banner.textContent = `✓ Access granted! Welcome to Start Your Cause ${plan.name}.`;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

function paywallGate(callback, context) {
  const token = sessionStorage.getItem(SESSION_KEY);
  if (token && !token.startsWith('paid_')) {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
  }
  if (hasAccess()) { callback(); } else { showPricingModal(context); }
}

function renderPricingSection(containerId) {
  // Pricing cards are now hardcoded in index.html — nothing to do here
}
