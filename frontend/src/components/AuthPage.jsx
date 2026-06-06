import { useState } from "react";
import * as I from "../icons";
import { registerCustomer, loginCustomer } from "../data/api";

const initialLogin = {
  email: "jan@gmail.com",
  password: "",
};

const initialRegister = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  plate: "",
  password: "",
  confirmPassword: "",
  terms: false,
};

export default function AuthPage({ setUser, setRole, setPage, setToast }) {
  const [mode, setMode] = useState("login");
  const [login, setLogin] = useState(initialLogin);
  const [register, setRegister] = useState(initialRegister);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateLogin = (key) => (e) => {
    setError("");
    setLogin({ ...login, [key]: e.target.value });
  };

  const updateRegister = (key) => (e) => {
    setError("");
    const value = key === "terms" ? e.target.checked : e.target.value;
    setRegister({ ...register, [key]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!login.email || !login.password) {
      setError("Podaj e-mail i hasło.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const customer = await loginCustomer({ email: login.email, password: login.password });
      const userData = {
        customerId: customer.customerId,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setRole("customer");
      setUser(userData);
      setPage("home");
      setToast("Zalogowano pomyślnie.");
    } catch (err) {
      setError(err.message || "Logowanie nie powiodło się.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setRole("customer");
    setUser({ name: "Jan Kowalski", email: "jan@gmail.com" });
    setPage("home");
    setToast("Zalogowano przez Google.");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!register.firstName || !register.lastName || !register.email || !register.password) {
      setError("Uzupełnij wymagane pola.");
      return;
    }
    if (register.password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (register.password !== register.confirmPassword) {
      setError("Hasła muszą być takie same.");
      return;
    }
    if (!register.terms) {
      setError("Zaakceptuj regulamin, aby utworzyć konto.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      // Zapis do bazy przez backend (POST /api/auth/register).
      const created = await registerCustomer({
        firstName: register.firstName,
        lastName: register.lastName,
        email: register.email,
        phone: register.phone,
        plate: register.plate,
        password: register.password,
      });

      const userData = {
        customerId: created?.customerId,
        name: `${created?.firstName ?? register.firstName} ${created?.lastName ?? register.lastName}`,
        email: created?.email ?? register.email,
        phone: created?.phone ?? register.phone,
        plate: register.plate.toUpperCase(),
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setRole("customer");
      setUser(userData);
      setPage("home");
      setToast("Konto utworzone i zapisane. Możesz rezerwować miejsce.");
    } catch (err) {
      setError(err.message || "Rejestracja nie powiodła się. Spróbuj ponownie.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page fin">
      <div className="auth-copy">
        <div className="land-badge">
          <I.Shield /> Konto kierowcy
        </div>
        <h1>{mode === "login" ? "Wróć do swoich rezerwacji" : "Utwórz konto w parkuj.my"}</h1>
        <p>
          Zarządzaj pojazdami, rezerwacjami i płatnościami z jednego miejsca.
          Numer rejestracyjny może działać jak bilet przy wjeździe.
        </p>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setError(""); }}>
            Logowanie
          </button>
          <button className={mode === "register" ? "on" : ""} onClick={() => { setMode("register"); setError(""); }}>
            Rejestracja
          </button>
        </div>

        {error && <div className="auth-error"><I.Alert /> {error}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <button className="btn btn-o btn-block auth-google" type="button" onClick={handleGoogleLogin}>
              <I.Google /> Zaloguj się przez Google
            </button>
            <div className="auth-divider"><span>lub</span></div>
            <div className="fg">
              <label className="fl">Adres e-mail</label>
              <input className="fi" type="email" value={login.email} onChange={updateLogin("email")} placeholder="jan@gmail.com" />
            </div>
            <div className="fg">
              <label className="fl">Hasło</label>
              <input className="fi" type="password" value={login.password} onChange={updateLogin("password")} placeholder="••••••••" />
            </div>
            <button className="btn btn-a btn-block" type="submit" disabled={submitting}>
              {submitting ? "Logowanie…" : <>Zaloguj się <I.Arr /></>}
            </button>
            <button className="btn btn-o btn-block" type="button" style={{ marginTop: 10 }} onClick={() => setMode("register")}>
              Utwórz nowe konto
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="fr">
              <div className="fg">
                <label className="fl">Imię</label>
                <input className="fi" value={register.firstName} onChange={updateRegister("firstName")} placeholder="Jan" />
              </div>
              <div className="fg">
                <label className="fl">Nazwisko</label>
                <input className="fi" value={register.lastName} onChange={updateRegister("lastName")} placeholder="Kowalski" />
              </div>
            </div>
            <div className="fg">
              <label className="fl">Adres e-mail</label>
              <input className="fi" type="email" value={register.email} onChange={updateRegister("email")} placeholder="jan@gmail.com" />
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Telefon</label>
                <input className="fi" value={register.phone} onChange={updateRegister("phone")} placeholder="+48 500 000 000" />
              </div>
              <div className="fg">
                <label className="fl">Tablica</label>
                <input
                  className="fi"
                  value={register.plate}
                  onChange={(e) => setRegister({ ...register, plate: e.target.value.toUpperCase() })}
                  placeholder="WA 12345"
                  style={{ fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}
                />
              </div>
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Hasło</label>
                <input className="fi" type="password" value={register.password} onChange={updateRegister("password")} placeholder="min. 6 znaków" />
              </div>
              <div className="fg">
                <label className="fl">Powtórz hasło</label>
                <input className="fi" type="password" value={register.confirmPassword} onChange={updateRegister("confirmPassword")} placeholder="••••••••" />
              </div>
            </div>
            <label className="auth-check">
              <input type="checkbox" checked={register.terms} onChange={updateRegister("terms")} />
              <span>Akceptuję regulamin i zgodę na obsługę rezerwacji parkingowych.</span>
            </label>
            <button className="btn btn-a btn-block" type="submit" disabled={submitting}>
              {submitting ? "Tworzenie konta…" : <>Zarejestruj konto <I.Check /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
