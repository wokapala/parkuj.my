import { useEffect, useState } from "react";
import * as I from "../icons";
import {
  fetchAllCustomers,
  fetchAllReservations,
  fetchAllIncidents,
  fetchAllParkingLotsAdmin,
  fetchAdminStats,
  createIncident,
  updateIncidentStatus,
  banCustomer,
  unbanCustomer,
  deleteCustomer,
  deleteParkingLot,
} from "../data/api";

const INCIDENT_TYPES = [
  { value: "BARRIER_FAILURE", label: "Awaria szlabanu" },
  { value: "PAYMENT_ISSUE",   label: "Problem z płatnością" },
  { value: "VEHICLE_BLOCKED", label: "Zablokowany pojazd" },
  { value: "OTHER",           label: "Inne" },
];
const SEVERITIES = [
  { value: "LOW",      label: "Niska",    color: "#64748b" },
  { value: "MEDIUM",   label: "Średnia",  color: "#f59e0b" },
  { value: "HIGH",     label: "Wysoka",   color: "#ef4444" },
  { value: "CRITICAL", label: "Krytyczna",color: "#b91c1c" },
];
const INCIDENT_STATUS = {
  OPEN:        { label: "Otwarty",    color: "#ef4444" },
  IN_PROGRESS: { label: "W toku",     color: "#f59e0b" },
  RESOLVED:    { label: "Rozwiązany", color: "#22c55e" },
};
const STATUS_PILL = {
  PENDING:   { label: "Oczekuje",     color: "#f59e0b" },
  CONFIRMED: { label: "Potwierdzona", color: "#22c55e" },
  ACTIVE:    { label: "Aktywna",      color: "#22c55e" },
  COMPLETED: { label: "Zakończona",   color: "#94a3b8" },
  CANCELLED: { label: "Anulowana",    color: "#ef4444" },
  EXPIRED:   { label: "Wygasła",      color: "#ef4444" },
};

const LOT_STATUS_COLOR = { ACTIVE: "#22c55e", INACTIVE: "#f59e0b", DELETED: "#ef4444", MAINTENANCE: "#94a3b8" };

