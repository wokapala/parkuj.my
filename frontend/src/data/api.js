import { MOCK_PARKINGS } from "./mockData";

const PARKING_EMOJIS = ["🏢", "🏬", "🏛️", "🅿️", "✈️"];

const mapLotToCard = (lot, index) => ({
  id: lot.id ?? lot.parkingLotId,
  name: lot.name,
  address: lot.address,
  spots: lot.placesCount ?? 0,
  available: lot.reservablePlacesCount ?? 0,
  price: lot.pricePerHour != null ? Number(lot.pricePerHour) : 0,
  img: PARKING_EMOJIS[index % PARKING_EMOJIS.length],
  coords:
    lot.latitude != null && lot.longitude != null
      ? [Number(lot.latitude), Number(lot.longitude)]
      : [52.2297, 21.0122],
});

export async function fetchParkingLots() {
  try {
    const response = await fetch("/api/parking-lots");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return MOCK_PARKINGS;
    return data.map(mapLotToCard);
  } catch (error) {
    console.warn("Nie udało się pobrać parkingów z API — używam danych mockowych.", error);
    return MOCK_PARKINGS;
  }
}

async function apiCall(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let data = null;
  try { data = await response.json(); } catch { /* brak ciała */ }
  if (!response.ok) {
    throw new Error(data?.message || `Błąd HTTP ${response.status}`);
  }
  return data;
}

export function registerCustomer(payload) {
  return apiCall("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export function loginCustomer(payload) {
  return apiCall("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export function fetchCurrentCustomer(customerId) {
  return apiCall(`/api/customers/me?customerId=${customerId}`);
}

// Panel admina (oddzielne logowanie, oddzielne endpointy /api/admin/*).
export function adminLogin(payload) {
  return apiCall("/api/admin/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export function fetchAllCustomers() {
  return apiCall("/api/admin/customers");
}

export async function fetchAllReservations() {
  const data = await apiCall("/api/admin/reservations");
  return Array.isArray(data) ? data.map(mapReservation) : [];
}

export function fetchAllIncidents() {
  return apiCall("/api/admin/incidents");
}

export function createIncident(adminId, payload) {
  return apiCall(`/api/admin/incidents?adminId=${adminId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateIncidentStatus(incidentId, status) {
  return apiCall(`/api/admin/incidents/${incidentId}/status?status=${status}`, {
    method: "PATCH",
  });
}

export function fetchParkingLotStats(lotId) {
  return apiCall(`/api/parking-lots/${lotId}/stats`);
}

export function updateParkingLotConfig(lotId, payload) {
  return apiCall(`/api/parking-lots/${lotId}/config`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function sendContactMessage(payload) {
  return apiCall("/api/contact", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCurrentCustomer(customerId, payload) {
  return apiCall(`/api/customers/me?customerId=${customerId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Backend zwraca VehicleDTO z polami plateNumber/countryCode/primary;
// UI pracuje na plate/country/primary — mapujemy do wspólnego kształtu.
const mapVehicle = (v) => ({
  id: v.id ?? v.vehicleId,
  plate: v.plateNumber,
  country: v.countryCode,
  name: v.name || v.plateNumber,
  primary: v.primary ?? v.primaryVehicle ?? false,
  hasActiveReservation: v.hasActiveReservation ?? false,
});

export async function fetchVehicles(customerId) {
  const data = await apiCall(`/api/vehicles?customerId=${customerId}`);
  return Array.isArray(data) ? data.map(mapVehicle) : [];
}

export async function addVehicle(payload) {
  const data = await apiCall("/api/vehicles", { method: "POST", body: JSON.stringify(payload) });
  return mapVehicle(data);
}

export function deleteVehicle(vehicleId, customerId) {
  return apiCall(`/api/vehicles/${vehicleId}?customerId=${customerId}`, { method: "DELETE" });
}

export async function setPrimaryVehicle(vehicleId, customerId) {
  const data = await apiCall(`/api/vehicles/${vehicleId}/primary?customerId=${customerId}`, { method: "PATCH" });
  return mapVehicle(data);
}

// Backend zwraca ReservationResponseDTO z ISO startAt/endAt;
// UI pracuje na osobnym date / time / status (skompresowanym do 3 grup).
const ACTIVE_STATUSES = new Set(["PENDING", "CONFIRMED", "ACTIVE"]);
const mapReservation = (r) => {
  const start = r.startAt ? new Date(r.startAt) : null;
  const end = r.endAt ? new Date(r.endAt) : null;
  const hh = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  let uiStatus = "completed";
  if (ACTIVE_STATUSES.has(r.status)) uiStatus = "active";
  else if (r.status === "CANCELLED" || r.status === "EXPIRED") uiStatus = "cancelled";
  return {
    id: r.reservationId,
    code: r.reservationCode,
    parking: r.parkingLotName,
    address: r.parkingLotAddress,
    date: start ? start.toISOString().slice(0, 10) : "",
    time: start && end ? `${hh(start)}–${hh(end)}` : "",
    plate: r.plateNumber || "—",
    price: r.priceEstimated != null ? Number(r.priceEstimated) : 0,
    status: uiStatus,
    backendStatus: r.status,
    spot: r.reservationId ? `${r.reservationId}` : "—",
  };
};

export async function fetchReservations(customerId) {
  const data = await apiCall(`/api/reservations?customerId=${customerId}`);
  return Array.isArray(data) ? data.map(mapReservation) : [];
}

export async function createReservation(payload) {
  const data = await apiCall("/api/reservations", { method: "POST", body: JSON.stringify(payload) });
  return mapReservation(data);
}

export function cancelReservation(reservationId, customerId) {
  return apiCall(`/api/reservations/${reservationId}?customerId=${customerId}`, { method: "DELETE" });
}

export function checkAvailability(lotId, from, to) {
  return apiCall(`/api/parking-lots/${lotId}/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export function fetchParkingLotPrice(lotId, from, to) {
  return apiCall(`/api/parking-lots/${lotId}/price?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}
