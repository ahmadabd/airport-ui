/**
 * DXB Airport Platform — Customer + OCC engine
 * Themes, RBAC, routing (elham-branch)
 */

document.addEventListener('DOMContentLoaded', () => {
  initUserDatabase()
  restoreSession()
  initCustomerPortalLinks()
  initBottomNav()
  initHashRouter()
  setInterval(updateOpsClock, 1000)
})

const STORAGE_USERS = 'EMIRATES_DXB_USERS_V2'
const STORAGE_SESSION = 'EMIRATES_DXB_SESSION_V2'

const DEFAULT_USERS = [
  { name: 'Duty Commander', email: 'admin@dxb.gov.ae', password: 'admin', role: 'admin', date: '11 Aug 2026' },
  { name: 'Sara Al-Mansoor', email: 'passenger@emirates.com', password: '123', role: 'customer', date: '11 Aug 2026' },
  { name: 'Local Tower', email: 'tower@dxb.gov.ae', password: 'tower', role: 'tower', date: '11 Aug 2026' },
  { name: 'Ops Coordinator', email: 'ops@dxb.gov.ae', password: 'ops', role: 'ops', date: '11 Aug 2026' },
]

let USERS_DB = []
let currentUser = { name: 'Guest User', email: '', role: 'guest' }
let currentRoute = 'landing'
let currentAdminModule = 'dashboard'
  { name: 'Duty Commander', email: 'admin@dxb.gov.ae', password: 'admin', role: 'admin', date: '4 Aug 2026' },
  { name: 'Sara Al-Mansoor', email: 'passenger@emirates.com', password: '123', role: 'user', date: '4 Aug 2026' },
  { name: 'Sara Rahimi', email: 'crew@dxb.gov.ae', password: 'Crew123!', role: 'crew', date: '4 Aug 2026' }
];

const SHARED_SCENARIO = {
  flight: 'EK 001',
  route: 'DXB → LHR',
  airport: 'Dubai International Airport — DXB',
  terminal: 'Terminal 3',
  date: 'Tue, 11 Aug',
  boarding: '08:30',
  aircraft: 'A380-800',
}

/* —— Persistence —— */
function initUserDatabase() {
  const stored = localStorage.getItem(STORAGE_USERS)
  if (stored) {
    try {
      USERS_DB = JSON.parse(stored).map((u) => ({ ...u, role: normalizeRole(u.role) }))
    } catch {
      USERS_DB = [...DEFAULT_USERS]
      saveUserDatabase()
      USERS_DB = JSON.parse(stored);
      DEFAULT_USERS.forEach(defaultUser => {
  if (!USERS_DB.some(user => user.email === defaultUser.email)) {
    USERS_DB.push(defaultUser);
  }
});
localStorage.setItem('EMIRATES_DXB_USERS', JSON.stringify(USERS_DB));
    } catch (e) {
      USERS_DB = [...DEFAULT_USERS];
      saveUserDatabase();
    }
  } else {
    // migrate legacy key if present
    const legacy = localStorage.getItem('EMIRATES_DXB_USERS')
    if (legacy) {
      try {
        USERS_DB = JSON.parse(legacy).map((u) => ({ ...u, role: normalizeRole(u.role) }))
      } catch {
        USERS_DB = [...DEFAULT_USERS]
      }
    } else {
      USERS_DB = [...DEFAULT_USERS]
    }
    // ensure demo staff accounts exist
    DEFAULT_USERS.forEach((d) => {
      if (!USERS_DB.some((u) => u.email === d.email)) USERS_DB.push(d)
    })
    saveUserDatabase()
  }
}

function saveUserDatabase() {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(USERS_DB))
}

function restoreSession() {
  const raw = localStorage.getItem(STORAGE_SESSION)
  if (!raw) return
  try {
    const session = JSON.parse(raw)
    const user = USERS_DB.find((u) => u.email === session.email)
    if (user) currentUser = { ...user, role: normalizeRole(user.role) }
  } catch {
    /* ignore */
  }
}

function persistSession() {
  if (currentUser.role === 'guest') {
    localStorage.removeItem(STORAGE_SESSION)
    return
  }
  localStorage.setItem(
    STORAGE_SESSION,
    JSON.stringify({ email: currentUser.email, role: currentUser.role })
  )
}

/* —— Shell visibility (colors stay Emirates brand — no theme swap) —— */
function applyThemeForRole(role) {
  document.body.classList.remove('theme-ops', 'ops-active', 'customer-active')
  document.body.classList.add('theme-customer')
}

function setOpsShellVisible(visible) {
  document.body.classList.toggle('ops-active', visible)
  const shell = document.getElementById('ops-shell')
  if (shell) shell.style.display = visible ? 'flex' : 'none'
}

function setCustomerPortalVisible(visible) {
  document.body.classList.toggle('customer-active', visible)
  const nameEl = document.getElementById('customer-portal-name')
  if (nameEl) nameEl.textContent = currentUser.name
}

function updateChrome() {
  const role = normalizeRole(currentUser.role)
  applyThemeForRole(role)

  const status = document.getElementById('user-status-display')
  if (status) {
    status.textContent =
      role !== 'guest' ? `${currentUser.name} (${getAccess(role).label})` : 'Guest'
  }

  const isStaff = isStaffRole(role) && currentRoute === 'admin'
  setOpsShellVisible(isStaff)
  setCustomerPortalVisible(role === 'customer' && !isStaff)

  const publicBits = [
    document.getElementById('public-top-strip'),
    document.getElementById('public-header'),
    document.getElementById('public-bottom-nav'),
    document.getElementById('main-content'),
  ]
  publicBits.forEach((el) => {
    if (!el) return
    if (isStaff) el.style.display = 'none'
    else el.style.removeProperty('display')
  })

  if (isStaff) buildOpsNav()
}

