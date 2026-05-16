# parkuj.my — Project Wiki (Memory File)

> **Cel tego pliku:** Trwała pamięć projektu dla Claude Code. Zawiera pełny kontekst — nie traci się przy czyszczeniu context window. Aktualizować przy każdej istotnej zmianie.

---

## 1. Informacje ogólne

| Parametr | Wartość |
|----------|---------|
| Nazwa | parkuj.my |
| Typ | Projekt zaliczeniowy — zespołowy |
| Uczelnia | — |
| Repozytorium | wokapala/parkuj.my |
| Branch roboczy | `claude/review-repo-files-4RXMt` |

### Skład zespołu
- Michał Kalinowski
- Stanisław Kopeć
- Wojciech Kapała
- Mateusz Kaliński

---

## 2. Opis produktu

System rezerwacji miejsc parkingowych online. Użytkownik rezerwuje miejsce, płaci online, a przy wjeździe kamera OCR odczytuje tablicę rejestracyjną i automatycznie otwiera szlaban. Tylko aplikacja webowa.

### Główne założenia
1. Rezerwacja miejsca online z płatnością z góry
2. Wjazd bez zatrzymania — tablica = bilet (ANPR/OCR)
3. Fallback: kod rezerwacji (12 znaków) wysyłany emailem gdy OCR zawiedzie
4. Konto klienta z punktami lojalnościowymi (0.2 pkt/zł)
5. Walk-in bez konta: wjazd spontaniczny, płatność przy parkomacie lub przez apkę
6. Panel admina/operatora (osobne logowanie, nie Google)
7. Ręczne sterowanie szlabanem z panelu admina

---

## 3. Stack technologiczny

| Warstwa | Technologia |
|---------|------------|
| Frontend | React 18 + Vite |
| Backend | Java (Spring Boot) |
| Baza danych | PostgreSQL |
| OCR / ANPR | Python + FastAPI |
| Autentykacja klientów | Google OAuth2 (JWT) |
| Autentykacja adminów | Email + hasło (bcrypt) |
| Mapy | Leaflet / react-leaflet |
| Wykresy | Recharts |

### Zależności frontendu (package.json)
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.1"
  }
}
```

---

## 4. Architektura frontendu (React prototype)

### Routing
Brak react-router. Routing przez `useState` w `App.jsx`:

```
landing → home → reserve / reservations / map / contact
                 join → dashboard (rola: owner)
