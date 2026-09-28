# System Inventory — Backend API

REST API for the **System Inventory (Stockify)** warehouse management system: Express + Sequelize + MySQL, with JWT authentication, role-based permissions, realtime updates via Socket.IO, and Excel/PDF/QR/Barcode generation.

> This Git repository tracks **only the backend**. The frontend, the root `package.json`, and the full documentation live in the parent `system_inventroy/` folder and are not part of this repo.

- Full project documentation (English): [`../README.md`](../README.md)
- Dokumentasi lengkap (Bahasa Indonesia): [`../DOKUMENTASI.md`](../DOKUMENTASI.md)

---

## Requirements

- Node.js (LTS)
- MySQL server (default connection: `127.0.0.1:3306`, user `root`, no password)

## Setup

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Edit `.env` to match your environment, then start the server:

```bash
npm run dev     # nodemon, auto-reload
npm start       # production
```

The API listens on `PORT` (default **5000**) → **http://localhost:5000/api**

Health check: **http://localhost:5000/api/health**

## Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `nodemon src/server.js` | Development server with auto-reload |
| `npm start` | `node src/server.js` | Production server |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP port |
| `NODE_ENV` | `development` | Runtime environment |
| `DB_DIALECT` | `mysql` | ORM dialect (`mysql` or `sqlite`) |
| `DB_HOST` | `127.0.0.1` | Database host |
| `DB_PORT` | `3306` | Database port |
| `DB_NAME` | `inventory_db` | Database name |
| `DB_USER` | `root` | Database user |
| `DB_PASSWORD` | *(empty)* | Database password |
| `DB_LOGGING` | `false` | Log every SQL query |
| `DB_STORAGE` | — | SQLite file path (only when `DB_DIALECT=sqlite`) |
| `JWT_ACCESS_SECRET` | **required** | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | **required** | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin (the frontend) |
| `MAIL_HOST` | *(empty)* | SMTP host; empty = log reset links to console |
| `MAIL_PORT` | `587` | SMTP port |
| `MAIL_USER` | *(empty)* | SMTP username |
| `MAIL_PASS` | *(empty)* | SMTP password |
| `MAIL_FROM` | `System Inventory <no-reply@company.com>` | Sender address |
| `UPLOAD_DIR` | `uploads` | Directory for uploaded files |
| `MAX_FILE_SIZE` | `5242880` | Max upload size in bytes (5 MB) |

> `.env` is git-ignored — never commit real secrets. Use `.env.example` as the template.

## API Endpoints

All routes are mounted under `/api`.

| Group | Endpoint | Description |
|---|---|---|
| Health | `GET /health` | Service health & uptime |
| Auth | `/auth` | Login, refresh, logout, forgot/reset password |
| Users | `/users` | User & role management |
| Branches | `/branches` | Branches |
| Warehouses | `/warehouses` | Warehouses |
| Locations | `/locations` | Area → rack → shelf → bin hierarchy |
| Suppliers | `/suppliers` | Suppliers |
| Customers | `/customers` | Customers |
| Categories | `/categories` | Parent–child categories |
| Brands | `/brands` | Product brands |
| Products | `/products` | Products, barcode/QR generation, import/export |
| Purchase Orders | `/purchase-orders` | Create & approve POs |
| Goods Receipts | `/goods-receipts` | Record received goods with photo evidence |
| Stock In | `/stock-in` | Manual stock in |
| Stock Out | `/stock-out` | Stock out with approval |
| Transfers | `/transfers` | Inter-warehouse stock transfers |
| Adjustments | `/adjustments` | Stock discrepancy corrections |
| Opnames | `/opnames` | Physical stock counts |
| Movements | `/movements` | Stock movement ledger |
| Reports | `/reports` | Stock & movement reports, Excel export |
| Audit Logs | `/audit-logs` | User activity audit trail |
| Settings | `/settings` | Application configuration |

## Project Structure

```
backend/
├── .env.example
├── .gitignore
├── package.json
└── src/
    ├── config/         # env + database configuration
    ├── controllers/    # business logic per module
    ├── middlewares/    # auth, authorization, validation, error handler
    ├── models/         # Sequelize models (28 tables)
    ├── routes/         # API routes
    ├── services/       # permission, stock, audit, notification services
    ├── sockets/        # realtime (Socket.IO)
    ├── utils/          # ApiError, ApiResponse, jwt, logger, mailer
    ├── validators/     # Joi validation schemas
    ├── app.js          # Express app
    ├── initDb.js       # database initialization / sync
    └── server.js       # entry point
```

## Notes

- Uploaded files are served statically from `/uploads`; the folder is created on demand and is git-ignored.
- Unhandled errors are appended to `logs/error.log`, which is created on demand and git-ignored.
- The database schema and seed data live in the sibling `database/` folder, which is currently not part of this repository.

## License

Internal/private project (`private: true`).
