/* ============================================================
   Mr. Kim's CAFE — Auth (login / signup / logout / session)
   Owns: window.authState
   Public globals: authHeader, saveAuthState, loadAuthState, updateAuthUI,
                   openAuthModal, closeAuthModal, switchAuthTab,
                   doLogin, resetSignupForm, doRegister, doLogout
   Depends on globals (defined in index.js or other modules):
     validatePhone, phoneDigits, showToast,
     loadFavorites (index-favorites.js),
     prefillResContactIfLoggedIn (index.js),
     closeProfileModal (index.js)
   ============================================================ */
(function () {

  /* ─── AUTH STATE ─── */
  // Owned by this module; exposed on window so index.js, index-reserve.js,
  // index-favorites.js can read/write it across script boundaries.
  window.authState = { customer: null, token: null, favorites: [] };

  function authHeader() {
    return window.authState.token ? { 'x-customer-token': window.authState.token } : {};
  }

  function saveAuthState(remember) {
    const payload = JSON.stringify({ customer: window.authState.customer, token: window.authState.token });
    if (remember) {
      localStorage.setItem('kims-auth', payload);
      sessionStorage.removeItem('kims-auth');
    } else {
      sessionStorage.setItem('kims-auth', payload);
      localStorage.removeItem('kims-auth');
    }
  }

  function loadAuthState() {
    try {
      const raw = localStorage.getItem('kims-auth') || sessionStorage.getItem('kims-auth') || 'null';
      const saved = JSON.parse(raw);
      if (saved?.token && saved?.customer) {
        window.authState.token = saved.token;
        window.authState.customer = saved.customer;
      }
    } catch (e) { console.warn('[auth-state] corrupt storage, ignoring', e); }
  }

  function updateAuthUI() {
    const loggedIn = !!window.authState.customer;
    document.getElementById('btn-auth-login').style.display = loggedIn ? 'none' : '';
    document.getElementById('btn-auth-profile').style.display = loggedIn ? '' : 'none';
    // Sprint 2.7+: the old `.group-tab[data-group="favorites"]` was removed when
    // group tabs were replaced with dynamic categories. The Favorites button
    // now lives next to the search bar as `#menu-fav-btn`. Use optional chaining
    // so this stays safe even if the button is removed in a future redesign.
    const favBtn = document.getElementById('menu-fav-btn');
    if (loggedIn) {
      const initial = (window.authState.customer.name || '?')[0].toUpperCase();
      document.getElementById('profile-avatar').textContent = initial;
      document.getElementById('profile-name-short').textContent = window.authState.customer.name.split(' ')[0];
      favBtn?.classList.add('show');
      if (typeof prefillResContactIfLoggedIn === 'function') prefillResContactIfLoggedIn();
    } else {
      favBtn?.classList.remove('show');
    }
  }

  /* ─── AUTH MODAL ─── */
  function openAuthModal(tab) {
    document.getElementById('auth-overlay').classList.add('open');
    switchAuthTab(tab || 'login');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    document.getElementById('auth-overlay').classList.remove('open');
    document.body.style.overflow = '';
    resetSignupForm();
  }

  // Wire overlay click-to-close once DOM is ready.
  function wireAuthOverlay() {
    const ov = document.getElementById('auth-overlay');
    if (ov) ov.addEventListener('click', (e) => { if (e.target === ov) closeAuthModal(); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAuthOverlay);
  } else {
    wireAuthOverlay();
  }

  function switchAuthTab(tab) {
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
    document.getElementById('auth-pane-login').style.display  = tab === 'login'  ? '' : 'none';
    document.getElementById('auth-pane-signup').style.display = tab === 'signup' ? '' : 'none';
    document.getElementById('login-error').classList.remove('show');
    document.getElementById('signup-error').classList.remove('show');
  }

  /* ─── LOGIN ─── */
  async function doLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.remove('show');
    if (!validatePhone(phone)) { errEl.textContent = 'Please enter a valid 11-digit phone number.'; errEl.classList.add('show'); return; }
    if (!password) { errEl.textContent = 'Please enter your password.'; errEl.classList.add('show'); return; }
    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    try {
      const res = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneDigits(phone), password })
      });
      const data = await res.json();
      if (!res.ok) { errEl.textContent = data.error || 'Login failed'; errEl.classList.add('show'); return; }
      window.authState.customer = data.customer;
      window.authState.token = data.token;
      const remember = document.getElementById('login-remember')?.checked || false;
      saveAuthState(remember);
      if (typeof loadFavorites === 'function') await loadFavorites();
      updateAuthUI();
      closeAuthModal();
      showToast('✅ ' + (document.getElementById('html-root').lang === 'ar' ? `مرحباً ${data.customer.name}!` : `Welcome back, ${data.customer.name}!`));
    } catch (e) {
      errEl.textContent = 'Network error. Please try again.';
      errEl.classList.add('show');
    } finally { btn.disabled = false; }
  }

  function resetSignupForm() {
    document.getElementById('signup-phone').value = '';
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-password2').value = '';
    document.getElementById('signup-birthdate').value = '';
  }

  /* ─── SIGNUP: Register ─── */
  async function doRegister() {
    const phone     = document.getElementById('signup-phone').value.trim();
    const name      = document.getElementById('signup-name').value.trim();
    const email     = document.getElementById('signup-email').value.trim();
    const password  = document.getElementById('signup-password').value;
    const password2 = document.getElementById('signup-password2').value;
    const birthdate = document.getElementById('signup-birthdate').value;
    const errEl     = document.getElementById('signup-error');
    errEl.classList.remove('show');

    if (!validatePhone(phone)) { errEl.textContent = 'Please enter a valid 11-digit phone number.'; errEl.classList.add('show'); return; }
    if (!name || !email || !password) { errEl.textContent = 'Please fill all required fields.'; errEl.classList.add('show'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = 'Please enter a valid email address.'; errEl.classList.add('show'); return; }
    if (password !== password2) { errEl.textContent = 'Passwords do not match.'; errEl.classList.add('show'); return; }
    if (password.length < 8)    { errEl.textContent = 'Password must be at least 8 characters.'; errEl.classList.add('show'); return; }

    const btn = document.getElementById('btn-register');
    btn.disabled = true;
    try {
      const res = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phoneDigits(phone), password, birthdate })
      });
      const data = await res.json();
      if (!res.ok) { errEl.textContent = data.error || 'Registration failed'; errEl.classList.add('show'); btn.disabled = false; return; }
      window.authState.customer = data.customer;
      window.authState.token = data.token;
      window.authState.favorites = [];
      saveAuthState(true);
      updateAuthUI();
      closeAuthModal();
      btn.disabled = false;
      showToast('🎉 ' + (document.getElementById('html-root').lang === 'ar' ? `مرحباً ${data.customer.name}!` : `Welcome, ${data.customer.name}!`));
    } catch (e) {
      errEl.textContent = 'Network error. Please try again.';
      errEl.classList.add('show');
      btn.disabled = false;
    }
  }

  /* ─── LOGOUT ─── */
  async function doLogout() {
    try { await fetch('/api/customers/logout', { method: 'POST', headers: authHeader() }); } catch (e) { console.warn('[logout] server call failed, clearing locally', e); }
    window.authState = { customer: null, token: null, favorites: [] };
    localStorage.removeItem('kims-auth');
    sessionStorage.removeItem('kims-auth');
    updateAuthUI();
    if (typeof closeProfileModal === 'function') closeProfileModal();
    showToast(document.getElementById('html-root').lang === 'ar' ? 'تم تسجيل الخروج' : 'Logged out');
  }

  // Expose to global scope (inline onclick + cross-module callers)
  window.authHeader = authHeader;
  window.saveAuthState = saveAuthState;
  window.loadAuthState = loadAuthState;
  window.updateAuthUI = updateAuthUI;
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.switchAuthTab = switchAuthTab;
  window.doLogin = doLogin;
  window.resetSignupForm = resetSignupForm;
  window.doRegister = doRegister;
  window.doLogout = doLogout;
})();
