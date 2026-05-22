# parkuj.my

System rezerwacji miejsc parkingowych online. Repo zawiera frontend React/Vite,
backend Spring Boot oraz lokalny PostgreSQL uruchamiany przez Docker Compose.

## Wymagania

- Docker Desktop
- Java 17 lub nowsza
- Node.js i npm

## Szybkie uruchomienie

Z glownego folderu projektu:

```cmd
.\run-dev.cmd
```

Skrypt:
- uruchamia PostgreSQL przez Docker Compose,
- czeka az baza bedzie dostepna na `localhost:5432`,
- uruchamia frontend, jesli nie dziala na `localhost:5173`,
- restartuje backend Java na `localhost:8080`, zeby dzialal aktualny kod,
- otwiera frontend i Swagger UI w domyslnej przegladarce.

Po zmianach w backendzie uruchom `.\run-dev.cmd` ponownie. Skrypt zatrzyma
poprzedni proces Java na porcie `8080` i odpali Spring Boot jeszcze raz, dzieki
czemu Swagger nie bedzie pokazywal starej wersji API.

Adresy:

- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- API docs JSON: http://localhost:8080/v3/api-docs
- Healthcheck: http://localhost:8080/api/health

## Baza danych

Domyslna konfiguracja backendu:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/db
spring.datasource.username=admin
spring.datasource.password=admin
```

PostgreSQL z Dockera:

```cmd
docker compose up -d postgres
```

Zatrzymanie kontenerow:

```cmd
docker compose down
```

Wyczyszczenie danych bazy lokalnej:

```cmd
docker compose down -v
```

## Backend

Ręczne uruchomienie backendu:

```cmd
cd backend
.\mvnw.cmd spring-boot:run
```

Testy:

```cmd
cd backend
.\mvnw.cmd test
```

## Frontend

Ręczne uruchomienie frontendu:

```cmd
cd frontend
npm run dev
```

Obecny frontend jest jeszcze mockupem i nie korzysta z backendu bezposrednio.
