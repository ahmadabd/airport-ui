/**
 * Emirates Official Website Engine & Router (emirates.com)
 * Signature Red Palette (#D71A21), Official Flight Search Hero, Auth, Admin OCC & Clean Header
 * Design Guide Version: 7 August 2026
 */

document.addEventListener('DOMContentLoaded', () => {
  initUserDatabase();
  initModuleStrip();
  initBottomNav();
  initHashRouter();
});

/* ==========================================================================
   1. LocalStorage User Database Persistence
   ========================================================================== */
const DEFAULT_USERS = [
  { name: 'Duty Commander', email: 'admin@dxb.gov.ae', password: 'admin', role: 'admin', date: '4 Aug 2026' },
  { name: 'Sara Al-Mansoor', email: 'passenger@emirates.com', password: '123', role: 'user', date: '4 Aug 2026' },
  { name: 'Sara Rahimi', email: 'crew@dxb.gov.ae', password: 'Crew123!', role: 'crew', date: '4 Aug 2026' }
];

let USERS_DB = [];

function initUserDatabase() {
  const stored = localStorage.getItem('EMIRATES_DXB_USERS');
  if (stored) {
    try {
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
    USERS_DB = [...DEFAULT_USERS];
    saveUserDatabase();
  }
}

function saveUserDatabase() {
  localStorage.setItem('EMIRATES_DXB_USERS', JSON.stringify(USERS_DB));
}

// Current Session User
let currentUser = {
  name: 'Guest User',
  email: '',
  role: 'guest'
};

const SHARED_SCENARIO = {
  flight: 'EK 001',
  route: 'DXB → LHR',
  airport: 'Dubai International Airport — DXB',
  terminal: 'Terminal 3',
  date: 'Tue, 4 Aug',
  boarding: '08:30',
  aircraft: 'A380-800'
};

let currentRoute = 'landing';
let currentAdminModule = 'dashboard';

/* ==========================================================================
   2. Hash Router (Listens to URL #admin, #signin, #signup, #landing)
   ========================================================================== */
function initHashRouter() {
  window.addEventListener('hashchange', handleHashRoute);
  handleHashRoute();
}

function handleHashRoute() {
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
  currentRoute = route;

  const topStrip = document.querySelector('.emirates-top-strip');
  const mainNav = document.getElementById('public-main-nav');
  const userActions = document.getElementById('user-actions-container');
  const adminNav = document.getElementById('admin-module-strip');
  const userStatusDisplay = document.getElementById('user-status-display');

  // Update Status Display
  if (userStatusDisplay) {
    userStatusDisplay.textContent = currentUser.role !== 'guest'
      ? `${currentUser.name} (${currentUser.role.toUpperCase()})`
      : 'Guest';
  }

  if (route === 'admin') {
    window.location.hash = 'admin';
    
    // Hide top landing page headers/navs in /admin mode — ONLY keep logo!
    if (topStrip) topStrip.style.display = 'none';
    if (mainNav) mainNav.style.display = 'none';
    if (userActions) userActions.style.display = 'none';

    // Check Authorization: Only ADMIN role can access /admin
    if (currentUser.role !== 'admin') {
      if (adminNav) adminNav.style.display = 'none';
      renderAdminLoginForm();
    } else {
      if (adminNav) adminNav.style.display = 'flex';
      renderAdminDashboard();
    }
  } else {
    // Restore public landing top bars when on public routes
    if (topStrip) topStrip.style.display = 'flex';
    if (mainNav) mainNav.style.display = 'flex';
    if (userActions) userActions.style.display = 'flex';
    if (adminNav) adminNav.style.display = 'none';

    if (mainNav) {
      const items = mainNav.querySelectorAll('.emirates-nav-item');
      items.forEach(i => i.classList.remove('active'));
      if (route === 'landing' && items[0]) items[0].classList.add('active');
      if (route === 'signin' && items[1]) items[1].classList.add('active');
    }

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
}

/* ==========================================================================
   3. Admin Logout Handler
   ========================================================================== */
function handleAdminLogout() {
  currentUser = {
    name: 'Guest User',
    email: '',
    role: 'guest'
  };
  alert('Admin session ended. You have been logged out.');
  switchRoute('admin');
}

/* ==========================================================================
   4. Official Emirates.com Landing Page & Flight Search Hero
   ========================================================================== */
function renderLandingView() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <!-- Official Emirates Hero Flight Search Card -->
    <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 24px;">
      
      <div style="display: flex; background-color: #F8F9FA; border-bottom: 1px solid #E0E0E0; overflow-x: auto;">
        <button class="search-tab-btn active" id="tab-search-flights" onclick="switchSearchTab('flights')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
          Search flights
        </button>
        <button class="search-tab-btn" id="tab-manage-booking" onclick="switchSearchTab('manage')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Manage booking / Check-in
        </button>
        <button class="search-tab-btn" id="tab-flight-status" onclick="switchSearchTab('status')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Flight status
        </button>
      </div>

      <div class="search-form-body" id="search-tab-content">
        <form id="booking-form" onsubmit="event.preventDefault(); handleBuyTicket();">
          <div style="display: flex; gap: 24px; margin-bottom: 16px; font-size: 14px; font-weight: 600;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="trip" value="return" checked style="accent-color: var(--color-primary);"> Return
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="trip" value="oneway" style="accent-color: var(--color-primary);"> One way
            </label>
          </div>

          <div class="grid-2col" style="gap: 16px; margin-bottom: 0;">
            <div class="input-group">
              <label class="input-label">Departure airport</label>
              <select class="input-field" id="flight-from">
                <option value="DXB" selected>Dubai (DXB) — Terminal 3 Hub</option>
              </select>
            </div>

            <div class="input-group">
              <label class="input-label">Arrival airport (Destination)</label>
              <select class="input-field" id="flight-to">
                <option value="LHR">London Heathrow (LHR)</option>
                <option value="CDG">Paris Charles de Gaulle (CDG)</option>
                <option value="FRA">Frankfurt Airport (FRA)</option>
                <option value="RUH">Riyadh King Khalid (RUH)</option>
                <option value="JFK">New York (JFK)</option>
                <option value="HND">Tokyo Haneda (HND)</option>
              </select>
            </div>
          </div>

          <div class="grid-2col" style="gap: 16px; margin-bottom: 0;">
            <div class="input-group">
              <label class="input-label">Departure & Return dates</label>
              <input type="text" class="input-field" id="flight-date" value="Tue, 4 Aug — Tue, 11 Aug">
            </div>

            <div class="input-group">
              <label class="input-label">Passengers & Class</label>
              <select class="input-field" id="flight-class">
                <option value="Economy">1 Passenger, Economy Class</option>
                <option value="Premium Economy">1 Passenger, Premium Economy</option>
                <option value="Business">1 Passenger, Business Class</option>
                <option value="First">1 Passenger, First Class</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn-primary" style="height: 52px; font-size: 17px; margin-top: 8px;">
            Search flights →
          </button>
        </form>
      </div>

    </div>

    <div id="booking-result-container"></div>

    <div class="grid-3col">
      <div class="card">
        <span class="caption-text" style="color: var(--color-gold); font-weight: 700;">A380 EXPERIENCE</span>
        <h3 class="card-title" style="margin-top: 4px; margin-bottom: 8px;">Fly the Emirates A380</h3>
        <p class="supporting-text">Enjoy Private Suites, Onboard Lounge, and Shower Spas in First Class.</p>
      </div>

      <div class="card">
        <span class="caption-text" style="color: var(--color-gold); font-weight: 700;">ICE ENTERTAINMENT</span>
        <h3 class="card-title" style="margin-top: 4px; margin-bottom: 8px;">6,500 Channels of Movies</h3>
        <p class="supporting-text">Award-winning inflight entertainment system ice across all cabin classes.</p>
      </div>

      <div class="card">
        <span class="caption-text" style="color: var(--color-gold); font-weight: 700;">DUBAI HUB</span>
        <h3 class="card-title" style="margin-top: 4px; margin-bottom: 8px;">DXB Terminal 3</h3>
        <p class="supporting-text">World-class lounges, direct boarding concourses, and seamless connections.</p>
      </div>
    </div>
  `;
}

function switchSearchTab(tab) {
  const btnFlights = document.getElementById('tab-search-flights');
  const btnManage = document.getElementById('tab-manage-booking');
  const btnStatus = document.getElementById('tab-flight-status');
  const content = document.getElementById('search-tab-content');

  [btnFlights, btnManage, btnStatus].forEach(b => b && b.classList.remove('active'));

  if (tab === 'flights') {
    if (btnFlights) btnFlights.classList.add('active');
    renderLandingView();
  } else if (tab === 'manage') {
    if (btnManage) btnManage.classList.add('active');
    content.innerHTML = `
      <form onsubmit="event.preventDefault(); alert('Finding your booking for EK 001...');">
        <div class="grid-2col" style="gap: 16px;">
          <div class="input-group">
            <label class="input-label">Booking reference (PNR)</label>
            <input type="text" class="input-field" value="EK-98214" required>
          </div>
          <div class="input-group">
            <label class="input-label">Passenger Last Name</label>
            <input type="text" class="input-field" value="Al-Mansoor" required>
          </div>
        </div>
        <button type="submit" class="btn-primary">Manage booking →</button>
      </form>
    `;
  } else if (tab === 'status') {
    if (btnStatus) btnStatus.classList.add('active');
    content.innerHTML = `
      <form onsubmit="event.preventDefault(); alert('Checking Flight Status for EK 001...');">
        <div class="grid-2col" style="gap: 16px;">
          <div class="input-group">
            <label class="input-label">Flight Number</label>
            <input type="text" class="input-field" value="EK 001" required>
          </div>
          <div class="input-group">
            <label class="input-label">Date</label>
            <input type="text" class="input-field" value="Tue, 4 Aug" required>
          </div>
        </div>
        <button type="submit" class="btn-primary">Check flight status →</button>
      </form>
    `;
  }
}

function handleBuyTicket() {
  const destination = document.getElementById('flight-to').value;
  const travelClass = document.getElementById('flight-class').value;
  const date = document.getElementById('flight-date').value;
  const resultContainer = document.getElementById('booking-result-container');

  const prices = {
    'Economy': 'GBP £680',
    'Premium Economy': 'GBP £1,250',
    'Business': 'GBP £2,850',
    'First': 'GBP £5,900'
  };

  resultContainer.innerHTML = `
    <div class="card" style="border-color: var(--border-success); background-color: var(--bg-success); margin-bottom: 24px;">
      <div class="card-header">
        <div>
          <span class="caption-text" style="color: var(--color-success);">Emirates Booking Confirmed</span>
          <h3 class="card-title" style="color: var(--color-success);">Ticket Reserved Successfully!</h3>
        </div>
        <span class="chip chip-completed">Confirmed</span>
      </div>

      <div style="background-color: #FFFFFF; padding: 20px; border-radius: 12px; border: var(--border-standard); margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <div>
            <span class="caption-text">Passenger Ticket</span>
            <p class="body-text" style="font-weight: 700; color: var(--color-primary); font-size: 18px;">EK 001 • ${travelClass}</p>
          </div>
          <div style="text-align: right;">
            <span class="caption-text">Booking Reference</span>
            <p class="body-text" style="font-weight: 700; font-size: 18px; color: var(--color-gold);">EK-98214</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
          <div><strong>Passenger Name:</strong> ${currentUser.name}</div>
          <div><strong>Route:</strong> DXB → ${destination}</div>
          <div><strong>Assigned Seat:</strong> 14A (Window)</div>
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Terminal:</strong> DXB Terminal 3</div>
          <div><strong>Total Paid:</strong> <span style="color: var(--color-success); font-weight: 700; font-size: 16px;">${prices[travelClass] || 'GBP £680'}</span></div>
        </div>
      </div>

      <button class="btn-secondary" onclick="alert('Digital Boarding Pass saved to Apple Wallet!')">
        Download Boarding Pass
      </button>
    </div>
  `;
}

/* ==========================================================================
   5. Passenger Sign In & Sign Up Views
   ========================================================================== */
function renderSignInView() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="card" style="max-width: 480px; margin: 0 auto; padding: 28px;">
      <div class="card-header">
        <div>
          <span class="caption-text">Emirates Skywards</span>
          <h1 class="page-title">Sign In to Your Account</h1>
        </div>
        <span class="chip chip-completed">Skywards</span>
      </div>

      <form onsubmit="event.preventDefault(); handlePassengerSignIn();">
        <div class="input-group">
          <label class="input-label">Email or Skywards Number</label>
          <input type="email" id="signin-email" class="input-field" value="passenger@emirates.com" required>
        </div>

        <div class="input-group">
          <label class="input-label">Password</label>
          <input type="password" id="signin-password" class="input-field" value="123" required>
        </div>

        <button type="submit" class="btn-primary" style="margin-top: 8px;">
          Sign in to Skywards →
        </button>
      </form>

      <div style="margin-top: 20px; text-align: center; border-top: 1px solid var(--border-color); padding-top: 16px;">
        <span class="supporting-text">Don't have an Emirates account?</span>
        <a href="#signup" style="color: var(--color-primary); font-weight: 700; margin-left: 6px; text-decoration: none;" onclick="switchRoute('signup')">
          Join Skywards Free →
        </a>
      </div>
    </div>
  `;
}

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
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="card" style="max-width: 480px; margin: 0 auto; padding: 28px;">
      <div class="card-header">
        <div>
          <span class="caption-text">Join Emirates Skywards</span>
          <h1 class="page-title">Create Account</h1>
        </div>
        <span class="chip chip-info">User Account</span>
      </div>

      <form onsubmit="event.preventDefault(); handlePassengerSignUp();">
        <div class="input-group">
          <label class="input-label">Full Name</label>
          <input type="text" id="signup-name" class="input-field" placeholder="e.g. Sara Al-Mansoor" required>
        </div>

        <div class="input-group">
          <label class="input-label">Email Address</label>
          <input type="email" id="signup-email" class="input-field" placeholder="name@example.com" required>
        </div>

        <div class="input-group">
          <label class="input-label">Create Password</label>
          <input type="password" id="signup-password" class="input-field" placeholder="••••••••" required>
        </div>

        <p class="caption-text" style="margin-bottom: 16px; color: var(--text-secondary);">
          Note: Newly created accounts receive the <strong>USER</strong> role and can manage bookings and search flights.
        </p>

        <button type="submit" class="btn-primary">
          Join Emirates Skywards →
        </button>
      </form>
    </div>
  `;
}

function handlePassengerSignUp() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();

  const newUser = { name, email, password, role: 'user', date: '4 Aug 2026' };
  USERS_DB.push(newUser);
  saveUserDatabase();
  currentUser = newUser;

  alert(`Account created successfully! Signed in as ${name} (Role: USER).`);
  switchRoute('landing');
}

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
    <div class="card" style="max-width: 480px; margin: 0 auto; border-color: var(--color-primary); padding: 28px;">
      <div class="card-header">
        <div>
          <span class="caption-text" style="color: var(--color-primary); font-weight: 700;">Restricted Route (/admin)</span>
          <h1 class="page-title">Admin OCC Login</h1>
        </div>
        <span class="chip chip-blocked">Admin Only</span>
      </div>

      <div style="background-color: var(--bg-error); border: 1px solid var(--border-error); padding: 14px; border-radius: 8px; margin-bottom: 20px;">
        <p class="supporting-text" style="color: var(--color-error); font-weight: 600;">
          ⚠ Access Restricted: You must sign in with an ADMIN role account to access the DXB Operations Control Center (/admin).
        </p>
      </div>

      <form onsubmit="event.preventDefault(); handleAdminLogin();">
        <div class="input-group">
          <label class="input-label">Admin Email / Staff ID</label>
          <input type="email" id="admin-email" class="input-field" value="admin@dxb.gov.ae" required>
        </div>

        <div class="input-group">
          <label class="input-label">Admin Password</label>
          <input type="password" id="admin-password" class="input-field" value="admin" required>
        </div>

        <button type="submit" class="btn-primary" style="margin-top: 8px;">
          Authenticate & Open /admin Platform →
        </button>
      </form>

      <div style="margin-top: 20px; text-align: center; border-top: 1px solid var(--border-color); padding-top: 16px;">
        <a href="#landing" style="color: var(--text-secondary); text-decoration: none;" onclick="switchRoute('landing')">
          ← Return to Public Emirates Site
        </a>
      </div>
    </div>
  `;
}

