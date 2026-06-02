import { MOCK_PARKINGS } from "./mockData";

const PARKING_EMOJIS = ["🏢", "🏬", "🏛️", "🅿️", "✈️"];

// Mapuje ParkingLotDTO z backendu na kształt karty używany przez PCard.
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

// Pobiera listę parkingów z backendu (GET /api/parking-lots).
// W razie błędu lub braku danych zwraca dane mockowe — UI działa nawet
// bez uruchomionego API, więc mockup pozostaje prezentowalny offline.
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

// Rejestruje nowego klienta w backendzie (POST /api/auth/register).
// W razie błędu walidacji/konfliktu rzuca Error z komunikatem z backendu,
// żeby AuthPage mogła go pokazać użytkownikowi.
export async function registerCustomer(payload) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // brak ciała odpowiedzi — zostaw data = null
  }

  if (!response.ok) {
    const message = data?.message || `Rejestracja nie powiodła się (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return data;
}
