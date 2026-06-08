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
import SettingsPage from "./components/SettingsPage";
import UserPage from "./components/UserPage";
import AddCarPage from "./components/AddCarPage";
import ParkingDetailsPage from "./components/ParkingDetailsPage";
import AdminLoginPage from "./components/AdminLoginPage";
import AdminDashboard from "./components/AdminDashboard";
import { Check } from "./icons";
import { fetchVehicles } from "./data/api";

const PAGE_PATHS = {
  landing: "/",
  auth: "/auth",
  home: "/home",
  reserve: "/reservation",
  reservations: "/reservations",
  join: "/join",
  dashboard: "/dashboard",
  contact: "/contact",
  settings: "/settings",
  user: "/user",
  addCar: "/add-car",
  parkingDetails: "/parking",
  adminLogin: "/admin",
  adminDashboard: "/admin/dashboard",
};

const PATH_PAGES = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page])
);

const getPageFromPath = () => {
  if (/^\/parking\/\d+$/.test(window.location.pathname)) return "parkingDetails";
  return PATH_PAGES[window.location.pathname] || "landing";
};

const getParkingIdFromPath = () => {
  const match = window.location.pathname.match(/^\/parking\/(\d+)$/);
  return match ? Number(match[1]) : null;
};

export default function App() {
  const [page, setPageState]      = useState(getPageFromPath);
  const [parkingId, setParkingId] = useState(getParkingIdFromPath);
  const [user, setUser]           = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; }
  });
  const [admin, setAdmin]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin")) || null; } catch { return null; }
  });
  const [role, setRoleState]      = useState(() => localStorage.getItem("role") || "customer");
  const setRole = (newRole) => {
    setRoleState(newRole);
    localStorage.setItem("role", newRole);
  };
  const [showMenu, setShowMenu]   = useState(false);
  const [toast, setToast]         = useState(null);
  const [vehicles, setVehicles]   = useState([]);
  const [vehiclesOwnerId, setVehiclesOwnerId] = useState(null);

  useEffect(() => {
    if (!user?.customerId) {
      setVehicles([]);
      setVehiclesOwnerId(null);
      return;
    }
    const customerId = user.customerId;
    setVehicles([]);
    setVehiclesOwnerId(null);
    let active = true;
    fetchVehicles(customerId)
      .then((list) => {
        if (active) {
          setVehicles(list);
          setVehiclesOwnerId(customerId);
        }
      })
      .catch(() => {
        if (active) {
          setVehicles([]);
          setVehiclesOwnerId(customerId);
        }
      });
    return () => { active = false; };
  }, [user?.customerId]);

  const setPage = (nextPage, options = {}) => {
    const path =
      nextPage === "parkingDetails" && options.parkingId
        ? `${PAGE_PATHS.parkingDetails}/${options.parkingId}`
        : PAGE_PATHS[nextPage] || PAGE_PATHS.landing;
    const currentPath = window.location.pathname;

    setPageState(nextPage);
    setParkingId(options.parkingId || (nextPage === "parkingDetails" ? parkingId : null));

    if (path !== currentPath) {
      const method = options.replace ? "replaceState" : "pushState";
      window.history[method]({}, "", path);
    }
  };

  useEffect(() => {
    const syncPageFromPath = () => {
      setPageState(getPageFromPath());
      setParkingId(getParkingIdFromPath());
    };
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
    const adminPages = page === "adminLogin" || page === "adminDashboard";
    if (adminPages) {
      // Panel admina: jeśli nie zalogowany — wymuś /admin (login),
      // jeśli zalogowany ale na loginie — przerzuć na dashboard.
      if (!admin && page === "adminDashboard") setPage("adminLogin", { replace: true });
      if (admin && page === "adminLogin") setPage("adminDashboard", { replace: true });
      return;
    }
    if (!user && page !== "landing" && page !== "join" && page !== "auth") {
      setPage("landing", { replace: true });
      return;
    }
    // Panel właściciela tylko dla roli 'owner' (US-A05). Klient próbujący wejść
    // przez bezpośredni URL ląduje na stronie głównej.
    if (page === "dashboard" && role !== "owner") {
      setPage("home", { replace: true });
    }
  }, [user, admin, role, page]);

  const renderPage = () => {
    switch (page) {
      case "landing":      return <Landing setPage={setPage} />;
      case "auth":         return <AuthPage setUser={setUser} setRole={setRole} setPage={setPage} setToast={setToast} />;
      case "home":         return <HomePage setPage={setPage} />;
      case "reserve":      return <ReservePage user={user} vehicles={vehicles} vehiclesOwnerId={vehiclesOwnerId} setPage={setPage} setToast={setToast} />;
      case "reservations": return <Reservations user={user} setPage={setPage} setToast={setToast} />;
      case "join":         return <JoinPage user={user} setUser={setUser} setPage={setPage} setRole={setRole} />;
      case "dashboard":    return <Dashboard user={user} setPage={setPage} setToast={setToast} />;
      case "contact":      return <ContactPage user={user} setToast={setToast} />;
      case "settings":     return <SettingsPage user={user} setUser={setUser} setToast={setToast} />;
      case "user":         return <UserPage user={user} vehicles={vehicles} setVehicles={setVehicles} setPage={setPage} setToast={setToast} />;
      case "addCar":       return <AddCarPage user={user} vehicles={vehicles} setVehicles={setVehicles} setPage={setPage} setToast={setToast} />;
      case "parkingDetails": return <ParkingDetailsPage parkingId={parkingId} setPage={setPage} />;
      case "adminLogin":     return <AdminLoginPage setAdmin={setAdmin} setPage={setPage} setToast={setToast} />;
      case "adminDashboard": return <AdminDashboard admin={admin} setAdmin={setAdmin} setPage={setPage} setToast={setToast} />;
      default:             return <Landing setPage={setPage} />;
    }
  };

  const isAdminPage = page === "adminLogin" || page === "adminDashboard";

  return (
    <div className="app">
      {!isAdminPage && (
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
      )}
      <main className="main">{renderPage()}</main>
      {toast && (
        <div className="toast">
          <Check /> {toast}
        </div>
      )}
    </div>
  );
}
