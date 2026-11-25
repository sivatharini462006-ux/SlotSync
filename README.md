# SlotSync — Smart Library, Lab & Resource Booking System

**Tagline:** *Book Smart. Avoid Conflicts. Sync Your Slots.*

SlotSync is a full-stack, concurrency-safe campus resource reservation platform engineered to eliminate double-bookings, walk-in congestion, and abandoned reservations across university libraries, computer labs, study rooms, and seminar equipment.

---

## Core Engineering Highlights

- **Zero Double-Bookings via InnoDB Row-Level Locking:** Uses explicit MySQL transactions (`BEGIN TRANSACTION` + `SELECT ... FOR UPDATE`) to serialize simultaneous booking requests at the database row level, returning `HTTP 409 Conflict` on overlapping time intervals.
- **Interactive Floor & Resource Map:** Visual floor-by-floor occupancy grid with real-time color status (**Green:** Available, **Red:** Booked, **Yellow:** Selected, **Gray:** Unavailable) and instant slot booking.
- **Cryptographic QR Code Check-In:** Generates unique `SYNC-XXXXXX` booking codes paired with SHA-256 hashed check-in tokens and downloadable QR passes.
- **Automated 15-Minute No-Show Release (`node-cron`):** Background scheduler runs every minute to release unclaimed reservations 15 minutes past their start time and auto-complete finished sessions.
- **Role-Based Access Control (RBAC):** Dedicated portals and JWT-protected APIs for **Students**, **Faculty**, and **Administrators**.
- **Admin Analytics & Audit Trail:** Interactive **Chart.js** visualizations (daily/weekly trends, category distribution, utilization percentage) alongside an immutable security audit log.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, React Router, Axios, Chart.js (`react-chartjs-2`), Lucide Icons |
| **Backend** | Node.js, Express.js, JWT (`jsonwebtoken`), `bcrypt`, `qrcode`, `node-cron`, `express-rate-limit` |
| **Database** | MySQL 8+ (InnoDB Storage Engine with ACID Transactions & Composite Indexes) |

---

## Project Structure

```text
SlotSync/
├── database/
│   ├── schema.sql          # Relational MySQL InnoDB schema & indexes
│   └── seed.sql            # Initial roles, floors, resources & sample bookings
├── server/
│   ├── config/db.js        # MySQL connection pool
│   ├── controllers/        # Auth, Resource, Booking, Check-In & Admin controllers
│   ├── jobs/noShowJob.js   # node-cron 15-minute no-show auto-release worker
│   ├── middleware/         # JWT verification, RBAC guards & error handler
│   ├── models/             # Parameterized SQL queries
│   ├── routes/             # Express REST API endpoints
│   ├── services/           # Transaction-safe booking engine (SELECT ... FOR UPDATE)
│   ├── tests/              # Automated Promise.all concurrency stress test suite
│   └── server.js           # Express application entry point
└── client/
    └── src/
        ├── components/     # Logo, StatusBadge
        ├── context/        # AuthContext (JWT state & session verification)
        ├── layouts/        # Responsive role-based Sidebar & Navbar shell
        ├── pages/          # Public, Student, Faculty & Admin portal views
        ├── routes/         # ProtectedRoute RBAC wrapper
        └── services/       # Axios client with Bearer token interceptor