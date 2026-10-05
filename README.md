# Koli — Fleet & Workshop Management API

REST API for **Koli**, a fleet and vehicle-workshop management platform used in production to run the day-to-day operations of a vehicle rental company in Panama: vehicle inventory, entry/exit inspections, workshop reports, mileage tracking, drivers, clients and exit orders — with a full audit trail of every change.

![Node.js](https://img.shields.io/badge/Node.js_22-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express_4-000000?style=flat&logo=express&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat&logo=mariadb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat&logo=nginx&logoColor=white)
![PM2](https://img.shields.io/badge/PM2-2B037A?style=flat&logo=pm2&logoColor=white)

[![CI](https://github.com/Clizco/garage-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/Clizco/garage-backend/actions/workflows/ci.yml)

> Frontend: [garage-frontend](https://github.com/Clizco/garage-frontend) (React 19 + TypeScript + Vite)

---

## Features

- **Vehicle management** — plate, VIN, owner, location, insurance PDF and image gallery per vehicle.
- **Inspections** — entry/exit checklists with mileage, fuel level, lights, accessories and notes.
- **Workshop reports** — repair history and parts used per vehicle.
- **Exit orders** — who took which vehicle, for which client, and for how long.
- **Drivers & clients** — license data, expiration dates and document uploads.
- **Audit log** — middleware that records every create/update/delete with user, IP, user agent and a JSON diff of the changes.
- **Auth** — JWT authentication, bcrypt password hashing and role-based users.
- **File uploads** — vehicle images, driver documents and part photos.

## Architecture

```
            Browser (HTTPS)
                  │
      ┌───────────▼────────────┐
      │  Nginx + Let's Encrypt │  serves the React SPAs
      │  /api/* → reverse proxy│
      └───────────┬────────────┘
                  │
      ┌───────────▼────────────┐
      │  Node.js + Express API │  this repo · managed by PM2
      └───────────┬────────────┘
                  │ mysql2 pool
      ┌───────────▼────────────┐
      │        MariaDB         │  dedicated database server
      └────────────────────────┘
```

Deployed as three Ubuntu servers on DigitalOcean (web, API, database).

## API modules

| Route | Purpose |
|---|---|
| `/users`, `/roles` | Users, login and roles |
| `/vehicles` | Vehicle inventory, images and documents |
| `/vehicle-inspections` | Entry/exit inspections |
| `/workshop-reports` | Repair and maintenance reports |
| `/milages` | Mileage history |
| `/exit-orders` | Vehicle check-out / check-in |
| `/drivers`, `/clients`, `/owners`, `/contacts` | People and companies |
| `/parts` | Mechanical parts inventory |
| `/routes`, `/locations`, `/provinces` | Routes and catalogs |
| `/observations` | Access log of people and vehicles |
| `/audit-logs` | Change history |

## Getting started

```bash
git clone https://github.com/Clizco/garage-backend.git
cd garage-backend
npm install
cp .env.example .env   # fill in your database and JWT values
npm run dev
```

The API starts on `http://localhost:3004` (configurable with `PORT`).

### Environment variables

| Variable | Description |
|---|---|
| `PORT` | API port (default `3004`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MariaDB connection |
| `DB_TIMEZONE` | Database timezone (default `-05:00`, Panama) |
| `JWT_SECRET` | Secret used to sign tokens |

## Project structure

```
src/
├── app.js          # Express app, middlewares and route mounting
├── index.js        # Server entry point
├── config.js       # Loads .env and validates required variables
├── db.js           # MariaDB connection pool
├── routes/         # One folder per API module
├── services/       # Audit log service
├── validators/     # Token and payload validation
└── helpers/
```

## Author

**Abraham Gonzalez** — Full Stack Developer · [GitHub](https://github.com/Clizco)
