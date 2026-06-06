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

export function fetchReservations(customerId) {
  return apiCall(`/api/reservations?customerId=${customerId}`);
}

export function createReservation(payload) {
  return apiCall("/api/reservations", { method: "POST", body: JSON.stringify(payload) });
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
