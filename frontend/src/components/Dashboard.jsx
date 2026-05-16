import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import * as I from "../icons";

const ENTRIES = [
  { plate: "WA 12345", time: "14:32", type: "in",  status: "Rezerwacja OK" },
  { plate: "WE 99887", time: "14:18", type: "in",  status: "Rezerwacja OK" },
  { plate: "WB 55443", time: "14:05", type: "out", status: "Wyjazd — 4h 12min" },
  { plate: "WI 77221", time: "13:42", type: "in",  status: "Ręczne wpuszczenie" },
  { plate: "WA 33210", time: "13:15", type: "out", status: "Wyjazd — 2h 05min" },
];

const REVENUE_DATA = [
  { day: "Pon", value: 840 },
  { day: "Wt",  value: 1120 },
  { day: "Śr",  value: 980 },
  { day: "Czw", value: 1340 },
  { day: "Pt",  value: 1580 },
  { day: "Sob", value: 2100 },
  { day: "Nd",  value: 1240 },
];

const QUICK_ACTIONS = [
  { label: "Zmień cenę",         icon: <I.TrendUp /> },
  { label: "Godziny otwarcia",   icon: <I.Clock /> },
  { label: "Zmień podział miejsc", icon: <I.Gear /> },
  { label: "Raport PDF",         icon: <I.Download /> },
];

export default function Dashboard({ setToast }) {
  const [barrierOpen, setBarrierOpen] = useState(false);
  const [spotSplit, setSpotSplit] = useState({ total: 50, reservable: 35 });
  const walkIn = Math.max(0, spotSplit.total - spotSplit.reservable);

  const toggleBarrier = () => {
    setBarrierOpen((prev) => {
      setToast(prev ? "Szlaban zamknięty" : "Szlaban otwarty");
      return !prev;
    });
  };

  const setReservable = (value) => {
    const reservable = Math.min(Math.max(0, Number(value) || 0), spotSplit.total);
    setSpotSplit({ ...spotSplit, reservable });
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

      {/* Stats */}
      <div className="d-grid">
        <div className="d-stat">
          <div className="d-stat-l">Obłożenie</div>
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
      </div>

      <div className="dash-layout">
        <div>
          {/* Revenue chart */}
          <div className="d-sec">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h3 style={{ margin: 0 }}>Przychód — ostatnie 7 dni</h3>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                Σ {REVENUE_DATA.reduce((s, d) => s + d.value, 0).toLocaleString("pl")} zł
              </span>
            </div>
            <div className="chart-c">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#F17300" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F17300" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(129,164,205,0.12)" />
                  <XAxis dataKey="day" tick={{ fill: "#81A4CD", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#81A4CD", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#054A91", border: "1px solid rgba(129,164,205,0.22)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#DBE4EE", fontWeight: 600 }}
                    itemStyle={{ color: "#F17300" }}
                    formatter={(v) => [`${v} zł`, "Przychód"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#F17300" strokeWidth={2} fill="url(#rev)" dot={{ fill: "#F17300", r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Entry log */}
          <div className="d-sec">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Ostatnie wjazdy / wyjazdy</h3>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>Na żywo</span>
            </div>
            <table className="dtbl">
              <thead>
                <tr>
                  <th>Tablica</th><th>Czas</th><th>Typ</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ENTRIES.map((e, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{e.plate}</td>
                    <td>{e.time}</td>
                    <td>
                      <span style={{
                        padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                        background: e.type === "in" ? "var(--success-bg)" : "var(--bg3)",
                        color: e.type === "in" ? "var(--success)" : "var(--text3)",
                      }}>
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
            <h3>Sterowanie szlabanem</h3>
            <div className="bar-ctrl">
              <button className={`bar-sw ${barrierOpen ? "on" : ""}`} onClick={toggleBarrier} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  Szlaban: <span style={{ color: barrierOpen ? "var(--success)" : "var(--danger)" }}>
                    {barrierOpen ? "OTWARTY" : "ZAMKNIĘTY"}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>Tryb ręczny — normalnie sterowany przez ANPR</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-o btn-sm" onClick={() => setToast("Rezerwacja dodana")}>
                  <I.Plus /> Dodaj rezerwację
                </button>
                <button className="btn btn-o btn-sm">
                  <I.Alert /> Zgłoś problem
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Spot split */}
          <div className="d-sec">
            <h3>Podział miejsc</h3>
            <div className="split-summary compact">
              <div>
                <span>{spotSplit.total}</span>
                <small>razem</small>
              </div>
              <div>
                <span>{spotSplit.reservable}</span>
                <small>aplikacja</small>
              </div>
              <div>
                <span>{walkIn}</span>
                <small>walk-in</small>
              </div>
            </div>
            <div className="fg" style={{ marginTop: 18 }}>
              <label className="fl">Miejsca rezerwowane online</label>
              <input
                className="split-range"
                type="range"
                min="0"
                max={spotSplit.total}
                value={spotSplit.reservable}
                onChange={(e) => setReservable(e.target.value)}
              />
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Online</label>
                <input
                  className="fi"
                  type="number"
                  min="0"
                  max={spotSplit.total}
                  value={spotSplit.reservable}
                  onChange={(e) => setReservable(e.target.value)}
                />
              </div>
              <div className="fg">
                <label className="fl">Walk-in</label>
                <input className="fi" type="number" value={walkIn} readOnly />
              </div>
            </div>
            <button className="btn btn-a btn-block" onClick={() => setToast("Podział miejsc zaktualizowany")}>
              Zapisz podział
            </button>
          </div>

          {/* Quick actions */}
          <div className="d-sec">
            <h3>Szybkie akcje</h3>
            {QUICK_ACTIONS.map((a, i) => (
              <button
                key={i}
                className="qa-item"
                onClick={() => setToast(`${a.label}...`)}
              >
                <div className="qa-item-ic">{a.icon}</div>
                <span style={{ flex: 1 }}>{a.label}</span>
                <I.Chev />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
