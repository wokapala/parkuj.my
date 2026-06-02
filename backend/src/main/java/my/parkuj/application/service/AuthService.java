package my.parkuj.application.service;

import java.util.Locale;
import my.parkuj.application.dto.CustomerDTO;
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
        customer.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        customer.setStatus("ACTIVE");
        Customer saved = customerRepository.save(customer);

        // Jeśli podano tablicę — utwórz pojazd główny (jeśli nie zajęty przez kogoś innego).
        if (request.getPlate() != null && !request.getPlate().isBlank()) {
            String plate = request.getPlate().trim().replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
            String countryCode = normalizeCountryCode(request.getCountryCode());
            if (!vehicleRepository.existsByPlateNumberAndCountryCode(plate, countryCode)) {
                Vehicle vehicle = new Vehicle();
                vehicle.setCustomer(saved);
                vehicle.setPlateNumber(plate);
                vehicle.setCountryCode(countryCode);
                vehicle.setPrimaryVehicle(true);
                vehicleRepository.save(vehicle);
            }
        }

        return CustomerDTO.fromEntity(saved);
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
        if (isBlank(request.getPassword()) || request.getPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hasło musi mieć co najmniej 6 znaków.");
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