function buildOpsNav() {
  const nav = document.getElementById('ops-nav')
  const badge = document.getElementById('ops-role-badge')
  if (!nav) return

  const role = normalizeRole(currentUser.role)
  const access = getAccess(role)
  if (badge) badge.textContent = `${access.label} · ${role.toUpperCase()}`

  nav.innerHTML = access.modules
    .map((id) => {
      const meta = MODULE_META[id] || { label: id, icon: '•' }
      const active = id === currentAdminModule ? 'active' : ''
      return `<button type="button" class="ops-nav-btn ${active}" data-module="${id}">
        <span class="ops-ico">${meta.icon}</span> ${meta.label}
      </button>`
    })
    .join('')

  nav.querySelectorAll('[data-module]').forEach((btn) => {
    btn.addEventListener('click', () => {
      loadAdminModule(btn.getAttribute('data-module'))
    })
  })
}

function updateOpsClock() {
  const el = document.getElementById('ops-clock')
  if (!el || !document.body.classList.contains('ops-active')) return
  const now = new Date()
  el.textContent = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}Z`
}

/* —— Router —— */
function initHashRouter() {
  window.addEventListener('hashchange', handleHashRoute)
  handleHashRoute()
}

function handleHashRoute() {
  const hash = window.location.hash.replace('#', '') || 'landing'
  const allowed = [
    'landing',
    'signin',
    'signup',
    'admin',
    'staff-login',
    'my-trips',
    'manage',
    'flight-status',
  ]
  switchRoute(allowed.includes(hash) ? hash : 'landing')
  const hash = window.location.hash.replace('#', '');
  if (hash === 'admin') {
    switchRoute('admin');
  } else if (hash === 'signin') {
    switchRoute('signin');
  } else if (hash === 'signup') {
    switchRoute('signup');
  } else if (hash === 'portal') {
    switchRoute('portal');
  } else {
    switchRoute('landing');
  }
}

function switchRoute(route) {
  const role = normalizeRole(currentUser.role)

  // Guards
  if (route === 'admin' && !isStaffRole(role)) {
    currentRoute = 'staff-login'
    window.location.hash = 'staff-login'
    updateChrome()
    renderStaffLogin()
    return
  }

  if (['my-trips', 'manage', 'flight-status'].includes(route) && role === 'guest') {
    currentRoute = 'signin'
    window.location.hash = 'signin'
    updateChrome()
    renderSignInView(`Sign in to access ${route.replace('-', ' ')}.`)
    return
  }

  if (isStaffRole(role) && ['landing', 'signin', 'signup', 'my-trips', 'manage', 'flight-status'].includes(route)) {
    // staff stay in OCC unless logging out
    if (route !== 'staff-login') {
      currentRoute = 'admin'
      window.location.hash = 'admin'
      updateChrome()
      loadAdminModule(getDefaultModule(role) || 'dashboard')
      return
    if (route === 'landing') {
      window.location.hash = 'landing';
      renderLandingView();
    } else if (route === 'signin') {
      window.location.hash = 'signin';
      renderSignInView();
    } else if (route === 'signup') {
      window.location.hash = 'signup';
      renderSignUpView();
    } else if (route === 'portal') {
      window.location.hash = 'portal';
      renderPassengerPortalView();
    }
  }

  currentRoute = route
  window.location.hash = route
  updateChrome()

  if (route === 'admin') {
    const mod = canAccessModule(role, currentAdminModule)
      ? currentAdminModule
      : getDefaultModule(role)
    loadAdminModule(mod || 'dashboard')
    return
  }

  if (route === 'landing') renderLandingView()
  else if (route === 'signin') renderSignInView()
  else if (route === 'signup') renderSignUpView()
  else if (route === 'staff-login') renderStaffLogin()
  else if (route === 'my-trips') renderMyTrips()
  else if (route === 'manage') renderManageBooking()
  else if (route === 'flight-status') renderFlightStatus()
}

function initCustomerPortalLinks() {
  document.querySelectorAll('[data-customer-route]').forEach((btn) => {
    btn.addEventListener('click', () => switchRoute(btn.getAttribute('data-customer-route')))
  })
  const logout = document.getElementById('btn-customer-logout')
  if (logout) logout.addEventListener('click', handleCustomerLogout)
}

function initBottomNav() {
  document.querySelectorAll('.bottom-nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      const target = item.getAttribute('data-nav')
      switchRoute(target === 'home' ? 'landing' : 'signin')
    })
  })
}

/* —— Auth —— */
function handleCustomerLogout() {
  currentUser = { name: 'Guest User', email: '', role: 'guest' }
  persistSession()
  switchRoute('landing')
}

function handleStaffLogout() {
  currentUser = { name: 'Guest User', email: '', role: 'guest' }
  persistSession()
  applyThemeForRole('guest')
  setOpsShellVisible(false)
  switchRoute('staff-login')
}

/* —— Customer views —— */
function renderLandingView() {
  const contentArea = document.getElementById('main-content')
  if (!contentArea) return

  contentArea.innerHTML = `
    <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 24px;">
      <div style="display: flex; background-color: var(--bg-secondary); border-bottom: 1px solid var(--border-color); overflow-x: auto;">
        <button class="search-tab-btn active" type="button">Search flights</button>
        <button class="search-tab-btn" type="button" onclick="switchRoute('manage')">Manage booking / Check-in</button>
        <button class="search-tab-btn" type="button" onclick="switchRoute('flight-status')">Flight status</button>
      </div>
      <div class="search-form-body">
        <form onsubmit="event.preventDefault(); handleBuyTicket();">
          <div style="display: flex; gap: 24px; margin-bottom: 16px; font-size: 14px; font-weight: 600;">
            <label style="display: flex; align-items: center; gap: 6px;"><input type="radio" name="trip" checked style="accent-color: var(--color-primary);"> Return</label>
            <label style="display: flex; align-items: center; gap: 6px;"><input type="radio" name="trip" style="accent-color: var(--color-primary);"> One way</label>
          </div>
          <div class="grid-2col" style="gap: 16px;">
            <div class="input-group">
              <label class="input-label">Departure airport</label>
              <select class="input-field"><option selected>Dubai (DXB) — Terminal 3 Hub</option></select>
            </div>
            <div class="input-group">
              <label class="input-label">Arrival airport</label>
              <select class="input-field">
                <option>London Heathrow (LHR)</option>
                <option>Paris Charles de Gaulle (CDG)</option>
                <option>Frankfurt Airport (FRA)</option>
                <option>New York (JFK)</option>
              </select>
            </div>
          </div>
          <div class="grid-2col" style="gap: 16px; margin-top: 12px;">
            <div class="input-group">
              <label class="input-label">Dates</label>
              <input class="input-field" value="Tue, 11 Aug — Tue, 18 Aug" readonly>
            </div>
            <div class="input-group">
              <label class="input-label">Passengers & Class</label>
              <select class="input-field">
                <option>1 Passenger, Economy Class</option>
                <option>1 Passenger, Business Class</option>
                <option>1 Passenger, First Class</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn-primary" style="margin-top: 16px; width: 100%;">Search flights →</button>
        </form>
      </div>
    </div>

    <div class="grid-2col" style="grid-template-columns: repeat(3, 1fr); gap: 16px;">
      <div class="card"><span class="caption-text" style="color: var(--color-gold);">A380 EXPERIENCE</span><h3 class="display-title card-title">Fly the Emirates A380</h3><p class="supporting-text">Private Suites, Onboard Lounge, and Shower Spas in First Class.</p></div>
      <div class="card"><span class="caption-text" style="color: var(--color-gold);">ENTERTAINMENT</span><h3 class="display-title card-title">6,500 Channels</h3><p class="supporting-text">Award-winning ice entertainment across all cabin classes.</p></div>
      <div class="card"><span class="caption-text" style="color: var(--color-gold);">DXB HUB</span><h3 class="display-title card-title">Terminal 3</h3><p class="supporting-text">World-class lounges and seamless connections.</p></div>
    </div>
  `
}

function handleBuyTicket() {
  if (normalizeRole(currentUser.role) === 'guest') {
    switchRoute('signin')
    return
  }
  alert(`Search started for ${SHARED_SCENARIO.route}. Demo booking flow.`)
  switchRoute('my-trips')
}

function renderSignInView(banner) {
  const contentArea = document.getElementById('main-content')
  if (!contentArea) return
  contentArea.innerHTML = `
    <div class="card" style="max-width: 440px; margin: 24px auto;">
      <h1 class="page-title display-title">Sign in</h1>
      <p class="supporting-text" style="margin-bottom: 16px;">Customer portal — book, manage, and track your journey.</p>
      ${banner ? `<p class="chip chip-warning" style="margin-bottom: 12px; display:inline-flex;">${banner}</p>` : ''}
      <form onsubmit="event.preventDefault(); handleCustomerLogin();">
        <div class="input-group">
          <label class="input-label">Email</label>
          <input type="email" id="signin-email" class="input-field" value="passenger@emirates.com" required>
        </div>
        <div class="input-group">
          <label class="input-label">Password</label>
          <input type="password" id="signin-password" class="input-field" value="123" required>
        </div>
        <button class="btn-primary" type="submit" style="width:100%; margin-top:8px;">Sign in →</button>
      </form>
      <p class="supporting-text" style="margin-top: 16px;">
        No account? <a href="#signup" onclick="switchRoute('signup')" style="color: var(--color-primary); font-weight:700;">Sign up</a>
        · Staff? <a href="#staff-login" onclick="switchRoute('staff-login')" style="color: var(--color-primary); font-weight:700;">OCC login</a>
      </p>
      <div class="staff-login-hint">
        Demo customer: <code>passenger@emirates.com</code> / <code>123</code>
      </div>
    </div>
  `
}

function handleCustomerLogin() {
  const email = document.getElementById('signin-email').value.trim()
  const password = document.getElementById('signin-password').value.trim()
  const user = USERS_DB.find((u) => u.email === email && u.password === password)
  if (!user) {
    alert('Invalid credentials.')
    return
  }
  const role = normalizeRole(user.role)
  if (isStaffRole(role)) {
    alert('This is a staff account. Use Staff / OCC login.')
    switchRoute('staff-login')
    return
  }
  currentUser = { ...user, role: 'customer' }
  persistSession()
  switchRoute('my-trips')
function handlePassengerSignIn() {
  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value.trim();

  const user = USERS_DB.find(u => u.email === email && u.password === password);

  if (!user) {
    alert('Invalid credentials. Demo Passenger Login: passenger@emirates.com / 123');
    return;
  }

  currentUser = user;

  if (user.role === 'crew') {
    let crewJourney = {};

    try {
      crewJourney = JSON.parse(localStorage.getItem('crewflow_journey') || '{}');
    } catch (e) {
      crewJourney = {};
    }

    crewJourney.user = {
      name: 'Sara Rahimi',
      role: 'Cabin Crew',
      employeeId: 'EK-CC-2847'
    };

    localStorage.setItem('crewflow_journey', JSON.stringify(crewJourney));
    window.location.href = './crew-app/#/crew';
    return;
  }

  alert(`Welcome back, ${user.name}! Signed in as Passenger (Role: ${user.role}).`);
  switchRoute('landing');
}

function renderSignUpView() {
  const contentArea = document.getElementById('main-content')
  if (!contentArea) return
  contentArea.innerHTML = `
    <div class="card" style="max-width: 440px; margin: 24px auto;">
      <h1 class="page-title display-title">Create account</h1>
      <p class="supporting-text" style="margin-bottom: 16px;">New accounts receive the Customer role.</p>
      <form onsubmit="event.preventDefault(); handleSignUp();">
        <div class="input-group"><label class="input-label">Full name</label><input id="signup-name" class="input-field" required></div>
        <div class="input-group"><label class="input-label">Email</label><input type="email" id="signup-email" class="input-field" required></div>
        <div class="input-group"><label class="input-label">Password</label><input type="password" id="signup-password" class="input-field" required></div>
        <button class="btn-primary" type="submit" style="width:100%;">Create customer account →</button>
      </form>
    </div>
  `
}

function handleSignUp() {
  const name = document.getElementById('signup-name').value.trim()
  const email = document.getElementById('signup-email').value.trim()
  const password = document.getElementById('signup-password').value.trim()
  if (USERS_DB.some((u) => u.email === email)) {
    alert('Email already registered.')
    return
  }
  const newUser = { name, email, password, role: 'customer', date: '11 Aug 2026' }
  USERS_DB.push(newUser)
  saveUserDatabase()
  currentUser = newUser
  persistSession()
  switchRoute('my-trips')
}

function renderMyTrips() {
  const contentArea = document.getElementById('main-content')
  if (!contentArea) return
  contentArea.innerHTML = `
    <h1 class="page-title display-title" style="margin-bottom: 8px;">My Trips</h1>
    <p class="supporting-text" style="margin-bottom: 20px;">Upcoming journeys for ${currentUser.name}</p>
    <div class="card">
      <div class="card-header">
        <div>
          <span class="caption-text">${SHARED_SCENARIO.date}</span>
          <h2 class="card-title" style="color: var(--color-primary);">${SHARED_SCENARIO.flight}</h2>
        </div>
        <span class="chip chip-completed">Confirmed</span>
      </div>
      <div class="grid-2col">
        <div><span class="caption-text">Route</span><p class="body-text" style="font-weight:600;">${SHARED_SCENARIO.route}</p></div>
        <div><span class="caption-text">Boarding</span><p class="body-text" style="font-weight:600;">${SHARED_SCENARIO.boarding} · ${SHARED_SCENARIO.terminal}</p></div>
        <div><span class="caption-text">Aircraft</span><p class="body-text" style="font-weight:600;">${SHARED_SCENARIO.aircraft}</p></div>
        <div><span class="caption-text">Seat</span><p class="body-text" style="font-weight:600;">24A · Economy</p></div>
      </div>
      <div style="display:flex; gap:8px; margin-top:16px; flex-wrap:wrap;">
        <button class="btn-primary" onclick="switchRoute('manage')">Manage booking</button>
        <button class="btn-header-signin" onclick="switchRoute('flight-status')">Flight status</button>
      </div>
    </div>
  `
}

function renderManageBooking() {
  const contentArea = document.getElementById('main-content')
  if (!contentArea) return
  contentArea.innerHTML = `
    <div class="card" style="max-width: 520px; margin: 0 auto;">
      <h1 class="page-title display-title">Manage booking</h1>
      <p class="supporting-text" style="margin-bottom: 16px;">Check-in, seat selection, and booking changes.</p>
      <div class="input-group"><label class="input-label">Booking reference</label><input class="input-field" value="EK7X2M"></div>
      <div class="input-group"><label class="input-label">Last name</label><input class="input-field" value="Al-Mansoor"></div>
      <button class="btn-primary" style="width:100%;" onclick="alert('Demo: check-in window opens 48h before departure.')">Continue →</button>
    </div>
  `
}

function renderFlightStatus() {
  const contentArea = document.getElementById('main-content')
  if (!contentArea) return
/* ==========================================================================
   5b. Public Passenger Portal (#portal) — Passenger Journey Module
   Booking + online check-in flow, fetched from pages/passenger-portal.html
   ========================================================================== */
async function renderPassengerPortalView() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  try {
    const response = await fetch('pages/passenger-portal.html');
    if (response.ok) {
      const htmlText = await response.text();
      contentArea.innerHTML = htmlText;

      // Re-execute inline scripts in the loaded page
      contentArea.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
      return;
    }
  } catch (err) {
    console.info('[Emirates-DXB] Passenger Portal requires Developer Mode (local server).');
  }

  contentArea.innerHTML = `
    <div class="card" style="max-width: 520px; margin: 0 auto; text-align: center; padding: 28px;">
      <h1 class="page-title" style="margin-bottom: 8px;">Passenger Portal</h1>
      <p class="supporting-text" style="margin-bottom: 16px;">
        This module loads <code>pages/passenger-portal.html</code> dynamically. Browsers block local
        file fetches, so please run the project in Developer Mode (<code>npx serve</code>) to view it.
      </p>
      <button class="btn-primary" onclick="switchRoute('landing')">Return to Home →</button>
    </div>
  `;
}

/* ==========================================================================
   6. Restricted Admin Login Form (Shown when accessing #admin without Admin Role)
   ========================================================================== */
function renderAdminLoginForm() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <h1 class="page-title display-title" style="margin-bottom: 16px;">Flight status</h1>
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">${SHARED_SCENARIO.flight} · ${SHARED_SCENARIO.route}</h2>
        <span class="chip chip-in-progress">On time</span>
      </div>
      <div class="grid-2col">
        <div><span class="caption-text">Departure</span><p class="body-text" style="font-weight:600;">DXB T3 · ${SHARED_SCENARIO.boarding}</p></div>
        <div><span class="caption-text">Arrival</span><p class="body-text" style="font-weight:600;">LHR T3 · 13:05</p></div>
        <div><span class="caption-text">Gate</span><p class="body-text" style="font-weight:600;">A14</p></div>
        <div><span class="caption-text">Status</span><p class="body-text" style="font-weight:600;">Boarding soon</p></div>
      </div>
    </div>
  `
}

