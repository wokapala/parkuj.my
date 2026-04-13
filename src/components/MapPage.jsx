import { MOCK_PARKINGS } from "../data/mockData";

export default function MapPage() {
  return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Mapa parkingów</h2>
          <p className="ss">Znajdź parking w okolicy</p>
        </div>
      </div>

      <div className="map-c">
        <div className="map-bg" />

        <div className="map-pins">
          {MOCK_PARKINGS.map((p, i) => (
            <div
              className="map-pin"
              key={p.id}
              style={{ left: `${15 + i * 16}%`, top: `${25 + (i % 3) * 20}%` }}
            >
              <div className="map-dot">P</div>
              <div className="map-lbl">{p.name}</div>
            </div>
          ))}
        </div>

        <div className="map-side">
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>W okolicy</div>
          {MOCK_PARKINGS.map((p) => (
            <div
              key={p.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <div className="pc-icon" style={{ width: 32, height: 32, fontSize: 16 }}>
                {p.img}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{p.available} wolnych</div>
              </div>
              <div
                style={{
                  fontFamily: "'Space Mono',monospace",
                  fontWeight: 700,
                  color: "var(--accent)",
                  fontSize: 13,
                }}
              >
                {p.price} zł
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
