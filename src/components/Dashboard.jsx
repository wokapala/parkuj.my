import { useState } from "react";
import * as I from "../icons";

const ENTRIES = [
  { plate: "WA 12345", time: "14:32", type: "in",  status: "Rezerwacja OK" },
  { plate: "WE 99887", time: "14:18", type: "in",  status: "Rezerwacja OK" },
  { plate: "WB 55443", time: "14:05", type: "out", status: "Wyjazd — 4h 12min" },
  { plate: "WI 77221", time: "13:42", type: "in",  status: "Ręczne wpuszczenie" },
  { plate: "WA 33210", time: "13:15", type: "out", status: "Wyjazd — 2h 05min" },
];

const TAKEN_SPOTS = new Set([
  0,1,3,5,6,8,9,11,12,14,15,17,18,20,22,23,24,26,27,29,30,31,33,34,35,36,37,39,40,41,42,43,44,45,46,47,48,49,
]);

const QUICK_ACTIONS = [
  { label: "Zmień cenę",         icon: "💰" },
  { label: "Godziny otwarcia",   icon: "🕐" },
  { label: "Konserwacja miejsc", icon: "🔧" },
  { label: "Raport PDF",         icon: "📊" },
];

export default function Dashboard({ setToast }) {
  const [barrierOpen, setBarrierOpen] = useState(false);

  const toggleBarrier = () => {
    setBarrierOpen((prev) => {
      setToast(prev ? "Szlaban zamknięty" : "Szlaban otwarty");
      return !prev;
    });
  };

  return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Panel zarządzania</h2>
          <p className="ss">Parking Centrum · ul. Przykładowa 10</p>
        </div>
        <button className="btn btn-o btn-sm">
          <I.Gear /> Ustawienia
        </button>
      </div>

      {/* Stats row */}
      <div className="d-grid">
        <div className="d-stat">
          <div className="d-stat-l">Zajętość</div>
          <div className="d-stat-v">76%</div>
          <div className="d-stat-c up">+12% vs wczoraj</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Przychód dziś</div>
          <div className="d-stat-v">1 240 zł</div>
          <div className="d-stat-c up">+8%</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Aktywne rezerwacje</div>
          <div className="d-stat-v">38</div>
          <div className="d-stat-c">z 50 miejsc</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Punkty lojalnościowe</div>
          <div className="d-stat-v">2 480</div>
          <div className="d-stat-c">wydane</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <div>
          {/* Entry log */}
          <div className="d-sec">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Ostatnie wjazdy / wyjazdy</h3>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>Ostatnie 5</span>
            </div>
            <table className="dtbl">
              <thead>
                <tr>
                  <th>Tablica</th>
                  <th>Czas</th>
                  <th>Typ</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ENTRIES.map((e, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{e.plate}</td>
                    <td>{e.time}</td>
                    <td>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 600,
                          background: e.type === "in" ? "var(--success-bg)" : "var(--bg3)",
                          color: e.type === "in" ? "var(--success)" : "var(--text3)",
                        }}
                      >
                        {e.type === "in" ? "Wjazd" : "Wyjazd"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text2)" }}>{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Manual controls */}
          <div className="d-sec">
            <h3>Ręczne zarządzanie</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <button className="btn btn-o btn-sm" onClick={() => setToast("Szlaban otwarty")}>
                <I.Barrier /> Otwórz szlaban
              </button>
              <button className="btn btn-o btn-sm" onClick={() => setToast("Rezerwacja dodana")}>
                <I.Plus /> Dodaj rezerwację
              </button>
              <button className="btn btn-o btn-sm">
                <I.Alert /> Zgłoś problem
              </button>
            </div>
            <div className="bar-ctrl">
              <button className={`bar-sw ${barrierOpen ? "on" : ""}`} onClick={toggleBarrier} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  Szlaban: {barrierOpen ? "OTWARTY" : "ZAMKNIĘTY"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>Tryb ręczny</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Spot map */}
          <div className="d-sec">
            <h3>Mapa miejsc</h3>
            <div className="spot-g" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
              {Array.from({ length: 50 }, (_, i) => (
                <div
                  key={i}
                  className={`spot ${TAKEN_SPOTS.has(i) ? "taken" : "free"}`}
                  style={{ fontSize: 9, height: 28, aspectRatio: "auto" }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6, display: "flex", gap: 10 }}>
              <span style={{ color: "var(--success)" }}>12 wolnych</span>
              <span>38 zajętych</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="d-sec">
            <h3>Szybkie akcje</h3>
            {QUICK_ACTIONS.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontSize: 13,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 14 }}>{a.icon}</span>
                <span style={{ flex: 1 }}>{a.label}</span>
                <I.Chev />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