```

### Strony i komponenty

| Strona (`page`) | Plik | Opis |
|-----------------|------|------|
| `landing` | `Landing.jsx` | Strona startowa, logowanie Google (mock) |
| `home` | `HomePage.jsx` | Dashboard klienta, popularne parkingi |
| `reserve` | `ReservePage.jsx` | 3-krokowy wizard: parking → szczegóły → płatność |
| `reservations` | `Reservations.jsx` | Lista aktywnych i zakończonych rezerwacji |
| `map` | `MapPage.jsx` | Mapa Warszawy z markerami (Leaflet) |
| `join` | `JoinPage.jsx` | 4-krokowy wizard rejestracji właściciela |
| `dashboard` | `Dashboard.jsx` | Panel właściciela: wykresy, mapa miejsc, szlaban |
| `contact` | `ContactPage.jsx` | Formularz kontaktowy + FAQ (accordion) |

### Komponenty współdzielone
- `Nav.jsx` — pasek nawigacyjny, hamburger mobile, user pill z menu
- `PCard.jsx` — karta parkingu (używana w HomePage i ReservePage)
- `src/icons/index.jsx` — własny zestaw ikon SVG

### Role użytkownika
- `customer` (domyślna) — klient
- `owner` — właściciel parkingu (dostęp do dashboardu)

### Stan globalny (App.jsx)
```js
const [page, setPage]         = useState("landing");
const [user, setUser]         = useState(null);        // null = niezalogowany
const [role, setRole]         = useState("customer");  // "customer" | "owner"
const [showMenu, setShowMenu] = useState(false);
const [toast, setToast]       = useState(null);        // toast notifications
```

### Dane mockowe (`src/data/mockData.js`)
- `MOCK_PARKINGS` — 5 parkingów warszawskich z coords, price, available, rating
- `MOCK_RESERVATIONS` — 3 rezerwacje (1 active, 2 completed)

### Nawigacja w Nav (zakładki zgodne z wymaganiami)
Strona główna | Zarezerwuj | Moje rezerwacje | Mapa parkingów | Kontakt

---

## 5. Schemat bazy danych (v2)

### ENUMy

```
customer_status:        active | inactive | banned
parking_lot_status:     active | inactive | maintenance
reservation_status:     pending | confirmed | active | completed | cancelled | expired
parking_session_status: active | completed | abandoned
plate_recognition_result: success | failure | uncertain
barrier_direction:      entry | exit
barrier_status:         active | inactive | maintenance
barrier_action_type:    open | close | force_open
barrier_action_result:  success | failure | pending
payment_status:         pending | completed | failed | refunded
payment_method:         card | blik | bank_transfer | cash | terminal
admin_role:             superadmin | admin | operator
admin_status:           active | inactive
incident_type:          barrier_failure | payment_issue | vehicle_blocked | other
incident_severity:      low | medium | high | critical
incident_status:        open | in_progress | resolved
```

### Tabele

#### `customer`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| customer_id | int PK | autoincrement |
| google_sub | varchar UNIQUE | Google OAuth sub z id_token |
| first_name | varchar | |
| last_name | varchar | |
| email | varchar UNIQUE | |
| phone | varchar NULL | |
| status | customer_status | default: active |
| created_at / updated_at | timestamp | |

#### `vehicle`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| vehicle_id | int PK | |
| customer_id | int FK→customer | |
| plate_number | varchar | |
| country_code | varchar(3) | default: POL |
| is_primary | boolean | default: false |
| UNIQUE | (plate_number, country_code) | uq_vehicle_plate_country |

#### `parking_lot`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| parking_lot_id | int PK | |
| name | varchar | |
| address | varchar | |
| latitude | decimal(9,6) | |
| longitude | decimal(9,6) | |
| places_count | int | łączna pojemność |
| reservable_places_count | int | pula online; reszta = walk-in |
| status | parking_lot_status | default: active |

> walk-in = places_count − reservable_places_count (wyliczane, nie stored)
> reservable_places_count=0 → tylko walk-in
> reservable_places_count=places_count → tylko rezerwacje

#### `pricing_plan`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| pricing_plan_id | int PK | |
| parking_lot_id | int FK→parking_lot | |
| price_per_hour | decimal(10,2) | |
| currency | varchar(3) | default: PLN |
| valid_from | timestamp | |
| valid_to | timestamp NULL | null = aktualny plan |

> Przy zmianie ceny: nie edytujemy, dodajemy nowy rekord z nowym valid_from

#### `reservation`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| reservation_id | int PK | |
| customer_id | int FK→customer | |
| vehicle_id | int FK→vehicle | |
| parking_lot_id | int FK→parking_lot | |
| pricing_plan_id | int FK→pricing_plan | |
| reservation_code | varchar(12) UNIQUE | kod emailowy, fallback dla OCR |
| start_at | timestamp | |
| end_at | timestamp | |
| status | reservation_status | default: pending |
| price_estimated | decimal(10,2) | |
| reserved_at | timestamp | |
| expires_at | timestamp | kiedy wygasa nieaktywna rezerwacja |
| version | int | optimistic locking (Spring @Version) |

#### `parking_session`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| parking_session_id | int PK | |
| reservation_id | int NULL FK→reservation | null = walk-in |
| vehicle_id | int NULL FK→vehicle | null = walk-in bez konta |
| entry_at | timestamp | |
| exit_at | timestamp NULL | |
| status | parking_session_status | default: active |
| entry_plate_number | varchar | denormalizacja z OCR |
| exit_plate_number | varchar NULL | denormalizacja z OCR |

#### `plate_recognition_event`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| plate_recognition_event_id | int PK | |
| parking_session_id | int NULL FK→parking_session | |
| barrier_gate_id | int FK→barrier_gate | |
| plate_number | varchar | |
| confidence | decimal(5,4) | 0.0000–1.0000 |
| captured_at | timestamp | |
| image_url | varchar NULL | |
| result | plate_recognition_result | |

#### `barrier_gate`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| barrier_gate_id | int PK | |
| parking_lot_id | int FK→parking_lot | |
| gate_name | varchar | |
| direction | barrier_direction | entry / exit |
| status | barrier_status | default: active |

#### `barrier_action`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| barrier_action_id | int PK | |
| barrier_gate_id | int FK→barrier_gate | |
| parking_session_id | int NULL FK→parking_session | |
| admin_user_id | int NULL FK→admin_user | null = automatyczna akcja |
| action_type | barrier_action_type | |
| reason | varchar NULL | |
| action_result | barrier_action_result | default: pending |
| requested_at | timestamp | |
| executed_at | timestamp NULL | |

#### `payment`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| payment_id | int PK | |
| reservation_id | int NULL FK→reservation | płatność z góry |
| parking_session_id | int NULL FK→parking_session | walk-in / overtime |
| amount | decimal(10,2) | |
| currency | varchar(3) | default: PLN |
| payment_method | payment_method | |
| status | payment_status | default: pending |
| provider_reference | varchar NULL | ID z zewnętrznego providera |
| paid_at | timestamp NULL | |

#### `admin_user`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| admin_user_id | int PK | |
| email | varchar UNIQUE | |
| password_hash | varchar | bcrypt |
| role | admin_role | superadmin / admin / operator |
| status | admin_status | default: active |

#### `incident_report`
| Kolumna | Typ | Uwagi |
|---------|-----|-------|
| incident_report_id | int PK | |
| reservation_id | int NULL FK | |
| parking_session_id | int NULL FK | |
| created_by_admin_id | int FK→admin_user | |
| incident_type | incident_type | |
| severity | incident_severity | |
| description | text | |
| status | incident_status | default: open |
| resolved_at | timestamp NULL | |

---

## 6. User Stories (18 łącznie)

### Klient z kontem (US-K01 – US-K10)

| ID | Tytuł | Priorytet |
|----|-------|-----------|
| US-K01 | Logowanie przez Google | Wysoki |
| US-K02 | Zarządzanie pojazdami | Wysoki |
| US-K03 | Przeglądanie dostępnych parkingów | Wysoki |
| US-K04 | Sprawdzenie dostępności i wyceny | Wysoki |
| US-K05 | Dokonanie rezerwacji | Wysoki |
| US-K06 | Anulowanie rezerwacji | Średni |
| US-K07 | Wjazd przez OCR (tablica) | Wysoki |
| US-K08 | Wjazd kodem rezerwacji (fallback OCR) | Wysoki |
| US-K09 | Wyjazd z parkingu | Wysoki |
| US-K10 | Historia rezerwacji | Niski |

#### US-K01 — Logowanie przez Google
- Przycisk "Zaloguj przez Google" na ekranie startowym
- Przekierowanie do Google OAuth2
- getOrCreateCustomer — tworzenie lub pobieranie konta
- Zwrot tokenu JWT, redirect na home
- Obsługa błędów OAuth

#### US-K02 — Zarządzanie pojazdami
- Dodaj pojazd: numer rej. + kod kraju (unikalna para)
- Usuń pojazd (tylko jeśli brak aktywnej rezerwacji/sesji)
- Oznacz jako "główny" (pozostałe tracą status)
- Lista: pojazd główny na górze

#### US-K03 — Przeglądanie parkingów
- Tylko parkingi status=ACTIVE
- Każdy: nazwa, adres, miejsca ogółem, miejsca rezerwowane, cena/h
- Widok szczegółowy z mapą (lat/lng)

#### US-K04 — Sprawdzenie dostępności i wyceny
- Dane wejściowe: data, godz. przyjazdu, godz. wyjazdu
- Wynik: dostępność (tak/nie), wolne miejsca rezerwowane, szacowana cena
- Cena z aktywnego pricing_plan dla parkingu
- "Brak wolnych miejsc" gdy zajęte

#### US-K05 — Dokonanie rezerwacji
- Wybór: parking, termin, pojazd (lub ręcznie tablica)
- Optimistic locking przy sprawdzaniu dostępności
- Reservation tworzona ze statusem PENDING
- Po płatności → CONFIRMED
- Email z kodem rezerwacji (12 znaków)
- Komunikat "Brak miejsc" gdy race condition

#### US-K06 — Anulowanie rezerwacji
- Dostępne dla: PENDING, CONFIRMED
- Niedostępne dla: ACTIVE (klient już wjechał)
- Status → CANCELLED
- Inicjuje zwrot przez PaymentService.refundPayment()

#### US-K07 — Wjazd przez OCR
- Kamera → Python/FastAPI OCR serwis
- confidence >= próg → szukaj aktywnej rezerwacji dla tablicy
- Znaleziono → status ACTIVE, szlaban otwiera się
- Tworzy ParkingSession (entryAt, entryPlateNumber)
- PlateRecognitionEvent z result=SUCCESS

#### US-K08 — Wjazd kodem (fallback)
- Opcja "Otwórz szlaban kodem" w aplikacji
- Weryfikacja kodu + bramki
- Kod ważny + CONFIRMED → ACTIVE, sesja tworzona
- Kod jednorazowy (ponowne użycie odrzucone)

#### US-K09 — Wyjazd
- OCR przy wyjeździe → kończy sesję (exitAt, exitPlateNumber)
- W czasie okna → szlaban otwiera się automatycznie
- Overtime → szlaban zamknięty, powiadomienie z kwotą dopłaty
- Po opłaceniu → szlaban otwiera się

#### US-K10 — Historia rezerwacji
- Kolumny: parking, termin, status, cena, tablica
- Sortowanie: od najnowszej
- Filtr po statusie (aktywne / zakończone / anulowane)

---

### Gość / Walk-in bez konta (US-G01 – US-G03)

| ID | Tytuł | Priorytet |
|----|-------|-----------|
| US-G01 | Wjazd bez rezerwacji (walk-in) | Wysoki |
| US-G02 | Płatność przez parkomat | Wysoki |
| US-G03 | Płatność przez aplikację bez konta | Średni |

#### US-G01 — Walk-in wjazd
- OCR rejestruje tablicę bez powiązanej rezerwacji
- Wolne miejsca walk-in = places_count − reservable_places_count − aktywne sesje > 0 → szlaban otwiera się
- ParkingSession bez customer_id (NULL)
- Brak wolnych → szlaban zamknięty

#### US-G02 — Płatność parkomat
- Parkomat identyfikuje sesję po tablicy (wpisanej przez użytkownika)
- `POST /api/sessions/by-plate/{plate}/pay`
- Kwota = czas sesji × aktywny cennik
- Po płatności → ParkingSession.status = COMPLETED, szlaban otwiera się

#### US-G03 — Płatność przez apkę bez konta
- `GET /api/sessions/by-plate/{plate}` — publiczny endpoint
- Płatność (BLIK / karta) bez logowania
- Po płatności → COMPLETED, szlaban otwiera się

---

### Administrator / Operator (US-A01 – US-A05)

| ID | Tytuł | Priorytet |
|----|-------|-----------|
| US-A01 | Logowanie do panelu admina | Wysoki |
| US-A02 | Podgląd aktywnych sesji | Wysoki |
| US-A03 | Ręczne otwieranie szlabanu | Wysoki |
| US-A04 | Tworzenie raportu incydentu | Średni |
| US-A05 | Konfiguracja podziału miejsc | Średni |

#### US-A01 — Logowanie admina
- Panel pod `/admin`
- Email + hasło (bcrypt)
- Role: SUPERADMIN > ADMIN > OPERATOR (różne uprawnienia)
- 3 błędne próby → tymczasowa blokada konta
- Sesja wygasa po 8h nieaktywności

#### US-A02 — Podgląd aktywnych sesji
- Widok: tablica, czas wjazdu, czas trwania, status
- Auto-odświeżanie co 30 sekund
- Filtr po tablicy rejestracyjnej
- Overtime sesje wyróżnione kolorem

#### US-A03 — Ręczne otwieranie szlabanu
- Wybór bramki + kliknięcie "Otwórz szlaban"
- Wymagany powód (min. 10 znaków)
- BarrierAction z type=FORCE_OPEN + ID operatora
- Historia ostatnich 50 ręcznych otwarć per bramka

#### US-A04 — Raport incydentu
- Formularz: typ, opis, severity (LOW/MEDIUM/HIGH/CRITICAL)
- Tworzony ze statusem OPEN, przypisany do admina
- Filtrowanie po statusie i severity
- Tylko SUPERADMIN może zamknąć (→ RESOLVED + data)

#### US-A05 — Konfiguracja podziału miejsc
- Edycja: "Liczba miejsc ogółem" + "Miejsca rezerwowane online"
- Walidacja: reservable ≤ total
- Zmiana natychmiastowa (sprawdzanie dostępności)
- Historia zmian z datą i autorem

---

## 7. Kluczowe endpointy API (wynikające z user stories)

```
POST   /api/auth/google          # wymiana kodu OAuth na JWT
GET    /api/parkings              # lista aktywnych parkingów
GET    /api/parkings/{id}         # szczegóły parkingu + pricing
GET    /api/parkings/{id}/availability?from=&to=  # sprawdzenie dostępności
POST   /api/reservations          # utwórz rezerwację (pending)
DELETE /api/reservations/{id}     # anuluj rezerwację
GET    /api/reservations          # historia rezerwacji klienta
POST   /api/reservations/open-barrier  # otwórz szlabanem kodem
GET    /api/sessions/by-plate/{plate}  # aktywna sesja dla tablicy (publiczny)
POST   /api/sessions/by-plate/{plate}/pay  # płatność przy parkomacie

