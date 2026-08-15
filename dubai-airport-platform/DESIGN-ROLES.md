# Design & Role Access — elham-branch

## 1. UI/UX surfaces

Same **Emirates brand colors** everywhere (red `#D71A21`, white, gold).  
What changes is **layout/structure**, not the palette:

| Surface | Audience | Design change |
|--------|----------|----------------|
| **Customer** | Guest + Customer | Public header + optional customer portal bar |
| **Management (OCC)** | Tower, Ops, Admin | Sidebar + topbar shell (same colors) |

Layout helpers live in `css/themes.css` (no alternate color theme).

---

## 2. Roles — who sees what

| Role | Portal | Sees |
|------|--------|------|
| **Guest** | Customer site | Book landing, Sign in, Sign up, Staff login link |
| **Customer** | Customer portal bar | Book, My Trips, Manage booking, Flight status |
| **Tower** | OCC sidebar | Dashboard, Tower Control |
| **Ops** | OCC sidebar | Dashboard, Gates, Turnaround, Crew, Passengers |
| **Admin** | OCC sidebar | All OCC modules + User management + access matrix |

Guards live in `js/roles.js` (`ACCESS_MATRIX`) and are enforced in `js/app.js`.

---

## 3. Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `passenger@emirates.com` | `123` | Customer |
| `tower@dxb.gov.ae` | `tower` | Tower |
| `ops@dxb.gov.ae` | `ops` | Ops |
| `admin@dxb.gov.ae` | `admin` | Admin |

- Customer login: `#signin`
- Staff / OCC: `#staff-login` or header link **Staff / OCC**

---

## 4. Run

```bash
cd dubai-airport-platform
python -m http.server 8080
```

Open `http://localhost:8080`
