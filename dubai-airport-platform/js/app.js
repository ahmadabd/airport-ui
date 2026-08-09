/**
 * Emirates–DXB Responsive Prototype Engine
 * Supports Fluid Desktop OCC Layout (>768px) and Mobile Viewport (<=768px)
 * Design Guide Version: 7 August 2026
 */

document.addEventListener('DOMContentLoaded', () => {
  initModuleStrip();
  initBottomNav();
  loadModuleView('dashboard');
});

/* ==========================================================================
   1. Shared Scenario Data (Emirates & DXB Standard)
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

/* ==========================================================================
   2. Module Navigation Strip & Bottom Nav Interactivity
   ========================================================================== */
function initModuleStrip() {
  const chips = document.querySelectorAll('.module-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const moduleId = chip.getAttribute('data-module');
      if (!moduleId) return;

      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      loadModuleView(moduleId);
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
        document.querySelector('[data-module="dashboard"]').click();
      } else if (target === 'schedule') {
        document.querySelector('[data-module="crew-flow"]').click();
      } else if (target === 'notifications') {
        renderNotificationsView();
      } else if (target === 'profile') {
        renderProfileView();
      }
    });
  });
}

/* ==========================================================================
   3. Module View Loader (External Fetch + Fallback Engine)
   ========================================================================== */
async function loadModuleView(moduleId) {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  // Sync active module chip if loaded programmatically
  const targetChip = document.querySelector(`.module-chip[data-module="${moduleId}"]`);
  if (targetChip) {
    document.querySelectorAll('.module-chip').forEach(c => c.classList.remove('active'));
    targetChip.classList.add('active');
  }

  // 1. Try to fetch custom page markup from pages/<moduleId>.html
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

  // 2. Fallback to built-in templates
  if (moduleId === 'dashboard') {
    renderDashboard();
  } else {
    renderModulePlaceholder(moduleId);
  }
}

/* ==========================================================================
   4. Responsive Dashboard Renderer (Desktop Grid + Mobile Support)
   ========================================================================== */
function renderDashboard() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <!-- Top Context & Quick Metrics Grid -->
    <div class="grid-2col" style="margin-bottom: var(--space-16);">
      
      <!-- Operational Context Card -->
      <div class="card" style="margin-bottom: 0;">
        <div class="card-header">
          <div>
            <span class="caption-text">Active Flight Context</span>
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

        <button class="btn-primary" onclick="document.querySelector('[data-module=\\'crew-flow\\']').click()">
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
        <h3 class="card-title">Live Operational Telemetry</h3>
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

/* ==========================================================================
   5. Built-in Module Placeholder Renderer
   ========================================================================== */
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

      <button class="btn-primary" onclick="document.querySelector('[data-module=\\'dashboard\\']').click()">
        Return to Home Dashboard
      </button>
    </div>
  `;
}

function renderNotificationsView() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h1 class="page-title">Notifications</h1>
        <span class="chip chip-completed">2 New</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="padding: 12px; background-color: var(--bg-secondary); border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span class="body-text" style="font-weight: 600;">Gate A14 Boarding</span>
            <span class="caption-text">08:30</span>
          </div>
          <p class="supporting-text">Passenger check-in for flight ${SHARED_SCENARIO.flight} is now open.</p>
        </div>

        <div style="padding: 12px; background-color: var(--bg-secondary); border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span class="body-text" style="font-weight: 600;">Runway 30L Inspection</span>
            <span class="caption-text">08:15</span>
          </div>
          <p class="supporting-text">Scheduled maintenance window active until 09:15.</p>
        </div>
      </div>
    </div>
  `;
}

function renderProfileView() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h1 class="page-title">Duty Officer Profile</h1>
          <span class="supporting-text">Emirates Flight Operations</span>
        </div>
        <span class="flight-badge-gold" style="font-weight: 700;">DXB OCC</span>
      </div>

      <div style="padding: 16px; background-color: var(--bg-secondary); border-radius: 12px; margin-bottom: 16px;">
        <p class="body-text" style="font-weight: 600;">Duty Officer — Shift Alpha</p>
        <span class="supporting-text">ID: EK-884912 • Dubai International Airport</span>
      </div>

      <button class="btn-secondary" onclick="alert('Platform Settings & Preferences')">
        Account Settings
      </button>
    </div>
  `;
}