/* —— Staff login —— */
function renderStaffLogin() {
  applyThemeForRole('guest')
  document.body.classList.remove('customer-active', 'ops-active')
  setOpsShellVisible(false)
  ;['public-top-strip', 'public-header', 'public-bottom-nav'].forEach((id) => {
    const el = document.getElementById(id)
    if (el) el.style.display = 'none'
  })
  const contentArea = document.getElementById('main-content')
  if (contentArea) contentArea.style.display = 'block'

  contentArea.innerHTML = `
    <div class="card" style="max-width: 480px; margin: 40px auto;">
      <span class="caption-text">DXB OPERATIONS</span>
      <h1 class="page-title">Staff / OCC Login</h1>
      <p class="supporting-text" style="margin-bottom: 16px;">Tower, Operations, and Admin access the management workspace here.</p>
      <form onsubmit="event.preventDefault(); handleStaffLogin();">
        <div class="input-group">
          <label class="input-label">Staff email</label>
          <input type="email" id="staff-email" class="input-field" value="admin@dxb.gov.ae" required>
        </div>
        <div class="input-group">
          <label class="input-label">Password</label>
          <input type="password" id="staff-password" class="input-field" value="admin" required>
        </div>
        <button class="btn-primary" type="submit" style="width:100%;">Authenticate →</button>
      </form>
      <div class="staff-login-hint">
        <div>Admin: <code>admin@dxb.gov.ae</code> / <code>admin</code></div>
        <div>Tower: <code>tower@dxb.gov.ae</code> / <code>tower</code></div>
        <div>Ops: <code>ops@dxb.gov.ae</code> / <code>ops</code></div>
      </div>
      <p style="margin-top:16px; text-align:center;">
        <a href="#landing" onclick="event.preventDefault(); applyThemeForRole('guest'); switchRoute('landing')" style="color: var(--text-secondary);">← Back to customer site</a>
      </p>
    </div>
  `
}

