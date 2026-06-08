import { useEffect, useState } from "react";
import * as I from "../icons";
import { fetchReservations, cancelReservation } from "../data/api";

const fmtDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

const STATUS_LABEL = {
  active: "Aktywna",
  completed: "Zakończona",
  cancelled: "Anulowana",
};

export default function Reservations({ user, setPage, setToast }) {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter]     = useState("all");
  const [cancellingId, setCancellingId] = useState(null);
  const [reservationToCancel, setReservationToCancel] = useState(null);

  const refresh = async () => {
    if (!user?.customerId) { setList([]); setLoading(false); return; }
    setLoading(true);
    try {
      setList(await fetchReservations(user.customerId));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [user?.customerId]);

  const requestCancel = (e, r) => {
    e.stopPropagation();
    if (cancellingId) return;
    const startDate = r.startAt ? new Date(r.startAt) : null;
    if (startDate && startDate - new Date() < 30 * 60 * 1000) {
      setToast("Nie można anulować rezerwacji na mniej niż 30 minut przed jej rozpoczęciem.");
      return;
    }
    setReservationToCancel(r);
  };

  const confirmCancel = async () => {
    const r = reservationToCancel;
    if (!r) return;
    if (cancellingId) return;
    const startDate = r.startAt ? new Date(r.startAt) : null;
    if (startDate && startDate - new Date() < 30 * 60 * 1000) {
      setReservationToCancel(null);
      setToast("Nie można anulować rezerwacji na mniej niż 30 minut przed jej rozpoczęciem.");
      return;
    }
    setCancellingId(r.id);
    try {
      await cancelReservation(r.id, user.customerId);
      await refresh();
      setReservationToCancel(null);
      setToast("Rezerwacja anulowana.");
    } catch (err) {
      setToast(err.message || "Nie udało się anulować rezerwacji.");
    } finally {
      setCancellingId(null);
    }
  };

  const visible = filter === "all" ? list : list.filter((r) => r.status === filter);
  const countActive = list.filter((r) => r.status === "active").length;
  const countDone = list.filter((r) => r.status === "completed").length;
  const countCancelled = list.filter((r) => r.status === "cancelled").length;

  if (loading) return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Moje rezerwacje</h2>
          <p className="ss">Wczytywanie…</p>
        </div>
      </div>
    </div>
  );

  if (list.length === 0) return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Moje rezerwacje</h2>
          <p className="ss">Historia i aktywne</p>
        </div>
      </div>
      <div className="card">
        <div className="empty">
          <div className="empty-ic"><I.List /></div>
          <h3>Brak rezerwacji</h3>
          <p>Nie masz jeszcze żadnych rezerwacji. Zarezerwuj pierwsze miejsce!</p>
          <button className="btn btn-a" onClick={() => setPage("reserve")}>
            <I.Cal /> Zarezerwuj teraz
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Moje rezerwacje</h2>
          <p className="ss">
            {countActive} aktywnych · {countDone} zakończonych · {countCancelled} anulowanych
          </p>
        </div>
        <button className="btn btn-a btn-sm" onClick={() => setPage("reserve")}>
          <I.Plus /> Nowa
        </button>
      </div>

      <div className="reservation-filters" style={{ marginBottom: 16 }}>
        {[
          { id: "all", label: `Wszystkie (${list.length})` },
          { id: "active", label: `Aktywne (${countActive})` },
          { id: "completed", label: `Zakończone (${countDone})` },
          { id: "cancelled", label: `Anulowane (${countCancelled})` },
        ].map((f) => (
          <button
            key={f.id}
            className={`btn btn-sm ${filter === f.id ? "btn-a" : "btn-o"}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="card">
          <div className="empty">
            <div className="empty-ic"><I.List /></div>
            <p>Brak rezerwacji w tej kategorii.</p>
          </div>
        </div>
      )}

      {visible.map((r) => (
        <div key={r.id}>
          <div
            className={`ri ${expanded === r.id ? "expanded" : ""}`}
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
          >
            <div className={`r-dot ${r.status}`} />
            <div className="r-info">
              <div className="r-name">{r.parking}</div>
              <div className="r-det">
                <span>{fmtDate(r.date)}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <I.Clock /> {r.time}
                </span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, background: "var(--bg3)", padding: "1px 8px", borderRadius: 6 }}>
                  {r.plate}
                </span>
              </div>
            </div>
            <span className={`spill ${r.status}`}>
              {STATUS_LABEL[r.status] || r.backendStatus}
            </span>
            <div className="r-price">{r.price} zł</div>
            {r.status === "active" && (
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => requestCancel(e, r)}
                disabled={cancellingId === r.id}
                style={{ marginLeft: 4 }}
              >
                {cancellingId === r.id ? "Anulowanie…" : <><I.X /> Anuluj</>}
              </button>
            )}
          </div>

          {expanded === r.id && (
            <div className="r-expand">
              <div className="r-expand-item">
                <strong>{r.address || "—"}</strong>
                Adres parkingu
              </div>
              <div className="r-expand-item">
                <strong style={{ fontFamily: "'Space Mono',monospace" }}>{r.code || "—"}</strong>
                Kod rezerwacji
              </div>
              <div className="r-expand-item">
                <strong style={{ fontFamily: "'Space Mono',monospace" }}>#{r.id}</strong>
                ID w bazie
              </div>
            </div>
          )}
        </div>
      ))}

      {reservationToCancel && (
        <div className="modal-backdrop" onClick={() => setReservationToCancel(null)}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-reservation-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-icon"><I.Alert /></div>
            <h3 id="cancel-reservation-title">Anulować rezerwację?</h3>
            <p>
              Czy na pewno chcesz anulować rezerwację na parkingu {reservationToCancel.parking}?
            </p>
            <div className="confirm-modal-meta">
              <span>{fmtDate(reservationToCancel.date)}</span>
              <span>{reservationToCancel.time}</span>
              <span>{reservationToCancel.price} zł</span>
            </div>
            <div className="confirm-modal-actions">
              <button
                className="btn btn-o"
                onClick={() => setReservationToCancel(null)}
                disabled={cancellingId === reservationToCancel.id}
              >
                Nie, zostaw
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmCancel}
                disabled={cancellingId === reservationToCancel.id}
              >
                {cancellingId === reservationToCancel.id ? "Anulowanie..." : "Tak, anuluj"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
