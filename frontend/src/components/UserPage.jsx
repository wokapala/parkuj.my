import * as I from "../icons";
import { fetchVehicles, deleteVehicle, setPrimaryVehicle } from "../data/api";

const sortVehicles = (vehicles) =>
  [...vehicles].sort((a, b) => Number(b.primary) - Number(a.primary));

export default function UserPage({ user, vehicles, setVehicles, setPage, setToast }) {
  const refresh = async () => {
    if (!user?.customerId) return;
    try { setVehicles(await fetchVehicles(user.customerId)); } catch { /* zostaw stan */ }
  };

  const makePrimary = async (id) => {
    try {
      await setPrimaryVehicle(id, user.customerId);
      await refresh();
      setToast("Zmieniono pojazd główny.");
    } catch (err) {
      setToast(err.message || "Nie udało się zmienić pojazdu głównego.");
    }
  };

  const removeVehicle = async (vehicle) => {
    try {
      await deleteVehicle(vehicle.id, user.customerId);
      await refresh();
      setToast("Pojazd usunięty.");
    } catch (err) {
      setToast(err.message || "Nie udało się usunąć pojazdu.");
    }
  };

  return (
    <div className="fin account-page">
      <div className="account-head">
        <div>
          <h1>Moje konto</h1>
          <p>Dane kierowcy, pojazdy i szybkie akcje związane z rezerwacjami.</p>
        </div>
        <button className="btn btn-a" onClick={() => setPage("addCar")}>
          <I.Plus /> Dodaj pojazd
        </button>
      </div>

      <div className="profile-summary">
        <div className="profile-avatar">{user?.name?.[0] || "U"}</div>
        <div>
          <h2>{user?.name || "Użytkownik"}</h2>
          <p>{user?.email || "Brak adresu e-mail"}</p>
        </div>
        <button className="btn btn-o btn-sm" onClick={() => setPage("settings")}>
          <I.Gear /> Ustawienia
        </button>
      </div>

      <div className="account-grid">
        <section className="wt-card">
          <div className="section-row">
            <div>
              <h2>Pojazdy</h2>
              <p className="desc">Pojazd główny jest pokazywany na górze i wybierany domyślnie.</p>
            </div>
          </div>

          <div className="manage-vehicles">
            {sortVehicles(vehicles).map((vehicle) => (
              <div className="manage-vehicle" key={vehicle.id}>
                <div>
                  <strong>{vehicle.name}</strong>
                  <span className="vehicle-plate">{vehicle.country} · {vehicle.plate}</span>
                  {vehicle.hasActiveReservation && <small>Aktywna rezerwacja</small>}
                </div>
                <div className="vehicle-actions">
                  {vehicle.primary ? (
                    <span className="status-pill ok">Główny</span>
                  ) : (
                    <button className="btn btn-o btn-sm" onClick={() => makePrimary(vehicle.id)}>
                      Ustaw główny
                    </button>
                  )}
                  <button className="icon-btn danger" onClick={() => removeVehicle(vehicle)} title="Usuń pojazd">
                    <I.X />
                  </button>
                </div>
              </div>
            ))}

            {!vehicles.length && (
              <div className="empty-state">
                <I.Car />
                <span>Nie masz jeszcze zapisanego pojazdu.</span>
              </div>
            )}
          </div>
        </section>

        <aside className="wt-card account-side">
          <h2>Skróty</h2>
          <button className="quick-link" onClick={() => setPage("reserve")}>
            <I.Cal /> Nowa rezerwacja <I.Chev />
          </button>
          <button className="quick-link" onClick={() => setPage("reservations")}>
            <I.List /> Historia rezerwacji <I.Chev />
          </button>
          <button className="quick-link" onClick={() => setPage("contact")}>
            <I.Mail /> Kontakt z obsługą <I.Chev />
          </button>
        </aside>
      </div>
    </div>
  );
}
