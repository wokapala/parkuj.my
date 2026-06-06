import { useState } from "react";
import * as I from "../icons";
import { adminLogin } from "../data/api";

// Logowanie administratora — osobne od konta klienta (US-A01).
// Domyślnie zaseedowane konto: admin@parkuj.my / admin123 (SUPERADMIN).
export default function AdminLoginPage({ setAdmin, setPage, setToast }) {
  const [form, setForm] = useState({ email: "admin@parkuj.my", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (event) => {
    setError("");
    setForm({ ...form, [key]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError("Podaj e-mail i hasło administratora.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const admin = await adminLogin(form);
      const adminData = {
        adminUserId: admin.adminUserId,
        email: admin.email,
        role: admin.role,
      };
      localStorage.setItem("admin", JSON.stringify(adminData));
      setAdmin(adminData);
      setPage("adminDashboard");
      setToast(`Zalogowano jako ${admin.role}.`);
    } catch (err) {
      setError(err.message || "Logowanie nie powiodło się.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page fin">
      <div className="auth-copy">
        <div className="land-badge">Panel administratora</div>
        <h1>Zaloguj się do panelu</h1>
        <p>
          Dostęp tylko dla pracowników parkuj.my. Konta klientów logują się
          przez stronę <button className="link-inline" onClick={() => setPage("auth")}>logowania użytkownika</button>.
        </p>
      </div>

      <div className="auth-card">
        {error && <div className="auth-error"><I.Alert /> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label className="fl">Służbowy adres e-mail</label>
            <input
              className="fi"
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="admin@parkuj.my"
            />
          </div>
          <div className="fg">
            <label className="fl">Hasło</label>
            <input
              className="fi"
              type="password"
              value={form.password}
              onChange={update("password")}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-a btn-block" type="submit" disabled={submitting}>
            {submitting ? "Logowanie…" : <>Zaloguj się <I.Arr /></>}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 16, textAlign: "center" }}>
          Konto demo: <strong>admin@parkuj.my</strong> · hasło: <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
}
