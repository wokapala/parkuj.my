# parkuj.my — Project Wiki (Memory File)

> **Cel tego pliku:** Trwała pamięć projektu dla Codex. Zawiera pełny kontekst — nie traci się przy czyszczeniu context window. Aktualizować przy każdej istotnej zmianie.

---

## 1. Informacje ogólne

| Parametr | Wartość |
|----------|---------|
| Nazwa | parkuj.my |
| Typ | Projekt zaliczeniowy — zespołowy |
| Uczelnia | — |
| Repozytorium | wokapala/parkuj.my |
| Branch roboczy | `Codex/review-repo-files-4RXMt` |

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
| Backend | Java 17, Spring Boot 4.0.6 |
| Baza danych | PostgreSQL |
| OCR / ANPR | Python + FastAPI |
| Autentykacja klientów | Google OAuth2 (JWT) |
| Autentykacja adminów | Email + hasło (bcrypt) |
| Mapy | Leaflet / react-leaflet |
| Wykresy | Recharts |

### Zależności backendu (pom.xml)
```
groupId:    my.parkuj
artifactId: application
Java:       17
Spring Boot: 4.0.6

Zależności:
- spring-boot-starter-data-jpa    ← JPA / Hibernate
- spring-boot-starter-webmvc      ← REST controllers
- postgresql                       ← driver JDBC (runtime)
- lombok                           ← @Data, @Builder itp.
```

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

## 4. Struktura repozytorium

```
parkuj.my/
├── AGENTS.md                          ← ten plik (wiki projektu)
├── frontend/                          ← React 18 + Vite
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Landing.jsx            ← strona marketingowa (niezalogowany)
│       │   ├── AuthPage.jsx           ← logowanie + rejestracja (PR #7, Michał)
│       │   ├── Nav.jsx
│       │   ├── HomePage.jsx
│       │   ├── ReservePage.jsx
│       │   ├── Reservations.jsx
│       │   ├── MapPage.jsx
│       │   ├── JoinPage.jsx
│       │   ├── Dashboard.jsx
│       │   ├── ContactPage.jsx
│       │   └── PCard.jsx
│       ├── data/
│       │   └── mockData.js
│       └── icons/
│           └── index.jsx
└── backend/                           ← Java 17 + Spring Boot 4.0.6
    ├── pom.xml
    ├── mvnw / mvnw.cmd
    └── src/main/java/my/parkuj/application/
        ├── Application.java
        ├── controller/                ← 8 kontrolerów (szkielety)
        ├── service/                   ← 9 serwisów (szkielety)
        ├── repository/                ← 12 repozytoriów (szkielety)
        ├── model/                     ← 11 encji JPA (częściowe pola)
        ├── dto/                       ← 10 klas DTO (szkielety)
        └── enums/                     ← 8 enumów (wypełnione)
```

> Frontend był wcześniej w `src/` na roota — przeniesiony do `frontend/` w PR #3 (Stanisław Kopeć).
> Backend: szkielet Maven w PR #3, pełna struktura pakietów w PR #5 (Stanisław Kopeć).
> AuthPage dodany w PR #7 (Michał Kalinowski).

---

## 5. Architektura frontendu (React prototype)

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

## 6. Schemat bazy danych (v2)

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

## 7. User Stories (18 łącznie)

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

## 8. Kluczowe endpointy API (wynikające z user stories)

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

## 9. Ważne decyzje architektoniczne

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

## 10. Stan implementacji (maj 2026)

### Gotowe (frontend prototype — MOCKUP)
> **WAŻNE:** Obecny frontend to mockup pokazowy dla prowadzącego — pokazuje jak ma wyglądać aplikacja. Będzie wymagał przepisania przy właściwej implementacji.

