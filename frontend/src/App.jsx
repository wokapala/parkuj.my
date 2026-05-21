import { useState, useEffect } from "react";
import Nav from "./components/Nav";
import Landing from "./components/Landing";
import AuthPage from "./components/AuthPage";
import HomePage from "./components/HomePage";
import ReservePage from "./components/ReservePage";
import Reservations from "./components/Reservations";
import JoinPage from "./components/JoinPage";
import Dashboard from "./components/Dashboard";
import ContactPage from "./components/ContactPage";
import { Check } from "./icons";

const PAGE_PATHS = {
  landing: "/",
  auth: "/auth",
  home: "/home",
  reserve: "/reservation",
  reservations: "/reservations",
  join: "/join",
  dashboard: "/dashboard",
  contact: "/contact",
};

const PATH_PAGES = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page])
);

const getPageFromPath = () => PATH_PAGES[window.location.pathname] || "landing";

export default function App() {
  const [page, setPageState]      = useState(getPageFromPath);
  const [user, setUser]           = useState(null);
  const [role, setRole]           = useState("customer");
  const [showMenu, setShowMenu]   = useState(false);
  const [toast, setToast]         = useState(null);

  const setPage = (nextPage, options = {}) => {
    const path = PAGE_PATHS[nextPage] || PAGE_PATHS.landing;
    const currentPath = window.location.pathname;

    setPageState(nextPage);

    if (path !== currentPath) {
      const method = options.replace ? "replaceState" : "pushState";
      window.history[method]({}, "", path);
    }
  };

  useEffect(() => {
    const syncPageFromPath = () => setPageState(getPageFromPath());
    window.addEventListener("popstate", syncPageFromPath);
    return () => window.removeEventListener("popstate", syncPageFromPath);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const dismiss = () => setShowMenu(false);
    if (showMenu) document.addEventListener("click", dismiss);
    return () => document.removeEventListener("click", dismiss);
  }, [showMenu]);

  useEffect(() => {
    if (!user && page !== "landing" && page !== "join" && page !== "auth") {
      setPage("landing", { replace: true });
    }
  }, [user, page]);

  const renderPage = () => {
    switch (page) {
      case "landing":      return <Landing setPage={setPage} />;
      case "auth":         return <AuthPage setUser={setUser} setRole={setRole} setPage={setPage} setToast={setToast} />;
      case "home":         return <HomePage setPage={setPage} />;
      case "reserve":      return <ReservePage setToast={setToast} />;
      case "reservations": return <Reservations setPage={setPage} setToast={setToast} />;
      case "join":         return <JoinPage user={user} setUser={setUser} setPage={setPage} setRole={setRole} />;
      case "dashboard":    return <Dashboard setToast={setToast} />;
      case "contact":      return <ContactPage setToast={setToast} />;
      default:             return <Landing setPage={setPage} />;
    }
  };

  return (
    <div className="app">
      <Nav
        page={page}
        setPage={setPage}
        pagePaths={PAGE_PATHS}
        user={user}
        setUser={setUser}
        setRole={setRole}
        role={role}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
      />
      <main className="main">{renderPage()}</main>
      {toast && (
        <div className="toast">
          <Check /> {toast}
        </div>
      )}
    </div>
  );
}
