/**
 * Emirates–DXB Prototype Engine & Router
 * Public Landing Page, Ticket Booking, User Authentication & /admin OCC Platform
 * Design Guide Version: 7 August 2026
 */

document.addEventListener('DOMContentLoaded', () => {
  initModuleStrip();
  initBottomNav();
  
  // Default to public landing & ticket booking route
  switchRoute('landing');
});

/* ==========================================================================
   1. Shared Scenario Data & App State
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

let currentRoute = 'landing';
let currentAdminModule = 'dashboard';

/* ==========================================================================
   2. Router & View Controller (Landing, Auth, /admin)
   ========================================================================== */
function switchRoute(route) {
  currentRoute = route;

  const publicNav = document.getElementById('public-nav-strip');
  const adminNav = document.getElementById('admin-module-strip');
  const headerSubtitle = document.getElementById('header-subtitle');
  
  const btnLanding = document.getElementById('nav-btn-landing');
  const btnAuth = document.getElementById('nav-btn-auth');
  const btnAdmin = document.getElementById('nav-btn-admin');

  // Reset top button active states
  [btnLanding, btnAuth, btnAdmin].forEach(b => b && b.classList.remove('active'));

  if (route === 'landing') {
    if (btnLanding) btnLanding.classList.add('active');
    if (publicNav) publicNav.style.display = 'flex';
    if (adminNav) adminNav.style.display = 'none';
    if (headerSubtitle) headerSubtitle.textContent = 'Fly Better • Dubai International Airport';
    
    renderLandingView();
  } else if (route === 'auth') {
    if (btnAuth) btnAuth.classList.add('active');
    if (publicNav) publicNav.style.display = 'flex';
    if (adminNav) adminNav.style.display = 'none';
    if (headerSubtitle) headerSubtitle.textContent = 'User & Staff Authentication';
    
    renderAuthView();
  } else if (route === 'admin') {
    if (btnAdmin) btnAdmin.classList.add('active');
    if (publicNav) publicNav.style.display = 'none';
    if (adminNav) adminNav.style.display = 'flex';
    if (headerSubtitle) headerSubtitle.textContent = '/admin OCC Operations Control Center';
    
    loadAdminModule(currentAdminModule);
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
          <!-- Origin -->
          <div class="input-group">
            <label class="input-label">From (Departure)</label>
            <select class="input-field" id="flight-from">
              <option value="DXB" selected>Dubai (DXB) — Terminal 3</option>
            </select>
          </div>

          <!-- Destination -->
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
          <!-- Date -->
          <div class="input-group">
            <label class="input-label">Travel Date</label>
            <input type="text" class="input-field" id="flight-date" value="Tue, 4 Aug">
          </div>

          <!-- Class -->
          <div class="input-group">
            <label class="input-label">Cabin Class</label>
            <select class="input-field" id="flight-class">
              <option value="Economy">Economy Class</option>
              <option value="Business">Business Class</option>
              <option value="First">First Class</option>
            </select>
          </div>
        </div>

        <!-- Single Primary Red CTA Rule -->
        <button type="submit" class="btn-primary" style="margin-top: 8px;">
          Search Flights & Buy Tickets
        </button>
      </form>
    </div>

    <!-- Booking Results Output Container -->
    <div id="booking-result-container"></div>

    <!-- Quick Navigation to Admin Platform -->
    <div class="card" style="background-color: var(--bg-secondary); border-color: var(--border-color);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 class="card-title" style="font-size: 16px;">Airport Operations Personnel?</h3>
          <p class="supporting-text">Access the DXB OCC Operations Control Center dashboard.</p>
        </div>
        <button class="btn-secondary" style="width: auto; padding: 0 16px; height: 40px;" onclick="switchRoute('admin')">
          Go to /admin
        </button>
      </div>
    </div>
  `;
}

function handleBuyTicket() {
  const destination = document.getElementById('flight-to').value;
  const travelClass = document.getElementById('flight-class').value;
  const date = document.getElementById('flight-date').value;
  const resultContainer = document.getElementById('booking-result-container');

  const destNames = {
    'LHR': 'London Heathrow (LHR)',
    'CDG': 'Paris Charles de Gaulle (CDG)',
    'FRA': 'Frankfurt Airport (FRA)',
    'RUH': 'Riyadh (RUH)',
    'JFK': 'New York (JFK)'
  };

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
          <div><strong>Route:</strong> DXB → ${destination}</div>
          <div><strong>Seat:</strong> 14A (Window)</div>
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>Boarding:</strong> 08:30</div>
          <div><strong>Terminal:</strong> DXB Terminal 3</div>
          <div><strong>Total Fare:</strong> <span style="color: var(--color-success); font-weight: 700;">${prices[travelClass]}</span></div>
        </div>
      </div>

      <button class="btn-secondary" onclick="alert('Digital Boarding Pass saved to Apple Wallet / Google Pay!')">
        Download Digital Boarding Pass
      </button>
    </div>
  `;
}

/* ==========================================================================
   4. User & Staff Authentication Page Implementation
   ========================================================================== */
function renderAuthView() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="card" style="max-width: 500px; margin: 0 auto;">
      <div class="card-header">
        <div>
          <span class="caption-text">Authentication</span>
          <h1 class="page-title">Sign In</h1>
        </div>
        <span class="flight-badge-gold">Skywards & Staff</span>
      </div>

      <!-- Auth Tabs -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px; background-color: var(--bg-secondary); padding: 4px; border-radius: 12px;">
        <button class="btn-secondary" id="tab-passenger" style="flex: 1; height: 36px; border: none; font-size: 14px;" onclick="switchAuthTab('passenger')">
          Passenger Sign In
        </button>
        <button class="btn-secondary" id="tab-staff" style="flex: 1; height: 36px; border: none; font-size: 14px; background: transparent; color: var(--text-secondary);" onclick="switchAuthTab('staff')">
          OCC Staff Access
        </button>
      </div>

      <!-- Passenger Form -->
      <form id="auth-form" onsubmit="event.preventDefault(); handleAuthSubmit();">
        <div class="input-group">
          <label class="input-label" id="auth-label-id">Emirates Skywards Number or Email</label>
          <input type="email" class="input-field" placeholder="skywards@emirates.com" required>
        </div>

        <div class="input-group">
          <label class="input-label">Password</label>
          <input type="password" class="input-field" placeholder="••••••••" required>
        </div>

        <button type="submit" class="btn-primary" id="auth-submit-btn" style="margin-top: 8px;">
          Sign In to Skywards Account
        </button>
      </form>

      <div style="margin-top: 16px; text-align: center;">
        <a href="#" class="supporting-text" style="color: var(--color-primary); text-decoration: none;" onclick="switchRoute('admin')">
          Need to access Airport OCC Control Center? Go to /admin →
        </a>
      </div>
    </div>
  `;
}

function switchAuthTab(type) {
  const tabPassenger = document.getElementById('tab-passenger');
  const tabStaff = document.getElementById('tab-staff');
  const labelId = document.getElementById('auth-label-id');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (type === 'staff') {
    tabStaff.style.background = 'var(--bg-surface)';
    tabStaff.style.color = 'var(--color-primary)';
    tabPassenger.style.background = 'transparent';
    tabPassenger.style.color = 'var(--text-secondary)';

    labelId.textContent = 'Emirates Staff ID / OCC Access Code';
    submitBtn.textContent = 'Access OCC Operations Platform (/admin)';
  } else {
    tabPassenger.style.background = 'var(--bg-surface)';
    tabPassenger.style.color = 'var(--color-primary)';
    tabStaff.style.background = 'transparent';
    tabStaff.style.color = 'var(--text-secondary)';

    labelId.textContent = 'Emirates Skywards Number or Email';
    submitBtn.textContent = 'Sign In to Skywards Account';
  }
}

function handleAuthSubmit() {
  alert('Authentication Successful! Directing to your dashboard...');
  switchRoute('admin');
}

/* ==========================================================================
   5. /admin Operations Control Platform Implementation
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
      } else if (target === 'auth') {
        switchRoute('auth');
      } else if (target === 'admin') {
        switchRoute('admin');
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

function renderAdminDashboard() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <!-- Top Context & Quick Metrics Grid -->
    <div class="grid-2col" style="margin-bottom: var(--space-16);">
      
      <!-- Operational Context Card -->
      <div class="card" style="margin-bottom: 0;">
        <div class="card-header">
          <div>
            <span class="caption-text">DXB OCC Active Telemetry</span>
            <h2 class="card-title" style="color: var(--color-primary);">${SHARED_SCENARIO.flight}</h2>
          </div>
          <span class="chip chip-completed">
            <span class="chip-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            Scheduled
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

      <!-- Required Task Alert Card -->
      <div class="card" style="background-color: var(--bg-secondary); border-color: var(--border-color); margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <span class="chip chip-action-required" style="padding: 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </span>
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
          <span class="chip chip-completed">
            <span class="chip-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            Active
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
          <div>
            <p class="body-text" style="font-weight: 600; font-size: 15px;">Runway 30L</p>
            <span class="supporting-text">Surface inspection scheduled</span>
          </div>
          <span class="chip chip-action-required">
            <span class="chip-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            Action required
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p class="body-text" style="font-weight: 600; font-size: 15px;">Gate A14 Boarding</p>
            <span class="supporting-text">EK 001 passenger check-in</span>
          </div>
          <span class="chip chip-in-progress">
            <span class="chip-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </span>
            In progress
          </span>
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
        <span class="chip chip-in-progress">
          <span class="chip-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </span>
          In progress
        </span>
      </div>

      <p class="supporting-text" style="margin-bottom: var(--space-16);">
        This module provides operational controls for ${name.toLowerCase()} within the Emirates–DXB platform.
      </p>

      <div style="background: var(--bg-secondary); padding: 12px; border-radius: 12px; margin-bottom: 16px;">
        <span class="caption-text">Scenario Context</span>
        <p class="body-text" style="font-weight: 600; font-size: 15px;">${SHARED_SCENARIO.flight} • ${SHARED_SCENARIO.route}</p>
        <span class="supporting-text">${SHARED_SCENARIO.terminal} • ${SHARED_SCENARIO.date} • Boarding ${SHARED_SCENARIO.boarding}</span>
      </div>

      <button class="btn-primary" onclick="loadAdminModule('dashboard')">
        Return to OCC Dashboard
      </button>
    </div>
  `;
}
