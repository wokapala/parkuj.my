package my.parkuj.application.service;

import java.util.Locale;
import my.parkuj.application.dto.CustomerDTO;
import my.parkuj.application.dto.LoginRequestDTO;
import my.parkuj.application.dto.RegisterRequestDTO;
import my.parkuj.application.model.Customer;
import my.parkuj.application.model.Vehicle;
import my.parkuj.application.repository.CustomerRepository;
import my.parkuj.application.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final String EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(CustomerRepository customerRepository, VehicleRepository vehicleRepository) {
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional
    public CustomerDTO register(RegisterRequestDTO request) {
        validate(request);

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (customerRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Konto z tym adresem e-mail już istnieje.");
        }

        Customer customer = new Customer();
        customer.setFirstName(request.getFirstName().trim());
        customer.setLastName(request.getLastName().trim());
        customer.setEmail(email);
        customer.setPhone(isBlank(request.getPhone()) ? null : request.getPhone().trim());
        customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        customer.setStatus("ACTIVE");
        Customer saved = customerRepository.save(customer);

        if (request.getPlate() != null && !request.getPlate().isBlank()) {
            String plate = request.getPlate().trim().replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
            String countryCode = normalizeCountryCode(request.getCountryCode());
            if (vehicleRepository.existsByPlateNumberAndCountryCode(plate, countryCode)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Pojazd z tą tablicą jest już zarejestrowany w systemie. Załóż konto bez tablicy i skontaktuj się z obsługą.");
            }
            Vehicle vehicle = new Vehicle();
            vehicle.setCustomer(saved);
            vehicle.setPlateNumber(plate);
            vehicle.setCountryCode(countryCode);
            vehicle.setPrimaryVehicle(true);
            vehicleRepository.save(vehicle);
        }

        return CustomerDTO.fromEntity(saved);
    }

    public CustomerDTO login(LoginRequestDTO request) {
        if (request == null || isBlank(request.getEmail()) || isBlank(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj e-mail i hasło.");
        }

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        Customer customer = customerRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy e-mail lub hasło."));

        if (customer.getPasswordHash() == null || customer.getPasswordHash().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy e-mail lub hasło.");
        }

        if (!passwordEncoder.matches(request.getPassword(), customer.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy e-mail lub hasło.");
        }

        // Konto zbanowane przez SuperAdmina nie może się zalogować (US-A: ban realnie blokuje dostęp).
        if ("BANNED".equalsIgnoreCase(customer.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Konto zostało zablokowane. Skontaktuj się z obsługą parkuj.my.");
        }
        if ("INACTIVE".equalsIgnoreCase(customer.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Konto jest nieaktywne.");
        }

        return CustomerDTO.fromEntity(customer);
    }

    private void validate(RegisterRequestDTO request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak danych rejestracji.");
        }
        if (isBlank(request.getFirstName()) || isBlank(request.getLastName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj imię i nazwisko.");
        }
        if (isBlank(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj adres e-mail.");
        }
        String email = request.getEmail().trim();
        if (!email.matches(EMAIL_PATTERN)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj poprawny adres e-mail.");
        }
        if (isBlank(request.getPassword()) || request.getPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hasło musi mieć co najmniej 6 znaków.");
        }
        if (!isBlank(request.getPlate())) {
            String plate = request.getPlate().trim().replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
            if (!plate.matches("[A-Z0-9]{2,10}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nieprawidłowy numer rejestracyjny. Dozwolone: 2–10 znaków alfanumerycznych.");
            }
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String normalizeCountryCode(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return "POL";
        }
        String normalized = countryCode.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "PL" -> "POL";
            case "DE" -> "DEU";
            case "CZ" -> "CZE";
            case "SK" -> "SVK";
            case "UA" -> "UKR";
            default -> normalized;
        };
    }
}
