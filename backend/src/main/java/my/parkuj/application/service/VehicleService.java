package my.parkuj.application.service;

import java.util.List;
import java.util.Locale;
import my.parkuj.application.dto.VehicleDTO;
import my.parkuj.application.enums.ReservationStatus;
import my.parkuj.application.model.Customer;
import my.parkuj.application.model.Vehicle;
import my.parkuj.application.repository.CustomerRepository;
import my.parkuj.application.repository.ReservationRepository;
import my.parkuj.application.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VehicleService {

    private static final List<ReservationStatus> ACTIVE_RESERVATION_STATUSES = List.of(
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED,
        ReservationStatus.ACTIVE
    );

    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final ReservationRepository reservationRepository;

    public VehicleService(
        CustomerRepository customerRepository,
        VehicleRepository vehicleRepository,
        ReservationRepository reservationRepository
    ) {
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.reservationRepository = reservationRepository;
    }

    public List<VehicleDTO> getVehiclesForCustomer(Integer customerId) {
        ensureCustomerExists(customerId);
        return vehicleRepository.findByCustomerCustomerIdOrderByPrimaryVehicleDescPlateNumberAsc(customerId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public VehicleDTO addVehicle(VehicleDTO request) {
        validateCreateRequest(request);
        Customer customer = ensureCustomerExists(request.getCustomerId());
        String plateNumber = normalizePlateNumber(request.getPlateNumber());
        String countryCode = normalizeCountryCode(request.getCountryCode());

        if (vehicleRepository.existsByPlateNumberAndCountryCode(plateNumber, countryCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Pojazd z taką tablicą i krajem już istnieje.");
        }

        boolean shouldBePrimary = request.isPrimaryVehicle()
            || vehicleRepository.findByCustomerCustomerIdOrderByPrimaryVehicleDescPlateNumberAsc(customer.getCustomerId()).isEmpty();

        if (shouldBePrimary) {
            clearPrimaryVehicle(customer.getCustomerId());
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setCustomer(customer);
        vehicle.setPlateNumber(plateNumber);
        vehicle.setCountryCode(countryCode);
        vehicle.setPrimaryVehicle(shouldBePrimary);
        if (request.getName() != null && !request.getName().isBlank()) {
            vehicle.setName(request.getName().trim());
        }
        return toDto(vehicleRepository.save(vehicle));
    }

    @Transactional
    public VehicleDTO setPrimaryVehicle(Integer customerId, Integer vehicleId) {
        ensureCustomerExists(customerId);
        Vehicle vehicle = findVehicleForCustomer(vehicleId, customerId);
        clearPrimaryVehicle(customerId);
        vehicle.setPrimaryVehicle(true);
        return toDto(vehicleRepository.save(vehicle));
    }

    @Transactional
    public void deleteVehicle(Integer customerId, Integer vehicleId) {
        ensureCustomerExists(customerId);
        Vehicle vehicle = findVehicleForCustomer(vehicleId, customerId);

        if (hasActiveReservation(vehicleId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nie można usunąć pojazdu z aktywną rezerwacją.");
        }
        // FK reservation.vehicle_id jest NOT NULL — bez sprawdzenia historycznych rezerwacji
        // ConstraintViolation rozwaliłby endpoint 500-tką.
        if (reservationRepository.existsByVehicleVehicleId(vehicleId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Pojazd ma rezerwacje w historii — nie można go usunąć. Możesz zarejestrować nowy pojazd.");
        }

        boolean wasPrimary = vehicle.isPrimaryVehicle();
        vehicleRepository.delete(vehicle);

        if (wasPrimary) {
            vehicleRepository.findByCustomerCustomerIdOrderByPrimaryVehicleDescPlateNumberAsc(customerId)
                .stream()
                .findFirst()
                .ifPresent(nextVehicle -> {
                    nextVehicle.setPrimaryVehicle(true);
                    vehicleRepository.save(nextVehicle);
                });
        }
    }

    private Customer ensureCustomerExists(Integer customerId) {
        if (customerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak identyfikatora klienta.");
        }
        return customerRepository.findById(customerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono klienta."));
    }

    private Vehicle findVehicleForCustomer(Integer vehicleId, Integer customerId) {
        if (vehicleId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak identyfikatora pojazdu.");
        }
        return vehicleRepository.findByVehicleIdAndCustomerCustomerId(vehicleId, customerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono pojazdu klienta."));
    }

    private void validateCreateRequest(VehicleDTO request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak danych pojazdu.");
        }
        if (request.getPlateNumber() == null || request.getPlateNumber().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj numer rejestracyjny.");
        }
    }

    private void clearPrimaryVehicle(Integer customerId) {
        vehicleRepository.findByCustomerCustomerIdOrderByPrimaryVehicleDescPlateNumberAsc(customerId)
            .forEach(vehicle -> {
                if (vehicle.isPrimaryVehicle()) {
                    vehicle.setPrimaryVehicle(false);
                    vehicleRepository.save(vehicle);
                }
            });
    }

    private VehicleDTO toDto(Vehicle vehicle) {
        VehicleDTO dto = new VehicleDTO();
        dto.setId(vehicle.getVehicleId());
        dto.setCustomerId(vehicle.getCustomer().getCustomerId());
        dto.setName(vehicle.getName() != null && !vehicle.getName().isBlank()
            ? vehicle.getName()
            : vehicle.getPlateNumber());
        dto.setPlateNumber(vehicle.getPlateNumber());
        dto.setCountryCode(vehicle.getCountryCode());
        dto.setPrimaryVehicle(vehicle.isPrimaryVehicle());
        dto.setHasActiveReservation(hasActiveReservation(vehicle.getVehicleId()));
        return dto;
    }

    private boolean hasActiveReservation(Integer vehicleId) {
        return reservationRepository.existsByVehicleVehicleIdAndStatusIn(vehicleId, ACTIVE_RESERVATION_STATUSES);
    }

    private String normalizePlateNumber(String plateNumber) {
        return plateNumber.trim().replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
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

