import { useState } from "react";
import * as I from "../icons";

export default function Nav({ page, setPage, pagePaths, user, setUser, setRole, role, showMenu, setShowMenu }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabs = [
    { id: "home",         label: "Strona główna",  icon: <I.Home /> },
    { id: "reserve",      label: "Zarezerwuj",      icon: <I.Cal /> },
    { id: "reservations", label: "Moje rezerwacje", icon: <I.List /> },
    { id: "contact",      label: "Kontakt",          icon: <I.Mail /> },
  ];

  const navigate = (id, event) => {
    event?.preventDefault();
    setPage(id);
    setMobileOpen(false);
  };

  return (
    <nav className="nav">
      <div className="nav-in">
        <a
          className="logo"
          href={pagePaths[user ? "home" : "landing"]}
          onClick={(e) => navigate(user ? "home" : "landing", e)}
        >
          <I.Car />
          <span style={{ marginLeft: 7 }}>parkuj</span>
          <span className="dot">.my</span>
        </a>

        {/* Desktop tabs */}
        {user ? (
          <div className="tabs">
            {tabs.map((t) => (
              <a
                key={t.id}
                className={`tab ${page === t.id ? "on" : ""}`}
                href={pagePaths[t.id]}
                onClick={(e) => navigate(t.id, e)}
              >
                {t.icon}{t.label}
              </a>
            ))}
            {role === "owner" && (
              <a
                className={`tab ${page === "dashboard" ? "on" : ""}`}
                href={pagePaths.dashboard}
                onClick={(e) => navigate("dashboard", e)}
              >
                <I.Dash />Panel zarządzania
              </a>
            )}
          </div>
        ) : (
          <div className="tabs">
          </div>
        )}

        <div className="nav-r">
          {user ? (
            <>
              {/* Hamburger (mobile) */}
              <button className="ham" onClick={() => setMobileOpen((o) => !o)}>
                <span /><span /><span />
              </button>

              {/* User pill */}
              <div
                style={{ position: "relative" }}
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              >
                <div className="pill">
                  <div className="av">{user.name?.[0] ?? "U"}</div>
                  <span>{user.name?.split(" ")[0] ?? "Konto"}</span>
                </div>

                {showMenu && (
                  <div className="umenu" onClick={(e) => e.stopPropagation()}>
                    <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{user.email}</div>
                      {role === "owner" && (
                        <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Właściciel parkingu
                        </div>
                      )}
                    </div>
                    <button className="umi" onClick={() => { setShowMenu(false); setPage("user"); }}>
                      <I.Home /> Moje konto
                    </button>
                    <button className="umi" onClick={() => { setShowMenu(false); setPage("settings"); }}>
                      <I.Gear /> Ustawienia
                    </button>
                    <button className="umi" onClick={() => { setShowMenu(false); setPage("addCar"); }}>
                      <I.Car /> Dodaj pojazd
                    </button>
                    {role !== "owner" && (
                      <button className="umi" onClick={() => { setShowMenu(false); setPage("join"); }}>
                        <I.Dash /> Dołącz z parkingiem
                      </button>
                    )}
                    <button
                      className="umi red"
                      onClick={() => { localStorage.removeItem("user"); localStorage.removeItem("role"); setUser(null); setRole("customer"); setShowMenu(false); setPage("landing"); }}
                    >
                      <I.Out /> Wyloguj się
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <a
              className="btn btn-a btn-sm"
              href={pagePaths.auth}
              onClick={(e) => navigate("auth", e)}
            >
              Zaloguj się
            </a>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {user && (
        <div className={`mob-nav ${mobileOpen ? "open" : ""}`}>
          {tabs.map((t) => (
            <a
              key={t.id}
              className={`mob-tab ${page === t.id ? "on" : ""}`}
              href={pagePaths[t.id]}
              onClick={(e) => navigate(t.id, e)}
              >
                {t.icon}{t.label}
            </a>
          ))}
          {role === "owner" && (
            <a
              className={`mob-tab ${page === "dashboard" ? "on" : ""}`}
              href={pagePaths.dashboard}
              onClick={(e) => navigate("dashboard", e)}
            >
              <I.Dash />Panel zarządzania
            </a>
          )}
        </div>
      )}
    </nav>
  );
}
