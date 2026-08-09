/**
 * Emirates–DXB Prototype Engine & Router
 * Public Landing Page, Ticket Booking, Passenger Auth & Restricted /admin OCC Platform
 * Design Guide Version: 7 August 2026
 */

document.addEventListener('DOMContentLoaded', () => {
  initModuleStrip();
  initBottomNav();
  initHashRouter();
});

/* ==========================================================================
   1. App State & Role-Based Auth DB
   ========================================================================== */
const SHARED_SCENARIO = {
  flight: 'EK 001',
  route: 'DXB → LHR',
  airport: 'Dubai International Airport — DXB',
  terminal: 'Terminal 3',
  date: 'Tue, 4 Aug',
  boarding: '08:30',
  aircraft: 'A380-800'
};

// Initial User Database
const USERS_DB = [
  { name: 'Duty Commander', email: 'admin@dxb.gov.ae', password: 'admin', role: 'admin', date: '4 Aug 2026' },
  { name: 'Sara Al-Mansoor', email: 'passenger@emirates.com', password: '123', role: 'user', date: '4 Aug 2026' }
];

// Current Session User
let currentUser = {
  name: 'Guest User',
  email: '',
  role: 'guest'
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
  } else {
    switchRoute('landing');
  }
}

function switchRoute(route) {
  currentRoute = route;

  const publicNav = document.getElementById('public-nav-strip');
  const adminNav = document.getElementById('admin-module-strip');
  const headerSubtitle = document.getElementById('header-subtitle');
  const userStatusDisplay = document.getElementById('user-status-display');
  
  const btnTickets = document.getElementById('btn-nav-tickets');
  const btnSignin = document.getElementById('btn-nav-signin');
  const btnSignup = document.getElementById('btn-nav-signup');

  // Reset top button active states
  [btnTickets, btnSignin, btnSignup].forEach(b => b && b.classList.remove('active'));

  // Update Status Display
  if (userStatusDisplay) {
    userStatusDisplay.textContent = currentUser.role !== 'guest'
      ? `${currentUser.name} (${currentUser.role.toUpperCase()})`
      : 'Guest Mode';
  }

  if (route === 'landing') {
    window.location.hash = 'landing';
    if (btnTickets) btnTickets.classList.add('active');
    if (publicNav) publicNav.style.display = 'flex';
    if (adminNav) adminNav.style.display = 'none';
    if (headerSubtitle) headerSubtitle.textContent = 'Fly Better • Dubai International Airport';
    
    renderLandingView();
  } else if (route === 'signin') {
    window.location.hash = 'signin';
    if (btnSignin) btnSignin.classList.add('active');
    if (publicNav) publicNav.style.display = 'flex';
    if (adminNav) adminNav.style.display = 'none';
    if (headerSubtitle) headerSubtitle.textContent = 'Passenger Sign In';
    
    renderSignInView();
  } else if (route === 'signup') {
    window.location.hash = 'signup';
    if (btnSignup) btnSignup.classList.add('active');
    if (publicNav) publicNav.style.display = 'flex';
    if (adminNav) adminNav.style.display = 'none';
    if (headerSubtitle) headerSubtitle.textContent = 'Passenger Registration';
    
    renderSignUpView();
  } else if (route === 'admin') {
    window.location.hash = 'admin';
    
    // Check Authorization: Only ADMIN role can access /admin
    if (currentUser.role !== 'admin') {
      if (publicNav) publicNav.style.display = 'flex';
      if (adminNav) adminNav.style.display = 'none';
      if (headerSubtitle) headerSubtitle.textContent = 'Admin Authentication Required';
      
      renderAdminLoginForm();
    } else {
      if (publicNav) publicNav.style.display = 'none';
      if (adminNav) adminNav.style.display = 'flex';
      if (headerSubtitle) headerSubtitle.textContent = '/admin OCC Operations Control Center';
      
      loadAdminModule(currentAdminModule);
    }
  }
}

/* ==========================================================================
   3. Public Landing Page & Buy Ticket Implementation
   ========================================================================== */
