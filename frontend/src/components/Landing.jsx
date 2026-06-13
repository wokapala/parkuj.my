import * as I from "../icons";

export default function Landing({ setPage }) {
  return (
    <div className="land fin">
      <div className="land-badge">
        <I.Zap /> Nowa generacja parkowania
      </div>

      <h1>Zarezerwuj miejsce parkingowe w 10 sekund</h1>

      <p>
        Zarezerwuj miejsce, zapłać online i wjeżdżaj bez zatrzymywania.
      </p>

      <div className="land-btns">
        <button className="btn btn-a btn-lg" onClick={() => setPage("auth", { customerRegister: true })}>
          Dołącz jako klient <I.Arr />
        </button>
        <button className="btn btn-o btn-lg" onClick={() => setPage("auth", { ownerRegister: true })}>
          Dołącz jako właściciel parkingu <I.Arr />
        </button>
      </div>

      <div className="land-grid">
        <div className="land-feat">
          <div className="land-feat-ic">
            <I.Cal />
          </div>
          <h3>Rezerwacja online</h3>
          <p>Zarezerwuj miejsce z wyprzedzeniem w kilka sekund</p>
        </div>
        <div className="land-feat">
          <div className="land-feat-ic">
            <I.Zap />
          </div>
          <h3>Płatność z góry</h3>
          <p>Zapłać przez aplikację i jedź bez stresu</p>
        </div>
      </div>
    </div>
  );
}
