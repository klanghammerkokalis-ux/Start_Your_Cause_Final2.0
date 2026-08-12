const ACCOUNT_ACCESS_KEY = 'syc_auth_access_token';
const ACCOUNT_REFRESH_KEY = 'syc_auth_refresh_token';
const ACCOUNT_PROJECT_KEY = 'default';
let accountConfig = null;
let accountUser = null;
let accountSaveTimer = null;

async function getAccountConfig() {
  if (accountConfig) return accountConfig;
  const response = await fetch('/.netlify/functions/auth-config');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Account service unavailable');
  accountConfig = data;
  return data;
}

function accountHeaders(token, extra) {
  return Object.assign({
    apikey: accountConfig.supabasePublishableKey,
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
  }, extra || {});
}

function storeAccountSession(session) {
  if (session.access_token) localStorage.setItem(ACCOUNT_ACCESS_KEY, session.access_token);
  if (session.refresh_token) localStorage.setItem(ACCOUNT_REFRESH_KEY, session.refresh_token);
  accountUser = session.user || accountUser;
  updateAccountButton();
}

function clearAccountSession() {
  localStorage.removeItem(ACCOUNT_ACCESS_KEY);
  localStorage.removeItem(ACCOUNT_REFRESH_KEY);
  accountUser = null;
  if (typeof revokeAccess === 'function') revokeAccess();
  updateAccountButton();
}

async function signOutAccount() {
  const token = localStorage.getItem(ACCOUNT_ACCESS_KEY);
  try {
    if (token) {
      await getAccountConfig();
      await fetch(accountConfig.supabaseUrl + '/auth/v1/logout', {
        method: 'POST',
        headers: accountHeaders(token),
      });
    }
  } finally {
    clearAccountSession();
  }
}

function hasAccountSession() {
  return Boolean(localStorage.getItem(ACCOUNT_ACCESS_KEY));
}

async function accountRequest(path, options) {
  await getAccountConfig();
  const response = await fetch(accountConfig.supabaseUrl + path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || 'Account request failed');
  return data;
}

async function signUpWithPassword(email, password) {
  await getAccountConfig();
  const data = await accountRequest('/auth/v1/signup', {
    method: 'POST',
    headers: accountHeaders(accountConfig.supabasePublishableKey),
    body: JSON.stringify({ email, password }),
  });
  if (data.access_token) storeAccountSession(data);
  return data;
}

async function signInWithPassword(email, password) {
  await getAccountConfig();
  const data = await accountRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: accountHeaders(accountConfig.supabasePublishableKey),
    body: JSON.stringify({ email, password }),
  });
  storeAccountSession(data);
  await loadAccountProject();
  if (typeof restoreVerifiedAccess === 'function') await restoreVerifiedAccess();
  return data;
}

async function getAccountUser() {
  const token = localStorage.getItem(ACCOUNT_ACCESS_KEY);
  if (!token) return null;
  try {
    const data = await accountRequest('/auth/v1/user', {
      headers: accountHeaders(token),
    });
    accountUser = data;
    updateAccountButton();
    return data;
  } catch (error) {
    const refreshed = typeof refreshCustomerToken === 'function' ? await refreshCustomerToken() : null;
    if (!refreshed) { clearAccountSession(); return null; }
    return getAccountUser();
  }
}

