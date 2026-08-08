# Dubai Airport Operating Platform

A modular, frontend-only prototype for automating and managing airport operations at Dubai International Airport (DXB). Built for the Operations Control Center (OCC), this platform provides a unified control panel for airfield telemetry, gate management, turnaround logistics, flight crew tracking, and passenger services.

---

## 🚀 Quick Start & How to Run

### Option A: Direct Browser Mode (Standalone / Zero Setup)
1. Clone or download this repository:
   ```bash
   git clone git@github.com:ahmadabd/airport-ui.git
   ```
2. Open `dubai-airport-platform/index.html` directly in any modern web browser (Chrome, Safari, Firefox, Edge).
3. The dashboard, live clock, active flight metrics, and built-in module views work **100% out of the box**.

> **Note**: No backend, database, Node.js, `npm install`, or web server is required for this mode.

---

### Option B: Developer Mode (Live `pages/*.html` Fetching)
If you want to edit HTML files inside `pages/*.html` (e.g., `pages/crew-flow.html`, `pages/gate-management.html`) and see your edits loaded dynamically upon browser refresh:

Modern browsers block local `fetch()` calls over `file://` for security. To bypass this, launch a simple local HTTP server:

* **VS Code Live Server**:
  Right-click `dubai-airport-platform/index.html` → **Open with Live Server**.

* **Python 3 (Built-in on macOS / Linux)**:
  ```bash
  cd dubai-airport-platform
  python3 -m http.server 8080
  ```
  Open **`http://localhost:8080`** in your browser.

* **Node.js (`npx serve`)**:
  ```bash
  cd dubai-airport-platform
  npx serve
  ```
  Open the URL displayed in your terminal.

When running in Developer Mode, `js/app.js` automatically detects your local server and fetches user-edited HTML files directly from `pages/*.html`.

---

## 📁 Project Structure

```text
dubai-airport-platform/
│
├── index.html                  # Main application shell (Topbar, Sidebar, Content Host)
│
├── css/
│   ├── design-system.css       # Core CSS variables, dark theme tokens, UI components
│   └── layout.css              # Structural grid, fixed topbar/sidebar, responsive layouts
│
├── js/
│   └── app.js                  # Navigation engine, live clock, dashboard & module rendering
│
├── pages/
│   ├── dashboard.html          # Operational overview module page
│   ├── gate-management.html    # Gate assignment & occupancy module page
│   ├── aircraft-turnaround.html # Ground services & turnaround module page
│   ├── tower-control.html      # Air traffic & taxiway module page
│   ├── crew-flow.html          # Flight crew roster module page
│   └── passenger-journey.html  # Passenger processing & check-in module page
│
├── components/
│   ├── sidebar.html            # Reusable navigation sidebar spec
│   ├── topbar.html             # Reusable OCC header & clock spec
│   ├── status-badge.html       # Status indicator component spec
│   └── airport-map.html        # Airfield & terminal map component spec
│
└── README.md                   # System documentation & developer guidelines
```

---

## 🏛 Product Domains & Module Responsibilities

The system is architected into discrete operational domains so different engineering sub-teams can build out modules independently:

### 1. 🛫 Gate Management (`pages/gate-management.html`)
* **Gate Assignment**: Automated and manual gate allocation based on aircraft category.
* **Gate Status**: Real-time status tracking (Free, Occupied, Cleaning, Reserved).
* **Boarding Status**: Passenger boarding milestone tracking per gate.
* **Gate Changes**: Instant reassignment and passenger notification dispatch upon gate conflicts.
* **Gate Occupancy**: Historical and predictive gate utilization timelines.

### 2. 🛬 Aircraft Turnaround (`pages/aircraft-turnaround.html`)
* **Aircraft Arrival**: Touchdown time logging and block-in timestamping.
* **Cabin Cleaning & Deering**: De-catering and cabin sanitation progress tracking.
* **Refueling**: Fuel volume monitoring and hazard clearance verification.
* **Line Maintenance**: Pre-flight inspection clearance logging.
* **Baggage Handling**: Offloading and loading container milestone progress.
* **Pushback Readiness**: Final clearance verification before tug connection.

### 3. 🗼 Local Tower Control (`pages/tower-control.html`)
* **Aircraft Movement**: Active radar/GPS taxiway tracking.
* **Taxiing Routes**: Optimal taxi route assignment between gates and runways.
* **Runway Status**: Active operational state for Runways 12L, 12R, and 30L.
* **Landing & Takeoff**: Slot sequencing and departure queues.
* **ATC Clearance**: Digital delivery of departure clearance and pushback authorization.

### 4. 👩‍✈️ CrewFlow (`pages/crew-flow.html`)
* **Crew Assignment**: Pilot and cabin crew pairing to scheduled flights.
* **Shift Schedule**: Flight duty period (FDP) compliance and rest period monitoring.
* **Crew Availability**: Standby and reserve crew pool visibility.
* **Digital Check-In**: Automated biometric/badge check-in verification at OCC.
* **Crew Replacement**: Rapid replacement dispatch in case of delays or illness.

### 5. 🧳 Passenger Journey (`pages/passenger-journey.html`)
* **Check-In & Booking**: Terminal passenger volume and check-in desk throughput.
* **Seat Selection**: Cabin mapping and last-minute seat reallocation.
* **Digital Boarding Pass**: Mobile pass generation and biometric gate validation.
* **Gate Information & Alerts**: Dynamic passenger flight status updates.

---

## 🛠 How Team Members Should Implement Their Module

To add business logic and custom visual views to your module:

1. **Edit your module HTML file** under `pages/<module-name>.html` (e.g. `pages/crew-flow.html`).
2. Run in **Developer Mode** (using Python, Live Server, or `npx serve`) so the browser fetches your `pages/*.html` markup dynamically.
3. **Reuse Design Tokens**:
   - Always use CSS custom properties from `css/design-system.css` (e.g., `var(--bg-surface-1)`, `var(--color-primary)`, `var(--status-active-bg)`).
   - Use standardized status badges (`.badge-active`, `.badge-warning`, `.badge-danger`, `.badge-info`).
   - Use standard data tables (`.data-table`) and card wrappers (`.card`).

---

## 🎨 Design Principles

* **Enterprise OCC Aesthetic**: Dark-themed control room interface (`#090d16` canvas, slate surfaces) optimized for 24/7 visibility and reduced eye strain.
* **Information Density**: Compact layouts prioritizing critical metrics, live telemetry, and actionable alerts over decorative white space.
* **Visual Hierarchy**: High-contrast status indicators (emerald green for active, amber for delayed, crimson for maintenance, cyan for info).
* **Zero External Dependencies**: Pure vanilla HTML5, CSS3, and ES6 JavaScript. No framework overhead or build tool requirement.

---

## 🔮 Future Integration Approach

* **REST / WebSocket Telemetry**: Replace static mock datasets in `js/app.js` with live WebSocket subscriptions to airport radar and FIDS (Flight Information Display System) APIs.
* **Modular Component Loading**: Migrate `pages/*.html` and `components/*.html` into dynamic fetch calls or Web Components when a local server environment is provisioned.
