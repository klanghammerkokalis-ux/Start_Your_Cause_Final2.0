const PAYWALL_CONFIG = {
  stripePublishableKey: 'pk_live_51TLnV2RyNZ1TUldS1oCbXHlyJ7ySi72JfjrjHrjdS9eCLI5oyO3lZQNLVXT87NktLLixTNEygLJOdm9PExAyVwvI00sa2xJaBp',
  plans: {
    monthly: {
      id: 'monthly', name: 'Monthly', price: 12, period: 'month',
      stripePriceId: 'price_1U3daX0dD4h0E3se5Zo5Bne0',
      features: [
        'All 9 formation-packet documents',
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
      id: 'annual', name: 'Formation Package', price: 79, period: 'one-time',
      stripePriceId: 'price_1U3dbf0dD4h0E3seh4ZWKQmT',
      badge: 'Best value — no automatic renewal',
      features: [
        'All formation and annual document templates',
        '12 months of account and document access',
        'All document updates included',
        'Annual compliance calendar',
        'One payment — does not renew automatically',
      ],
    },
  },
  checkoutUrl: '/.netlify/functions/create-checkout',
};

const CHECKOUT_SESSION_KEY = 'syc_checkout_session_id';
const PLAN_KEY = 'syc_plan';
const AUTH_TOKEN_KEY = 'syc_auth_access_token';
const AUTH_REFRESH_KEY = 'syc_auth_refresh_token';
let verifiedAccess = null;
let verificationPromise = null;

function hasAccess() {
  return Boolean(verifiedAccess && verifiedAccess.verified);
}

function clearStoredAccess() {
  verifiedAccess = null;
  localStorage.removeItem(CHECKOUT_SESSION_KEY);
  localStorage.removeItem(PLAN_KEY);
}

async function verifyCustomerToken(token) {
  if (!token) return false;
  try {
    const response = await fetch('/.netlify/functions/verify-customer-access', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
    });
    const result = await response.json();
    if (!response.ok || !result.verified) {
      return false;
    }
    verifiedAccess = result;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(PLAN_KEY, result.planId);
    return true;
  } catch (error) {
    console.error('Unable to verify recovered access:', error);
    return false;
  }
}

function consumeAuthTokenFromUrl() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  if (hash.get('type') === 'recovery') sessionStorage.setItem('syc_password_recovery', 'true');
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(AUTH_REFRESH_KEY, refreshToken);
  if (token) window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return token;
}

async function refreshCustomerToken() {
  const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const configResponse = await fetch('/.netlify/functions/auth-config');
    const config = await configResponse.json();
    if (!configResponse.ok) return null;
    const response = await fetch(config.supabaseUrl + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: {
        apikey: config.supabasePublishableKey,
        Authorization: 'Bearer ' + config.supabasePublishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return null;
    const session = await response.json();
    if (!session.access_token) return null;
    localStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
    if (session.refresh_token) localStorage.setItem(AUTH_REFRESH_KEY, session.refresh_token);
    return session.access_token;
  } catch (error) {
    return null;
  }
}

async function verifyAccess(sessionId) {
  if (!sessionId) return false;

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    clearStoredAccess();
    return false;
  }

  const response = await fetch('/.netlify/functions/verify-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({ sessionId }),
  });

  const result = await response.json();
  if (!response.ok || !result.verified) {
    clearStoredAccess();
    return false;
  }

  verifiedAccess = result;
  localStorage.setItem(CHECKOUT_SESSION_KEY, sessionId);
  localStorage.setItem(PLAN_KEY, result.planId);
  return true;
}