function renderLandingView() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <!-- Hero Banner Card -->
    <div class="card" style="background: linear-gradient(135deg, #1D1B1A 0%, #3D3836 100%); color: #FFFFFF; border: none; padding: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="color: var(--color-gold); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Emirates Experience</span>
          <h1 class="page-title" style="color: #FFFFFF; font-size: 26px; margin-top: 4px; margin-bottom: 8px;">Fly Better from Dubai</h1>
          <p class="supporting-text" style="color: #DED8D1; font-size: 15px;">Book non-stop flights from DXB Terminal 3 to over 150 destinations worldwide.</p>
        </div>
        <span class="chip" style="background-color: rgba(198, 161, 91, 0.2); color: var(--color-gold); border-color: var(--color-gold);">
          DXB Hub
        </span>
      </div>
    </div>

    <!-- Buy Ticket Form Card -->
    <div class="card">
      <div class="card-header">
        <div>
          <span class="caption-text">Flight Booking</span>
          <h2 class="card-title" style="color: var(--color-primary);">Buy Tickets</h2>
        </div>
        <span class="chip chip-completed">Best Fares</span>
      </div>

      <form id="booking-form" onsubmit="event.preventDefault(); handleBuyTicket();">
        <div class="grid-2col" style="gap: 12px; margin-bottom: 0;">
          <div class="input-group">
            <label class="input-label">From (Departure)</label>
            <select class="input-field" id="flight-from">
              <option value="DXB" selected>Dubai (DXB) — Terminal 3</option>
            </select>
          </div>

          <div class="input-group">
            <label class="input-label">To (Destination)</label>
            <select class="input-field" id="flight-to">
              <option value="LHR">London Heathrow (LHR)</option>
              <option value="CDG">Paris Charles de Gaulle (CDG)</option>
              <option value="FRA">Frankfurt Airport (FRA)</option>
              <option value="RUH">Riyadh King Khalid (RUH)</option>
              <option value="JFK">New York (JFK)</option>
            </select>
          </div>
        </div>

        <div class="grid-2col" style="gap: 12px; margin-bottom: 0;">
          <div class="input-group">
            <label class="input-label">Travel Date</label>
            <input type="text" class="input-field" id="flight-date" value="Tue, 4 Aug">
          </div>

          <div class="input-group">
            <label class="input-label">Cabin Class</label>
            <select class="input-field" id="flight-class">
              <option value="Economy">Economy Class</option>
              <option value="Business">Business Class</option>
              <option value="First">First Class</option>
            </select>
          </div>
        </div>

        <button type="submit" class="btn-primary" style="margin-top: 8px;">
          Search Flights & Buy Tickets
        </button>
      </form>
    </div>

    <!-- Booking Results Output Container -->
    <div id="booking-result-container"></div>
  `;
}

function handleBuyTicket() {
  const destination = document.getElementById('flight-to').value;
  const travelClass = document.getElementById('flight-class').value;
  const date = document.getElementById('flight-date').value;
  const resultContainer = document.getElementById('booking-result-container');

  const prices = {
    'Economy': 'USD 850',
    'Business': 'USD 2,450',
    'First': 'USD 5,800'
  };

  resultContainer.innerHTML = `
    <div class="card" style="border-color: var(--border-success); background-color: var(--bg-success);">
      <div class="card-header">
        <div>
          <span class="caption-text" style="color: var(--color-success);">Booking Confirmed</span>
          <h3 class="card-title" style="color: var(--color-success);">Ticket Reserved Successfully!</h3>
        </div>
        <span class="chip chip-completed">Confirmed</span>
      </div>

      <div style="background-color: var(--bg-surface); padding: 16px; border-radius: 12px; border: var(--border-standard); margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div>
            <span class="caption-text">Passenger Ticket</span>
            <p class="body-text" style="font-weight: 700; color: var(--color-primary);">EK 001 • ${travelClass}</p>
          </div>
          <div style="text-align: right;">
            <span class="caption-text">Booking Ref</span>
            <p class="body-text" style="font-weight: 700;">EK-98214</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
          <div><strong>Passenger:</strong> ${currentUser.name}</div>
          <div><strong>Route:</strong> DXB → ${destination}</div>
          <div><strong>Seat:</strong> 14A (Window)</div>
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Terminal:</strong> DXB Terminal 3</div>
          <div><strong>Total Fare:</strong> <span style="color: var(--color-success); font-weight: 700;">${prices[travelClass]}</span></div>
        </div>
      </div>

      <button class="btn-secondary" onclick="alert('Digital Boarding Pass saved to Apple Wallet!')">
        Download Digital Boarding Pass
      </button>
    </div>
  `;
}

/* ==========================================================================
   4. Passenger Sign In & Sign Up Forms
   ========================================================================== */
function renderSignInView() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="card" style="max-width: 460px; margin: 0 auto;">
      <div class="card-header">
        <div>
          <span class="caption-text">Passenger Portal</span>
          <h1 class="page-title">Passenger Sign In</h1>
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
          Sign In to Account
        </button>
      </form>

      <div style="margin-top: 16px; text-align: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
        <span class="supporting-text">Don't have an account?</span>
        <a href="#signup" style="color: var(--color-primary); font-weight: 600; margin-left: 6px; text-decoration: none;" onclick="switchRoute('signup')">
          Sign Up Here →
        </a>
      </div>
    </div>
  `;
}

