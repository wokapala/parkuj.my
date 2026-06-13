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
  openFrom: lot.openFrom ?? null,
  openTo: lot.openTo ?? null,
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

export function fetchAllCustomers(adminId) {
  return apiCall(`/api/admin/customers?adminId=${adminId}`);
}

export function banCustomer(customerId, adminId) {
  return apiCall(`/api/admin/customers/${customerId}/ban?adminId=${adminId}`, { method: "PATCH" });
}

export function unbanCustomer(customerId, adminId) {
  return apiCall(`/api/admin/customers/${customerId}/unban?adminId=${adminId}`, { method: "PATCH" });
}

export function deleteCustomer(customerId, adminId) {
  return apiCall(`/api/admin/customers/${customerId}?adminId=${adminId}`, { method: "DELETE" });
}

export function fetchAllParkingLotsAdmin(adminId) {
  return apiCall(`/api/admin/parking-lots?adminId=${adminId}`);
}

export function deleteParkingLot(lotId, adminId) {
  return apiCall(`/api/admin/parking-lots/${lotId}?adminId=${adminId}`, { method: "DELETE" });
}

export async function fetchAllReservations(adminId) {
  const data = await apiCall(`/api/admin/reservations?adminId=${adminId}`);
  return Array.isArray(data) ? data.map(mapReservation) : [];
}

export function fetchAllIncidents(adminId) {
  return apiCall(`/api/admin/incidents?adminId=${adminId}`);
}

export function createIncident(adminId, payload) {
  return apiCall(`/api/admin/incidents?adminId=${adminId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateIncidentStatus(incidentId, status, adminId) {
  return apiCall(`/api/admin/incidents/${incidentId}/status?status=${status}&adminId=${adminId}`, {
    method: "PATCH",
  });
}

export function fetchParkingLotStats(lotId, customerId) {
  return apiCall(`/api/parking-lots/${lotId}/stats?customerId=${customerId}`);
}

export function updateParkingLotConfig(lotId, customerId, payload) {
  return apiCall(`/api/parking-lots/${lotId}/config?customerId=${customerId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Parkingi zarejestrowane przez konkretnego właściciela — do panelu /dashboard.
export async function fetchMyParkingLots(customerId) {
  const data = await apiCall(`/api/parking-lots/my?customerId=${customerId}`);
  return Array.isArray(data) ? data : [];
}

// Tworzy parking + cennik — wywoływane po wizardzie /join.
export function createParkingLot(payload) {
  return apiCall("/api/parking-lots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Statystyki publiczne sieci — kafelki na HomePage.
export function fetchStatsOverview() {
  return apiCall("/api/stats/overview");
}

// Potwierdzenie rezerwacji + zapis płatności (status → CONFIRMED).
// Backend wymaga customerId — potwierdzić może tylko właściciel rezerwacji.
export async function confirmReservation(reservationId, customerId, paymentMethod, providerReference) {
  const params = new URLSearchParams();
  params.set("customerId", customerId);
  if (paymentMethod) params.set("paymentMethod", paymentMethod);
  if (providerReference) params.set("providerReference", providerReference);
  const data = await apiCall(
    `/api/reservations/${reservationId}/confirm?${params.toString()}`,
    { method: "POST" }
  );
  return mapReservation(data);
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
// Data z lokalnych komponentów — toISOString() konwertuje na UTC i dla godzin
// porannych (np. start 01:00 przy UTC+2) przesuwała datę o dzień wstecz.
const localDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
    startAt: r.startAt,
    endAt: r.endAt,
    date: start ? localDate(start) : "",
    time: start && end ? `${hh(start)}–${hh(end)}` : "",
    plate: r.plateNumber || "—",
    price: r.priceEstimated != null ? Number(r.priceEstimated).toFixed(2) : "0.00",
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

export function updateParkingLotPrice(lotId, customerId, newPrice) {
  return apiCall(
    `/api/parking-lots/${lotId}/price?customerId=${customerId}&newPrice=${encodeURIComponent(newPrice)}`,
    { method: "PATCH" }
  );
}

export function fetchAdminStats(adminId) {
  return apiCall(`/api/stats/admin?adminId=${adminId}`);
}

export function fetchCustomerStats(customerId) {
  return apiCall(`/api/stats/customer?customerId=${customerId}`);
}

export function forgotPassword(email) {
  return apiCall(`/api/auth/forgot-password?email=${encodeURIComponent(email)}`, { method: "POST" });
}

// Zgłoszenie incydentu przez właściciela parkingu (bez konta admina).
export function reportLotIncident(lotId, customerId, payload) {
  return apiCall(`/api/parking-lots/${lotId}/incidents?customerId=${customerId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Rezerwacje dla konkretnego parkingu (panel właściciela).
export async function fetchLotReservations(lotId, customerId) {
  const data = await apiCall(`/api/parking-lots/${lotId}/reservations?customerId=${customerId}`);
  return Array.isArray(data) ? data.map(mapReservation) : [];
}