function handleStaffLogin() {
  const email = document.getElementById('staff-email').value.trim()
  const password = document.getElementById('staff-password').value.trim()
  const user = USERS_DB.find((u) => u.email === email && u.password === password)
  if (!user || !isStaffRole(user.role)) {
    alert('Access denied. Use a staff account (admin / tower / ops).')
    return
  }
  currentUser = { ...user, role: normalizeRole(user.role) }
  persistSession()
  currentAdminModule = getDefaultModule(currentUser.role) || 'dashboard'
  switchRoute('admin')
}

/* —— OCC modules —— */
async function loadAdminModule(moduleId) {
  const role = normalizeRole(currentUser.role)
  if (!canAccessModule(role, moduleId)) {
    alert(`Role "${getAccess(role).label}" cannot access this module.`)
    moduleId = getDefaultModule(role) || 'dashboard'
  }

  currentAdminModule = moduleId
  buildOpsNav()

  const title = document.getElementById('ops-page-title')
  const meta = document.getElementById('ops-page-meta')
  const metaInfo = MODULE_META[moduleId] || { label: moduleId }
  if (title) title.textContent = metaInfo.label
  if (meta) meta.textContent = `${getAccess(role).label} · ${SHARED_SCENARIO.airport}`

  const host = document.getElementById('ops-content')
  if (!host) return
  const targetChip = document.querySelector(
    `.module-chip[data-module="${moduleId}"]`
  );

  if (targetChip) {
    document.querySelectorAll('.module-chip').forEach(c => {
      c.classList.remove('active');
    });

    targetChip.classList.add('active');
  }

  currentAdminModule = moduleId;

  if (moduleId === 'user-management') {
    renderUserManagementModule(host)
    return
  }
  if (moduleId === 'dashboard') {
    renderAdminDashboard(host)
    return
  }

  if (moduleId === 'dashboard') {
    renderAdminDashboard();
    return;
  }

  try {
    const response = await fetch(`pages/${moduleId}.html`)
    if (response.ok) {
      const htmlText = await response.text()
      const cleaned = htmlText.replace(/<!--[\s\S]*?-->/g, '').trim()
      if (cleaned.length > 40) {
        if (window.TowerHub && window.TowerHub.destroyTimers) window.TowerHub.destroyTimers()
        host.innerHTML = htmlText
        // Re-run inline scripts only (tower-hub.js is loaded globally from index.html)
        host.querySelectorAll('script').forEach((oldScript) => {
          if (oldScript.src) {
            oldScript.remove()
            return
          }
          const newScript = document.createElement('script')
          newScript.textContent = oldScript.textContent
          oldScript.parentNode.replaceChild(newScript, oldScript)
        })
        if (moduleId === 'tower-control' && window.TowerHub) window.TowerHub.init()
        return
      }
    }
  } catch {
    /* fallback */
  }

  renderModulePlaceholder(host, moduleId)
}

