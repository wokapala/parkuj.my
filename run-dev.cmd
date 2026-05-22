@echo off
setlocal

set "ROOT=%~dp0"

if not exist "%ROOT%frontend\package.json" (
  echo Nie znaleziono frontend\package.json.
  exit /b 1
)

if not exist "%ROOT%backend\mvnw.cmd" (
  echo Nie znaleziono backend\mvnw.cmd.
  exit /b 1
)

echo Uruchamiam frontend i backend parkuj.my...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8080
echo Swagger:  http://localhost:8080/swagger-ui/index.html
echo.

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker nie jest dostepny w PATH. Pomijam automatyczne uruchomienie PostgreSQL.
) else (
  echo Uruchamiam PostgreSQL z Docker Compose...
  docker compose -f "%ROOT%docker-compose.yml" up -d postgres
)

echo Czekam na PostgreSQL na localhost:5432...
for /l %%i in (1,1,20) do (
  powershell -NoProfile -Command "if (Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet) { exit 0 } else { exit 1 }" >nul 2>nul
  if not errorlevel 1 goto postgres_ready
  timeout /t 2 /nobreak >nul
)

powershell -NoProfile -Command "if (Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet) { exit 0 } else { exit 1 }" >nul 2>nul
if errorlevel 1 (
  echo Uwaga: PostgreSQL nie odpowiada na localhost:5432.
  echo Backend wymaga bazy: jdbc:postgresql://localhost:5432/db, user admin, haslo admin.
  echo.
)
goto start_apps

:postgres_ready
echo PostgreSQL jest gotowy.
echo.

:start_apps

powershell -NoProfile -Command "if (Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet) { exit 0 } else { exit 1 }" >nul 2>nul
if errorlevel 1 (
  start "parkuj.my frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"
) else (
  echo Frontend juz dziala na localhost:5173. Nie uruchamiam drugiej kopii.
)

echo Restartuje backend na localhost:8080, zeby dzialal aktualny kod...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$connections = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue; foreach ($connection in $connections) { $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue; if ($process -and $process.ProcessName -eq 'java') { Stop-Process -Id $process.Id -Force; Write-Host ('Zatrzymano stary backend Java, PID ' + $process.Id + '.'); } elseif ($process) { Write-Host ('Port 8080 jest zajety przez ' + $process.ProcessName + ' PID ' + $process.Id + '. Nie zamykam obcego procesu.'); exit 2; } }"
if errorlevel 2 (
  echo Nie moge uruchomic backendu, bo port 8080 jest zajety przez inny proces.
  echo Zamknij ten proces albo zmien port backendu.
  goto open_browser
)
timeout /t 2 /nobreak >nul
start "parkuj.my backend" cmd /k "cd /d ""%ROOT%backend"" && mvnw.cmd spring-boot:run"

:open_browser
start "parkuj.my browser" cmd /c "timeout /t 3 /nobreak >nul && start "" http://localhost:5173"
start "parkuj.my swagger" cmd /c "timeout /t 8 /nobreak >nul && start "" http://localhost:8080/swagger-ui/index.html"

endlocal
