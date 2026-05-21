# Frontend Endpoint Context

Current status: the frontend does not call the backend yet. There are no `fetch`, Axios, React Query, or other API client calls in `frontend/src` as of this update. The UI is driven by local mock data in `frontend/src/data/mockData.js` and helper calculations in `frontend/src/data/parkingAvailability.js`.

This list describes the API endpoints the current frontend screens imply and should use when the mock data is replaced.

## Customer App Endpoints

### Authentication

| Method | Endpoint | Used by | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/google` | `AuthPage` | Exchange Google OAuth result for app session/JWT. |
| `POST` | `/api/auth/login` | `AuthPage` | Email/password login, currently mocked. |
| `POST` | `/api/auth/register` | `AuthPage` | Create customer account, currently mocked. |

### Current Customer

| Method | Endpoint | Used by | Purpose |
|---|---|---|---|
| `GET` | `/api/customers/me` | `UserPage`, `SettingsPage`, `Nav` | Load current customer profile. |
| `PUT` | `/api/customers/me` | `SettingsPage` | Update name, email, phone, and account preferences. |

### Vehicles

| Method | Endpoint | Used by | Purpose |
|---|---|---|---|
| `GET` | `/api/vehicles` | `UserPage`, `ReservePage` | Load saved vehicles, with primary vehicle first. |
| `POST` | `/api/vehicles` | `AddCarPage` | Add vehicle by plate number and country code. |
| `PATCH` | `/api/vehicles/{vehicleId}/primary` | `UserPage` | Mark one vehicle as primary. |
| `DELETE` | `/api/vehicles/{vehicleId}` | `UserPage` | Delete vehicle when it has no active reservation/session. |

### Parking Search And Details

| Method | Endpoint | Used by | Purpose |
|---|---|---|---|
| `GET` | `/api/parking-lots` | `HomePage`, `ReservePage` | List active parking lots. Should support search/date filters when available. |
| `GET` | `/api/parking-lots/{id}` | `ParkingDetailsPage`, `ReservePage` | Load one parking lot with address, coordinates, pricing, capacity, and stats. |
| `GET` | `/api/parking-lots/{id}/availability?from=&to=` | `ReservePage`, `ParkingDetailsPage` | Check available reservable spots for a date/time window. |
| `GET` | `/api/parking-lots/{id}/price?from=&to=` | `ReservePage`, `ParkingDetailsPage` | Estimate reservation price for the selected time window. |
| `GET` | `/api/parking-lots/{id}/stats?from=&to=` | `ParkingDetailsPage` | Display occupancy, available spots, reservations count, peak hours, and average stay. Do not return income/revenue for this page. |

### Reservations

| Method | Endpoint | Used by | Purpose |
|---|---|---|---|
| `GET` | `/api/reservations` | `Reservations` | Load current customer's reservation history. |
| `POST` | `/api/reservations` | `ReservePage` | Create pending reservation from parking, vehicle/plate, and time window. |
| `POST` | `/api/reservations/{id}/confirm` | `ReservePage` | Confirm reservation after payment. |
| `DELETE` | `/api/reservations/{id}` | `Reservations` | Cancel pending/confirmed reservation. |
| `POST` | `/api/reservations/open-barrier` | Future fallback entry UI | Open barrier by reservation code when OCR fails. |

### Payments

| Method | Endpoint | Used by | Purpose |
|---|---|---|---|
| `POST` | `/api/payments/reservation/{reservationId}` | `ReservePage` | Pay for a reservation by BLIK/card/Google Pay. |
| `POST` | `/api/payments/session/{sessionId}` | Future walk-in payment UI | Pay for active parking session. |

## Owner/Admin Endpoints

| Method | Endpoint | Used by | Purpose |
|---|---|---|---|
| `POST` | `/api/admin/auth/login` | `JoinPage` owner login path | Log in parking owner/admin. |
| `GET` | `/api/admin/sessions/active` | `Dashboard` | Load active sessions for owner dashboard. |
| `POST` | `/api/admin/barriers/{gateId}/open` | `Dashboard` | Manually open a barrier. |
| `PATCH` | `/api/admin/parking-lots/{id}/config` | `Dashboard`, `JoinPage` | Update parking configuration, spot split, price, opening hours, and ANPR settings. |
| `POST` | `/api/admin/incidents` | Future admin incident UI | Create operational incident. |
| `PATCH` | `/api/admin/incidents/{id}` | Future admin incident UI | Update incident status. |

## External Frontend Resources

These are not backend API endpoints, but the frontend currently loads them directly:

| URL | Used by | Purpose |
|---|---|---|
| `https://fonts.googleapis.com/css2?...` | `index.css` | Google Fonts import. |
| `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | `ReservePage`, `ParkingDetailsPage`, `MapPage` | Leaflet/CARTO map tiles. |
| `https://www.openstreetmap.org/copyright` | Map attribution | OpenStreetMap attribution link. |
| `https://carto.com/attributions` | Map attribution | CARTO attribution link. |

## Notes

- Backend controller base paths currently present in code are `/api/auth`, `/api/customers`, `/api/vehicles`, `/api/parking-lots`, `/api/reservations`, `/api/payments`, `/api/barrier`, and `/api/admin`.
- `BarrierController` currently exposes `POST /api/barrier/events` for OCR plate events from an external service. The current frontend does not use it directly.
- Older docs mention `/api/parkings`; the current backend package uses `/api/parking-lots`, so the frontend integration should prefer `/api/parking-lots` unless backend routes are renamed.
