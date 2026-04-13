import * as I from "../icons";

export default function Nav({ page, setPage, user, setUser, role, showMenu, setShowMenu }) {
  const tabs = [
    { id: "home",         label: "Strona główna",   icon: <I.Home /> },
    { id: "reserve",      label: "Zarezerwuj",       icon: <I.Cal /> },
    { id: "reservations", label: "Moje rezerwacje",  icon: <I.List /> },
    { id: "map",          label: "Mapa parkingów",   icon: <I.MapPin /> },
  ];

  return (
    <nav className="nav">
      <div className="nav-in">
        <div className="logo" onClick={() => setPage(user ? "home" : "landing")}>
          <I.Car />
          <span style={{ marginLeft: 7 }}>parkuj</span>
          <span className="dot">.my</span>
        </div>

        {user ? (
          <div className="tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`tab ${page === t.id ? "on" : ""}`}
                onClick={() => setPage(t.id)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
            {role === "owner" && (
              <button
                className={`tab ${page === "dashboard" ? "on" : ""}`}
                onClick={() => setPage("dashboard")}
              >
                <I.Dash />
                Panel zarządzania
              </button>
            )}
          </div>
        ) : (
          <div className="tabs">
            <button className="tab join" onClick={() => setPage("join")}>
              <I.Plus />
              Dołącz z parkingiem
            </button>
          </div>
        )}

        <div className="nav-r">
          {user ? (
            <div
              style={{ position: "relative" }}
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            >
              <div className="pill">
                <div className="av">{user.name[0]}</div>
                <span>{user.name.split(" ")[0]}</span>
                {role === "customer" && (
                  <span className="loy">
                    <I.Heart /> 240
                  </span>
                )}
              </div>

              {showMenu && (
                <div className="umenu" onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--border)",
                      marginBottom: "4px",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{user.email}</div>
                    {role === "owner" && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--accent)",
                          fontWeight: 700,
                          marginTop: 3,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Właściciel parkingu
                      </div>
                    )}
                  </div>
                  <button className="umi" onClick={() => setShowMenu(false)}>
                    <I.Gear /> Ustawienia
                  </button>
                  <button
                    className="umi red"
                    onClick={() => { setUser(null); setShowMenu(false); setPage("landing"); }}
                  >
                    <I.Out /> Wyloguj się
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn-g"
              onClick={() => { setUser({ name: "Jan Kowalski", email: "jan@gmail.com" }); setPage("home"); }}
            >
              <I.Google /> Zaloguj się
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
