import { useState } from "react";
import * as I from "../icons";
import { registerCustomer, loginCustomer, forgotPassword, fetchMyParkingLots } from "../data/api";

const initialLogin = { email: "jan@gmail.com", password: "" };

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizePlate = (plate) => plate.trim().replace(/\s+/g, "").toUpperCase();

export default function AuthPage({ setUser, setRole, setPage, setToast, pageOptions }) {
  const initialMode = pageOptions?.ownerRegister ? "registerOwner" : "login";
  const [mode, setMode] = useState(initialMode);
  const [login, setLogin] = useState(initialLogin);
  const [register, setRegister] = useState(initialRegister);
  const [registerOwner, setRegisterOwner] = useState(initialRegister);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const switchMode = (m) => { setMode(m); setError(""); setForgotSent(false); };

  const updateLogin = (key) => (e) => { setError(""); setLogin({ ...login, [key]: e.target.value }); };
  const updateReg = (key) => (e) => {
    setError("");
    setRegister({ ...register, [key]: key === "terms" ? e.target.checked : e.target.value });
  };
  const updateOwnerReg = (key) => (e) => {
    setError("");
    setRegisterOwner({ ...registerOwner, [key]: key === "terms" ? e.target.checked : e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!login.email || !login.password) { setError("Podaj e-mail i hasło."); return; }
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
      let nextRole = "customer";
      try {
        const lots = await fetchMyParkingLots(customer.customerId);
        if (Array.isArray(lots) && lots.length > 0) nextRole = "owner";
      } catch { /* brak parkingów */ }
      setRole(nextRole);
      setUser(userData);
      setPage(nextRole === "owner" ? "dashboard" : "home");
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
      setForgotSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setToast("Logowanie Google — wkrótce. Na razie użyj e-maila i hasła.");
  };

  const validateRegisterForm = (form) => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    const plate = normalizePlate(form.plate);
    if (!firstName) return "Podaj imię.";
    if (!lastName) return "Podaj nazwisko.";
    if (!email) return "Podaj adres e-mail.";
    if (!EMAIL_RE.test(email)) return "Podaj poprawny adres e-mail, np. jan@example.com.";
    if (!form.password) return "Podaj hasło.";
    if (form.password.length < 6) return "Hasło musi mieć co najmniej 6 znaków.";
    if (plate && (plate.length < 2 || plate.length > 10)) return "Tablica rejestracyjna musi mieć od 2 do 10 znaków.";
    if (form.password !== form.confirmPassword) return "Hasła muszą być takie same.";
    if (!form.terms) return "Zaakceptuj regulamin, aby utworzyć konto.";
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const err = validateRegisterForm(register);
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError("");
    try {
      const firstName = register.firstName.trim();
      const lastName = register.lastName.trim();
      const email = register.email.trim().toLowerCase();
      const phone = register.phone.trim();
      const plate = normalizePlate(register.plate);
      const created = await registerCustomer({ firstName, lastName, email, phone: phone || null, plate: plate || null, password: register.password });
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
      setPage("home");
      setToast("Konto utworzone. Witaj w parkuj.my!");
    } catch (err) {
      setError(err.message || "Rejestracja nie powiodła się. Spróbuj ponownie.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterOwner = async (e) => {
    e.preventDefault();
    const err = validateRegisterForm(registerOwner);
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError("");
    try {
      const firstName = registerOwner.firstName.trim();
      const lastName = registerOwner.lastName.trim();
      const email = registerOwner.email.trim().toLowerCase();
      const phone = registerOwner.phone.trim();
      const plate = normalizePlate(registerOwner.plate);
      const created = await registerCustomer({ firstName, lastName, email, phone: phone || null, plate: plate || null, password: registerOwner.password });
      const userData = {
        customerId: created?.customerId,
        name: `${created?.firstName ?? firstName} ${created?.lastName ?? lastName}`,
        email: created?.email ?? email,
        phone: created?.phone ?? phone,
        plate,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setRole("owner");
      setUser(userData);
      setPage("join");
      setToast("Konto właściciela utworzone. Zarejestruj teraz swój parking.");
    } catch (err) {
      setError(err.message || "Rejestracja nie powiodła się. Spróbuj ponownie.");
    } finally {
      setSubmitting(false);
    }
  };

  const COPY = {
    login: {
      badge: "Witaj z powrotem",
      h1: "Zaloguj się do parkuj.my",
      p: "Dostęp do rezerwacji, historii parkowania i ustawień konta.",
    },
    register: {
      badge: "Nowy klient",
      h1: "Utwórz konto kierowcy",
      p: "Rezerwuj miejsca online, wjeżdżaj bez zatrzymania — numer rejestracyjny działa jak bilet.",
    },
    registerOwner: {
      badge: "Właściciel parkingu",
      h1: "Dołącz z parkingiem",
      p: "Utwórz konto, a następnie dodaj parking w kreatorze. Twoi klienci będą rezerwować miejsca online.",
    },
  };

  const copy = COPY[mode];

  const RegisterFields = ({ form, update }) => (
    <>
      <div className="fr">
        <div className="fg">
          <label className="fl">Imię</label>
          <input className="fi" value={form.firstName} onChange={update("firstName")} placeholder="Jan" required />
        </div>
        <div className="fg">
          <label className="fl">Nazwisko</label>
          <input className="fi" value={form.lastName} onChange={update("lastName")} placeholder="Kowalski" required />
        </div>
      </div>
      <div className="fg">
        <label className="fl">Adres e-mail</label>
        <input className="fi" type="email" value={form.email} onChange={update("email")} placeholder="jan@gmail.com" required />
      </div>
      <div className="fr">
        <div className="fg">
          <label className="fl">Telefon (opcjonalnie)</label>
          <input className="fi" value={form.phone} onChange={update("phone")} placeholder="+48 500 000 000" />
        </div>
        <div className="fg">
          <label className="fl">Tablica (opcjonalnie)</label>
          <input
            className="fi"
            value={form.plate}
            onChange={(e) => update("plate")({ target: { value: e.target.value.toUpperCase() } })}
            placeholder="KR 12345"
            style={{ fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}
          />
        </div>
      </div>
      <div className="fr">
        <div className="fg">
          <label className="fl">Hasło</label>
          <input className="fi" type="password" value={form.password} onChange={update("password")} placeholder="min. 6 znaków" required />
        </div>
        <div className="fg">
          <label className="fl">Powtórz hasło</label>
          <input className="fi" type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="••••••••" required />
        </div>
      </div>
      <label className="auth-check">
        <input type="checkbox" checked={form.terms} onChange={update("terms")} />
        <span>Akceptuję regulamin i zgodę na obsługę rezerwacji parkingowych.</span>
      </label>
    </>
  );

  return (
    <div className="auth-page fin">
      <div className="auth-copy">
        <div className="land-badge">{copy.badge}</div>
        <h1>{copy.h1}</h1>
        <p>{copy.p}</p>
      </div>

      <div className="auth-card">
        <div className="auth-tabs" style={{ display: "flex" }}>
          <button className={mode === "login" ? "on" : ""} onClick={() => switchMode("login")}>
            Logowanie
          </button>
          <button className={mode === "register" ? "on" : ""} onClick={() => switchMode("register")}>
            Rejestracja — Klient
          </button>
          <button className={mode === "registerOwner" ? "on" : ""} onClick={() => switchMode("registerOwner")}>
            Właściciel
          </button>
        </div>

        {error && <div className="auth-error"><I.Alert /> {error}</div>}

        {mode === "login" && (
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
            <button className="btn btn-o btn-block" type="button" style={{ marginTop: 10 }} onClick={() => switchMode("register")}>
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
                <button className="btn btn-o btn-sm" type="button" disabled={submitting} onClick={handleForgotPassword} style={{ whiteSpace: "nowrap" }}>
                  Wyślij link
                </button>
              </div>
            )}
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister} noValidate>
            <RegisterFields form={register} update={updateReg} />
            <button className="btn btn-a btn-block" type="submit" disabled={submitting}>
              {submitting ? "Tworzenie konta…" : <>Zarejestruj się <I.Check /></>}
            </button>
          </form>
        )}

        {mode === "registerOwner" && (
          <form onSubmit={handleRegisterOwner} noValidate>
            <div style={{ background: "rgba(129,164,205,0.08)", border: "1px solid var(--accent)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              <strong style={{ color: "var(--accent)" }}>Rejestracja właściciela parkingu</strong>
              <br />
              <span style={{ color: "var(--text2)" }}>Po założeniu konta przejdziesz do kreatora, gdzie dodasz swój parking.</span>
            </div>
            <RegisterFields form={registerOwner} update={updateOwnerReg} />
            <button className="btn btn-a btn-block" type="submit" disabled={submitting}>
              {submitting ? "Tworzenie konta…" : <>Zarejestruj i dodaj parking <I.Arr /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