async function saveAccountProject(formData) {
  clearTimeout(accountSaveTimer);
  accountSaveTimer = setTimeout(async () => {
    const token = localStorage.getItem(ACCOUNT_ACCESS_KEY);
    const user = accountUser || await getAccountUser();
    if (!token || !user) return;
    try {
      await getAccountConfig();
      const response = await fetch(accountConfig.supabaseUrl + '/rest/v1/nonprofit_projects?on_conflict=user_id,project_key', {
        method: 'POST',
        headers: accountHeaders(token, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify({
          user_id: user.id,
          project_key: ACCOUNT_PROJECT_KEY,
          org_name: formData.fields.f_orgName || 'Untitled nonprofit',
          form_data: formData,
          current_step: formData.step || 0,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Unable to save project');
      setAccountSaveStatus('Saved to your account');
    } catch (error) {
      console.error('Account save failed:', error);
      setAccountSaveStatus('Not saved — check your connection', true);
    }
  }, 700);
}

async function loadAccountProject() {
  const token = localStorage.getItem(ACCOUNT_ACCESS_KEY);
  const user = accountUser || await getAccountUser();
  if (!token || !user) return null;
  await getAccountConfig();
  const query = '/rest/v1/nonprofit_projects?select=form_data&user_id=eq.' + encodeURIComponent(user.id)
    + '&project_key=eq.' + encodeURIComponent(ACCOUNT_PROJECT_KEY) + '&limit=1';
  const response = await fetch(accountConfig.supabaseUrl + query, { headers: accountHeaders(token) });
  if (!response.ok) return null;
  const rows = await response.json();
  if (rows[0] && rows[0].form_data) {
    localStorage.setItem('syc_form_data', JSON.stringify(rows[0].form_data));
    if (typeof restoreFormData === 'function') restoreFormData();
    setAccountSaveStatus('Loaded from your account');
    return rows[0].form_data;
  }
  return null;
}

function setAccountSaveStatus(message, isError) {
  const el = document.getElementById('account-save-status');
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? '#8a2525' : '#1d6b52';
}

function updateAccountButton() {
  document.querySelectorAll('[data-account-button]').forEach(button => {
    button.textContent = accountUser ? 'My Account' : 'Log in';
  });
}

function escapeAccountHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
}

function showAccountModal(mode) {
  let modal = document.getElementById('account-modal');
  if (modal) modal.remove();
  const signup = mode === 'signup';
  const signedIn = Boolean(accountUser);
  modal = document.createElement('div');
  modal.id = 'account-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(44,36,24,.7);z-index:10001;display:flex;align-items:center;justify-content:center;padding:1rem;font-family:DM Sans,sans-serif';
  modal.innerHTML = `<div style="background:#fff9f4;border-radius:16px;max-width:440px;width:100%;padding:2rem;position:relative">
    <button type="button" data-close aria-label="Close" style="position:absolute;right:1rem;top:1rem;background:none;border:0;font-size:21px;cursor:pointer">✕</button>
    <div style="font-size:12px;color:#2d8f6f;text-transform:uppercase;letter-spacing:.08em">Customer account</div>
    <h2 style="font-family:Lora,serif;margin:.35rem 0 1rem">${signedIn ? 'My account' : (signup ? 'Create your account' : 'Log in')}</h2>
    ${signedIn ? `<p style="font-size:14px;color:#6b5c4c">Signed in as <strong>${escapeAccountHtml(accountUser.email)}</strong>. Your nonprofit information is saved securely to this account.</p>` : ''}
    <form data-account-form style="${signedIn ? 'display:none' : ''}">
      <label style="display:block;font-size:14px;font-weight:500">Email</label><input name="email" type="email" required autocomplete="email" style="width:100%;padding:11px;margin:.25rem 0 .75rem;border:1.5px solid #e2d5c6;border-radius:8px">
      <label style="display:block;font-size:14px;font-weight:500">Password</label><input name="password" type="password" required minlength="8" autocomplete="${signup ? 'new-password' : 'current-password'}" style="width:100%;padding:11px;margin:.25rem 0 .75rem;border:1.5px solid #e2d5c6;border-radius:8px">
      <button type="submit" style="width:100%;padding:11px;border:0;border-radius:8px;background:#2d8f6f;color:white;font-weight:500">${signup ? 'Create account' : 'Log in'}</button>
    </form>
    <p data-status aria-live="polite" style="font-size:13px;line-height:1.5"></p>
    <button type="button" data-switch style="${signedIn ? 'display:none;' : ''}background:none;border:0;color:#1d6b52;text-decoration:underline;cursor:pointer;padding:0">${signup ? 'Already have an account? Log in' : 'New customer? Create an account'}</button>
    ${accountUser ? '<button type="button" data-signout style="display:block;margin-top:1rem;background:none;border:0;color:#8a2525;text-decoration:underline;cursor:pointer;padding:0">Log out</button>' : ''}
  </div>`;
  modal.querySelector('[data-close]').onclick = () => modal.remove();
  modal.querySelector('[data-switch]').onclick = () => showAccountModal(signup ? 'login' : 'signup');
  modal.querySelector('[data-signout]')?.addEventListener('click', async () => { await signOutAccount(); modal.remove(); });
  modal.querySelector('form').onsubmit = async event => {
    event.preventDefault();
    const status = modal.querySelector('[data-status]');
    const submit = modal.querySelector('[type=submit]');
    submit.disabled = true; status.textContent = 'Please wait...';
    try {
      const form = new FormData(event.target);
      const result = signup
        ? await signUpWithPassword(form.get('email').trim().toLowerCase(), form.get('password'))
        : await signInWithPassword(form.get('email').trim().toLowerCase(), form.get('password'));
      if (signup && !result.access_token) {
        status.textContent = 'Check your email to confirm your account, then log in.';
        submit.disabled = false;
      } else {
        modal.remove();
        go('form');
      }
    } catch (error) {
      status.style.color = '#8a2525'; status.textContent = error.message; submit.disabled = false;
    }
  };
  document.body.appendChild(modal);
}

window.addEventListener('load', async () => {
  await getAccountUser();
  if (accountUser) await loadAccountProject();
});