function renderAdminDashboard(host) {
  const role = normalizeRole(currentUser.role)
  const access = getAccess(role)
  const moduleChips = access.modules
    .filter((m) => m !== 'dashboard' && m !== 'user-management')
    .map((m) => {
      const meta = MODULE_META[m]
      return `<button class="btn-header-signin" style="margin:4px;" onclick="loadAdminModule('${m}')">${meta.label}</button>`
    })
    .join('')

  host.innerHTML = `
    <div class="grid-2col" style="margin-bottom: 16px;">
      <div class="card" style="margin-bottom:0;">

    const htmlText = await response.text();

    contentArea.innerHTML = htmlText;

    // Initialize Gate Management after HTML is loaded
    if (moduleId === 'gate-management') {
      filterGateTable();
    }

  } catch (error) {
    console.error(
      `[Emirates-DXB] Failed to load module: ${moduleId}`,
      error
    );

    renderModulePlaceholder(moduleId);
  }
}
function initGateManagement() {
  try {
    if (typeof filterGateTable === 'function') {
      filterGateTable();
    }
  } catch (error) {
    console.error('[Gate Management] Initialization error:', error);
  }
}
function renderUserManagementModule() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  const userRowsHTML = USERS_DB.map(u => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px 8px; font-weight: 600;">${u.name}</td>
      <td style="padding: 12px 8px;">${u.email}</td>
      <td style="padding: 12px 8px;">
        ${u.role === 'admin' 
          ? '<span class="chip chip-completed"><span class="chip-icon">✓</span> ADMIN</span>' 
          : '<span class="chip chip-info"><span class="chip-icon">👤</span> USER</span>'}
      </td>
      <td style="padding: 12px 8px;" class="caption-text">${u.date || '4 Aug 2026'}</td>
    </tr>
  `).join('');

  contentArea.innerHTML = `
    <div class="grid-2col">
      <div class="card">
        <div class="card-header">
          <div>
            <span class="caption-text">Live scenario</span>
            <h2 class="card-title" style="color: var(--color-primary);">${SHARED_SCENARIO.flight}</h2>
          </div>
          <span class="chip chip-completed">Scheduled</span>
        </div>
        <p class="supporting-text">${SHARED_SCENARIO.route} · ${SHARED_SCENARIO.terminal} · Boarding ${SHARED_SCENARIO.boarding}</p>
        <div style="margin-top:12px;">${moduleChips}</div>
      </div>
      <div class="card" style="margin-bottom:0;">
        <h3 class="card-title">Your access</h3>
        <p class="supporting-text" style="margin: 8px 0 12px;">${access.description}</p>
        <p class="body-text" style="font-family: var(--font-mono); font-size: 0.8rem;">
          Modules: ${access.modules.join(' · ')}
        </p>
      </div>
    </div>
    ${role === 'admin' ? renderRoleMatrixHTML() : ''}
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Operational snapshot</h3>
        <span class="supporting-text">${SHARED_SCENARIO.date}</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <div><p class="body-text" style="font-weight:600;">Runway 12L & 12R</p><span class="supporting-text">Normal operations</span></div>
          <span class="chip chip-completed">Active</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div><p class="body-text" style="font-weight:600;">Gate A14</p><span class="supporting-text">EK 001 boarding</span></div>
          <span class="chip chip-in-progress">In progress</span>
        </div>
      </div>
    </div>
  `
}

