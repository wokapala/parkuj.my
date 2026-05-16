import { useState } from "react";
import * as I from "../icons";

const FAQ = [
  {
    q: "Jak działa automatyczny szlaban?",
    a: "Kamera ANPR przy wjeździe odczytuje tablicę rejestracyjną. Jeśli masz aktywną rezerwację, szlaban otwiera się automatycznie — bez zatrzymywania się.",
  },
  {
    q: "Czy mogę anulować rezerwację?",
    a: "Tak, możesz anulować rezerwację do 30 minut przed jej rozpoczęciem w zakładce 'Moje rezerwacje'. Pełny zwrot środków następuje do 3 dni roboczych.",
  },
  {
    q: "Co zrobić gdy szlaban nie otwiera się?",
    a: "Naciśnij przycisk interkomu przy szlabanie i poczekaj na obsługę. Możesz też zadzwonić na naszą infolinię dostępną 24/7: +48 22 123 45 67.",
  },
  {
    q: "Czy aplikacja działa na urządzeniach mobilnych?",
    a: "Tak, aplikacja parkuj.my jest w pełni responsywna i działa poprawnie na smartfonach oraz tabletach.",
  },
];

export default function ContactPage({ setToast }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    setSent(true);
    setToast("Wiadomość wysłana! Odpowiemy w ciągu 24h.");
  };

  return (
    <div className="fin">
      <div className="sh">
        <div>
          <h2 className="st">Kontakt</h2>
          <p className="ss">Jesteśmy do Twojej dyspozycji</p>
        </div>
      </div>

      <div className="contact-grid">
        {/* Contact form */}
        <div className="card" style={{ padding: 28 }}>
          {sent ? (
            <div className="empty" style={{ padding: "40px 0" }}>
              <div className="empty-ic" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                <I.Check />
              </div>
              <h3>Wiadomość wysłana!</h3>
              <p>Odpowiemy na Twój e-mail w ciągu 24 godzin roboczych.</p>
              <button className="btn btn-o" onClick={() => setSent(false)}>Wyślij kolejną</button>
            </div>
          ) : (
            <form onSubmit={handleSend}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Wyślij wiadomość</h3>
              <div className="fr">
                <div className="fg">
                  <label className="fl">Imię</label>
                  <input className="fi" placeholder="Jan" required />
                </div>
                <div className="fg">
                  <label className="fl">Nazwisko</label>
                  <input className="fi" placeholder="Kowalski" required />
                </div>
              </div>
              <div className="fg">
                <label className="fl">Adres e-mail</label>
                <input className="fi" type="email" placeholder="jan@gmail.com" required />
              </div>
              <div className="fg">
                <label className="fl">Temat</label>
                <select className="fs">
                  <option>Problem z rezerwacją</option>
                  <option>Problem z płatnością</option>
                  <option>Błąd szlabanu / wjazd</option>
                  <option>Pytanie ogólne</option>
                  <option>Inne</option>
                </select>
              </div>
              <div className="fg">
                <label className="fl">Wiadomość</label>
                <textarea className="fi" rows={5} placeholder="Opisz swój problem lub pytanie..." required />
              </div>
              <button type="submit" className="btn btn-a btn-block">
                Wyślij wiadomość <I.Arr />
              </button>
            </form>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Contact info */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Dane kontaktowe</h3>
            <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 16, lineHeight: 1.5 }}>
              Biuro obsługi klienta czynne Pon–Pt 8:00–20:00. Infolinia 24/7.
            </p>
            {[
              { label: "Telefon",   val: "+48 22 123 45 67",    icon: <I.Phone /> },
              { label: "E-mail",    val: "kontakt@parkuj.my",   icon: <I.Mail /> },
              { label: "Adres",     val: "ul. Marszałkowska 10\n00-590 Warszawa", icon: <I.MapPin /> },
            ].map((c) => (
              <div key={c.label} className="contact-item">
                <div className="contact-ic">{c.icon}</div>
                <div>
                  <div className="contact-label">{c.label}</div>
                  <div className="contact-val" style={{ whiteSpace: "pre-line" }}>{c.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Najczęstsze pytania</h3>
            {FAQ.map((f, i) => (
              <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-q">
                  <span>{f.q}</span>
                  <span style={{ color: "var(--text3)", transform: openFaq === i ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                    <I.Chev />
                  </span>
                </div>
                {openFaq === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