- [x] Landing page (bez logowania — osobna strona auth)
- [x] **AuthPage** (`AuthPage.jsx`) — strona logowania/rejestracji (PR #7, Michał):
  - tryb `login` (email + hasło) i `register` (imię, nazwisko, email, telefon, tablica, hasło)
  - przycisk Google OAuth (mock)
  - walidacja formularzy, komunikaty błędów
- [x] Nav z zakładkami (strona główna / zarezerwuj / moje rezerwacje / kontakt)
- [x] 3-krokowy wizard rezerwacji (wybór parkingu, szczegóły, płatność BLIK/karta/GPay)
- [x] Lista rezerwacji z anulowaniem
- [x] Mapa parkingów (Leaflet + dark tiles) — osobna zakładka (do usunięcia wg planu)
- [x] Panel właściciela (wykresy, mapa miejsc, sterowanie szlabanem)
- [x] Wizard dołączania z parkingiem (4 kroki)
- [x] Strona kontaktowa z FAQ

### Backend — struktura (PR #5, Stanisław Kopeć)
> Wszystkie pliki to **szkielety** — klasy/interfejsy z właściwymi adnotacjami, ale bez logiki biznesowej.

- [x] Pełna struktura pakietów: `controller / service / repository / model / dto / enums`
- [x] `application.properties` — datasource PostgreSQL skonfigurowane:
  ```
  url:      jdbc:postgresql://localhost:5432/db
  username: admin
  password: admin
  ddl-auto: update
  show-sql: true
  ```
- [x] Wszystkie **model** (JPA `@Entity`):
  - `Customer` — na razie tylko `id, name, email` (uproszczone, do rozbudowy)
  - `Reservation` — `id, startTime, endTime, @Version version` (optimistic locking działa)
  - `Vehicle, ParkingLot, PricingPlan, ParkingSession, PlateRecognitionEvent`
  - `BarrierGate, BarrierAction, Payment, AdminUser, IncidentReport`
- [x] Wszystkie **repository** (puste interfejsy `extends JpaRepository`)
- [x] Wszystkie **service** (puste klasy `@Service`)
- [x] Wszystkie **controller** (puste klasy `@RestController` z `@RequestMapping`)
- [x] Wszystkie **dto** (puste klasy)
- [x] Wszystkie **enums** (`ReservationStatus, ParkingSessionStatus, PaymentMethod` itd.)

### Backend — logika rezerwacji (Codex, maj 2026)
- [x] `POST /api/reservations` tworzy rezerwację `PENDING`
- [x] `ReservationService.createReservation()` sprawdza klienta, pojazd, parking, aktywny cennik i dostępność miejsc online
- [x] Rezerwacja dostaje 12-znakowy `reservationCode`, `priceEstimated`, `reservedAt`, `expiresAt` oraz `@Version`
- [x] Uzupełniono encje i repozytoria potrzebne do przepływu: `Customer`, `Vehicle`, `ParkingLot`, `PricingPlan`, `Reservation`
- [x] `DataInitializer` dodaje przy starcie testowego klienta, pojazd, 5 warszawskich parkingów i aktywne cenniki, jeśli baza jest pusta

### Poprawki rezerwacji (Codex, czerwiec 2026)
- [x] Anulowanie rezerwacji w `Reservations.jsx` wymaga potwierdzenia w modalu, żeby uniknąć missclicków
- [x] Frontend liczy cenę tym samym modelem co backend: minuty / 60, zaokrąglenie do 0.01h w górę, następnie kwota do 2 miejsc
- [x] Minimalny czas rezerwacji to 30 minut; walidacja jest w UI, `ReservationService` i endpointzie wyceny `PricingService`
- [x] Formularz rezerwacji zapisuje draft w `sessionStorage` na czas sesji użytkownika i czyści go po udanej rezerwacji

### Do zrobienia (backend — wypełnienie logiki)
- [ ] Rozbudowa entity `Customer` o pełne pola wg schematu DB (googleSub, firstName, lastName, phone, status, itp.)
- [ ] Rozbudowa pozostałych encji o pełne pola + relacje JPA (`@ManyToOne`, `@OneToMany`)
- [ ] Metody w repositories (custom queries)
- [ ] Logika w services
- [ ] Endpointy w controllers
- [ ] Google OAuth2 + JWT auth
- [ ] PostgreSQL schema migration (Flyway/Liquibase)
- [ ] OCR serwis (Python/FastAPI + OpenCV/EasyOCR)
- [ ] Płatności (BLIK, karta, gotówka — provider)
- [ ] Email z kodem rezerwacji (12 znaków)
- [ ] Panel admina (/admin — osobna ścieżka, email+bcrypt)
- [ ] Overtime detection + powiadomienia
- [ ] Walk-in flow

---

## 11. Lista zmian do wprowadzenia w UI (zaplanowane)

### Strona przed zalogowaniem (Landing)
- [ ] Usunąć sekcję "Punkty lojalnościowe" z features
- [ ] Zmienić "Mam parking" → "Dołącz z parkingiem" i przenieść wyżej (zamiast przycisku w prawym górnym rogu)
- [ ] Podstrona przed logowaniem = landing/marketing; dashboard dopiero po zalogowaniu
- [ ] Zaimplementować prawdziwe logowanie Google OAuth2 (zamiast mockowego `setUser`)

### Strona główna po zalogowaniu (HomePage)
- [ ] Usunąć kartę "Automatyczny wjazd"
- [ ] Usunąć kartę "Program lojalnościowy"

### Strona Zarezerwuj (ReservePage)
- [ ] Dodać wyszukiwarkę parkingów (po nazwie / mieście)
- [ ] Wbudować mapę parkingów bezpośrednio w tę stronę
- [ ] Usunąć osobną zakładkę "Mapa parkingów" z nawigacji

### Menu użytkownika (Nav — user pill)
- [ ] Dodać pozycję "Dodaj pojazd" obok "Ustawienia" i "Wyloguj się"

### Rezerwacja
- [ ] Możliwość wyboru pojazdu już zapisanego w koncie (zamiast tylko ręcznego wpisywania tablicy)

### Panel admina / właściciela (Dashboard + JoinPage)
- [ ] Przy dodawaniu parkingu: usunąć "Podgląd miejsc" (wizualną siatkę)
- [ ] Liczbę miejsc przenieść do sekcji danych (nie osobny krok)
- [ ] Dodać podział: ile miejsc na rezerwacje przez apkę vs. ile "z drogi" (walk-in)
- [ ] W dashboardzie: usunąć "Punkty lojalnościowe" ze statystyk
- [ ] Zmienić "Zajętość" na lepsze określenie (np. "Obłożenie")
- [ ] Usunąć mapę miejsc (wizualną siatkę spotów)
- [ ] Zmienić "Konserwacja miejsc" → "Zmień podział miejsc" (rezerwacje z apki / walk-in)

---

## 12. Zasady płatności i wymagania prawne

- **Gotówka jest obowiązkowa** — wymóg prawny, parkomat musi akceptować gotówkę
- **Faktury** — użytkownicy mają prawo żądać faktury za parkowanie
- Metody płatności: BLIK, karta (terminal), gotówka (parkomat), przelew
- Płatność z góry dla rezerwacji online; przy wyjeździe dla walk-in i overtime

---

## 13. Wymagania projektowe / zaliczeniowe

- **Design:** propozycja interfejsu, kilka screenów, dokumentacja decyzji projektowych (co i dlaczego wybraliśmy)
- **Okrojona funkcjonalność na zaliczenie:** 1–2 rzeczy działające end-to-end, np.:
  - Encje i relacje w bazie (JPA entities + migracja)
  - Podstawowe tworzenie użytkowników (rejestracja/logowanie)
- Pełna funkcjonalność (OCR, szlaban, płatności) — docelowo, nie wymóg zaliczenia

---

## 14. Architektura backendu Java (Spring Boot)

Źródło: diagram UML PlantUML `parkuj_my_full`.

### Warstwy aplikacji
```
Controller → Service → Repository → Model (Entity)
                ↕
               DTO  (konwersja entity ↔ JSON)
```

### Package structure

```
com.parkujmy/
├── controller/
│   ├── AuthController
│   ├── CustomerController
│   ├── VehicleController
│   ├── ParkingLotController
│   ├── ReservationController
│   ├── PaymentController
│   ├── BarrierController          ← odbiera zdarzenia OCR z Python serwisu
│   └── AdminController
├── service/
│   ├── CustomerService
│   ├── VehicleService
│   ├── ParkingLotService
│   ├── PricingService
│   ├── ReservationService
│   ├── ParkingSessionService
│   ├── PaymentService
│   ├── BarrierService
│   ├── EmailService
│   └── OcrEventService
├── repository/                    ← Spring Data JPA interfaces
│   ├── CustomerRepository
│   ├── VehicleRepository
│   ├── ParkingLotRepository
│   ├── PricingPlanRepository
│   ├── ReservationRepository
│   ├── ParkingSessionRepository
│   ├── PlateRecognitionEventRepository
│   ├── BarrierGateRepository
│   ├── BarrierActionRepository
│   ├── PaymentRepository
│   ├── AdminUserRepository
│   └── IncidentReportRepository
├── model/                         ← JPA entities
│   ├── Customer
│   ├── Vehicle
│   ├── ParkingLot
│   ├── PricingPlan
│   ├── Reservation                ← @Version dla optimistic locking
│   ├── ParkingSession
│   ├── PlateRecognitionEvent
│   ├── BarrierGate
│   ├── BarrierAction
│   ├── Payment
│   ├── AdminUser
│   └── IncidentReport
├── dto/
│   ├── CustomerDTO
│   ├── VehicleDTO
│   ├── ParkingLotDTO
│   ├── AvailabilityDTO
│   ├── PriceEstimateDTO
│   ├── ReservationRequestDTO
│   ├── ReservationResponseDTO
│   ├── PlateEventDTO              ← przychodzi z Python OCR
│   ├── BarrierOpenRequestDTO      ← kod rezerwacji + gateId
│   ├── SessionDTO
│   └── PaymentDTO
└── enums/
    ├── ReservationStatus
    ├── ParkingSessionStatus
    ├── PaymentMethod
    ├── PaymentStatus
    ├── BarrierActionType
    ├── BarrierDirection
    ├── PlateRecognitionResult
    └── AdminRole
```

### Controllers — endpointy

#### `AuthController`
```java
POST /api/auth/google              // googleCallback(token) → TokenDTO
```

#### `CustomerController`
```java
GET  /api/customers/me             // getMe() → CustomerDTO
PUT  /api/customers/me             // updateMe(dto) → CustomerDTO
```

#### `VehicleController`
```java
GET    /api/vehicles               // getVehicles() → List<VehicleDTO>
POST   /api/vehicles               // addVehicle(dto) → VehicleDTO
DELETE /api/vehicles/{vehicleId}   // deleteVehicle()
PATCH  /api/vehicles/{vehicleId}/primary  // setPrimary() → VehicleDTO
```

#### `ParkingLotController`
```java
GET /api/parkings                  // getAllParkingLots() → List<ParkingLotDTO>
GET /api/parkings/{id}             // getParkingLot() → ParkingLotDTO
GET /api/parkings/{id}/availability?from=&to=   // → AvailabilityDTO
GET /api/parkings/{id}/price?from=&to=          // → PriceEstimateDTO
```

#### `ReservationController`
```java
POST   /api/reservations                     // createReservation(dto) → ReservationResponseDTO
POST   /api/reservations/{id}/confirm        // confirmReservation(id, ref)
DELETE /api/reservations/{id}                // cancelReservation()
GET    /api/reservations                     // getMyReservations()
POST   /api/reservations/open-barrier        // openBarrierWithCode(BarrierOpenRequestDTO)
```

#### `PaymentController`
```java
POST /api/payments/session/{sessionId}       // payForSession(method) → PaymentDTO
POST /api/payments/webhook                   // handleWebhook(payload)
```

#### `BarrierController` (wewnętrzny, dla Python OCR)
```java
POST /api/barriers/plate-event               // handlePlateEvent(PlateEventDTO)
```

#### `AdminController`
```java
GET  /admin/api/sessions/active              // getActiveSessions() → List<SessionDTO>
POST /admin/api/barriers/{gateId}/open       // forceOpenBarrier(reason)
POST /admin/api/incidents                    // createIncident(dto)
```

### Services — kluczowe metody

#### `CustomerService`
```java
getOrCreateCustomer(googleSub, email)        // Google OAuth → upsert customer
getCustomerById(id)
updateCustomer(id, dto)
```

#### `VehicleService`
```java
getVehiclesForCustomer(customerId)
addVehicle(customerId, dto)
deleteVehicle(customerId, vehicleId)         // sprawdza brak aktywnej rezerwacji
setPrimary(customerId, vehicleId)            // resetuje is_primary dla pozostałych
```

#### `ParkingLotService`
```java
getAllParkingLots()                           // status = ACTIVE
getParkingLotById(id)
checkAvailability(id, from, to)              // → AvailabilityDTO
```

#### `PricingService`
```java
calculatePrice(lotId, from, to)              // → PriceEstimateDTO
getActivePlan(lotId)                         // pricing_plan gdzie valid_to IS NULL
```

#### `ReservationService`
```java
createReservation(customerId, dto)           // status=PENDING, generuje reservation_code
confirmReservation(reservationId, ref)       // status=CONFIRMED po płatności
cancelReservation(customerId, reservationId) // PENDING/CONFIRMED → CANCELLED + refund
getReservationsForCustomer(customerId)
openBarrierWithCode(code, gateId)            // weryfikacja kodu fallback OCR
expireStaleReservations()                    // scheduler @Scheduled
```

#### `ParkingSessionService`
```java
handleEntry(plate, gateId)                   // wjazd: szuka rezerwacji → ACTIVE, tworzy session
handleExit(plate, gateId)                    // wyjazd: kończy session, sprawdza overtime
getSessionByPlate(plate)                     // publiczny — dla walk-in app/parkomat
isOvertimeOnExit(session)
calculateOvertimeAmount(session)
```

#### `PaymentService`
```java
createPaymentForReservation(reservationId, method)   // płatność z góry
payForSession(sessionId, method)                      // walk-in / overtime
handleProviderWebhook(reference)                      // callback od brokera płatności
refundPayment(paymentId)                              // zwrot przy anulowaniu
```

#### `BarrierService`
```java
openBarrier(gateId, reason)
closeBarrier(gateId)
forceOpenBarrier(gateId, adminId, reason)    // zapisuje BarrierAction FORCE_OPEN
```

#### `OcrEventService`
```java
processPlateEvent(dto)                       // przetwarza zdarzenie z Python OCR
isConfidenceAcceptable(confidence)           // sprawdza próg pewności
```

### DTOs — kluczowe pola

| DTO | Zastosowanie |
|-----|-------------|
| `PlateEventDTO` | Przychodzi z Python FastAPI: plateNumber, confidence, gateId, direction, imageUrl |
| `BarrierOpenRequestDTO` | Klient otwiera kodem: reservationCode + gateId |
| `ReservationRequestDTO` | Tworzenie rezerwacji: lotId, vehicleId/plateNumber, startAt, endAt |
| `ReservationResponseDTO` | Odpowiedź z kodem 12-znakowym |
| `AvailabilityDTO` | available, totalSpots, occupiedSpots, availableSpots |
| `PriceEstimateDTO` | hours, pricePerHour, totalPrice, currency |
| `SessionDTO` | sessionId, entryPlate, entryAt, status, parkingLotName |

### Relacje między encjami (model)
```
Customer 1──* Vehicle
Customer 1──* Reservation
Vehicle  1──* Reservation
Vehicle  1──* ParkingSession
ParkingLot 1──* PricingPlan
ParkingLot 1──* Reservation
ParkingLot 1──* BarrierGate
PricingPlan 1──* Reservation
Reservation 1──0..1 ParkingSession
Reservation 1──0..1 Payment
ParkingSession 0..1──0..1 Payment       (walk-in: brak reservation)
ParkingSession 1──* PlateRecognitionEvent
ParkingSession 1──* BarrierAction
BarrierGate 1──* PlateRecognitionEvent
BarrierGate 1──* BarrierAction
AdminUser 1──* IncidentReport
```

### Zależności między serwisami
```
ReservationService → PricingService, EmailService
ParkingSessionService → BarrierService
OcrEventService → ParkingSessionService
PaymentService → ParkingSessionRepository
VehicleService → CustomerRepository (cross-check)
ParkingLotService → PricingPlanRepository
```

---

## 15. Konwencje i notatki

- Wszystkie kwoty w PLN (decimal 10,2)
- Czas w UTC (timestamp), wyświetlanie konwertowane na strefę klienta
- plate_number przechowywany uppercase bez spacji
- country_code ISO 3166-1 alpha-3 (domyślnie "POL")
- Punkty lojalnościowe: 0.2 pkt / 1 zł, 100 pkt = 1h darmowego parkowania
- Klient może mieć wiele pojazdów, jeden oznaczony jako primary
- Admini nie mają Google OAuth — osobna tabela admin_user z password_hash

## 16. Decyzje organizacyjne i infrastruktura

### Git workflow
- Wszyscy 4 członkowie zespołu jako collaboratorzy na `wokapala/parkuj.my`
- Pushowanie bezpośrednio (bez forka) — projekt zamknięty, zespół się zna
- Docelowo każdy na własnym branchu (`imie/feature`) + PR do main gdy feature gotowy
- Na razie (faza budowania backendu) bez wymuszania branch-per-feature

### Docker — kiedy wdrożyć
- **Teraz: za wcześnie** — backend jeszcze nie działa, frontend to mockup
- **Docker ma sens gdy:**
  - Backend ma działające endpointy + bazę + auth
  - Frontend przepisany i połączony z backendem
  - Integracja wszystkich serwisów (Java + PostgreSQL + Python OCR)
- **Docelowy `docker-compose.yml`** będzie miał 3 serwisy: java app, postgres, python-ocr
- **Na razie:** backend lokalnie (`mvnw spring-boot:run`), PostgreSQL lokalnie lub Supabase/Railway, frontend lokalnie (`npm run dev`)
