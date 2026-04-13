import { useState } from "react";
import * as I from "../icons";
import PCard from "./PCard";
import { MOCK_PARKINGS } from "../data/mockData";

export default function ReservePage({ setToast }) {
  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const selectedParking = MOCK_PARKINGS.find((x) => x.id === selectedId);

  const handleConfirm = () => {
    setStep(1);
    setSelectedId(null);
    setToast("Rezerwacja potwierdzona!");
  };

  if (step === 1) {
    return (
      <div className="fin">
        <div className="sh">
          <div>
            <h2 className="st">Zarezerwuj miejsce</h2>
            <p className="ss">Wybierz parking, podaj tablicę, zapłać</p>
          </div>
        </div>

        <div className="card-grid">
          {MOCK_PARKINGS.map((p) => (
            <PCard
              key={p.id}
              p={p}
              selected={selectedId === p.id}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn btn-a"
            disabled={!selectedId}
            onClick={() => setStep(2)}
            style={{ opacity: selectedId ? 1 : 0.4 }}
          >
            Dalej <I.Arr />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fin">
      <button
        style={{
          marginBottom: 14,
          cursor: "pointer",
          background: "none",
          border: "none",
          color: "var(--text2)",
          fontSize: 13,
          fontFamily: "inherit",
        }}
        onClick={() => setStep(1)}
      >
        ← Wróć
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        <div className="wt-card">
          <h2>Szczegóły rezerwacji</h2>
          <p className="desc">Podaj dane i opłać parking</p>

          <div className="fg">
            <label className="fl">Numer rejestracyjny</label>
            <input className="fi" placeholder="np. WA 12345" defaultValue="WA 12345" />
          </div>

          <div className="fr">
            <div className="fg">
              <label className="fl">Data</label>
              <input className="fi" type="date" defaultValue="2026-03-25" />
            </div>
            <div className="fg">
              <label className="fl">Godziny</label>
              <div className="fr">
                <input className="fi" type="time" defaultValue="09:00" />
                <input className="fi" type="time" defaultValue="17:00" />
              </div>
            </div>
          </div>

          <button className="btn btn-a btn-block" style={{ marginTop: 8 }} onClick={handleConfirm}>
            Zapłać 64 zł i zarezerwuj
          </button>
        </div>

        <div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Podsumowanie</div>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 2.2 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Parking</span>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>{selectedParking?.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Data</span>
                <span style={{ color: "var(--text)" }}>25.03.2026</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Godziny</span>
                <span style={{ color: "var(--text)" }}>09:00 - 17:00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tablica</span>
                <span style={{ color: "var(--text)", fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                  WA 12345
                </span>
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  marginTop: 6,
                  paddingTop: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  color: "var(--text)",
                  fontSize: 15,
                }}
              >
                <span>Suma</span>
                <span style={{ color: "var(--accent)" }}>64 zł</span>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              padding: "10px 14px",
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--accent)",
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <I.Heart />
            <span>+12 punktów lojalnościowych</span>
          </div>
        </div>
      </div>
    </div>
  );
}
