import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as I from "../icons";
import { MOCK_PARKINGS } from "../data/mockData";
import { fetchParkingLots, checkAvailability, fetchParkingLotPrice } from "../data/api";
import { MIN_RESERVATION_MINUTES, calcMinutes, formatDuration } from "../data/parkingAvailability";

const makeIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:42px;height:42px;background:#F17300;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-weight:800;color:#fff;font-size:13px;font-family:Inter,sans-serif;
      box-shadow:0 0 20px rgba(241,115,0,0.5);
      border:3px solid rgba(255,255,255,0.8);
    ">P</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22],
  });

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function ParkingDetailsPage({ parkingId, setPage }) {
  const [parking, setParking]         = useState(null);
  const [date, setDate]               = useState(todayIso);
  const [timeFrom, setTimeFrom]       = useState("09:00");
  const [timeTo, setTimeTo]           = useState("17:00");
  const [avail, setAvail]             = useState(null);
  const [priceEst, setPriceEst]       = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const minutes = calcMinutes(timeFrom, timeTo);
  const durationTooShort = minutes > 0 && minutes < MIN_RESERVATION_MINUTES;

  // Załaduj dane parkingu z backendu (fallback: mock)
  useEffect(() => {
    fetchParkingLots()
      .then((lots) => {
        const found = lots.find((l) => l.id === parkingId || l.parkingLotId === parkingId);
        setParking(found || MOCK_PARKINGS.find((m) => m.id === parkingId) || MOCK_PARKINGS[0]);
      })
      .catch(() => {
        setParking(MOCK_PARKINGS.find((m) => m.id === parkingId) || MOCK_PARKINGS[0]);
      });
  }, [parkingId]);

  // Sprawdź dostępność i cenę przy zmianie daty/godzin
  useEffect(() => {
    if (!parking?.id || !date || !timeFrom || !timeTo) return;
    const from = `${date}T${timeFrom}:00`;
    const to   = `${date}T${timeTo}:00`;
    if (from >= to) { setAvail(null); setPriceEst(null); setCheckingAvail(false); return; }
    if (durationTooShort) { setAvail(null); setPriceEst(null); setCheckingAvail(false); return; }

    setCheckingAvail(true);
    Promise.all([
      checkAvailability(parking.id, from, to).catch(() => null),
      fetchParkingLotPrice(parking.id, from, to).catch(() => null),
    ]).then(([a, p]) => {
      setAvail(a);
      setPriceEst(p);
    }).finally(() => setCheckingAvail(false));
  }, [parking?.id, date, timeFrom, timeTo, durationTooShort]);

  if (!parking) return (
    <div className="fin">
      <div className="sh"><div><h2 className="st">Szczegóły parkingu</h2><p className="ss">Wczytywanie…</p></div></div>
    </div>
  );

  const coords = parking.coords || [52.2297, 21.0122];
  const availSpots = avail?.availableSpots ?? parking.available ?? 0;
  const totalSpots = parking.spots ?? 0;
  const occupancyPct = totalSpots > 0 ? Math.round(((totalSpots - availSpots) / totalSpots) * 100) : 0;
  const estimatedPrice = priceEst?.estimatedPrice != null
    ? Number(priceEst.estimatedPrice).toFixed(2)
    : null;

  return (
    <div className="fin parking-details">
      <div className="account-head">
        <button className="back-btn" onClick={() => setPage("reserve")}>
          ← Wróć do rezerwacji
        </button>
        <button className="btn btn-a" onClick={() => setPage("reserve")}>
          Rezerwuj miejsce <I.Arr />
        </button>
      </div>

      <section className="parking-hero">
        <div className="parking-hero-copy">
          <div className="pc-icon">{parking.img || "🅿️"}</div>
          <h1>{parking.name}</h1>
          <p>{parking.address}</p>
          <div className="parking-hero-meta">
            {parking.rating && <span><I.Star /> {parking.rating}</span>}
            <span>{parking.price ?? Number(parking.pricePerHour ?? 0)} zł/h</span>
            <span>{totalSpots} miejsc</span>
          </div>
        </div>
        <div className="parking-mini-map">
          <MapContainer center={coords} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
            />
            <Marker position={coords} icon={makeIcon()}>
              <Popup>{parking.name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      </section>

      <section className="wt-card details-filter">
        <div className="fg">
          <label className="fl">Data</label>
          <input className="fi" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="fg">
          <label className="fl">Od</label>
          <input className="fi" type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} />
        </div>
        <div className="fg">
          <label className="fl">Do</label>
          <input className="fi" type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} />
        </div>
        <div className={`filter-summary${avail?.available && !durationTooShort ? " is-available" : ""}`}>
          {checkingAvail ? (
            <span>Sprawdzam…</span>
          ) : durationTooShort ? (
            <>
              <span>{formatDuration(minutes)} postoju</span>
              <strong style={{ color: "var(--danger)" }}>
                Minimum {MIN_RESERVATION_MINUTES} minut
              </strong>
            </>
          ) : avail ? (
            <>
              <span>{estimatedPrice ? `${estimatedPrice} zł` : "—"}</span>
              <strong style={{ color: avail.available ? "var(--success)" : "var(--danger)" }}>
                {avail.available ? `${availSpots} wolnych` : "Brak miejsc"}
              </strong>
            </>
          ) : (
            <span style={{ color: "var(--text3)" }}>Wybierz termin</span>
          )}
        </div>
      </section>

      <section className="details-stats">
        <div className="d-stat">
          <div className="d-stat-l">Dostępne miejsca</div>
          <div className="d-stat-v">{avail?.availableSpots ?? availSpots}</div>
          <div className="d-stat-c">z {totalSpots} rezerwowanych</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Obłożenie</div>
          <div className="d-stat-v">{occupancyPct}%</div>
          <div className="d-stat-c up">dla wybranego terminu</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Cena szacowana</div>
          <div className="d-stat-v">{estimatedPrice ? `${estimatedPrice} zł` : "—"}</div>
          <div className="d-stat-c">za wybrany czas</div>
        </div>
      </section>

      <section className="details-grid">
        <div className="wt-card">
          <h2>Podział miejsc</h2>
          <p className="desc">Miejsca online są dostępne do rezerwacji w aplikacji, a walk-in zostają dla kierowców z drogi.</p>
          <div className="parking-bars">
            <div>
              <div className="bar-label">
                <span>Rezerwacje online</span>
                <strong>{avail?.totalReservableSpots ?? parking.available ?? 0}</strong>
              </div>
              <div className="bar-track">
                <span style={{ width: `${totalSpots > 0 ? ((avail?.totalReservableSpots ?? parking.available ?? 0) / totalSpots) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="bar-label">
                <span>Walk-in</span>
                <strong>{Math.max(0, totalSpots - (avail?.totalReservableSpots ?? parking.available ?? 0))}</strong>
              </div>
              <div className="bar-track muted">
                <span style={{ width: `${totalSpots > 0 ? (Math.max(0, totalSpots - (avail?.totalReservableSpots ?? parking.available ?? 0)) / totalSpots) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="wt-card">
          <h2>Informacje</h2>
          <div className="parking-info-list">
            <div><span>Cena godzinowa</span><strong>{parking.price ?? Number(parking.pricePerHour ?? 0)} zł</strong></div>
            <div><span>Szacowany koszt</span><strong>{estimatedPrice ? `${estimatedPrice} zł` : "—"}</strong></div>
            <div><span>Adres</span><strong>{parking.address}</strong></div>
            <div><span>Rozpoznawanie tablic</span><strong>Aktywne</strong></div>
          </div>
        </div>
      </section>
    </div>
  );
}