export default function AdminDashboard({ admin, setAdmin, setPage, setToast }) {
  const [tab, setTab]                   = useState("reservations");
  const [customers, setCustomers]       = useState([]);
  const [reservations, setReservations] = useState([]);
  const [incidents, setIncidents]       = useState([]);
  const [lots, setLots]                 = useState([]);
  const [adminStats, setAdminStats]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [newIncident, setNewIncident]   = useState({ incidentType: "BARRIER_FAILURE", severity: "MEDIUM", description: "" });
  const [incidentError, setIncidentError] = useState("");
  const [creatingIncident, setCreatingIncident] = useState(false);
  const [plateFilter, setPlateFilter]   = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // { type, id, label }

  const refresh = async (silent = false) => {
    if (!admin?.adminUserId) return;
    if (!silent) setLoading(true);
    try {
      const [c, r, i, l, s] = await Promise.all([
        fetchAllCustomers(admin.adminUserId),
        fetchAllReservations(admin.adminUserId),
        fetchAllIncidents(admin.adminUserId),
        fetchAllParkingLotsAdmin(admin.adminUserId),
        fetchAdminStats(admin.adminUserId).catch(() => null),
      ]);
      setCustomers(c || []);
      setReservations(r || []);
      setIncidents(i || []);
      setLots(l || []);
      setAdminStats(s);
    } catch (err) {
      if (!silent) setToast(err.message || "Nie udało się wczytać danych panelu.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(() => refresh(true), 30_000);
    return () => clearInterval(interval);
  }, [admin?.adminUserId]);

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
      await updateIncidentStatus(id, status, admin.adminUserId);
      await refresh();
      setToast("Status incydentu zaktualizowany.");
    } catch (err) {
      setToast(err.message || "Nie udało się zmienić statusu.");
    }
  };

  const handleBan = async (customerId, isBanned) => {
    try {
      if (isBanned) await unbanCustomer(customerId, admin.adminUserId);
      else await banCustomer(customerId, admin.adminUserId);
      await refresh(true);
      setToast(isBanned ? "Konto odblokowane." : "Konto zbanowane.");
    } catch (err) {
      setToast(err.message || "Nie udało się zmienić statusu konta.");
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      await deleteCustomer(customerId, admin.adminUserId);
      await refresh(true);
      setToast("Konto usunięte.");
    } catch (err) {
      setToast(err.message || "Nie udało się usunąć konta.");
    } finally {
      setConfirmAction(null);
    }
  };

  const handleDeleteLot = async (lotId) => {
    try {
      await deleteParkingLot(lotId, admin.adminUserId);
      await refresh(true);
      setToast("Parking usunięty z systemu.");
    } catch (err) {
      setToast(err.message || "Nie udało się usunąć parkingu.");
    } finally {
      setConfirmAction(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("admin");
    setAdmin(null);
    setPage("adminLogin");
    setToast("Wylogowano z panelu admina.");
  };

  const owners = customers.filter((c) => c.isOwner);
  const regularCustomers = customers.filter((c) => !c.isOwner);

  const TABS = [
    { id: "reservations", label: `Rezerwacje (${reservations.length})` },
    { id: "customers",    label: `Klienci (${regularCustomers.length})` },
    { id: "owners",       label: `Właściciele (${owners.length})` },
    { id: "parking-lots", label: `Parkingi (${lots.length})` },
    { id: "incidents",    label: `Incydenty (${incidents.length})` },
  ];

  const CustomerRow = ({ c }) => (
    <tr key={c.customerId} style={{ borderTop: "1px solid var(--border)" }}>
      <td style={{ padding: "10px 12px", fontFamily: "'Space Mono',monospace", fontSize: 12 }}>#{c.customerId}</td>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>{c.firstName} {c.lastName}</td>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>{c.email}</td>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>{c.phone || "—"}</td>
      <td style={{ padding: "10px 12px" }}>
        <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#fff",
          background: c.status === "BANNED" ? "#ef4444" : c.status === "INACTIVE" ? "#94a3b8" : "#22c55e" }}>
          {c.status === "BANNED" ? "Zbanowany" : c.status === "INACTIVE" ? "Nieaktywny" : "Aktywny"}
        </span>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className={`btn btn-sm ${c.status === "BANNED" ? "btn-o" : "btn-danger"}`}
            style={{ fontSize: 11 }}
            onClick={() => handleBan(c.customerId, c.status === "BANNED")}
          >
            {c.status === "BANNED" ? "Odblokuj" : "Banuj"}
          </button>
          <button
            className="btn btn-danger btn-sm"
            style={{ fontSize: 11 }}
            onClick={() => setConfirmAction({ type: "customer", id: c.customerId, label: `${c.firstName} ${c.lastName}` })}
          >
            Usuń
          </button>
        </div>
      </td>
    </tr>
  );

  const CustomerTable = ({ list }) => (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {list.length === 0 ? (
        <div className="empty"><p>Brak użytkowników w tej kategorii.</p></div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg3)", textAlign: "left" }}>
              <th style={{ padding: "10px 12px", fontSize: 12 }}>ID</th>
              <th style={{ padding: "10px 12px", fontSize: 12 }}>Imię i nazwisko</th>
              <th style={{ padding: "10px 12px", fontSize: 12 }}>E-mail</th>
              <th style={{ padding: "10px 12px", fontSize: 12 }}>Telefon</th>
              <th style={{ padding: "10px 12px", fontSize: 12 }}>Status</th>
              <th style={{ padding: "10px 12px", fontSize: 12 }}>Akcje</th>
            </tr>
          </thead>
          <tbody>{list.map((c) => <CustomerRow key={c.customerId} c={c} />)}</tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="fin">
      {/* Confirm dialog */}
      {confirmAction && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: 360, padding: 28, textAlign: "center" }}>
            <h3 style={{ marginTop: 0 }}>Potwierdź usunięcie</h3>
            <p style={{ color: "var(--text2)", marginBottom: 20 }}>
              Czy na pewno usunąć <strong>{confirmAction.label}</strong>? Tej operacji nie można cofnąć.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-o" onClick={() => setConfirmAction(null)}>Anuluj</button>
              <button
                className="btn btn-danger"
                onClick={() => confirmAction.type === "customer"
                  ? handleDeleteCustomer(confirmAction.id)
                  : handleDeleteLot(confirmAction.id)}
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sh">
        <div>
          <h2 className="st">Panel SuperAdmina</h2>
          <p className="ss">{admin?.email} · {admin?.role}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-o btn-sm" onClick={refresh}>Odśwież</button>
          <button className="btn btn-danger btn-sm" onClick={logout}><I.Out /> Wyloguj</button>
        </div>
      </div>

      <div className="d-grid" style={{ marginBottom: 20 }}>
        <div className="d-stat">
          <div className="d-stat-l">Klienci</div>
          <div className="d-stat-v">{regularCustomers.length}</div>
          <div className="d-stat-c">zarejestrowani kierowcy</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Właściciele</div>
          <div className="d-stat-v">{owners.length}</div>
          <div className="d-stat-c">aktywnych parkingów: {lots.filter((l) => l.status === "ACTIVE").length}</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Aktywne rezerwacje</div>
          <div className="d-stat-v">{adminStats?.activeReservations ?? "—"}</div>
          <div className="d-stat-c">PENDING + CONFIRMED + ACTIVE</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Otwarte incydenty</div>
          <div className="d-stat-v">{incidents.filter((i) => i.status === "OPEN").length}</div>
          <div className="d-stat-c">wymagają uwagi</div>
        </div>
      </div>

      <div className="reservation-filters" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} className={`btn btn-sm ${tab === t.id ? "btn-a" : "btn-o"}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="card"><div className="empty">Wczytywanie…</div></div>}

      {/* Rezerwacje */}
      {!loading && tab === "reservations" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
            <input
              className="fi"
              style={{ maxWidth: 280, fontFamily: "'Space Mono',monospace" }}
              placeholder="Filtruj po tablicy…"
              value={plateFilter}
              onChange={(e) => setPlateFilter(e.target.value.toUpperCase())}
            />
          </div>
          {reservations.length === 0 ? (
            <div className="empty"><p>Brak rezerwacji w systemie.</p></div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg3)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>Kod</th>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>Parking</th>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>Tablica</th>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>Termin</th>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>Status</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, textAlign: "right" }}>Cena</th>
                </tr>
              </thead>
              <tbody>
                {reservations
                  .filter((r) => !plateFilter || (r.plate || "").includes(plateFilter.trim()))
                  .map((r) => {
                    const pill = STATUS_PILL[r.backendStatus] || { label: r.backendStatus, color: "#94a3b8" };
                    return (
                      <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 12px", fontFamily: "'Space Mono',monospace", fontSize: 12 }}>{r.code}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13 }}>{r.parking}</td>
                        <td style={{ padding: "10px 12px", fontFamily: "'Space Mono',monospace", fontSize: 12 }}>{r.plate}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12 }}>{r.date} {r.time}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#fff", background: pill.color }}>
                            {pill.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>
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

      {/* Klienci */}
      {!loading && tab === "customers" && <CustomerTable list={regularCustomers} />}

      {/* Właściciele */}
      {!loading && tab === "owners" && <CustomerTable list={owners} />}

      {/* Parkingi */}
      {!loading && tab === "parking-lots" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {lots.length === 0 ? (
            <div className="empty"><p>Brak parkingów w systemie.</p></div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg3)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>ID</th>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>Nazwa</th>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>Adres</th>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>Miejsca</th>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>Status</th>
                  <th style={{ padding: "10px 12px", fontSize: 12 }}>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((l) => (
                  <tr key={l.id} style={{ borderTop: "1px solid var(--border)", opacity: l.status === "DELETED" ? 0.5 : 1 }}>
                    <td style={{ padding: "10px 12px", fontFamily: "'Space Mono',monospace", fontSize: 12 }}>#{l.id}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{l.name}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--text2)" }}>{l.address}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12 }}>{l.spots} / {l.reservablePlacesCount ?? "?"} online</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#fff",
                        background: LOT_STATUS_COLOR[l.status] || "#94a3b8" }}>
                        {l.status || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {l.status !== "DELETED" && (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ fontSize: 11 }}
                          onClick={() => setConfirmAction({ type: "lot", id: l.id, label: l.name })}
                        >
                          Usuń
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Incydenty */}
      {!loading && tab === "incidents" && (
        <div style={{ display: "grid", gap: 16 }}>
          <form onSubmit={handleCreateIncident} className="wt-card">
            <h3 style={{ marginTop: 0 }}>Zgłoś nowy incydent</h3>
            {incidentError && <div className="auth-error" style={{ marginBottom: 12 }}><I.Alert /> {incidentError}</div>}
            <div className="fr">
              <div className="fg">
                <label className="fl">Typ</label>
                <select className="fs" value={newIncident.incidentType}
                  onChange={(e) => setNewIncident({ ...newIncident, incidentType: e.target.value })}>
                  {INCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="fl">Waga</label>
                <select className="fs" value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}>
                  {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="fg">
              <label className="fl">Opis (min. 10 znaków)</label>
              <textarea className="fi" rows={3} value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                placeholder="Co się stało, gdzie, kiedy. Możliwie konkretnie." />
            </div>
            <button type="submit" className="btn btn-a" disabled={creatingIncident}>
              {creatingIncident ? "Tworzenie…" : <><I.Plus /> Zgłoś incydent</>}
            </button>
          </form>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {incidents.length === 0 ? (
              <div className="empty"><p>Brak zgłoszonych incydentów.</p></div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg3)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", fontSize: 12 }}>ID</th>
                    <th style={{ padding: "10px 12px", fontSize: 12 }}>Typ</th>
                    <th style={{ padding: "10px 12px", fontSize: 12 }}>Waga</th>
                    <th style={{ padding: "10px 12px", fontSize: 12 }}>Opis</th>
                    <th style={{ padding: "10px 12px", fontSize: 12 }}>Zgłaszający</th>
                    <th style={{ padding: "10px 12px", fontSize: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => {
                    const typeLabel = INCIDENT_TYPES.find((t) => t.value === inc.incidentType)?.label || inc.incidentType;
                    const sev = SEVERITIES.find((s) => s.value === inc.severity) || { label: inc.severity, color: "#94a3b8" };
                    return (
                      <tr key={inc.incidentReportId} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 12px", fontFamily: "'Space Mono',monospace", fontSize: 12 }}>#{inc.incidentReportId}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13 }}>{typeLabel}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#fff", background: sev.color }}>
                            {sev.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, maxWidth: 260 }}>{inc.description}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12 }}>{inc.createdByEmail || "—"}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <select className="fs" style={{ padding: "4px 8px", fontSize: 12 }} value={inc.status}
                            onChange={(e) => handleChangeStatus(inc.incidentReportId, e.target.value)}>
                            {Object.entries(INCIDENT_STATUS).map(([key, val]) => (
                              <option key={key} value={key}
                                disabled={key === "RESOLVED" && admin?.role !== "SUPERADMIN"}>
                                {val.label}{key === "RESOLVED" && admin?.role !== "SUPERADMIN" ? " (tylko SUPERADMIN)" : ""}
                              </option>
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
    </div>
  );
}