async function restoreVerifiedAccess() {
  if (verificationPromise) return verificationPromise;

  verificationPromise = (async () => {
    const params = new URLSearchParams(window.location.search);
    const returnedSessionId = params.get('checkout_session_id');
    const canceled = params.get('checkout_canceled') === 'true';
    const storedSessionId = localStorage.getItem(CHECKOUT_SESSION_KEY);
    const returnedAuthToken = consumeAuthTokenFromUrl();
    const storedAuthToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const sessionId = returnedSessionId || storedSessionId;

    if (canceled && typeof window.trackSycEvent === 'function') {
      window.trackSycEvent('checkout_cancel', {});
    }

    const authToken = returnedAuthToken || storedAuthToken;
    if (!sessionId && authToken) {
      let verified = await verifyCustomerToken(authToken);
      if (!verified && storedAuthToken && !returnedAuthToken) {
        const refreshedToken = await refreshCustomerToken();
        if (refreshedToken) verified = await verifyCustomerToken(refreshedToken);
      }
      if (verified && returnedAuthToken) {
        const plan = PAYWALL_CONFIG.plans[verifiedAccess.planId] || PAYWALL_CONFIG.plans.monthly;
        showAccessGranted(plan);
      }
      return verified;
    }

    if (!sessionId) {
      if (returnedSessionId || canceled) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      return false;
    }

    try {
      const verified = await verifyAccess(sessionId);
      if (verified && returnedSessionId) {
        const plan = PAYWALL_CONFIG.plans[verifiedAccess.planId] || PAYWALL_CONFIG.plans.monthly;
        const purchaseKey = 'syc_purchase_tracked_' + sessionId;
        if (!localStorage.getItem(purchaseKey) && typeof window.trackSycEvent === 'function') {
          window.trackSycEvent('purchase', {
            transaction_id: sessionId,
            currency: 'USD',
            value: plan.price,
            items: [{
              item_id: verifiedAccess.planId,
              item_name: plan.name,
              price: plan.price,
              quantity: 1
            }]
          });
          localStorage.setItem(purchaseKey, 'true');
        }
        showAccessGranted(plan);
      }
      return verified;
    } catch (error) {
      console.error('Unable to verify access:', error);
      clearStoredAccess();
      return false;
    } finally {
      if (returnedSessionId || canceled) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      if (document.getElementById('page-annual')?.classList.contains('active')) {
        initAnnualPage();
      }
    }
  })();

  const result = await verificationPromise;
  verificationPromise = null;
  return result;
}

async function requestAccessEmail(email, statusElement, button) {
  const originalText = button.textContent;
  try {
    button.disabled = true;
    button.textContent = 'Sending link...';
    statusElement.textContent = '';
    const configResponse = await fetch('/.netlify/functions/auth-config');
    const config = await configResponse.json();
    if (!configResponse.ok) throw new Error(config.error || 'Account recovery is unavailable');

    const redirectTo = window.location.origin + '/';
    const response = await fetch(config.supabaseUrl + '/auth/v1/otp?redirect_to=' + encodeURIComponent(redirectTo), {
      method: 'POST',
      headers: {
        apikey: config.supabasePublishableKey,
        Authorization: 'Bearer ' + config.supabasePublishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, create_user: true }),
    });
    if (!response.ok) throw new Error('Unable to send the sign-in link');
    statusElement.style.color = '#1d6b52';
    statusElement.textContent = 'Check your email for a one-time access link. It may take a few minutes.';
    button.textContent = 'Link sent';
  } catch (error) {
    console.error('Unable to send access link:', error);
    statusElement.style.color = '#8a2525';
    statusElement.textContent = 'We could not send the access link. Please try again or email hello@startyourcause.org.';
    button.disabled = false;
    button.textContent = originalText;
  }
}

