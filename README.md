# sf-portal

Node.js backend for the shop floor portal.

## Backend

```bash
cd backend
npm start
```

The API runs on `http://localhost:3000` by default.
The SAP UI5 frontend is served by the same backend at `http://localhost:3000/portal`.

### SAP endpoints

- `GET /api/sap/metadata`
- `POST /api/sap/login` with JSON body `{ "userid": "1001", "password": "PASS123" }`
- `GET /api/sap/planned`
- `GET /api/sap/planned?year=2026`
- `GET /api/sap/planned?month=04&year=2026`
- `GET /api/sap/production`
- `GET /api/sap/production?year=2026`
- `GET /api/sap/production?month=04&year=2026`

Responses are parsed from SAP XML into JSON.

## Frontend

The frontend is a lightweight OpenUI5 app in `frontend/webapp`.

- Login posts to `POST /api/sap/login`.
- A successful login stores the SAP user ID in `localStorage`.
- The dashboard has Planned and Production tabs with search, month, and year filters.
- Tables load from `/api/sap/planned` and `/api/sap/production`.
