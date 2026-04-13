import * as I from "../icons";
import PCard from "./PCard";
import { MOCK_PARKINGS } from "../data/mockData";

export default function HomePage({ setPage }) {
  return (
    <div className="fin">
      <div className="home-hero">
        <h1>Witaj ponownie</h1>
        <p>Zarezerwuj miejsce, sprawdź status rezerwacji lub znajdź parking w okolicy.</p>
        <div className="home-stats">
          <div>
            <span className="home-stat-n">1 250+</span>
            <div className="home-stat-l">Miejsc parkingowych</div>
          </div>
          <div>
            <span className="home-stat-n">15</span>
            <div className="home-stat-l">Parkingów w sieci</div>
          </div>
          <div>
            <span className="home-stat-n">240</span>
            <div className="home-stat-l">Twoich punktów</div>
          </div>
        </div>
      </div>

      <div className="sh">
        <div>
          <h2 className="st">Popularne parkingi</h2>
          <p className="ss">Zarezerwuj jednym kliknięciem</p>
        </div>
        <button className="btn btn-o btn-sm" onClick={() => setPage("map")}>
          Wszystkie <I.Arr />
        </button>
      </div>

      <div className="card-grid">
        {MOCK_PARKINGS.slice(0, 4).map((p) => (
          <PCard key={p.id} p={p} onClick={() => setPage("reserve")} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
        <div className="card" style={{ padding: 24, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
              flexShrink: 0,
            }}
          >
            <I.Barrier />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Automatyczny wjazd</div>
            <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
              Szlaban otworzy się po rozpoznaniu tablicy rejestracyjnej.
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: 24, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--success-bg)",
              border: "1px solid rgba(34,197,94,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--success)",
              flexShrink: 0,
            }}
          >
            <I.Heart />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Program lojalnościowy</div>
            <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
              Zbieraj punkty za każde parkowanie. Wymień na darmowe godziny.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
