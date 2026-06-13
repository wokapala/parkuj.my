import { useState } from "react";
import * as I from "../icons";
import { createParkingLot } from "../data/api";

const STEPS = [
  { label: "Dane",    n: 1 },
  { label: "Podział", n: 2 },
  { label: "Cennik",  n: 3 },
  { label: "Gotowe",  n: 4 },
];

// Współrzędne losowane raz przy zapisie — w mockupie nie integrujemy
// geokodera, więc parking ląduje w okolicy centrum Warszawy.
const randomWarsawCoords = () => ({
  lat: (52.22 + (Math.random() - 0.5) * 0.06).toFixed(6),
  lng: (21.00 + (Math.random() - 0.5) * 0.10).toFixed(6),
});

export default function JoinPage({ user, setUser, setPage, setRole, role }) {
  // Zalogowany użytkownik wchodzący na /join chce kreatora, nie ekranu marketingowego.
  const [wizardStep, setWizardStep] = useState(user ? 1 : 0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdLot, setCreatedLot] = useState(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "Warszawa",
    spots: "50",
    reservableSpots: "35",
    walkInSpots: "15",
    levels: "1",
    type: "indoor",
    barrier: true,
    price: "6",
    openFrom: "06:00",
    openTo: "22:00",
  });

  // Anuluj w kreatorze: właściciel wraca do panelu zarządzania (nie wylatuje na landing),
  // nowo zarejestrowany właściciel bez parkingu również ląduje na dashboardzie,
  // a niezalogowany gość wraca do ekranu marketingowego kreatora.
  const handleCancel = () => {
    if (user && role === "owner") { setPage("dashboard"); return; }
    if (user) { setPage("home"); return; }
    setWizardStep(0);
  };

  const handleStart = () => {
    // Wymagamy zalogowanego konta — wcześniej był tu mock 'Adam Nowak'.
    if (!user) {
      setPage("auth");
      return;
    }
    setWizardStep(1);
  };

  const handleFinish = async () => {
    if (!user?.customerId) {
      setSubmitError("Musisz być zalogowany, żeby zarejestrować parking.");
      return;
    }
    // Walidacja przed wysłaniem — wcześniej fallbacki ("Parking", "ul. Przykładowa 10")
    // maskowały puste pola i do bazy trafiały dane-wydmuszki.
    if (!form.name.trim()) {
      setSubmitError("Podaj nazwę parkingu (krok 1).");
      return;
    }
    if (!form.address.trim()) {
      setSubmitError("Podaj adres parkingu (krok 1).");
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0 || price > 9999.99) {
      setSubmitError("Cena musi być liczbą z zakresu 0–9999.99 zł/h.");
      return;
    }
    if ((Number(form.spots) || 0) < 1) {
      setSubmitError("Parking musi mieć co najmniej 1 miejsce (krok 1).");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const coords = randomWarsawCoords();
      const lot = await createParkingLot({
        ownerCustomerId: user.customerId,
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim() || "Warszawa",
        latitude: coords.lat,
        longitude: coords.lng,
        placesCount: Number(form.spots) || 0,
        reservablePlacesCount: Number(form.reservableSpots) || 0,
        pricePerHour: Math.round(price * 100) / 100,
        openFrom: form.openFrom || null,
        openTo: form.openTo || null,
      });
      setCreatedLot(lot);
      setRole("owner");
      setWizardStep(4);
    } catch (err) {
      setSubmitError(err.message || "Nie udało się zapisać parkingu.");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setTotalSpots = (e) => {
    const spots = Math.max(0, Number(e.target.value) || 0);
    const reservable = Math.min(Number(form.reservableSpots) || 0, spots);
    setForm({
      ...form,
      spots: String(spots),
      reservableSpots: String(reservable),
      walkInSpots: String(Math.max(0, spots - reservable)),
    });
  };
  const setReservableSpots = (e) => {
    const spots = Math.max(0, Number(form.spots) || 0);
    const reservable = Math.min(Math.max(0, Number(e.target.value) || 0), spots);
    setForm({
      ...form,
      reservableSpots: String(reservable),
      walkInSpots: String(Math.max(0, spots - reservable)),
    });
  };
  const setWalkInSpots = (e) => {
    const spots = Math.max(0, Number(form.spots) || 0);
    const walkIn = Math.min(Math.max(0, Number(e.target.value) || 0), spots);
    setForm({
      ...form,
      walkInSpots: String(walkIn),
      reservableSpots: String(Math.max(0, spots - walkIn)),
    });
  };

  if (wizardStep === 0) {
    return (
      <div className="fin">
        <div className="j-hero">
          <h1>Dołącz z własnym parkingiem</h1>
          <p>
            Zarabiaj na swoim parkingu. Dołącz do sieci parkuj.my i zyskaj system rezerwacji, ANPR
            i panel zarządzania.
          </p>
          <button className="btn btn-a btn-lg" onClick={handleStart}>
            <I.Google /> Zaloguj się i rozpocznij
          </button>
        </div>

        <div className="j-feats">
          <div className="j-feat">
            <div className="j-feat-ic"><I.Dash /></div>
            <h3>Panel zarządzania</h3>
            <p>Obłożenie, przychody, rezerwacje na żywo</p>
          </div>
          <div className="j-feat">
            <div className="j-feat-ic"><I.Barrier /></div>
            <h3>Automatyczny szlaban</h3>
            <p>ANPR rozpoznaje tablice i otwiera bariery</p>
          </div>
          <div className="j-feat">
            <div className="j-feat-ic"><I.Car /></div>
            <h3>Więcej klientów</h3>
            <p>Widoczność w aplikacji dla tysięcy kierowców</p>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            padding: "24px 0",
            borderTop: "1px solid var(--border)",
            maxWidth: 500,
            margin: "0 auto",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--text3)" }}>Już masz konto właściciela?</div>
          <button
            className="btn btn-o btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => {
              if (!user) { setPage("auth"); return; }
              setRole("owner");
              setPage("dashboard");
            }}
          >
            {user ? "Przejdź do panelu właściciela" : "Najpierw się zaloguj"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sup">
      <div className="wt">
        {/* Step indicator */}
        <div className="wt-bar">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={`wt-s ${wizardStep > s.n ? "ok" : ""} ${wizardStep === s.n ? "on" : ""}`}
            >
              <div className="wt-d">{wizardStep > s.n ? <I.Check /> : s.n}</div>
              <div className="wt-l">{s.label}</div>
              {i < STEPS.length - 1 && <div className="wt-line" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Dane */}
        {wizardStep === 1 && (
          <div className="wt-card fin">
            <h2>Informacje o firmie</h2>
            <p className="desc">Podaj dane dotyczące Twojego parkingu</p>
            <div className="fg">
              <label className="fl">Nazwa parkingu</label>
              <input className="fi" placeholder="np. Parking Centrum" value={form.name} onChange={set("name")} />
            </div>
            <div className="fg">
              <label className="fl">Adres</label>
              <input className="fi" placeholder="ul. Przykładowa 10" value={form.address} onChange={set("address")} />
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Miasto</label>
                <input className="fi" value={form.city} onChange={set("city")} />
              </div>
              <div className="fg">
                <label className="fl">NIP</label>
                <input className="fi" placeholder="1234567890" />
              </div>
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Liczba miejsc</label>
                <input className="fi" type="number" min="0" value={form.spots} onChange={setTotalSpots} />
              </div>
              <div className="fg">
                <label className="fl">Poziomy</label>
                <input className="fi" type="number" min="1" value={form.levels} onChange={set("levels")} />
              </div>
            </div>
            <div className="wt-acts">
              <button className="btn btn-o" onClick={handleCancel}>Anuluj</button>
              <button className="btn btn-a" onClick={() => setWizardStep(2)}>Dalej <I.Arr /></button>
            </div>
          </div>
        )}

        {/* Step 2 — Parking details */}
        {wizardStep === 2 && (
          <div className="wt-card fin">
            <h2>Podział miejsc</h2>
            <p className="desc">Ustal ile miejsc będzie dostępnych w aplikacji, a ile zostaje dla kierowców z drogi.</p>
            <div className="split-summary">
              <div>
                <span>{form.spots}</span>
                <small>wszystkich miejsc</small>
              </div>
              <div>
                <span>{form.reservableSpots}</span>
                <small>rezerwacje w aplikacji</small>
              </div>
              <div>
                <span>{form.walkInSpots}</span>
                <small>walk-in / z drogi</small>
              </div>
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Miejsca rezerwowane online</label>
                <input className="fi" type="number" min="0" max={form.spots} value={form.reservableSpots} onChange={setReservableSpots} />
              </div>
              <div className="fg">
                <label className="fl">Miejsca walk-in / z drogi</label>
                <input className="fi" type="number" min="0" max={form.spots} value={form.walkInSpots} onChange={setWalkInSpots} />
              </div>
            </div>
            <div className="fg">
              <label className="fl">Typ</label>
              <select className="fs" value={form.type} onChange={set("type")}>
                <option value="indoor">Podziemny / kryty</option>
                <option value="outdoor">Odkryty</option>
                <option value="multi">Wielopoziomowy</option>
              </select>
            </div>
            <div className="wt-acts">
              <button className="btn btn-o" onClick={() => setWizardStep(1)}>← Wstecz</button>
              <button className="btn btn-a" onClick={() => setWizardStep(3)}>Dalej <I.Arr /></button>
            </div>
          </div>
        )}

        {/* Step 3 — Pricing */}
        {wizardStep === 3 && (
          <div className="wt-card fin">
            <h2>Cennik i ustawienia</h2>
            <p className="desc">Cena za godzinę i opcje automatyki</p>
            <div className="fg">
              <label className="fl">Cena / godzinę (zł)</label>
              <input
                className="fi"
                type="number"
                min="0"
                max="9999.99"
                step="0.01"
                value={form.price}
                onChange={set("price")}
              />
            </div>
            <div className="fg">
              <label className="fl">Automatyczny szlaban (ANPR)</label>
              <div className="bar-ctrl">
                <button
                  className={`bar-sw ${form.barrier ? "on" : ""}`}
                  onClick={() => setForm({ ...form, barrier: !form.barrier })}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {form.barrier ? "Włączony" : "Wyłączony"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    Szlaban otwiera się automatycznie
                  </div>
                </div>
              </div>
            </div>
            <div className="fg">
              <label className="fl">Godziny otwarcia</label>
              <div className="fr">
                <input className="fi" type="time" value={form.openFrom} onChange={set("openFrom")} />
                <input className="fi" type="time" value={form.openTo} onChange={set("openTo")} />
              </div>
            </div>
            {submitError && (
              <div className="auth-error" style={{ marginBottom: 14 }}>
                <I.Alert /> {submitError}
              </div>
            )}
            <div className="wt-acts">
              <button className="btn btn-o" onClick={() => setWizardStep(2)} disabled={submitting}>← Wstecz</button>
              <button className="btn btn-a" onClick={handleFinish} disabled={submitting}>
                {submitting ? "Zapisywanie…" : <>Zarejestruj parking <I.Arr /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {wizardStep === 4 && (
          <div className="wt-card fin" style={{ textAlign: "center", padding: "48px 36px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--success-bg)",
                color: "var(--success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <I.Check />
            </div>
            <h2>Wszystko gotowe!</h2>
            <p className="desc" style={{ maxWidth: 380, margin: "6px auto 0" }}>
              Twój parking został zarejestrowany. Przejdź do panelu.
            </p>
            <div
              style={{
                background: "var(--bg3)",
                borderRadius: 8,
                padding: "14px 20px",
                margin: "20px auto",
                maxWidth: 300,
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 3 }}>Twój parking</div>
              <div style={{ fontWeight: 700 }}>{form.name || "Parking Centrum"}</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>
                {form.address || "ul. Przykładowa 10"}, {form.city}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>
                {form.spots} miejsc · {form.price} zł/h
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>
                {form.reservableSpots} online · {form.walkInSpots} walk-in
              </div>
            </div>
            <button
              className="btn btn-a btn-lg"
              onClick={() => { setRole("owner"); setPage("dashboard"); }}
            >
              Panel zarządzania <I.Arr />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
