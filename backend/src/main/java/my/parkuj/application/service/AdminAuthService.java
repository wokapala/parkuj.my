package my.parkuj.application.service;

import java.util.Locale;
import my.parkuj.application.dto.AdminUserDTO;
import my.parkuj.application.dto.LoginRequestDTO;
import my.parkuj.application.model.AdminUser;
import my.parkuj.application.repository.AdminUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminAuthService(AdminUserRepository adminUserRepository) {
        this.adminUserRepository = adminUserRepository;
    }

    // Login admina — analogicznie do AuthService.login dla klientów, ale na tabeli admin_users.
    public AdminUserDTO login(LoginRequestDTO request) {
        if (request == null || isBlank(request.getEmail()) || isBlank(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj e-mail i hasło.");
        }
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        AdminUser admin = adminUserRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy e-mail lub hasło administratora."));

        if (admin.getPasswordHash() == null || admin.getPasswordHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy e-mail lub hasło administratora.");
        }
        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy e-mail lub hasło administratora.");
        }
        if ("INACTIVE".equalsIgnoreCase(admin.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Konto administratora jest nieaktywne.");
        }

        return AdminUserDTO.fromEntity(admin);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