function renderRoleMatrixHTML() {
  return `
    <div class="card role-matrix-card" style="margin-bottom: 16px;">
      <h3 class="card-title" style="margin-bottom: 12px;">Role & access matrix</h3>
      <table>
        <thead>
          <tr>
            <th>Area</th>
            <th>Guest</th>
            <th>Customer</th>
            <th>Tower</th>
            <th>Ops</th>
            <th>Admin</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Book / public site</td><td class="access-yes">✓</td><td class="access-yes">✓</td><td class="access-no">—</td><td class="access-no">—</td><td class="access-yes">✓</td></tr>
          <tr><td>My Trips / Manage</td><td class="access-no">—</td><td class="access-yes">✓</td><td class="access-no">—</td><td class="access-no">—</td><td class="access-no">—</td></tr>
          <tr><td>Tower Control</td><td class="access-no">—</td><td class="access-no">—</td><td class="access-yes">✓</td><td class="access-no">—</td><td class="access-yes">✓</td></tr>
          <tr><td>Gates / Turnaround / Crew</td><td class="access-no">—</td><td class="access-no">—</td><td class="access-no">—</td><td class="access-yes">✓</td><td class="access-yes">✓</td></tr>
          <tr><td>User management</td><td class="access-no">—</td><td class="access-no">—</td><td class="access-no">—</td><td class="access-no">—</td><td class="access-yes">✓</td></tr>
        </tbody>
      </table>
    </div>
  `
}