function showAccessRecovery() {
  if (typeof showAccountModal === 'function') {
    showAccountModal('login');
    return;
  }
  let existing = document.getElementById('access-recovery-modal');
  if (existing) { existing.style.display = 'flex'; return; }

  const modal = document.createElement('div');
  modal.id = 'access-recovery-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(44,36,24,.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;font-family:DM Sans,sans-serif';
  modal.innerHTML = `
    <div style="background:#fff9f4;border-radius:16px;max-width:470px;width:100%;padding:2rem;position:relative">
      <button type="button" aria-label="Close" data-close-access style="position:absolute;right:1rem;top:1rem;background:none;border:0;font-size:21px;cursor:pointer;color:#9e8e7e">✕</button>
      <div style="font-size:12px;color:#2d8f6f;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.4rem">Returning customer</div>
      <h2 style="font-family:Lora,serif;font-size:1.55rem;margin:0 0 .5rem;color:#2c2418">Restore document access</h2>
      <p style="font-size:14px;color:#6b5c4c;line-height:1.6;margin:0 0 1rem">Enter the email used at checkout. We’ll email a one-time sign-in link, confirm your access, and load nonprofit answers saved to your account.</p>
      <label for="access-email" style="display:block;font-size:14px;font-weight:500;margin-bottom:4px">Checkout email</label>
      <input id="access-email" type="email" autocomplete="email" required style="width:100%;padding:11px 12px;border:1.5px solid #e2d5c6;border-radius:8px;font-size:15px;margin-bottom:.75rem">
      <button type="button" data-send-access style="width:100%;padding:11px;border:0;border-radius:8px;background:#2d8f6f;color:#fff;font-size:14px;font-weight:500;cursor:pointer">Email my access link</button>
      <p data-access-status aria-live="polite" style="font-size:13px;line-height:1.5;margin:.75rem 0 0"></p>
      <p style="font-size:12px;color:#9e8e7e;line-height:1.5;margin:1rem 0 0">Answers saved while you were signed in are available across your devices. Answers entered before creating an account may remain only in the original browser.</p>
    </div>`;
  const close = () => { modal.style.display = 'none'; };
  modal.querySelector('[data-close-access]').addEventListener('click', close);
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  modal.querySelector('[data-send-access]').addEventListener('click', () => {
    const input = modal.querySelector('#access-email');
    if (!input.reportValidity()) return;
    requestAccessEmail(input.value.trim().toLowerCase(), modal.querySelector('[data-access-status]'), modal.querySelector('[data-send-access]'));
  });
  document.body.appendChild(modal);
  modal.querySelector('#access-email').focus();
}

function revokeAccess() {
  clearStoredAccess();
}

async function openBillingPortal(btn) {
  const originalText = btn ? btn.textContent : '';
  try {
    if (btn) {
      btn.textContent = 'Opening billing...';
      btn.disabled = true;
    }

    const verified = hasAccess() || await restoreVerifiedAccess();
    const sessionId = localStorage.getItem(CHECKOUT_SESSION_KEY);
    if (!verified) {
      showAccessRecovery();
      if (btn) {
        btn.textContent = originalText;
        btn.disabled = false;
      }
      return;
    }
    const authToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if (typeof window.trackSycEvent === 'function') {
      window.trackSycEvent('manage_subscription', {});
    }

    const response = await fetch('/.netlify/functions/create-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: 'Bearer ' + authToken } : {}),
      },
      body: JSON.stringify({ sessionId }),
    });
    const result = await response.json();
    if (!response.ok || !result.url) {
      throw new Error(result.error || 'Billing portal unavailable');
    }
    window.location.href = result.url;
  } catch (error) {
    console.error('Unable to open billing management:', error);
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
    alert('We could not open billing management. Email hello@startyourcause.org for help.');
  }
}

async function startCheckout(planId) {
  const plan = PAYWALL_CONFIG.plans[planId];
  if (!plan) return;
  const accountToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!accountToken) {
    if (typeof showAccountModal === 'function') showAccountModal('signup');
    return;
  }
  const btn = document.getElementById('checkout-btn-' + planId);
  try {
    if (btn) { btn.textContent = 'Redirecting to payment...'; btn.disabled = true; }
    if (typeof window.trackSycEvent === 'function') {
      window.trackSycEvent('begin_checkout', {
        currency: 'USD',
        value: plan.price,
        items: [{ item_id: planId, item_name: plan.name, price: plan.price, quantity: 1 }],
        checkout_source: 'paywall_modal'
      });
    }
    const res = await fetch(PAYWALL_CONFIG.checkoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accountToken },
      body: JSON.stringify({
        planId: planId,
      }),
    });
    if (!res.ok) throw new Error('Checkout request failed with status ' + res.status);
    const data = await res.json();
    if (!data.url) throw new Error(data.error || 'Checkout URL missing');
    window.location.href = data.url;
  } catch (err) {
    console.error('Checkout error:', err);
    if (typeof window.trackSycEvent === 'function') {
      window.trackSycEvent('checkout_error', {
        plan_id: planId,
        checkout_source: 'paywall_modal',
        error_message: err.message
      });
    }
    if (btn) {
      btn.textContent = planId === 'annual' ? 'Get the Formation Package →' : 'Start compliance membership';
      btn.disabled = false;
    }
    alert('Payment system unavailable. Please try again later.');
  }
}

