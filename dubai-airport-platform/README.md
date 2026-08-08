# Dubai Airport Operating Platform

A modular, frontend-only prototype for automating and managing airport operations at Dubai International Airport (DXB). Built for the Operations Control Center (OCC), this platform provides a unified control panel for airfield telemetry, gate management, turnaround logistics, flight crew tracking, and passenger services.

---

## 🚀 Quick Start & How to Run

1. Clone or download this repository.
2. Locate `index.html` in the root directory.
3. Double-click `index.html` or open it directly in any modern web browser (Chrome, Safari, Firefox, Edge).

> **Note**: No backend, database, Node.js, `npm install`, or web server is required. The application runs natively in the browser directly over the `file://` protocol.

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
│   ├── dashboard.html          # Operational overview responsibility placeholder
│   ├── gate-management.html    # Gate assignment & occupancy responsibility placeholder
│   ├── aircraft-turnaround.html # Ground services & turnaround responsibility placeholder
│   ├── tower-control.html      # Air traffic & taxiway responsibility placeholder
│   ├── crew-flow.html          # Flight crew roster responsibility placeholder
│   └── passenger-journey.html  # Passenger processing & check-in responsibility placeholder
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

1. **Locate your domain file** in `pages/<module-name>.html` for documentation or detailed markup references.
2. **Register module rendering in `js/app.js`**:
   - Update `MODULE_DATA['<your-module-id>']` with rich domain dataset or interactive components.
   - Replace the default placeholder render call in `renderModulePlaceholder()` with a dedicated function (e.g. `renderGateManagement()`).
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
