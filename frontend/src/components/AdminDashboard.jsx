import { useEffect, useState } from "react";
import * as I from "../icons";
import {
  fetchAllCustomers,
  fetchAllReservations,
  fetchAllIncidents,
  fetchAdminStats,
  createIncident,
  updateIncidentStatus,
} from "../data/api";

const INCIDENT_TYPES = [
  { value: "BARRIER_FAILURE", label: "Awaria szlabanu" },
  { value: "PAYMENT_ISSUE", label: "Problem z płatnością" },
  { value: "VEHICLE_BLOCKED", label: "Zablokowany pojazd" },
  { value: "OTHER", label: "Inne" },
];
const SEVERITIES = [
  { value: "LOW", label: "Niska", color: "#64748b" },
  { value: "MEDIUM", label: "Średnia", color: "#f59e0b" },
  { value: "HIGH", label: "Wysoka", color: "#ef4444" },
  { value: "CRITICAL", label: "Krytyczna", color: "#b91c1c" },
];
const INCIDENT_STATUS = {
  OPEN: { label: "Otwarty", color: "#ef4444" },
  IN_PROGRESS: { label: "W toku", color: "#f59e0b" },
  RESOLVED: { label: "Rozwiązany", color: "#22c55e" },
};

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
  const [incidents, setIncidents]     = useState([]);
  const [adminStats, setAdminStats]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [newIncident, setNewIncident] = useState({
    incidentType: "BARRIER_FAILURE",
    severity: "MEDIUM",
    description: "",
  });
  const [incidentError, setIncidentError] = useState("");
  const [creatingIncident, setCreatingIncident] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [c, r, i, s] = await Promise.all([
        fetchAllCustomers(),
        fetchAllReservations(),
        fetchAllIncidents(),
        fetchAdminStats().catch(() => null),
      ]);
      setCustomers(c || []);
      setReservations(r || []);
      setIncidents(i || []);
      setAdminStats(s);
    } catch {
      setCustomers([]);
      setReservations([]);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!newIncident.description || newIncident.description.trim().length < 10) {
      setIncidentError("Opis musi mieć co najmniej 10 znaków.");
      return;
    }
    setCreatingIncident(true);
    setIncidentError("");
    try {
      await createIncident(admin.adminUserId, newIncident);
      setNewIncident({ incidentType: "BARRIER_FAILURE", severity: "MEDIUM", description: "" });
      await refresh();
      setToast("Incydent zgłoszony.");
    } catch (err) {
      setIncidentError(err.message || "Nie udało się utworzyć incydentu.");
    } finally {
      setCreatingIncident(false);
    }
  };

  const handleChangeStatus = async (id, status) => {
    try {
      await updateIncidentStatus(id, status);
      await refresh();
      setToast("Status incydentu zaktualizowany.");
    } catch (err) {
      setToast(err.message || "Nie udało się zmienić statusu.");
    }
  };

  useEffect(() => { refresh(); }, []);

  const logout = () => {
    localStorage.removeItem("admin");
    setAdmin(null);
    setPage("adminLogin");
    setToast("Wylogowano z panelu admina.");
  };

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

      <div className="d-grid" style={{ marginBottom: 20 }}>
        <div className="d-stat">
          <div className="d-stat-l">Przychód łącznie</div>
          <div className="d-stat-v">
            {adminStats?.totalRevenue != null
              ? `${Number(adminStats.totalRevenue).toLocaleString("pl")} zł`
              : `${reservations.filter((r) => ["CONFIRMED","ACTIVE","COMPLETED"].includes(r.backendStatus)).reduce((s,r) => s + (Number(r.price)||0), 0).toFixed(0)} zł`}
          </div>
          <div className="d-stat-c">opłacone rezerwacje</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Klienci w bazie</div>
          <div className="d-stat-v">{adminStats?.totalCustomers ?? customers.length}</div>
          <div className="d-stat-c">zarejestrowani użytkownicy</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Aktywne rezerwacje</div>
          <div className="d-stat-v">{adminStats?.activeReservations ?? "—"}</div>
          <div className="d-stat-c">PENDING + CONFIRMED + ACTIVE</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Otwarte incydenty</div>
          <div className="d-stat-v">{adminStats?.openIncidents ?? incidents.filter((i) => i.status === "OPEN").length}</div>
          <div className="d-stat-c">wymagają uwagi</div>
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
        <button
          className={`btn btn-sm ${tab === "incidents" ? "btn-a" : "btn-o"}`}
          onClick={() => setTab("incidents")}
        >
          Incydenty ({incidents.length})
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

      {!loading && tab === "incidents" && (
        <div style={{ display: "grid", gap: 16 }}>
          <form onSubmit={handleCreateIncident} className="wt-card">
            <h3 style={{ marginTop: 0 }}>Zgłoś nowy incydent</h3>
            {incidentError && (
              <div className="auth-error" style={{ marginBottom: 12 }}>
                <I.Alert /> {incidentError}
              </div>
            )}
            <div className="fr">
              <div className="fg">
                <label className="fl">Typ</label>
                <select
                  className="fs"
                  value={newIncident.incidentType}
                  onChange={(e) => setNewIncident({ ...newIncident, incidentType: e.target.value })}
                >
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label className="fl">Waga</label>
                <select
                  className="fs"
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="fg">
              <label className="fl">Opis (min. 10 znaków)</label>
              <textarea
                className="fi"
                rows={3}
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                placeholder="Co się stało, gdzie, kiedy. Możliwie konkretnie."
              />
            </div>
            <button type="submit" className="btn btn-a" disabled={creatingIncident}>
              {creatingIncident ? "Tworzenie…" : <>Zgłoś incydent <I.Plus /></>}
            </button>
          </form>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {incidents.length === 0 ? (
              <div className="empty"><p>Brak zgłoszonych incydentów.</p></div>
            ) : (
              <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg3)", textAlign: "left" }}>
                    <th style={{ padding: 12, fontSize: 12 }}>ID</th>
                    <th style={{ padding: 12, fontSize: 12 }}>Typ</th>
                    <th style={{ padding: 12, fontSize: 12 }}>Waga</th>
                    <th style={{ padding: 12, fontSize: 12 }}>Opis</th>
                    <th style={{ padding: 12, fontSize: 12 }}>Zgłaszający</th>
                    <th style={{ padding: 12, fontSize: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => {
                    const typeLabel = INCIDENT_TYPES.find((t) => t.value === inc.incidentType)?.label || inc.incidentType;
                    const sev = SEVERITIES.find((s) => s.value === inc.severity) || { label: inc.severity, color: "#94a3b8" };
                    return (
                      <tr key={inc.incidentReportId} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: 12, fontFamily: "'Space Mono',monospace", fontSize: 12 }}>#{inc.incidentReportId}</td>
                        <td style={{ padding: 12, fontSize: 13 }}>{typeLabel}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#fff", background: sev.color }}>
                            {sev.label}
                          </span>
                        </td>
                        <td style={{ padding: 12, fontSize: 12, maxWidth: 260 }}>{inc.description}</td>
                        <td style={{ padding: 12, fontSize: 12 }}>{inc.createdByEmail || "—"}</td>
                        <td style={{ padding: 12 }}>
                          <select
                            className="fs"
                            style={{ padding: "4px 8px", fontSize: 12 }}
                            value={inc.status}
                            onChange={(e) => handleChangeStatus(inc.incidentReportId, e.target.value)}
                          >
                            {Object.entries(INCIDENT_STATUS).map(([key, val]) => (
                              <option key={key} value={key}>{val.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
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