function renderUserManagementModule(host) {
  if (!getAccess(currentUser.role).canManageUsers) {
    host.innerHTML = `<div class="card"><p>Access denied.</p></div>`
    return
  }

  const rows = USERS_DB.map(
    (u) => `
    <tr>
      <td style="padding:10px 8px; font-weight:600;">${u.name}</td>
      <td style="padding:10px 8px;">${u.email}</td>
      <td style="padding:10px 8px;"><span class="chip chip-info">${normalizeRole(u.role).toUpperCase()}</span></td>
      <td style="padding:10px 8px;" class="caption-text">${u.date || '—'}</td>
    </tr>`
  ).join('')

  host.innerHTML = `
    <div class="grid-2col">
      <div class="card">
        <h2 class="card-title" style="margin-bottom:12px;">Add user</h2>
        <form onsubmit="event.preventDefault(); handleAddNewUserByAdmin();">
          <div class="input-group"><label class="input-label">Name</label><input id="newuser-name" class="input-field" required></div>
          <div class="input-group"><label class="input-label">Email</label><input type="email" id="newuser-email" class="input-field" required></div>
          <div class="input-group"><label class="input-label">Password</label><input type="password" id="newuser-password" class="input-field" required></div>
          <div class="input-group">
            <label class="input-label">Role</label>
            <select id="newuser-role" class="input-field">
              <option value="customer">Customer — passenger portal</option>
              <option value="tower">Tower — tower modules only</option>
              <option value="ops">Ops — ground operations modules</option>
              <option value="admin">Admin — full OCC + users</option>
            </select>
          </div>
          <button class="btn-primary" type="submit">Create account →</button>
        </form>
      </div>
      <div class="card">
        <h2 class="card-title" style="margin-bottom:12px;">Users (${USERS_DB.length})</h2>
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <thead><tr style="color:var(--text-secondary); border-bottom:1px solid var(--border-color);">
              <th style="text-align:left; padding:8px;">Name</th>
              <th style="text-align:left; padding:8px;">Email</th>
              <th style="text-align:left; padding:8px;">Role</th>
              <th style="text-align:left; padding:8px;">Date</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
    ${renderRoleMatrixHTML()}
  `
}

function handleAddNewUserByAdmin() {
  const name = document.getElementById('newuser-name').value.trim()
  const email = document.getElementById('newuser-email').value.trim()
  const password = document.getElementById('newuser-password').value.trim()
  const role = document.getElementById('newuser-role').value
  USERS_DB.push({ name, email, password, role, date: '11 Aug 2026' })
  saveUserDatabase()
  loadAdminModule('user-management')
}

function renderModulePlaceholder(host, moduleId) {
  const name = (MODULE_META[moduleId] && MODULE_META[moduleId].label) || moduleId
  host.innerHTML = `
    <div class="card">
      <span class="caption-text">Module base</span>
      <h1 class="page-title">${name}</h1>
      <p class="supporting-text" style="margin: 12px 0 16px;">
        Base shell for <strong>${name}</strong> is ready. Role-gated for your account.
        Extend this module under <code>pages/${moduleId}.html</code>.
      </p>
      <button class="btn-primary" onclick="loadAdminModule('dashboard')">← OCC Dashboard</button>
    </div>
  `
}