function showPricingModal(context) {
  if (typeof window.trackSycEvent === 'function') {
    window.trackSycEvent('paywall_view', { paywall_context: context || 'unknown' });
  }
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
        <p style="color:#6b5c4c;font-size:15px;max-width:500px;margin:0 auto">Pay once for twelve months of formation access, or choose ongoing monthly compliance support.</p>
      </div>
      <div class="mobile-grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
        <div style="background:#fff;border:1.5px solid #e2d5c6;border-radius:12px;padding:1.5rem">
          <div style="font-size:13px;font-weight:500;color:#9e8e7e;margin-bottom:.25rem;text-transform:uppercase">Compliance membership</div>
          <div style="font-size:2.2rem;font-family:Lora,serif;font-weight:600;color:#2c2418;line-height:1">$${monthly.price}</div>
          <div style="font-size:13px;color:#9e8e7e;margin-bottom:1.25rem">per month</div>
          <ul style="list-style:none;padding:0;margin:0 0 1.5rem;font-size:13px;color:#6b5c4c">
            ${monthly.features.map(f=>`<li style="padding:5px 0;border-bottom:1px solid #f0e9de;display:flex;gap:8px"><span style="color:#2d8f6f;flex-shrink:0">✓</span>${f}</li>`).join('')}
          </ul>
          <button id="checkout-btn-monthly" onclick="startCheckout('monthly')" style="width:100%;padding:11px;border-radius:8px;background:#fff;border:1.5px solid #c4e8d8;color:#1d6b52;font-family:DM Sans,sans-serif;font-size:14px;font-weight:500;cursor:pointer">Start compliance membership</button>
        </div>
        <div style="background:#fff;border:2px solid #2d8f6f;border-radius:12px;padding:1.5rem;position:relative">
          <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#2d8f6f;color:#fff;font-size:11px;font-weight:500;padding:4px 14px;border-radius:20px;white-space:nowrap">${annual.badge}</div>
          <div style="font-size:13px;font-weight:500;color:#2d8f6f;margin-bottom:.25rem;text-transform:uppercase">Formation Package</div>
          <div style="font-size:2.2rem;font-family:Lora,serif;font-weight:600;color:#2c2418;line-height:1">$${annual.price}</div>
          <div style="font-size:13px;color:#9e8e7e;margin-bottom:1.25rem">one payment · 12 months of access</div>
          <ul style="list-style:none;padding:0;margin:0 0 1.5rem;font-size:13px;color:#6b5c4c">
            ${annual.features.map(f=>`<li style="padding:5px 0;border-bottom:1px solid #f0e9de;display:flex;gap:8px"><span style="color:#2d8f6f;flex-shrink:0">✓</span>${f}</li>`).join('')}
          </ul>
          <button id="checkout-btn-annual" onclick="startCheckout('annual')" style="width:100%;padding:11px;border-radius:8px;background:#2d8f6f;border:none;color:#fff;font-family:DM Sans,sans-serif;font-size:14px;font-weight:500;cursor:pointer">Get the Formation Package →</button>
        </div>
      </div>
      <div style="text-align:center;margin-bottom:.75rem"><button type="button" onclick="hidePricingModal();showAccessRecovery()" style="background:none;border:0;color:#1d6b52;text-decoration:underline;font-size:14px;cursor:pointer">Already subscribed? Log in</button></div>
      <p style="text-align:center;font-size:12px;color:#9e8e7e">🔒 Secure payment via Stripe · Formation Package does not renew · Billing help: hello@startyourcause.org</p>
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

async function paywallGate(callback, context) {
  const verified = hasAccess() || await restoreVerifiedAccess();
  if (verified) {
    callback();
  } else {
    showPricingModal(context);
  }
}

function renderPricingSection(containerId) {
  // Pricing cards are now hardcoded in index.html — nothing to do here
}

window.addEventListener('load', function() {
  restoreVerifiedAccess();
});

// Launch copy accuracy pass. Keep customer-facing guidance aligned with current IRS
// eligibility rules without changing the underlying intake or payment behavior.
function applyLaunchCopyAccuracyFixes() {
  const replacements = [
    ['Plain language — no lawyer needed', 'Plain language — professional help when you need it'],
    ['Donations to your org are tax-deductible for donors. That means more people give — because they get a tax break for doing so.', 'After IRS recognition, qualifying contributions to a 501(c)(3) are generally tax-deductible for donors, subject to IRS rules and each donor’s circumstances.'],
    ['Donors can deduct their gifts on personal tax returns.', 'Qualifying contributions are generally deductible after IRS recognition, subject to IRS rules and the donor’s circumstances.'],
    ['No federal income tax on donations and grants.', 'Recognized 501(c)(3)s are generally exempt from federal income tax on income related to their exempt purposes.'],
    ['Board members generally serve as volunteers', 'Board compensation rules vary; any compensation should be reasonable, properly approved, and consistent with state law and governing documents'],
    ['Board members volunteer their time and cannot personally profit.', 'Board members must act in the nonprofit’s interests. Compensation, if any, should be reasonable, properly approved, and consistent with applicable law and governing documents.'],
    ['1023-EZ ($275) for orgs under $50,000/yr. Form 1023 ($600) for larger orgs. IRS typically responds in 3–6 months.', 'Form 1023-EZ ($275) is available only to organizations that satisfy all IRS eligibility requirements, including financial thresholds. Organizations that are not eligible use Form 1023 ($600).'],
    ['A rough guess — this helps determine whether to use Form 1023-EZ (under $50K) or 1023 (over $50K).', 'A rough estimate is helpful. Revenue and asset thresholds are part of Form 1023-EZ eligibility, but the IRS has additional eligibility requirements too.'],
    ['Form 1023-EZ: $275 (orgs under ~$50K/yr). Form 1023 full: $600.', 'Form 1023-EZ: $275 if your organization meets all IRS eligibility requirements. Form 1023: $600.'],
    ["Form 1023-EZ ($275) is for organizations that expect to have gross receipts under $50,000/year and assets under $250,000. It's simpler and faster. Form 1023 ($600) is for larger organizations and those that are churches, schools, hospitals, or supporting organizations — these must use the full form.", "Form 1023-EZ ($275) is available only if your organization meets every IRS eligibility requirement. Gross receipts and asset limits are part of that test, but they are not the only requirements. Organizations that are not eligible for Form 1023-EZ use Form 1023 ($600)."],
  ];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(node => {
    let value = node.nodeValue;
    replacements.forEach(([from, to]) => {
      if (value.includes(from)) value = value.replace(from, to);
    });
    node.nodeValue = value;
  });
}

document.addEventListener('DOMContentLoaded', applyLaunchCopyAccuracyFixes);

// Remove stale or unverified launch claims without changing product behavior.
function applyLaunchIntegrityFixes() {
  const replacements = [
    ['Trusted by nonprofit founders across all 50 states', 'Guidance for all 50 states and U.S. territories'],
    ['Priority email support', 'Email support'],
    ['Annual compliance reminder emails', 'Annual compliance calendar'],
    ['Compliance calendar & reminders', 'Compliance calendar'],
    ['Email deadline alerts', 'Self-managed filing reminders'],
    ['Nonprofit owner portal', 'Questionnaire answers saved in this browser'],
    ['New documents added automatically', 'New documents as we add them'],
    ['7-day money-back guarantee', 'Cancel anytime through Stripe'],
  ];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(node => {
    let value = node.nodeValue;
    replacements.forEach(([from, to]) => {
      if (value.includes(from)) value = value.replace(from, to);
    });
    node.nodeValue = value;
  });

  // Remove the unverified beta testimonial block if it is present.
  const all = Array.from(document.querySelectorAll('body *'));
  const testimonialMarker = all.find(el => /Testimonials from beta users/i.test(el.textContent || ''));
  if (testimonialMarker) {
    let block = testimonialMarker;
    for (let i = 0; i < 6 && block.parentElement; i++) {
      const text = block.textContent || '';
      if (/Sarah T\./.test(text) && /Marcus R\./.test(text) && /Diane M\./.test(text)) break;
      block = block.parentElement;
    }
    if (block && block !== document.body) block.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', applyLaunchIntegrityFixes);
