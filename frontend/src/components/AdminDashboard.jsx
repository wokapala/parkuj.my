import { useEffect, useState } from "react";
import * as I from "../icons";
import { fetchAllCustomers, fetchAllReservations } from "../data/api";

const STATUS_PILL = {
  PENDING: { label: "Oczekuje", color: "#f59e0b" },
  CONFIRMED: { label: "Potwierdzona", color: "#22c55e" },
  ACTIVE: { label: "Aktywna", color: "#22c55e" },
  COMPLETED: { label: "Zakończona", color: "#94a3b8" },
  CANCELLED: { label: "Anulowana", color: "#ef4444" },
  EXPIRED: { label: "Wygasła", color: "#ef4444" },
};

const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function AdminDashboard({ admin, setAdmin, setPage, setToast }) {
  const [tab, setTab]                 = useState("reservations");
  const [customers, setCustomers]     = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]         = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([fetchAllCustomers(), fetchAllReservations()]);
      setCustomers(c || []);
      setReservations(r || []);
    } catch {
      setCustomers([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const logout = () => {
    localStorage.removeItem("admin");
    setAdmin(null);
    setPage("adminLogin");
    setToast("Wylogowano z panelu admina.");
  };

  const revenue = reservations
    .filter((r) => ["CONFIRMED", "ACTIVE", "COMPLETED"].includes(r.backendStatus))
    .reduce((sum, r) => sum + (Number(r.price) || 0), 0);

  return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Panel administratora</h2>
          <p className="ss">{admin?.email} · {admin?.role}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-o btn-sm" onClick={refresh}>
            Odśwież
          </button>
          <button className="btn btn-danger btn-sm" onClick={logout}>
            <I.Out /> Wyloguj
          </button>
        </div>
      </div>

      <div className="home-stats" style={{ marginBottom: 20 }}>
        <div>
          <span className="home-stat-n">{customers.length}</span>
          <div className="home-stat-l">Klienci w bazie</div>
        </div>
        <div>
          <span className="home-stat-n">{reservations.length}</span>
          <div className="home-stat-l">Wszystkich rezerwacji</div>
        </div>
        <div>
          <span className="home-stat-n">{revenue.toFixed(0)} zł</span>
          <div className="home-stat-l">Przychód z aktywnych</div>
        </div>
      </div>

      <div className="reservation-filters" style={{ marginBottom: 16 }}>
        <button
          className={`btn btn-sm ${tab === "reservations" ? "btn-a" : "btn-o"}`}
          onClick={() => setTab("reservations")}
        >
          Rezerwacje ({reservations.length})
        </button>
        <button
          className={`btn btn-sm ${tab === "customers" ? "btn-a" : "btn-o"}`}
          onClick={() => setTab("customers")}
        >
          Klienci ({customers.length})
        </button>
      </div>

      {loading && <div className="card"><div className="empty">Wczytywanie…</div></div>}

      {!loading && tab === "reservations" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {reservations.length === 0 ? (
            <div className="empty"><p>Brak rezerwacji w systemie.</p></div>
          ) : (
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg3)", textAlign: "left" }}>
                  <th style={{ padding: 12, fontSize: 12 }}>Kod</th>
                  <th style={{ padding: 12, fontSize: 12 }}>Parking</th>
                  <th style={{ padding: 12, fontSize: 12 }}>Tablica</th>
                  <th style={{ padding: 12, fontSize: 12 }}>Termin</th>
                  <th style={{ padding: 12, fontSize: 12 }}>Status</th>
                  <th style={{ padding: 12, fontSize: 12, textAlign: "right" }}>Cena</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => {
                  const pill = STATUS_PILL[r.backendStatus] || { label: r.backendStatus, color: "#94a3b8" };
                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: 12, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>{r.code}</td>
                      <td style={{ padding: 12, fontSize: 13 }}>{r.parking}</td>
                      <td style={{ padding: 12, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>{r.plate}</td>
                      <td style={{ padding: 12, fontSize: 12 }}>
                        {r.date} {r.time}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#fff", background: pill.color }}>
                          {pill.label}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: "right", fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>
                        {r.price} zł
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!loading && tab === "customers" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {customers.length === 0 ? (
            <div className="empty"><p>Brak klientów w bazie.</p></div>
          ) : (
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg3)", textAlign: "left" }}>
                  <th style={{ padding: 12, fontSize: 12 }}>ID</th>
                  <th style={{ padding: 12, fontSize: 12 }}>Imię i nazwisko</th>
                  <th style={{ padding: 12, fontSize: 12 }}>E-mail</th>
                  <th style={{ padding: 12, fontSize: 12 }}>Telefon</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.customerId} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: 12, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>#{c.customerId}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{c.firstName} {c.lastName}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{c.email}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{c.phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
