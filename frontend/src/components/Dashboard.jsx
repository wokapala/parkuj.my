import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import * as I from "../icons";
import { fetchMyParkingLots, fetchParkingLotStats, updateParkingLotConfig, updateParkingLotPrice } from "../data/api";

const DAY_LABELS = ["Nd", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];

export default function Dashboard({ user, setPage, setToast }) {
  const [lots, setLots]                   = useState([]);
  const [lotId, setLotId]                 = useState(null);
  const [stats, setStats]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [savingSplit, setSavingSplit]     = useState(false);
  const [splitError, setSplitError]       = useState("");
  const [barrierOpen, setBarrierOpen]     = useState(false);
  const [split, setSplit]                 = useState({ total: 0, reservable: 0 });

  // "Zmień cenę" modal
  const [priceModal, setPriceModal]       = useState(false);
  const [newPrice, setNewPrice]           = useState("");
  const [savingPrice, setSavingPrice]     = useState(false);
  const [priceError, setPriceError]       = useState("");

  // "Godziny otwarcia" modal
  const [hoursModal, setHoursModal]       = useState(false);
  const [hoursForm, setHoursForm]         = useState({ openFrom: "", openTo: "" });
  const [savingHours, setSavingHours]     = useState(false);
  const [hoursError, setHoursError]       = useState("");

  useEffect(() => {
    let active = true;
    if (!user?.customerId) { setLoading(false); return; }
    (async () => {
      try {
        const data = await fetchMyParkingLots(user.customerId);
        if (!active || !data?.length) { setLoading(false); return; }
        setLots(data);
        const firstId = data[0].id ?? data[0].parkingLotId;
        setLotId(firstId);
        const s = await fetchParkingLotStats(firstId, user.customerId);
        if (!active) return;
        setStats(s);
        setSplit({ total: s.placesCount || 0, reservable: s.reservablePlacesCount || 0 });
      } catch {
        if (active) setStats(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.customerId]);

  const switchLot = async (id) => {
    setLotId(id);
    setStats(null);
    try {
      const s = await fetchParkingLotStats(id, user.customerId);
      setStats(s);
      setSplit({ total: s.placesCount || 0, reservable: s.reservablePlacesCount || 0 });
    } catch { /* zostaw null */ }
  };

  const refreshStats = async () => {
    if (!lotId) return;
    try {
      const s = await fetchParkingLotStats(lotId, user.customerId);
      setStats(s);
      setSplit({ total: s.placesCount || 0, reservable: s.reservablePlacesCount || 0 });
    } catch { /* zostaw */ }
  };

  const handleSaveSplit = async () => {
    if (!lotId) return;
    if (split.reservable > split.total) {
      setSplitError("Liczba miejsc rezerwowanych nie może przekraczać liczby miejsc ogółem.");
      return;
    }
    setSplitError("");
    setSavingSplit(true);
    try {
      await updateParkingLotConfig(lotId, user.customerId, {
        placesCount: split.total,
        reservablePlacesCount: split.reservable,
      });
      await refreshStats();
      setToast("Podział miejsc zaktualizowany w bazie.");
    } catch (err) {
      setSplitError(err.message || "Nie udało się zapisać podziału.");
    } finally {
      setSavingSplit(false);
    }
  };

  const currentLot = lots.find((l) => (l.id ?? l.parkingLotId) === lotId);

  const handleOpenHoursModal = () => {
    setHoursForm({
      openFrom: currentLot?.openFrom || "",
      openTo: currentLot?.openTo || "",
    });
    setHoursError("");
    setHoursModal(true);
  };

  const handleSaveHours = async () => {
    const { openFrom, openTo } = hoursForm;
    if ((openFrom && !openTo) || (!openFrom && openTo)) {
      setHoursError("Podaj obie godziny albo zostaw oba pola puste (czynny całą dobę).");
      return;
    }
    setSavingHours(true);
    setHoursError("");
    try {
      await updateParkingLotConfig(lotId, user.customerId, {
        openFrom: openFrom || "",
        openTo: openTo || "",
      });
      const data = await fetchMyParkingLots(user.customerId);
      setLots(data);
      setHoursModal(false);
      setToast(openFrom ? `Godziny otwarcia: ${openFrom}–${openTo}` : "Parking czynny całą dobę.");
    } catch (err) {
      setHoursError(err.message || "Nie udało się zapisać godzin otwarcia.");
    } finally {
      setSavingHours(false);
    }
  };

  const handleOpenPriceModal = () => {
    setNewPrice(stats?.pricePerHour != null ? String(stats.pricePerHour) : "");
    setPriceError("");
    setPriceModal(true);
  };

  const handleSavePrice = async () => {
    const val = parseFloat(newPrice);
    if (isNaN(val) || val < 0) {
      setPriceError("Podaj prawidłową cenę (≥ 0).");
      return;
    }
    setSavingPrice(true);
    setPriceError("");
    try {
      await updateParkingLotPrice(lotId, user.customerId, val.toFixed(2));
      await refreshStats();
      setPriceModal(false);
      setToast(`Cena zaktualizowana: ${val.toFixed(2)} zł/h`);
    } catch (err) {
      setPriceError(err.message || "Nie udało się zmienić ceny.");
    } finally {
      setSavingPrice(false);
    }
  };

  const toggleBarrier = () => {
    setBarrierOpen((prev) => {
      setToast(prev ? "Szlaban zamknięty (mock)" : "Szlaban otwarty (mock)");
      return !prev;
    });
  };

  const setReservable = (value) => {
    const reservable = Math.min(Math.max(0, Number(value) || 0), split.total);
    setSplit({ ...split, reservable });
  };

  const walkIn = Math.max(0, split.total - split.reservable);
  const revenueChartData = useMemo(() => {
    if (!stats?.revenueLast7Days) return [];
    return stats.revenueLast7Days.map((p) => {
      const d = new Date(p.day);
      return { day: DAY_LABELS[d.getDay()], value: Number(p.value) || 0 };
    });
  }, [stats]);
  const totalWeekRevenue = revenueChartData.reduce((sum, p) => sum + p.value, 0);
  // Obłożenie liczone względem puli rezerwowanej online — rezerwacje z aplikacji
  // nie zajmują miejsc walk-in, więc dzielenie przez placesCount zaniżało wynik.
  const occupancy = stats && stats.reservablePlacesCount > 0
    ? Math.min(100, Math.round((stats.activeReservationsCount / stats.reservablePlacesCount) * 100))
    : 0;

  if (loading) return (
    <div className="fin">
      <div className="sh"><div><h2 className="st">Panel zarządzania</h2><p className="ss">Wczytywanie danych…</p></div></div>
    </div>
  );

  if (!stats) return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Panel zarządzania</h2>
          <p className="ss">Nie masz jeszcze zarejestrowanego parkingu.</p>
        </div>
      </div>
      <div className="empty" style={{ padding: "60px 24px" }}>
        <div className="empty-ic"><I.Dash /></div>
        <h3>Dodaj swój pierwszy parking</h3>
        <p>Przejdź przez krótki kreator, by zarejestrować obiekt — od tego momentu zobaczysz tu obłożenie, przychody i podział miejsc.</p>
        <button className="btn btn-a" style={{ marginTop: 16 }} onClick={() => setPage("join")}>
          Dołącz z parkingiem <I.Arr />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Panel zarządzania</h2>
          {lots.length > 1 ? (
            <select
              className="fs"
              style={{ marginTop: 4, fontSize: 13 }}
              value={lotId || ""}
              onChange={(e) => switchLot(Number(e.target.value))}
            >
              {lots.map((l) => (
                <option key={l.id ?? l.parkingLotId} value={l.id ?? l.parkingLotId}>
                  {l.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="ss">{stats.parkingLotName} · z bazy danych</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-a btn-sm" onClick={() => setPage("join")}>
            <I.Plus /> Dodaj parking
          </button>
          <button className="btn btn-o btn-sm" onClick={refreshStats}>
            Odśwież
          </button>
        </div>
      </div>

      <div className="d-grid">
        <div className="d-stat">
          <div className="d-stat-l">Obłożenie (aktywne)</div>
          <div className="d-stat-v">{occupancy}%</div>
          <div className="d-stat-c">{stats.activeReservationsCount} z {stats.reservablePlacesCount} miejsc online</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Przychód — bieżący miesiąc</div>
          <div className="d-stat-v">{Number(stats.revenueThisMonth || 0).toLocaleString("pl")} zł</div>
          <div className="d-stat-c">{stats.reservationsThisMonth} rezerwacji</div>
        </div>
        <div className="d-stat">
          <div className="d-stat-l">Cena godzinowa</div>
          <div className="d-stat-v">{stats.pricePerHour != null ? `${Number(stats.pricePerHour).toFixed(2)} zł` : "—"}</div>
          <div className="d-stat-c">aktywny cennik</div>
        </div>
      </div>

      <div className="dash-layout">
        <div>
          <div className="d-sec">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h3 style={{ margin: 0 }}>Przychód — ostatnie 7 dni</h3>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                Σ {totalWeekRevenue.toLocaleString("pl")} zł
              </span>
            </div>
            <div className="chart-c">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#F17300" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F17300" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(129,164,205,0.12)" />
                  <XAxis dataKey="day" tick={{ fill: "#81A4CD", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#81A4CD", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#054A91", border: "1px solid rgba(129,164,205,0.22)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#DBE4EE", fontWeight: 600 }}
                    itemStyle={{ color: "#F17300" }}
                    formatter={(v) => [`${v} zł`, "Przychód"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#F17300" strokeWidth={2} fill="url(#rev)" dot={{ fill: "#F17300", r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="d-sec">
            <h3>Wjazdy / wyjazdy</h3>
            <div className="empty" style={{ padding: "32px 0" }}>
              <div className="empty-ic"><I.Car /></div>
              <p style={{ fontSize: 13, color: "var(--text3)", margin: 0 }}>
                Historia wjazdów i wyjazdów będzie dostępna po integracji z czytnikiem tablic (ANPR).
              </p>
            </div>
          </div>

          <div className="d-sec">
            <h3>Sterowanie szlabanem</h3>
            <div className="bar-ctrl">
              <button className={`bar-sw ${barrierOpen ? "on" : ""}`} onClick={toggleBarrier} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  Szlaban: <span style={{ color: barrierOpen ? "var(--success)" : "var(--danger)" }}>
                    {barrierOpen ? "OTWARTY" : "ZAMKNIĘTY"}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>Demo — wymaga sprzętu</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="d-sec">
            <h3>Podział miejsc</h3>
            <p className="desc">Określ ile miejsc rezerwujesz online, a ile zostawiasz dla wjazdów bez rezerwacji.</p>
            <div className="split-summary compact">
              <div>
                <span>{split.total}</span>
                <small>razem</small>
              </div>
              <div>
                <span>{split.reservable}</span>
                <small>aplikacja</small>
              </div>
              <div>
                <span>{walkIn}</span>
                <small>walk-in</small>
              </div>
            </div>
            <div className="fg" style={{ marginTop: 18 }}>
              <label className="fl">Miejsca rezerwowane online</label>
              <input
                className="split-range"
                type="range"
                min="0"
                max={split.total || 1}
                value={split.reservable}
                onChange={(e) => setReservable(e.target.value)}
                style={{
                  background: `linear-gradient(to right, var(--accent) ${split.total ? Math.round((split.reservable / split.total) * 100) : 0}%, var(--bg3) 0%)`,
                }}
              />
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Razem</label>
                <input
                  className="fi"
                  type="number"
                  min="0"
                  value={split.total}
                  onChange={(e) => setSplit({ total: Math.max(0, Number(e.target.value) || 0), reservable: split.reservable })}
                />
              </div>
              <div className="fg">
                <label className="fl">Online</label>
                <input
                  className="fi"
                  type="number"
                  min="0"
                  max={split.total}
                  value={split.reservable}
                  onChange={(e) => setReservable(e.target.value)}
                />
              </div>
            </div>
            {splitError && (
              <div className="auth-error" style={{ margin: "12px 0" }}>
                <I.Alert /> {splitError}
              </div>
            )}
            <button className="btn btn-a btn-block" onClick={handleSaveSplit} disabled={savingSplit}>
              {savingSplit ? "Zapisywanie…" : "Zapisz podział"}
            </button>
          </div>

          <div className="d-sec">
            <h3>Szybkie akcje</h3>

            <button className="qa-item" onClick={handleOpenPriceModal}>
              <div className="qa-item-ic"><I.TrendUp /></div>
              <span style={{ flex: 1 }}>Zmień cenę</span>
              <I.Chev />
            </button>

            {priceModal && (
              <div className="qa-inline">
                <div className="fg" style={{ marginTop: 8 }}>
                  <label className="fl">Nowa cena / godz. (PLN)</label>
                  <input
                    className="fi"
                    type="number"
                    min="0"
                    step="0.50"
                    value={newPrice}
                    onChange={(e) => { setNewPrice(e.target.value); setPriceError(""); }}
                    autoFocus
                  />
                </div>
                {priceError && (
                  <div className="auth-error" style={{ margin: "8px 0" }}>
                    <I.Alert /> {priceError}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn btn-a btn-sm" onClick={handleSavePrice} disabled={savingPrice}>
                    {savingPrice ? "Zapisywanie…" : "Zapisz"}
                  </button>
                  <button className="btn btn-o btn-sm" onClick={() => setPriceModal(false)}>
                    Anuluj
                  </button>
                </div>
              </div>
            )}

            <button className="qa-item" onClick={handleOpenHoursModal}>
              <div className="qa-item-ic"><I.Clock /></div>
              <span style={{ flex: 1 }}>
                Godziny otwarcia
                {currentLot?.openFrom && currentLot?.openTo && (
                  <small style={{ display: "block", fontSize: 11, color: "var(--text3)" }}>
                    {currentLot.openFrom}–{currentLot.openTo}
                  </small>
                )}
              </span>
              <I.Chev />
            </button>

            {hoursModal && (
              <div className="qa-inline">
                <div className="fr" style={{ marginTop: 8 }}>
                  <div className="fg">
                    <label className="fl">Otwarcie</label>
                    <input
                      className="fi"
                      type="time"
                      value={hoursForm.openFrom}
                      onChange={(e) => { setHoursForm({ ...hoursForm, openFrom: e.target.value }); setHoursError(""); }}
                    />
                  </div>
                  <div className="fg">
                    <label className="fl">Zamknięcie</label>
                    <input
                      className="fi"
                      type="time"
                      value={hoursForm.openTo}
                      onChange={(e) => { setHoursForm({ ...hoursForm, openTo: e.target.value }); setHoursError(""); }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: 11, color: "var(--text3)", margin: "6px 0 0" }}>
                  Puste pola = parking czynny całą dobę.
                </p>
                {hoursError && (
                  <div className="auth-error" style={{ margin: "8px 0" }}>
                    <I.Alert /> {hoursError}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn btn-a btn-sm" onClick={handleSaveHours} disabled={savingHours}>
                    {savingHours ? "Zapisywanie…" : "Zapisz"}
                  </button>
                  <button className="btn btn-o btn-sm" onClick={() => { setHoursForm({ openFrom: "", openTo: "" }); setHoursError(""); }}>
                    Całą dobę
                  </button>
                  <button className="btn btn-o btn-sm" onClick={() => setHoursModal(false)}>
                    Anuluj
                  </button>
                </div>
              </div>
            )}
            <button className="qa-item" onClick={() => setToast("Eksport PDF — wkrótce")}>
              <div className="qa-item-ic"><I.Download /></div>
              <span style={{ flex: 1 }}>Raport PDF</span>
              <I.Chev />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
