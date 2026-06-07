import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as I from "../icons";
import PCard from "./PCard";
import { MOCK_PARKINGS } from "../data/mockData";
import { calcHours, getParkingAvailability } from "../data/parkingAvailability";
import { fetchParkingLots, createReservation, confirmReservation } from "../data/api";

const STEPS = [
  { n: 1, label: "Parking" },
  { n: 2, label: "Szczegóły" },
  { n: 3, label: "Płatność" },
];

const makeIcon = (available, selected) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:${selected ? 42 : 36}px;height:${selected ? 42 : 36}px;
      background:${available < 10 ? "#f87171" : "#F17300"};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-weight:800;color:#fff;font-size:13px;
      font-family:Inter,sans-serif;
      box-shadow:0 0 20px ${available < 10 ? "rgba(248,113,113,0.5)" : "rgba(241,115,0,0.5)"};
      border:${selected ? 3 : 2.5}px solid rgba(255,255,255,0.8);
    ">P</div>`,
    iconSize: [selected ? 42 : 36, selected ? 42 : 36],
    iconAnchor: [selected ? 21 : 18, selected ? 21 : 18],
    popupAnchor: [0, -22],
  });

const fmtDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

export default function ReservePage({ user, vehicles = [], setPage, setToast }) {
  const [step, setStep]             = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch]         = useState("");
  const [vehicleMode, setVehicleMode] = useState("saved");
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || null);
  const [plate, setPlate]           = useState("");
  const [date, setDate]             = useState(() => new Date().toISOString().slice(0, 10));
  const [timeFrom, setTimeFrom]     = useState("09:00");
  const [timeTo, setTimeTo]         = useState("17:00");
  const [payMethod, setPayMethod]   = useState("blik");
  const [blik, setBlik]             = useState(["", "", "", "", "", ""]);
  const [parkings, setParkings]     = useState(MOCK_PARKINGS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let active = true;
    fetchParkingLots().then((data) => { if (active) setParkings(data); });
    return () => { active = false; };
  }, []);

  const filteredParkings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return parkings.filter((p) => {
      const matchesQuery = !query || `${p.name} ${p.address}`.toLowerCase().includes(query);
      const hasAvailability = getParkingAvailability(p, date, timeFrom, timeTo) > 0;
      return matchesQuery && hasAvailability;
    });
  }, [parkings, search, date, timeFrom, timeTo]);

  const parking = parkings.find((p) => p.id === selectedId);
  const savedVehicles = vehicles.length ? vehicles : [];
  const selectedVehicle = savedVehicles.find((v) => v.id === selectedVehicleId) || savedVehicles[0];
  const activePlate = vehicleMode === "saved" ? selectedVehicle?.plate || "" : plate;
  const hours = calcHours(timeFrom, timeTo);
  // Backend liczy cenę przez BigDecimal.divide(60, 2, CEILING) — czyli zaokrągla
  // do 0.01h w górę. Musimy zrobić to samo, inaczej user widzi 8 zł a backend
  // zapisze 4 zł (przy 30-minutowej rezerwacji).
  const ceilHours = Math.ceil(hours * 100) / 100;
  const totalRaw = ceilHours * (parking?.price || 0);
  const total = totalRaw > 0 ? totalRaw.toFixed(2) : 0;
  // Rezerwacja w przeszłości — porównujemy start z bieżącą chwilą.
  const isPastReservation = date && timeFrom
    ? new Date(`${date}T${timeFrom}:00`) < new Date()
    : false;

  const handleBlikDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...blik];
    next[i] = val;
    setBlik(next);
    if (val && i < 5) document.getElementById(`blik-${i + 1}`)?.focus();
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedId(null);
    setSearch("");
    setVehicleMode("saved");
    setSelectedVehicleId(savedVehicles[0]?.id || null);
    setPlate("");
    setBlik(["", "", "", "", "", ""]);
    setSubmitError("");
  };

  const handleConfirm = async () => {
    if (!user?.customerId) {
      setSubmitError("Musisz być zalogowany, żeby zarezerwować.");
      return;
    }
    if (!parking) {
      setSubmitError("Wybierz parking.");
      return;
    }
    if (hours <= 0) {
      setSubmitError("Godziny rezerwacji są nieprawidłowe.");
      return;
    }

    const payload = {
      customerId: user.customerId,
      parkingLotId: parking.id,
      startAt: `${date}T${timeFrom}:00`,
      endAt: `${date}T${timeTo}:00`,
    };
    if (vehicleMode === "saved" && selectedVehicle?.id) {
      payload.vehicleId = selectedVehicle.id;
    } else if (vehicleMode === "manual") {
      const trimmed = plate.trim().replace(/\s+/g, "").toUpperCase();
      if (!trimmed) {
        setSubmitError("Podaj numer rejestracyjny.");
        return;
      }
      payload.plateNumber = trimmed;
      payload.countryCode = "PL";
    } else {
      setSubmitError("Wybierz pojazd lub wpisz tablicę ręcznie.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const reservation = await createReservation(payload);
      // Symulacja płatności — od razu potwierdzamy i zapisujemy Payment.
      // W realu byłby tu callback od bramki (BLIK/karta).
      const methodMap = { blik: "BLIK", card: "CARD", gpay: "CARD" };
      const confirmed = await confirmReservation(
        reservation.id,
        methodMap[payMethod] || "BLIK",
        `MOCK_${payMethod.toUpperCase()}_${Date.now()}`
      );
      resetWizard();
      setToast(`✓ Rezerwacja potwierdzona! Kod: ${confirmed.code}`);
      setPage("reservations");
    } catch (err) {
      setSubmitError(err.message || "Nie udało się utworzyć rezerwacji.");
    } finally {
      setSubmitting(false);
    }
  };

  const StepBar = ({ current }) => (
    <div className="wt-bar">
      {STEPS.map((s, i) => (
        <div key={s.n} className={`wt-s ${current > s.n ? "ok" : ""} ${current === s.n ? "on" : ""}`}>
          <div className="wt-d">{current > s.n ? <I.Check /> : s.n}</div>
          <div className="wt-l">{s.label}</div>
          {i < STEPS.length - 1 && <div className="wt-line" />}
        </div>
      ))}
    </div>
  );

  const Summary = () => (
    <div className="res-summary">
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Podsumowanie</div>
        <div style={{ fontSize: 13, color: "var(--text2)" }}>
          {[
            ["Parking", parking?.name || "—"],
            ["Data", fmtDate(date) || "—"],
            ["Godziny", hours > 0 ? `${timeFrom} – ${timeTo}` : "—"],
            ["Czas", hours > 0 ? `${hours} h` : "—"],
            ["Tablica", activePlate || "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{k}</span>
              <span style={{ color: "var(--text)", fontWeight: 500, fontFamily: k === "Tablica" ? "'Space Mono',monospace" : "inherit", fontSize: k === "Tablica" ? 12 : 13 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 800, fontSize: 16 }}>
            <span style={{ color: "var(--text)" }}>Suma</span>
            <span style={{ color: "var(--accent)", fontFamily: "'Space Mono',monospace" }}>
              {totalRaw > 0 ? `${total} zł` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 1) return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Zarezerwuj miejsce</h2>
          <p className="ss">Krok 1 z 3 — wybierz parking</p>
        </div>
      </div>
      <StepBar current={1} />

      <div className="reserve-search">
        <I.MapPin />
        <input
          className="fi"
          placeholder="Szukaj po nazwie, dzielnicy lub adresie"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="reservation-filters">
        <div className="fg">
          <label className="fl">Data</label>
          <input
            className="fi"
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="fg">
          <label className="fl">Od</label>
          <input className="fi" type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} />
        </div>
        <div className="fg">
          <label className="fl">Do</label>
          <input className="fi" type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} />
        </div>
        <div className={`filter-summary${filteredParkings.length > 0 && !isPastReservation && hours > 0 ? " is-available" : ""}`}>
          <span>
            {isPastReservation
              ? "Termin w przeszłości — wybierz przyszły"
              : hours > 0
                ? `${hours} h postoju`
                : "Wybierz poprawne godziny"}
          </span>
          <strong>{filteredParkings.length} parkingów dostępnych</strong>
        </div>
      </div>

      <div className="reserve-pick-layout">
        <div className="reserve-list">
          {filteredParkings.length > 0 ? (
            filteredParkings.map((p) => (
              <PCard
                key={p.id}
                p={p}
                availability={getParkingAvailability(p, date, timeFrom, timeTo)}
                selected={selectedId === p.id}
                onClick={() => setSelectedId(p.id)}
                onDetails={() => setPage("parkingDetails", { parkingId: p.id })}
              />
            ))
          ) : (
            <div className="empty">
              <div className="empty-ic"><I.MapPin /></div>
              <h3>Brak parkingów</h3>
              <p>Zmień frazę wyszukiwania albo wybierz parking z mapy.</p>
            </div>
          )}
        </div>

        <div className="reserve-map">
          <MapContainer
            center={parking?.coords || [52.2297, 21.0122]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
            />
            {parkings.map((p) => {
              const availability = getParkingAvailability(p, date, timeFrom, timeTo);
              return (
              <Marker
                key={p.id}
                position={p.coords}
                icon={makeIcon(availability, selectedId === p.id)}
                eventHandlers={{ click: () => setSelectedId(p.id) }}
              >
                <Popup>
                  <div style={{ fontFamily: "Inter,sans-serif", minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>{p.address}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: availability < 10 ? "#ef4444" : "#22c55e", fontWeight: 600 }}>
                        {availability} wolnych
                      </span>
                      <span style={{ color: "#F17300", fontWeight: 700 }}>{p.price} zł/h</span>
                    </div>
                    <button
                      style={{ marginTop: 8, border: "none", background: "#F17300", color: "#fff", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      onClick={() => setPage("parkingDetails", { parkingId: p.id })}
                    >
                      Szczegóły
                    </button>
                  </div>
                </Popup>
              </Marker>
            )})}
          </MapContainer>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-a"
          disabled={!selectedId || isPastReservation || hours <= 0}
          onClick={() => setStep(2)}
        >
          Dalej <I.Arr />
        </button>
      </div>
    </div>
  );

  if (step === 2) return (
    <div className="fin">
      <button className="btn btn-o btn-sm" style={{ marginBottom: 16 }} onClick={() => setStep(1)}>
        ← Wróć
      </button>
      <StepBar current={2} />
      <div className="res-layout">
        <div className="wt-card">
          <h2>Szczegóły rezerwacji</h2>
          <p className="desc">{parking?.name} · {parking?.price} zł/h</p>

          <div className="fg">
            <label className="fl">Pojazd</label>
            <div className="vehicle-mode">
              <button className={vehicleMode === "saved" ? "on" : ""} onClick={() => setVehicleMode("saved")}>
                Z konta
              </button>
              <button className={vehicleMode === "manual" ? "on" : ""} onClick={() => setVehicleMode("manual")}>
                Wpisz ręcznie
              </button>
            </div>
          </div>

          {vehicleMode === "saved" ? (
            <div className="vehicle-list">
              {savedVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? "on" : ""}`}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                >
                  <span>
                    <strong>{vehicle.name}</strong>
                    {vehicle.primary && <small>Główny</small>}
                  </span>
                  <span className="vehicle-plate">{vehicle.plate}</span>
                </button>
              ))}
              {!savedVehicles.length && (
                <div className="empty-state">
                  <I.Car />
                  <span>Nie masz jeszcze zapisanego pojazdu.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="fg">
              <label className="fl">Numer rejestracyjny</label>
              <input
                className="fi"
                placeholder="np. WA 12345"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                style={{ fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}
              />
            </div>
          )}

          <div className="fg">
            <label className="fl">Data</label>
            <input className="fi" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="fr" style={{ marginBottom: 18 }}>
            <div>
              <label className="fl">Od</label>
              <input className="fi" type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} />
            </div>
            <div>
              <label className="fl">Do</label>
              <input className="fi" type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} />
            </div>
          </div>

          {hours > 0 && (
            <div style={{ padding: "10px 14px", background: "var(--bg3)", borderRadius: 8, fontSize: 13, marginBottom: 18, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text2)" }}>{ceilHours} h × {parking?.price} zł</span>
              <span style={{ fontWeight: 700, color: "var(--accent)", fontFamily: "'Space Mono',monospace" }}>{total} zł</span>
            </div>
          )}

          {isPastReservation && (
            <div className="auth-error" style={{ marginBottom: 16 }}>
              <I.Alert /> Wybrana data i godzina są już w przeszłości. Wybierz przyszły termin.
            </div>
          )}

          <div className="wt-acts">
            <div />
            <button
              className="btn btn-a"
              disabled={!activePlate || hours <= 0 || isPastReservation}
              onClick={() => setStep(3)}
            >
              Przejdź do płatności <I.Arr />
            </button>
          </div>
        </div>

        <Summary />
      </div>
    </div>
  );

  return (
    <div className="fin">
      <button className="btn btn-o btn-sm" style={{ marginBottom: 16 }} onClick={() => setStep(2)}>
        ← Wróć
      </button>
      <StepBar current={3} />
      <div className="res-layout">
        <div className="wt-card">
          <h2>Metoda płatności</h2>
          <p className="desc">Wybierz jak chcesz zapłacić</p>

          <div className="pay-methods">
            {[
              { id: "blik", icon: "B", label: "BLIK" },
              { id: "card", icon: "💳", label: "Karta" },
              { id: "gpay", icon: "G", label: "Google Pay", isG: true },
            ].map((m) => (
              <div
                key={m.id}
                className={`pay-method ${payMethod === m.id ? "on" : ""}`}
                onClick={() => setPayMethod(m.id)}
              >
                <div className="pay-method-icon" style={m.isG ? { fontFamily: "sans-serif", fontWeight: 700, fontSize: 18, color: "#4285F4" } : {}}>
                  {m.icon}
                </div>
                <div className="pay-method-label">{m.label}</div>
              </div>
            ))}
          </div>

          {payMethod === "blik" && (
            <div>
              <label className="fl">Kod BLIK</label>
              <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
                Otwórz aplikację bankową i wygeneruj 6-cyfrowy kod.
              </p>
              <div className="blik-input">
                {blik.map((v, i) => (
                  <input
                    key={i}
                    id={`blik-${i}`}
                    className="blik-digit"
                    maxLength={1}
                    value={v}
                    onChange={(e) => handleBlikDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !v && i > 0)
                        document.getElementById(`blik-${i - 1}`)?.focus();
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {payMethod === "card" && (
            <div>
              <div className="fg">
                <label className="fl">Numer karty</label>
                <input className="fi" placeholder="0000 0000 0000 0000" style={{ fontFamily: "'Space Mono',monospace", letterSpacing: 1 }} />
              </div>
              <div className="fg">
                <label className="fl">Imię i nazwisko</label>
                <input className="fi" placeholder="JAN KOWALSKI" style={{ fontFamily: "'Space Mono',monospace", textTransform: "uppercase", letterSpacing: 0.5 }} />
              </div>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Ważna do</label>
                  <input className="fi" placeholder="MM/RR" style={{ fontFamily: "'Space Mono',monospace" }} />
                </div>
                <div className="fg">
                  <label className="fl">CVV</label>
                  <input className="fi" placeholder="•••" maxLength={3} style={{ fontFamily: "'Space Mono',monospace" }} />
                </div>
              </div>
            </div>
          )}

          {payMethod === "gpay" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", background: "#000", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#fff" }}>
                <span style={{ color: "#4285F4", fontWeight: 800 }}>G</span>
                <span style={{ color: "#fff" }}>oogle</span>
                <span style={{ color: "#34A853", marginLeft: 2 }}>Pay</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 10 }}>
                Zostaniesz przekierowany do Google Pay
              </p>
            </div>
          )}

          {submitError && (
            <div className="auth-error" style={{ marginTop: 16 }}>
              <I.Alert /> {submitError}
            </div>
          )}

          <button
            className="btn btn-a btn-block"
            style={{ marginTop: 20 }}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Tworzenie rezerwacji…" : <>Zapłać {total} zł i zarezerwuj <I.Check /></>}
          </button>
        </div>

        <Summary />
      </div>
    </div>
  );
}
