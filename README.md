# Dubai Airport Operating Platform (airport-ui)

This repository contains the frontend prototype for the **Dubai Airport Operating Platform**.

## 📁 Repository Structure

All project source files are located inside the [`dubai-airport-platform/`](./dubai-airport-platform/) directory:

```text
airport-ui/
│
├── dubai-airport-platform/
│   ├── index.html                  # Main application shell
│   ├── css/                        # Design system & layout stylesheets
│   ├── js/                         # Application engine & routing logic
│   ├── pages/                      # Module pages & templates
│   ├── components/                 # UI component specifications
│   └── README.md                   # Detailed module documentation & guide
│
└── README.md
```

## 🚀 How to Run

### Option A: Standalone Mode (Double Click `index.html`)
1. Open [`dubai-airport-platform/index.html`](./dubai-airport-platform/index.html) directly in any web browser.
2. Runs natively with zero setup. No backend, database, Node.js, `npm install`, or web server required.

### Option B: Developer Mode (Live `pages/*.html` Edits)
To edit HTML files inside `pages/*.html` (e.g. `pages/crew-flow.html`) and see your changes loaded dynamically upon browser refresh, launch a lightweight local server:

* **VS Code Live Server**: Right-click `dubai-airport-platform/index.html` → **Open with Live Server**.
* **Python**: `cd dubai-airport-platform && python3 -m http.server 8080` (open `http://localhost:8080`).
* **Node.js**: `cd dubai-airport-platform && npx serve`.

For full developer guidelines, module responsibilities, and architectural boundaries, see the [Dubai Airport Platform README](./dubai-airport-platform/README.md).
