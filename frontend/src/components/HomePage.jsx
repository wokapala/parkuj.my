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
        </div>
      </div>

      <div className="sh">
        <div>
          <h2 className="st">Popularne parkingi</h2>
          <p className="ss">Zarezerwuj jednym kliknięciem</p>
        </div>
        <button className="btn btn-o btn-sm" onClick={() => setPage("reserve")}>
          Wszystkie <I.Arr />
        </button>
      </div>

      <div className="card-grid">
        {MOCK_PARKINGS.slice(0, 4).map((p) => (
          <PCard key={p.id} p={p} onClick={() => setPage("reserve")} />
        ))}
      </div>
    </div>
  );
}
