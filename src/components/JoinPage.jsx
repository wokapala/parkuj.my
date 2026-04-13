import { useState } from "react";
import * as I from "../icons";

const STEPS = [
  { label: "Dane",    n: 1 },
  { label: "Parking", n: 2 },
  { label: "Cennik",  n: 3 },
  { label: "Gotowe",  n: 4 },
];

const SPOT_GRID_TAKEN = [0,3,5,8,11,12,15,18];
const SPOT_GRID_DIS   = [19];

export default function JoinPage({ user, setUser, setPage, setRole }) {
  const [wizardStep, setWizardStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "Warszawa",
    spots: "50",
    levels: "1",
    type: "indoor",
    barrier: true,
    price: "6",
  });

  const handleStart = () => {
    if (!user) setUser({ name: "Adam Nowak", email: "adam.owner@gmail.com" });
    setWizardStep(1);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

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
              setUser({ name: "Adam Nowak", email: "adam.owner@gmail.com" });
              setRole("owner");
              setPage("dashboard");
            }}
          >
            Zaloguj jako właściciel
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
            <div className="wt-acts">
              <button className="btn btn-o" onClick={() => setWizardStep(0)}>Anuluj</button>
              <button className="btn btn-a" onClick={() => setWizardStep(2)}>Dalej <I.Arr /></button>
            </div>
          </div>
        )}

        {/* Step 2 — Parking details */}
        {wizardStep === 2 && (
          <div className="wt-card fin">
            <h2>Szczegóły parkingu</h2>
            <p className="desc">Ile miejsc, jakie poziomy, typ</p>
            <div className="fr">
              <div className="fg">
                <label className="fl">Liczba miejsc</label>
                <input className="fi" type="number" value={form.spots} onChange={set("spots")} />
              </div>
              <div className="fg">
                <label className="fl">Poziomy</label>
                <input className="fi" type="number" value={form.levels} onChange={set("levels")} />
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
            <div className="fg">
              <label className="fl">Podgląd miejsc</label>
              <div className="spot-g">
                {Array.from({ length: 20 }, (_, i) => {
                  const cls = SPOT_GRID_TAKEN.includes(i)
                    ? "taken"
                    : SPOT_GRID_DIS.includes(i)
                    ? "dis"
                    : "free";
                  const label = cls === "free" ? `P${i + 1}` : cls === "taken" ? "—" : "X";
                  return <div key={i} className={`spot ${cls}`}>{label}</div>;
                })}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6, display: "flex", gap: 12 }}>
                <span style={{ color: "var(--success)" }}>Wolne</span>
                <span>Zajęte</span>
                <span style={{ color: "var(--danger)" }}>Wyłączone</span>
              </div>
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
              <input className="fi" type="number" value={form.price} onChange={set("price")} />
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
                <input className="fi" type="time" defaultValue="06:00" />
                <input className="fi" type="time" defaultValue="22:00" />
              </div>
            </div>
            <div className="wt-acts">
              <button className="btn btn-o" onClick={() => setWizardStep(2)}>← Wstecz</button>
              <button className="btn btn-a" onClick={() => setWizardStep(4)}>Dalej <I.Arr /></button>
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
