import { useState } from "react";
import * as I from "../icons";
import { registerCustomer, loginCustomer, forgotPassword } from "../data/api";

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
  hostParking: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizePlate = (plate) => plate.trim().replace(/\s+/g, "").toUpperCase();

export default function AuthPage({ setUser, setRole, setPage, setToast }) {
  const [mode, setMode] = useState("login");
  const [login, setLogin] = useState(initialLogin);
  const [register, setRegister] = useState(initialRegister);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const updateLogin = (key) => (e) => {
    setError("");
    setLogin({ ...login, [key]: e.target.value });
  };

  const updateRegister = (key) => (e) => {
    setError("");
    const value = key === "terms" || key === "hostParking" ? e.target.checked : e.target.value;
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) { setError("Podaj adres e-mail."); return; }
    setSubmitting(true);
    setError("");
    try {
      await forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch {
      setForgotSent(true); // zawsze pokaż sukces (nie ujawniamy czy email istnieje)
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // Google OAuth jeszcze nie zaimplementowane na backendzie — wcześniejszy mock
    // ustawiał user bez customerId, przez co rezerwacje / pojazdy się wywalały.
    setToast("Logowanie Google — wkrótce. Na razie użyj e-maila i hasła.");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const firstName = register.firstName.trim();
    const lastName = register.lastName.trim();
    const email = register.email.trim().toLowerCase();
    const phone = register.phone.trim();
    const plate = normalizePlate(register.plate);

    if (!firstName) {
      setError("Podaj imię.");
      return;
    }
    if (!lastName) {
      setError("Podaj nazwisko.");
      return;
    }
    if (!email) {
      setError("Podaj adres e-mail.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Podaj poprawny adres e-mail, np. jan@example.com.");
      return;
    }
    if (!register.password) {
      setError("Podaj hasło.");
      return;
    }
    if (register.password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (plate && (plate.length < 5 || plate.length > 7)) {
      setError("Tablica rejestracyjna musi mieć od 5 do 7 znaków.");
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
        firstName,
        lastName,
        email,
        phone: phone || null,
        plate: plate || null,
        password: register.password,
      });

      const userData = {
        customerId: created?.customerId,
        name: `${created?.firstName ?? firstName} ${created?.lastName ?? lastName}`,
        email: created?.email ?? email,
        phone: created?.phone ?? phone,
        plate,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setRole("customer");
      setUser(userData);
      if (register.hostParking) {
        // Użytkownik zaznaczył "chcę zarejestrować parking" — od razu wizard /join.
        setPage("join");
        setToast("Konto utworzone. Zarejestruj teraz swój parking.");
      } else {
        setPage("home");
        setToast("Konto utworzone i zapisane. Możesz rezerwować miejsce.");
      }
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
          <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setError(""); setForgotSent(false); }}>
            Logowanie
          </button>
          <button className={mode === "register" ? "on" : ""} onClick={() => { setMode("register"); setError(""); setForgotSent(false); }}>
            Rejestracja
          </button>
        </div>

        {error && <div className="auth-error"><I.Alert /> {error}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <button className="btn btn-o btn-block auth-google" type="button" onClick={handleGoogleLogin}>
              <I.Google /> Zaloguj się przez Google <small style={{ marginLeft: 8, opacity: 0.6, fontSize: 11 }}>(wkrótce)</small>
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

            <div className="auth-divider" style={{ margin: "16px 0 8px" }}><span>resetowanie hasła</span></div>
            {forgotSent ? (
              <div style={{ fontSize: 13, color: "var(--success)", textAlign: "center", padding: "8px 0" }}>
                Jeśli konto istnieje, link resetujący zostanie wysłany na podany adres.
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="fi"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Twój e-mail"
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-o btn-sm"
                  type="button"
                  disabled={submitting}
                  onClick={handleForgotPassword}
                  style={{ whiteSpace: "nowrap" }}
                >
                  Wyślij link
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleRegister} noValidate>
            <div className="fr">
              <div className="fg">
                <label className="fl">Imię</label>
                <input className="fi" value={register.firstName} onChange={updateRegister("firstName")} placeholder="Jan" required />
              </div>
              <div className="fg">
                <label className="fl">Nazwisko</label>
                <input className="fi" value={register.lastName} onChange={updateRegister("lastName")} placeholder="Kowalski" required />
              </div>
            </div>
            <div className="fg">
              <label className="fl">Adres e-mail</label>
              <input className="fi" type="email" value={register.email} onChange={updateRegister("email")} placeholder="jan@gmail.com" required />
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Telefon (opcjonalnie)</label>
                <input className="fi" value={register.phone} onChange={updateRegister("phone")} placeholder="+48 500 000 000" />
              </div>
              <div className="fg">
                <label className="fl">Tablica (opcjonalnie)</label>
                <input
                  className="fi"
                  value={register.plate}
                  onChange={(e) => setRegister({ ...register, plate: e.target.value.toUpperCase() })}
                  placeholder="KR 12345"
                  style={{ fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}
                />
              </div>
            </div>
            <div className="fr">
              <div className="fg">
                <label className="fl">Hasło</label>
                <input className="fi" type="password" value={register.password} onChange={updateRegister("password")} placeholder="min. 6 znaków" required />
              </div>
              <div className="fg">
                <label className="fl">Powtórz hasło</label>
                <input className="fi" type="password" value={register.confirmPassword} onChange={updateRegister("confirmPassword")} placeholder="••••••••" required />
              </div>
            </div>
            <label className="auth-check">
              <input type="checkbox" checked={register.terms} onChange={updateRegister("terms")} />
              <span>Akceptuję regulamin i zgodę na obsługę rezerwacji parkingowych.</span>
            </label>
            <label className="auth-check">
              <input type="checkbox" checked={register.hostParking} onChange={updateRegister("hostParking")} />
              <span>Mam parking i chcę go zarejestrować w sieci parkuj.my (przejdziesz do kreatora po założeniu konta).</span>
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