// Back-compat aliases used by older inline handlers
function handleAdminLogout() {
  handleStaffLogout()
function renderModulePlaceholder(moduleId) {

  if (moduleId === 'gate-management') {
    loadGateManagementPage();
    return;
  }

  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  async function loadGateManagementPage() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  try {
    const response = await fetch('pages/gate-management.html');

    if (!response.ok) {
      throw new Error('Gate Management page failed to load');
    }

    const html = await response.text();

    contentArea.innerHTML = html;

    // Execute scripts inside the loaded HTML
    const scripts = contentArea.querySelectorAll('script');

    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');

      Array.from(oldScript.attributes).forEach(attribute => {
        newScript.setAttribute(attribute.name, attribute.value);
      });

      newScript.textContent = oldScript.textContent;

      oldScript.parentNode.replaceChild(newScript, oldScript);
    });

  } catch (error) {
    console.error('Gate Management Error:', error);

    contentArea.innerHTML = `
      <div class="card">
        <h2 class="section-title">Gate Management</h2>
        <p class="supporting-text" style="margin-top:8px;">
          Failed to load Gate Management.
        </p>
      </div>
    `;
  }
}

  const titles = {
    'gate-management': 'Gate Management',
    'aircraft-turnaround': 'Aircraft Turnaround',
    'tower-control': 'Local Tower Control',
    'crew-flow': 'CrewFlow',
    'passenger-journey': 'Passenger Journey'
  };

  const name = titles[moduleId] || moduleId;

  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <span class="caption-text">${SHARED_SCENARIO.airport}</span>
          <h1 class="page-title">${name}</h1>
        </div>
        <span class="chip chip-in-progress">In progress</span>
      </div>

      <p class="supporting-text" style="margin-bottom: var(--space-16);">
        This module provides operational controls for ${name.toLowerCase()} within the Emirates–DXB platform.
      </p>

      <button class="btn-primary" onclick="loadAdminModule('dashboard')">
        Return to OCC Dashboard →
      </button>
    </div>
  `;
}
/* ==========================================================================
   GATE MANAGEMENT INTERACTIONS
   ========================================================================== */

function filterGateTable() {
  const searchInput = document.getElementById('gate-search');
  const terminalInput = document.getElementById('gate-terminal');
  const statusInput = document.getElementById('gate-status');
  const timeInput = document.getElementById('gate-time');

  if (!searchInput || !terminalInput || !statusInput || !timeInput) {
    return;
  }

  const search = searchInput.value.toLowerCase().trim();
  const terminal = terminalInput.value;
  const status = statusInput.value;
  const time = timeInput.value;

  const rows = document.querySelectorAll('#gate-table-body tr');

  let visibleCount = 0;

  rows.forEach(row => {
    const gate = (row.dataset.gate || '').toLowerCase();
    const flight = (row.dataset.flight || '').toLowerCase();
    const route = (row.dataset.route || '').toLowerCase();

    const rowStatus = row.dataset.status || '';
    const rowTerminal = row.dataset.terminal || '';
    const rowTime = row.dataset.time || '';

    const searchMatch =
      !search ||
      gate.includes(search) ||
      flight.includes(search) ||
      route.includes(search);

    const terminalMatch =
      !terminal || rowTerminal === terminal;

    const statusMatch =
      !status || rowStatus === status;

    const timeMatch =
      !time || rowTime === time;

    const visible =
      searchMatch &&
      terminalMatch &&
      statusMatch &&
      timeMatch;

    row.style.display = visible ? '' : 'none';

    if (visible) {
      visibleCount++;
    }
  });

  const resultCount =
    document.getElementById('gate-result-count');

  if (resultCount) {
    resultCount.textContent =
      `${visibleCount} active records`;
  }

  const emptyState =
    document.getElementById('gate-empty-state');

  if (emptyState) {
    emptyState.style.display =
      visibleCount === 0 ? 'block' : 'none';
  }
}


function resetGateFilters() {
  const searchInput = document.getElementById('gate-search');
  const terminalInput = document.getElementById('gate-terminal');
  const statusInput = document.getElementById('gate-status');
  const timeInput = document.getElementById('gate-time');

  if (searchInput) searchInput.value = '';
  if (terminalInput) terminalInput.value = '';
  if (statusInput) statusInput.value = '';
  if (timeInput) timeInput.value = '';

  filterGateTable();
}


function gateRefreshData() {
  const button = document.activeElement;

  if (
    button &&
    button.tagName === 'BUTTON' &&
    button.textContent.includes('Refresh')
  ) {
    button.textContent = '✓ Updated';

    setTimeout(() => {
      button.textContent = '↻ Refresh';
    }, 1200);
  }
}


function openGateDetails(gateId) {
  const rows =
    document.querySelectorAll('#gate-table-body tr');

  let selectedRow = null;

  rows.forEach(row => {
    if (row.dataset.gate === gateId) {
      selectedRow = row;
    }
  });

  if (!selectedRow) {
    console.warn(`Gate ${gateId} not found.`);
    return;
  }

  const cells =
    selectedRow.querySelectorAll('td');

  const flight =
    selectedRow.dataset.flight || '—';

  const route =
    cells[2]
      ? cells[2].innerText.trim()
      : '—';

  const aircraft =
    cells[3]
      ? cells[3].innerText.trim()
      : '—';

  const status =
    selectedRow.dataset.status || 'Available';

  const boarding =
    cells[5]
      ? cells[5].innerText.trim()
      : '—';

  const departure =
    cells[6]
      ? cells[6].innerText.trim()
      : '—';

  const terminal =
    selectedRow.dataset.terminal || '—';


  const title =
    document.getElementById('gate-detail-title');

  const detailFlight =
    document.getElementById('detail-flight');

  const detailRoute =
    document.getElementById('detail-route');

  const detailAircraft =
    document.getElementById('detail-aircraft');

  const detailBoarding =
    document.getElementById('detail-boarding');

  const detailDeparture =
    document.getElementById('detail-departure');

  const detailTerminal =
    document.getElementById('detail-terminal');

  const statusElement =
    document.getElementById('gate-detail-status');

  const overlay =
    document.getElementById('gate-overlay');

  const panel =
    document.getElementById('gate-detail-panel');


  if (title) {
    title.textContent = `Gate ${gateId}`;
  }

  if (detailFlight) {
    detailFlight.textContent = flight;
  }

  if (detailRoute) {
    detailRoute.textContent = route;
  }

  if (detailAircraft) {
    detailAircraft.textContent = aircraft;
  }

  if (detailBoarding) {
    detailBoarding.textContent = boarding;
  }

  if (detailDeparture) {
    detailDeparture.textContent = departure;
  }

  if (detailTerminal) {
    detailTerminal.textContent = terminal;
  }

  if (statusElement) {
    statusElement.textContent = status;
    statusElement.className =
      'chip ' + getGateStatusClass(status);
  }

  if (overlay) {
    overlay.classList.add('open');
  }

  if (panel) {
    panel.classList.add('open');
  }
}


function getGateStatusClass(status) {
  switch (status) {

    case 'Available':
      return 'chip-success';

    case 'Assigned':
      return 'chip-info';

    case 'Boarding':
      return 'chip-in-progress';

    case 'Change Required':
      return 'chip-warning';

    case 'Conflict':
      return 'chip-error';

    default:
      return 'chip-info';
  }
}


function closeGateDetails() {
  const overlay =
    document.getElementById('gate-overlay');

  const panel =
    document.getElementById('gate-detail-panel');

  if (overlay) {
    overlay.classList.remove('open');
  }

  if (panel) {
    panel.classList.remove('open');
  }
}