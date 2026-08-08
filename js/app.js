/**
 * Dubai Airport Operating Platform - Application Core Engine
 * Handlers for real-time dynamic clock, sidebar navigation,
 * dashboard views, and module placeholder page rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initNavigation();
  renderDashboard();
});

/* ==========================================================================
   1. Dynamic Clock Implementation
   ========================================================================== */
function initClock() {
  const clockElement = document.getElementById('live-clock');
  if (!clockElement) return;

  function updateClock() {
    const now = new Date();
    
    // Format Date: "08 Aug 2026"
    const day = String(now.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    // Format Time: "12:36:42"
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    clockElement.textContent = `${day} ${month} ${year}  ${hours}:${minutes}:${seconds}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* ==========================================================================
   2. Module Definitions & Product Domains
   ========================================================================== */
const MODULE_DATA = {
  'dashboard': {
    title: 'Airport Operations Dashboard',
    isDashboard: true
  },
  'gate-management': {
    title: 'Gate Management',
    tagline: 'Gate Allocation & Departure Gate Control',
    description: 'Monitor gate assignments, real-time occupancy status, boarding progress, and execute dynamic gate reassignments across all terminals.',
    responsibilities: [
      'Gate assignment',
      'Gate status',
      'Boarding status',
      'Gate changes',
      'Gate occupancy'
    ]
  },
  'aircraft-turnaround': {
    title: 'Aircraft Turnaround',
    tagline: 'Ground Handling & Turnaround Services Synchronization',
    description: 'Track and coordinate ground handling operations from aircraft arrival to pushback readiness, ensuring zero turnaround delays.',
    responsibilities: [
      'Aircraft arrival',
      'Cleaning',
      'Catering',
      'Refueling',
      'Maintenance',
      'Baggage handling',
      'Boarding preparation',
      'Pushback readiness'
    ]
  },
  'tower-control': {
    title: 'Local Tower Control',
    tagline: 'Airfield Movement & Air Traffic Operation Center',
    description: 'Monitor aircraft movement, taxiing routes, runway allocation, landing/takeoff sequences, pushback approvals, and tower clearances.',
    responsibilities: [
      'Aircraft movement',
      'Taxiing',
      'Runway status',
      'Landing',
      'Takeoff',
      'Pushback',
      'Clearance'
    ]
  },
  'crew-flow': {
    title: 'CrewFlow',
    tagline: 'Flight Crew Roster & Duty Operations',
    description: 'Manage cockpit and cabin crew rosters, real-time check-in status, availability, flight assignments, and emergency standby replacements.',
    responsibilities: [
      'Crew assignment',
      'Crew schedule',
      'Crew availability',
      'Crew check-in',
      'Crew status',
      'Crew replacement'
    ]
  },
  'passenger-journey': {
    title: 'Passenger Journey',
    tagline: 'Terminal Experience & Departure Flow Management',
    description: 'Oversee passenger check-in, seat allocation, digital boarding pass issuance, security screening flow, and gate boarding validation.',
    responsibilities: [
      'Flight search',
      'Booking',
      'Check-in',
      'Seat selection',
      'Boarding pass',
      'Gate information',
      'Boarding'
    ]
  },
  'operations': {
    title: 'General Operations Control',
    tagline: 'High-Level Airport Operational Logistics',
    description: 'Central operational dispatch and facility management interface for overall airport resource planning.',
    responsibilities: [
      'Resource planning',
      'Incident management',
      'Inter-terminal transfer',
      'Emergency response dispatch'
    ]
  },
  'alerts': {
    title: 'Operational Alerts Center',
    tagline: 'Real-time Incident & Event Monitoring',
    description: 'Live telemetry stream of system alerts, gate changes, maintenance notices, and operational bottlenecks.',
    responsibilities: [
      'Priority alert filtering',
      'Dispatch notifications',
      'Telemetry logging',
      'Severity escalation'
    ]
  },
  'analytics': {
    title: 'Airport Performance Analytics',
    tagline: 'Operational Intelligence & OTP Metrics',
    description: 'Analytical dashboards for On-Time Performance (OTP), turnaround duration metrics, runway throughput, and passenger flow velocity.',
    responsibilities: [
      'OTP tracking',
      'Turnaround bottleneck analysis',
      'Runway throughput report',
      'Gate utilization stats'
    ]
  },
  'settings': {
    title: 'Platform Configuration',
    tagline: 'System Settings & Control Parameters',
    description: 'Manage platform integration parameters, OCC display layouts, system thresholds, and access control policies.',
    responsibilities: [
      'Display preferences',
      'Threshold configuration',
      'Integration endpoints',
      'Role-based permissions'
    ]
  }
};

/* ==========================================================================
   3. Sidebar Navigation Interactivity
   ========================================================================== */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      const moduleId = item.getAttribute('data-module');
      if (!moduleId) return;

      // Update Active Navigation Item UI
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Switch Main View
      if (moduleId === 'dashboard') {
        renderDashboard();
      } else {
        renderModulePlaceholder(moduleId);
      }
    });
  });
}

/* ==========================================================================
   4. Dashboard Rendering Function
   ========================================================================== */
function renderDashboard() {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  contentArea.innerHTML = `
    <div class="dashboard-grid">
      <!-- Section Header -->
      <div class="card-header" style="border: none; padding-bottom: 0; margin-bottom: 0;">
        <div>
          <h1 style="font-size: 1.5rem; font-weight: 700;">Airport Operations Dashboard</h1>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Dubai International Airport (DXB) • Operations Control Center</p>
        </div>
        <div style="display: flex; gap: var(--space-sm);">
          <span class="badge badge-active"><span class="badge-dot"></span> System Live</span>
          <span class="badge badge-info">DXB OCC v1.0</span>
        </div>
      </div>

      <!-- Flight Metrics Row -->
      <div class="metrics-row">
        <div class="stat-widget">
          <span class="stat-label">Total Flights</span>
          <span class="stat-value">248</span>
          <span class="stat-subtext">Scheduled today</span>
        </div>
        <div class="stat-widget">
          <span class="stat-label">Departures</span>
          <span class="stat-value" style="color: var(--color-primary);">124</span>
          <span class="stat-subtext">On track</span>
        </div>
        <div class="stat-widget">
          <span class="stat-label">Arrivals</span>
          <span class="stat-value" style="color: var(--status-info-text);">124</span>
          <span class="stat-subtext">In transit</span>
        </div>
        <div class="stat-widget">
          <span class="stat-label">Delayed Flights</span>
          <span class="stat-value" style="color: var(--status-warning-text);">14</span>
          <span class="stat-subtext">Requires attention</span>
        </div>
        <div class="stat-widget">
          <span class="stat-label">Flights Boarding</span>
          <span class="stat-value" style="color: var(--status-purple-text);">18</span>
          <span class="stat-subtext">Active gates</span>
        </div>
      </div>

      <!-- Operational Status Cards -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Airport Operational Status
          </span>
          <span style="font-size: 0.8rem; color: var(--text-dim);">Live Telemetry</span>
        </div>
        <div class="operational-status-grid">
          <div class="status-card-item">
            <span class="status-card-title">Runway 12L</span>
            <span class="badge badge-active"><span class="badge-dot"></span> Active</span>
          </div>
          <div class="status-card-item">
            <span class="status-card-title">Runway 12R</span>
            <span class="badge badge-active"><span class="badge-dot"></span> Active</span>
          </div>
          <div class="status-card-item">
            <span class="status-card-title">Runway 30L</span>
            <span class="badge badge-maintenance"><span class="badge-dot"></span> Maintenance</span>
          </div>
          <div class="status-card-item">
            <span class="status-card-title">Terminal 1</span>
            <span class="badge badge-operational"><span class="badge-dot"></span> Operational</span>
          </div>
          <div class="status-card-item">
            <span class="status-card-title">Terminal 2</span>
            <span class="badge badge-operational"><span class="badge-dot"></span> Operational</span>
          </div>
          <div class="status-card-item">
            <span class="status-card-title">Terminal 3</span>
            <span class="badge badge-operational"><span class="badge-dot"></span> Operational</span>
          </div>
        </div>
      </div>

      <!-- Main Grid: Active Flights Table & Operational Alerts -->
      <div class="dashboard-two-col">
        <!-- Active Flights Table -->
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header">
            <span class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
              Active Flights Monitoring
            </span>
            <span style="font-size: 0.8rem; color: var(--text-dim);">Updated Real-Time</span>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Flight</th>
                  <th>Airline</th>
                  <th>Route</th>
                  <th>Aircraft</th>
                  <th>Gate</th>
                  <th>Status</th>
                  <th>Departure</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="mono" style="font-weight: 700; color: var(--color-primary);">EK202</td>
                  <td>Emirates</td>
                  <td>Dubai → London</td>
                  <td class="mono">A380</td>
                  <td class="mono" style="font-weight: 600;">A14</td>
                  <td><span class="badge badge-boarding"><span class="badge-dot"></span> Boarding</span></td>
                  <td class="mono">10:45</td>
                </tr>
                <tr>
                  <td class="mono" style="font-weight: 700; color: var(--color-primary);">EK501</td>
                  <td>Emirates</td>
                  <td>Dubai → Paris</td>
                  <td class="mono">B777</td>
                  <td class="mono" style="font-weight: 600;">B22</td>
                  <td><span class="badge badge-delayed"><span class="badge-dot"></span> Delayed</span></td>
                  <td class="mono">11:20</td>
                </tr>
                <tr>
                  <td class="mono" style="font-weight: 700; color: var(--color-primary);">EK303</td>
                  <td>Emirates</td>
                  <td>Dubai → Frankfurt</td>
                  <td class="mono">A350</td>
                  <td class="mono" style="font-weight: 600;">B07</td>
                  <td><span class="badge badge-taxiing"><span class="badge-dot"></span> Taxiing</span></td>
                  <td class="mono">11:35</td>
                </tr>
                <tr>
                  <td class="mono" style="font-weight: 700; color: var(--color-primary);">FZ812</td>
                  <td>flydubai</td>
                  <td>Dubai → Riyadh</td>
                  <td class="mono">B737</td>
                  <td class="mono" style="font-weight: 600;">C12</td>
                  <td><span class="badge badge-ready"><span class="badge-dot"></span> Ready</span></td>
                  <td class="mono">12:00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Operational Alerts Side Panel -->
        <div class="card" style="display: flex; flex-direction: column;">
          <div class="card-header">
            <span class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Operational Alerts
            </span>
            <span class="badge badge-danger">5 New</span>
          </div>
          <div class="alert-list">
            <div class="alert-item alert-info">
              <span class="alert-time">10:32</span>
              <div class="alert-content">
                <strong>Gate A14 boarding started</strong>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Flight EK202 passenger boarding initiated.</p>
              </div>
            </div>
            <div class="alert-item alert-warning">
              <span class="alert-time">10:28</span>
              <div class="alert-content">
                <strong>EK501 delayed by 15 minutes</strong>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Late inbound aircraft turnaround.</p>
              </div>
            </div>
            <div class="alert-item alert-danger">
              <span class="alert-time">10:15</span>
              <div class="alert-content">
                <strong>Runway 30L maintenance scheduled</strong>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Surface inspection & routine maintenance.</p>
              </div>
            </div>
            <div class="alert-item alert-warning">
              <span class="alert-time">10:04</span>
              <div class="alert-content">
                <strong>Crew member late for EK202</strong>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Standby crew notified by CrewFlow.</p>
              </div>
            </div>
            <div class="alert-item alert-info">
              <span class="alert-time">09:50</span>
              <div class="alert-content">
                <strong>Gate B22 changed from B18</strong>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Flight EK501 reallocated due to gate conflict.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   5. Module Placeholder Page Renderer
   ========================================================================== */
function renderModulePlaceholder(moduleId) {
  const contentArea = document.getElementById('main-content');
  if (!contentArea) return;

  const info = MODULE_DATA[moduleId] || {
    title: moduleId,
    tagline: 'Airport Operations Sub-system',
    description: 'This domain module manages dedicated operational functions within the Dubai Airport platform.',
    responsibilities: ['Domain data management', 'Operational workflow', 'Real-time telemetry']
  };

  const responsibilitiesHTML = info.responsibilities.map(r => `
    <li class="responsibility-item">${r}</li>
  `).join('');

  contentArea.innerHTML = `
    <div class="placeholder-container">
      <div class="placeholder-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 4px;">${info.title}</h1>
            <p style="color: var(--color-primary); font-size: 0.9rem; font-weight: 500;">${info.tagline || ''}</p>
          </div>
          <span class="badge badge-warning placeholder-dev-badge">
            <span class="badge-dot"></span> Module under development
          </span>
        </div>
        
        <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; max-width: 800px; margin-top: var(--space-sm);">
          ${info.description}
        </p>

        <div style="display: flex; gap: var(--space-md); margin-top: var(--space-sm);">
          <button class="btn btn-primary" onclick="document.querySelector('[data-module=\\'dashboard\\']').click()">
            ← Back to Operations Dashboard
          </button>
        </div>
      </div>

      <div class="placeholder-responsibilities">
        <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: var(--space-xs);">Domain Responsibilities</h3>
        <p style="color: var(--text-dim); font-size: 0.85rem;">
          This module is assigned to a dedicated engineering track. Future implementation will cover the following responsibilities:
        </p>

        <ul class="responsibility-list">
          ${responsibilitiesHTML}
        </ul>
      </div>
    </div>
  `;
}
