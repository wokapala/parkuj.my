package my.parkuj.application.controller;

import my.parkuj.application.dto.CustomerDTO;
import my.parkuj.application.dto.LoginRequestDTO;
import my.parkuj.application.dto.RegisterRequestDTO;
import my.parkuj.application.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Rejestracja email + hasło. Zapisuje klienta (i opcjonalnie pojazd główny) do bazy.
    @PostMapping("/register")
    public ResponseEntity<CustomerDTO> register(@RequestBody RegisterRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    // Logowanie email + hasło. Zwraca CustomerDTO (frontend trzyma w localStorage)
    // albo 401 jeśli email/hasło są nieprawidłowe.
    @PostMapping("/login")
    public CustomerDTO login(@RequestBody LoginRequestDTO request) {
        return authService.login(request);
    }

    // Reset hasła — mock: loguje request do konsoli, nie wysyła emaila.
    // Zawsze zwraca 200 żeby nie ujawniać czy email istnieje w systemie.
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestParam String email) {
        System.out.println("[AUTH] Password reset requested for: " + email);
        return ResponseEntity.ok().build();
    }
}