function handlePassengerSignIn() {
  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value.trim();

  const user = USERS_DB.find(u => u.email === email && u.password === password);
  if (user) {
    currentUser = user;
    alert(`Welcome back, ${user.name}! Signed in as Passenger (Role: ${user.role}).`);
    switchRoute('landing');
  } else {
    alert('Invalid email or password. Try: passenger@emirates.com / 123');
  }
}

function renderSignUpView() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="card" style="max-width: 460px; margin: 0 auto;">
      <div class="card-header">
        <div>
          <span class="caption-text">New Passenger</span>
          <h1 class="page-title">Create Account</h1>
        </div>
        <span class="chip chip-info">User Role</span>
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
          <label class="input-label">Password</label>
          <input type="password" id="signup-password" class="input-field" placeholder="Create a password" required>
        </div>

        <p class="caption-text" style="margin-bottom: 12px; color: var(--text-secondary);">
          Note: Newly registered accounts receive the <strong>USER</strong> role and cannot access /admin.
        </p>

        <button type="submit" class="btn-primary">
          Register Passenger Account
        </button>
      </form>

      <div style="margin-top: 16px; text-align: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
        <span class="supporting-text">Already registered?</span>
        <a href="#signin" style="color: var(--color-primary); font-weight: 600; margin-left: 6px; text-decoration: none;" onclick="switchRoute('signin')">
          Sign In →
        </a>
      </div>
    </div>
  `;
}

function handlePassengerSignUp() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();

  // Create new user with 'user' role
  const newUser = { name, email, password, role: 'user', date: '4 Aug 2026' };
  USERS_DB.push(newUser);
  currentUser = newUser;

  alert(`Account created successfully! Signed in as ${name} (Role: USER). You can now search and buy tickets.`);
  switchRoute('landing');
}

/* ==========================================================================
   5. Admin Login Form (Shown when unauthenticated user accesses /admin)
   ========================================================================== */
function renderAdminLoginForm() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="card" style="max-width: 460px; margin: 0 auto; border-color: var(--color-primary);">
      <div class="card-header">
        <div>
          <span class="caption-text" style="color: var(--color-primary); font-weight: 700;">Restricted Route (/admin)</span>
          <h1 class="page-title">Admin OCC Login</h1>
        </div>
        <span class="chip chip-blocked">Admin Only</span>
      </div>

      <div style="background-color: var(--bg-secondary); padding: 12px; border-radius: 12px; margin-bottom: 16px;">
        <p class="supporting-text" style="color: var(--color-error); font-weight: 600;">
          ⚠ Access Denied: You must sign in with an ADMIN role account to access /admin. Regular users cannot access airport operations.
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
          Authenticate & Open /admin Platform
        </button>
      </form>

      <div style="margin-top: 16px; text-align: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
        <a href="#landing" style="color: var(--text-secondary); text-decoration: none;" onclick="switchRoute('landing')">
          ← Return to Public Passenger Site
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
   6. /admin Operations Platform & User Management Module
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

  const targetChip = document.querySelector(`.module-chip[data-module="${moduleId}"]`);
  if (targetChip) {
    document.querySelectorAll('.module-chip').forEach(c => c.classList.remove('active'));
    targetChip.classList.add('active');
  }

  // Intercept special admin 'user-management' module
  if (moduleId === 'user-management') {
    renderUserManagementModule();
    return;
  }

  // Fetch module HTML from pages/<moduleId>.html
  try {
    const pagePath = `pages/${moduleId}.html`;
    const response = await fetch(pagePath);
    if (response.ok) {
      const htmlText = await response.text();
      const cleanedContent = htmlText.replace(/<!--[\s\S]*?-->/g, '').trim();
      
      if (cleanedContent.length > 0) {
        contentArea.innerHTML = htmlText;
        return;
      }
    }
  } catch (err) {
    console.info(`[Emirates-DXB] Using built-in responsive template for '${moduleId}'.`);
  }

  if (moduleId === 'dashboard') {
    renderAdminDashboard();
  } else {
    renderModulePlaceholder(moduleId);
  }
}

/* ==========================================================================
   7. Admin Module: Add New User & Manage Roles
   ========================================================================== */
function renderUserManagementModule() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  const userRowsHTML = USERS_DB.map(u => `
    <tr>
      <td style="font-weight: 600;">${u.name}</td>
      <td class="mono">${u.email}</td>
      <td>
        ${u.role === 'admin' 
          ? '<span class="chip chip-completed"><span class="chip-icon">✓</span> ADMIN</span>' 
          : '<span class="chip chip-info"><span class="chip-icon">👤</span> USER</span>'}
      </td>
      <td class="caption-text">${u.date || '4 Aug 2026'}</td>
    </tr>
  `).join('');

  contentArea.innerHTML = `
    <div class="grid-2col">
      <!-- Add New User Form Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <span class="caption-text">Admin Control</span>
            <h2 class="card-title">Add New User</h2>
          </div>
          <span class="chip chip-completed">Admin Privilege</span>
        </div>

        <form onsubmit="event.preventDefault(); handleAddNewUserByAdmin();">
          <div class="input-group">
            <label class="input-label">Full Name</label>
            <input type="text" id="newuser-name" class="input-field" placeholder="e.g. Captain Tariq" required>
          </div>

          <div class="input-group">
            <label class="input-label">Email Address</label>
            <input type="email" id="newuser-email" class="input-field" placeholder="user@emirates.com" required>
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
            Create User Account
          </button>
        </form>
      </div>

      <!-- User Roster List Card -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Registered Accounts</h2>
          <span class="supporting-text">${USERS_DB.length} Total</span>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
            <thead>
              <tr style="border-bottom: var(--border-standard); color: var(--text-secondary);">
                <th style="padding: 8px;">Name</th>
                <th style="padding: 8px;">Email</th>
                <th style="padding: 8px;">Role</th>
                <th style="padding: 8px;">Created</th>
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

  USERS_DB.push({ name, email, password, role, date: '4 Aug 2026' });

  alert(`New User '${name}' created successfully with role '${role.toUpperCase()}'!`);
  renderUserManagementModule();
}

