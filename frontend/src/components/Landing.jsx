import * as I from "../icons";

export default function Landing({ setPage, setUser }) {
  const handleLogin = () => {
    setUser({ name: "Jan Kowalski", email: "jan@gmail.com" });
    setPage("home");
  };

  return (
    <div className="land fin">
      <div className="land-badge">
        <I.Zap /> Nowa generacja parkowania
      </div>

      <h1>Zarezerwuj miejsce parkingowe w 10 sekund</h1>

      <p>
        Płać online, wjeżdżaj bez zatrzymywania. Twój numer rejestracyjny to Twój bilet wstępu.
      </p>

      <div className="land-btns">
        <button className="btn btn-a btn-lg" onClick={handleLogin}>
          <I.Google /> Zaloguj się przez Google
        </button>
        <button className="btn btn-o btn-lg" onClick={() => setPage("join")}>
          Dołącz z parkingiem <I.Arr />
        </button>
      </div>

      <div className="land-grid">
        <div className="land-feat">
          <div className="land-feat-ic">
            <I.Scan />
          </div>
          <h3>Rozpoznawanie tablic</h3>
          <p>Szlaban otwiera się automatycznie po skanowaniu rejestracji</p>
        </div>
        <div className="land-feat">
          <div className="land-feat-ic">
            <I.Zap />
          </div>
          <h3>Płatność online</h3>
          <p>Zapłać z góry przez aplikację, zero gotówki</p>
        </div>
      </div>

      <div className="land-bottom">
        <span><span className="land-num">1 250+</span> miejsc</span>
        <span><span className="land-num">15</span> parkingów</span>
        <span><span className="land-num">24/7</span> dostęp</span>
      </div>
    </div>
  );
}