# Admin
POST   /admin/api/auth/login      # logowanie admina
GET    /admin/api/sessions/active # aktywne sesje
POST   /admin/api/barriers/{id}/open  # force_open szlabanu
POST   /admin/api/incidents        # utwórz incydent
PATCH  /admin/api/incidents/{id}   # zmień status incydentu
PATCH  /admin/api/parkings/{id}/config  # konfiguracja podziału miejsc
```

---

## 8. Ważne decyzje architektoniczne

| Decyzja | Uzasadnienie |
|---------|-------------|
| Optimistic locking (`@Version`) na reservation | Zapobiega race condition przy jednoczesnych rezerwacjach |
| reservation_code (12 znaków) w emailu | Fallback gdy OCR nie rozpozna tablicy przy wjeździe |
| Denormalizacja entry_plate_number / exit_plate_number w parking_session | Szybki dostęp w panelu admina bez JOIN z milionami eventów OCR |
| pricing_plan append-only (nie edytujemy) | Historia cen, rezerwacje historyczne mają poprawną cenę |
| walk-in = places_count − reservable_places_count (wyliczane) | Nie trzymamy osobnego pola — jedno źródło prawdy |
| Admini mają osobne logowanie (nie Google) | Inny security model, role systemowe |
| Python/FastAPI dla OCR | Ekosystem ML/CV w Pythonie (OpenCV, EasyOCR itp.) |

---

## 9. Stan implementacji (maj 2026)

### Gotowe (frontend prototype)
- [x] Landing page z mockowym logowaniem
- [x] Nav z zakładkami (strona główna / zarezerwuj / moje rezerwacje / mapa / kontakt)
- [x] 3-krokowy wizard rezerwacji (wybór parkingu, szczegóły, płatność BLIK/karta/GPay)
- [x] Lista rezerwacji z anulowaniem
- [x] Mapa parkingów (Leaflet + dark tiles)
- [x] Panel właściciela (wykresy, mapa miejsc, sterowanie szlabanem)
- [x] Wizard dołączania z parkingiem (4 kroki)
- [x] Strona kontaktowa z FAQ

### Do zrobienia (backend + integracja)
- [ ] Google OAuth2 (backend Java)
- [ ] JWT auth
- [ ] REST API (Spring Boot)
- [ ] PostgreSQL schema migration (Flyway/Liquibase)
- [ ] OCR serwis (Python/FastAPI + OpenCV/EasyOCR)
- [ ] Integracja fizycznego szlabanu z API
- [ ] Płatności (BLIK, karta — provider)
- [ ] Email z kodem rezerwacji
- [ ] Panel admina (/admin — osobna ścieżka)
- [ ] Overtime detection + powiadomienia
- [ ] Walk-in flow

---

## 10. Konwencje i notatki

- Wszystkie kwoty w PLN (decimal 10,2)
- Czas w UTC (timestamp), wyświetlanie konwertowane na strefę klienta
- plate_number przechowywany uppercase bez spacji
- country_code ISO 3166-1 alpha-3 (domyślnie "POL")
- Punkty lojalnościowe: 0.2 pkt / 1 zł, 100 pkt = 1h darmowego parkowania
- Klient może mieć wiele pojazdów, jeden oznaczony jako primary
- Admini nie mają Google OAuth — osobna tabela admin_user z password_hash