/* ==========================================================================
   8. Built-in Admin Dashboard Renderer
   ========================================================================== */
function renderAdminDashboard() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <!-- Top Context & Quick Metrics Grid -->
    <div class="grid-2col" style="margin-bottom: var(--space-16);">
      
      <div class="card" style="margin-bottom: 0;">
        <div class="card-header">
          <div>
            <span class="caption-text">DXB OCC Active Telemetry</span>
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
          <div>
            <span class="caption-text">Date</span>
            <p class="body-text" style="font-weight: 600;">${SHARED_SCENARIO.date}</p>
          </div>
        </div>

        <button class="btn-primary" onclick="loadAdminModule('crew-flow')">
          View Flight Operations
        </button>
      </div>

      <div class="card" style="background-color: var(--bg-secondary); border-color: var(--border-color); margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <span class="chip chip-action-required" style="padding: 6px;">⚠</span>
          <div>
            <h3 class="card-title" style="font-size: 16px;">One required task is incomplete</h3>
            <p class="supporting-text" style="margin-top: 4px;">Complete ground crew clearance to finalize departure dispatch for EK 001.</p>
          </div>
        </div>

        <div style="margin-top: 16px;">
          <span class="chip chip-action-required">Action required</span>
        </div>
      </div>

    </div>

    <!-- Active Flight Status List -->
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
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

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
        Return to OCC Dashboard
      </button>
    </div>
  `;
}
