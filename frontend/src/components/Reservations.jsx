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

  const cancel = async (e, id) => {
    e.stopPropagation();
    try {
      await cancelReservation(id, user.customerId);
      await refresh();
      setToast("Rezerwacja anulowana.");
    } catch (err) {
      setToast(err.message || "Nie udało się anulować rezerwacji.");
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
                onClick={(e) => cancel(e, r.id)}
                style={{ marginLeft: 4 }}
              >
                <I.X /> Anuluj
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
    </div>
  );
}