function handleAdminLogin() {
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();

  const user = USERS_DB.find(u => u.email === email && u.password === password && u.role === 'admin');
  if (user) {
    currentUser = user;
    alert(`Admin Authentication Granted! Opening DXB OCC Platform for ${user.name}.`);
    switchRoute('admin');
  } else {
    alert('Access Denied: Invalid Admin credentials. Demo Admin Login: admin@dxb.gov.ae / admin');
  }
}

/* ==========================================================================
   7. /admin Operations Control Platform & User Management Module
   ========================================================================== */
function initModuleStrip() {
  const chips = document.querySelectorAll('.module-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const moduleId = chip.getAttribute('data-module');
      if (!moduleId) return;

      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      currentAdminModule = moduleId;
      loadAdminModule(moduleId);
    });
  });
}

function initBottomNav() {
  const navItems = document.querySelectorAll('.bottom-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const target = item.getAttribute('data-nav');
      if (target === 'home') {
        switchRoute('landing');
      } else if (target === 'signin') {
        switchRoute('signin');
      }
    });
  });
}

async function loadAdminModule(moduleId) {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

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
    renderUserManagementModule();
    return;
  }

  if (moduleId === 'dashboard') {
    renderAdminDashboard();
    return;
  }

  try {
    const pagePath = `pages/${moduleId}.html`;
    const response = await fetch(pagePath);
    if (response.ok) {
      const htmlText = await response.text();
      const cleanedContent = htmlText.replace(/<!--[\s\S]*?-->/g, '').trim();
      
      if (cleanedContent.length > 0) {
        contentArea.innerHTML = htmlText;
        // Re-execute inline scripts in loaded page
        const scripts = contentArea.querySelectorAll('script');
        scripts.forEach(oldScript => {
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
          oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        return;
      }
    }

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
            <span class="caption-text">Admin Control</span>
            <h2 class="card-title">Add New User</h2>
          </div>
          <span class="chip chip-completed">Admin Role</span>
        </div>

        <form onsubmit="event.preventDefault(); handleAddNewUserByAdmin();">
          <div class="input-group">
            <label class="input-label">Full Name</label>
            <input type="text" id="newuser-name" class="input-field" placeholder="e.g. Captain John" required>
          </div>

          <div class="input-group">
            <label class="input-label">Email Address</label>
            <input type="email" id="newuser-email" class="input-field" placeholder="john@dxb.gov.ae" required>
          </div>

          <div class="input-group">
            <label class="input-label">Password</label>
            <input type="password" id="newuser-password" class="input-field" placeholder="Initial password" required>
          </div>

          <div class="input-group">
            <label class="input-label">Assign Role</label>
            <select id="newuser-role" class="input-field">
              <option value="user">USER (Passenger — No /admin access)</option>
              <option value="admin">ADMIN (OCC Staff — Full /admin access)</option>
            </select>
          </div>

          <button type="submit" class="btn-primary" style="margin-top: 8px;">
            Create User Account →
          </button>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Registered System Users</h2>
          <span class="supporting-text">${USERS_DB.length} Total</span>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-secondary);">
                <th style="padding: 8px;">Name</th>
                <th style="padding: 8px;">Email</th>
                <th style="padding: 8px;">Role</th>
                <th style="padding: 8px;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${userRowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function handleAddNewUserByAdmin() {
  const name = document.getElementById('newuser-name').value.trim();
  const email = document.getElementById('newuser-email').value.trim();
  const password = document.getElementById('newuser-password').value.trim();
  const role = document.getElementById('newuser-role').value;

  const newUser = { name, email, password, role, date: '4 Aug 2026' };
  USERS_DB.push(newUser);
  saveUserDatabase();

  alert(`New Account '${name}' created successfully with role '${role.toUpperCase()}'! User saved to LocalStorage.`);
  renderUserManagementModule();
}

function renderAdminDashboard() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="grid-2col" style="margin-bottom: var(--space-16);">
      <div class="card" style="margin-bottom: 0;">
        <div class="card-header">
          <div>
            <span class="caption-text">DXB OCC Telemetry</span>
            <h2 class="card-title" style="color: var(--color-primary);">${SHARED_SCENARIO.flight}</h2>
          </div>
          <span class="chip chip-completed">
            <span class="chip-icon">✓</span> Scheduled
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: var(--space-8); background: var(--bg-secondary); padding: 12px; border-radius: 12px; margin-bottom: 12px;">
          <div>
            <span class="caption-text">Route</span>
            <p class="body-text" style="font-weight: 600;">${SHARED_SCENARIO.route}</p>
          </div>
          <div>
            <span class="caption-text">Boarding Time</span>
            <p class="body-text" style="font-weight: 600;">${SHARED_SCENARIO.boarding}</p>
          </div>
          <div>
            <span class="caption-text">Terminal</span>
            <p class="body-text" style="font-weight: 600;">${SHARED_SCENARIO.terminal}</p>
          </div>
        </div>

        <button class="btn-primary" onclick="loadAdminModule('crew-flow')">
          View Flight Operations →
        </button>
      </div>

      <div class="card" style="background-color: var(--bg-secondary); margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <span class="chip chip-action-required" style="padding: 6px;">⚠</span>
          <div>
            <h3 class="card-title" style="font-size: 16px;">Ground Task Incomplete</h3>
            <p class="supporting-text" style="margin-top: 4px;">Finalize ground crew clearance for EK 001 departure.</p>
          </div>
        </div>

        <div style="margin-top: 16px;">
          <span class="chip chip-action-required">Action required</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Live Operational Status</h3>
        <span class="supporting-text">${SHARED_SCENARIO.date} • ${SHARED_SCENARIO.airport}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: var(--space-12);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
          <div>
            <p class="body-text" style="font-weight: 600; font-size: 15px;">Runway 12L & 12R</p>
            <span class="supporting-text">Normal departure operations</span>
          </div>
          <span class="chip chip-completed">✓ Active</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p class="body-text" style="font-weight: 600; font-size: 15px;">Gate A14 Boarding</p>
            <span class="supporting-text">EK 001 passenger check-in</span>
          </div>
          <span class="chip chip-in-progress">In progress</span>
        </div>
      </div>
    </div>
  `;
}

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