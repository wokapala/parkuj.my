import * as I from "../icons";
import { MOCK_RESERVATIONS } from "../data/mockData";

export default function Reservations() {
  return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Moje rezerwacje</h2>
          <p className="ss">Historia i aktywne</p>
        </div>
      </div>

      {MOCK_RESERVATIONS.map((r) => (
        <div className="ri" key={r.id}>
          <div className={`r-dot ${r.status}`} />
          <div className="r-info">
            <div className="r-name">{r.parking}</div>
            <div className="r-det">
              <span>{r.date}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <I.Clock /> {r.time}
              </span>
              <span
                style={{
                  fontFamily: "'Space Mono',monospace",
                  fontSize: 11,
                  background: "var(--bg3)",
                  padding: "1px 8px",
                  borderRadius: 6,
                }}
              >
                {r.plate}
              </span>
            </div>
          </div>
          <span className={`spill ${r.status}`}>
            {r.status === "active" ? "Aktywna" : "Zakończona"}
          </span>
          <div className="r-price">{r.price} zł</div>
        </div>
      ))}
    </div>
  );
}
