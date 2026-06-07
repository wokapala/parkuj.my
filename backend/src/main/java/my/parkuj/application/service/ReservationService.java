package my.parkuj.application.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import my.parkuj.application.dto.ReservationRequestDTO;
import my.parkuj.application.dto.ReservationResponseDTO;
import my.parkuj.application.enums.PaymentMethod;
import my.parkuj.application.enums.PaymentStatus;
import my.parkuj.application.enums.ReservationStatus;
import my.parkuj.application.model.Customer;
import my.parkuj.application.model.ParkingLot;
import my.parkuj.application.model.Payment;
import my.parkuj.application.model.PricingPlan;
import my.parkuj.application.model.Reservation;
import my.parkuj.application.model.Vehicle;
import my.parkuj.application.repository.CustomerRepository;
import my.parkuj.application.repository.ParkingLotRepository;
import my.parkuj.application.repository.PaymentRepository;
import my.parkuj.application.repository.PricingPlanRepository;
import my.parkuj.application.repository.ReservationRepository;
import my.parkuj.application.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReservationService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 12;
    private static final List<ReservationStatus> BLOCKING_STATUSES = List.of(
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED,
        ReservationStatus.ACTIVE
    );

    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final PricingPlanRepository pricingPlanRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public ReservationService(
        CustomerRepository customerRepository,
        VehicleRepository vehicleRepository,
        ParkingLotRepository parkingLotRepository,
        PricingPlanRepository pricingPlanRepository,
        ReservationRepository reservationRepository,
        PaymentRepository paymentRepository
    ) {
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.parkingLotRepository = parkingLotRepository;
        this.pricingPlanRepository = pricingPlanRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public ReservationResponseDTO createReservation(ReservationRequestDTO request) {
        validateRequest(request);

        Customer customer = customerRepository.findById(request.getCustomerId())
            .orElseThrow(() -> notFound("Nie znaleziono klienta."));

        Vehicle vehicle = vehicleRepository
            .findByVehicleIdAndCustomerCustomerId(request.getVehicleId(), request.getCustomerId())
            .orElseThrow(() -> notFound("Nie znaleziono pojazdu przypisanego do tego klienta."));

        ParkingLot parkingLot = parkingLotRepository.findById(request.getParkingLotId())
            .orElseThrow(() -> notFound("Nie znaleziono parkingu."));

        if (!"ACTIVE".equalsIgnoreCase(parkingLot.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parking nie przyjmuje obecnie rezerwacji.");
        }

        PricingPlan pricingPlan = pricingPlanRepository
            .findFirstByParkingLotParkingLotIdAndValidToIsNullOrderByValidFromDesc(parkingLot.getParkingLotId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parking nie ma aktywnego cennika."));

        ensureReservablePlaceAvailable(parkingLot, request.getStartAt(), request.getEndAt());

        LocalDateTime now = LocalDateTime.now();
        Reservation reservation = new Reservation();
        reservation.setCustomer(customer);
        reservation.setVehicle(vehicle);
        reservation.setParkingLot(parkingLot);
        reservation.setPricingPlan(pricingPlan);
        reservation.setReservationCode(generateUniqueReservationCode());
        reservation.setStartAt(request.getStartAt());
        reservation.setEndAt(request.getEndAt());
        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setPriceEstimated(calculatePrice(pricingPlan, request.getStartAt(), request.getEndAt()));
        reservation.setReservedAt(now);
        reservation.setExpiresAt(now.plusMinutes(15));

        return toResponse(reservationRepository.save(reservation));
    }

    public List<ReservationResponseDTO> getReservationsForCustomer(Integer customerId) {
        ensureCustomerExists(customerId);
        return reservationRepository.findByCustomerCustomerIdOrderByReservedAtDesc(customerId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // Dla panelu admina — wszystkie rezerwacje w systemie (najnowsze pierwsze).
    public List<ReservationResponseDTO> getAllReservations() {
        return reservationRepository.findAll().stream()
            .sorted((a, b) -> {
                if (a.getReservedAt() == null) return 1;
                if (b.getReservedAt() == null) return -1;
                return b.getReservedAt().compareTo(a.getReservedAt());
            })
            .map(this::toResponse)
            .toList();
    }

    public ReservationResponseDTO getReservation(Integer customerId, Integer reservationId) {
        ensureCustomerExists(customerId);
        Reservation reservation = reservationRepository.findById(reservationId)
            .filter(item -> item.getCustomer().getCustomerId().equals(customerId))
            .orElseThrow(() -> notFound("Nie znaleziono rezerwacji klienta."));

        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponseDTO confirmReservation(Integer reservationId, String providerReference, String paymentMethod) {
        Reservation reservation = findReservation(reservationId);
        expireIfStale(reservation);

        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            return toResponse(reservation);
        }

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Można potwierdzić tylko rezerwację oczekującą.");
        }

        reservation.setStatus(ReservationStatus.CONFIRMED);
        Reservation saved = reservationRepository.save(reservation);

        // Zapis "płatności" — w mockupie nie wołamy bramki płatności,
        // ale zostawiamy ślad w tabeli payments żeby panel admina i przyszły
        // refund/raport miał spójne dane.
        Payment payment = new Payment();
        payment.setReservation(saved);
        payment.setAmount(saved.getPriceEstimated() != null ? saved.getPriceEstimated() : BigDecimal.ZERO);
        payment.setCurrency(saved.getPricingPlan() != null ? saved.getPricingPlan().getCurrency() : "PLN");
        payment.setPaymentMethod(resolvePaymentMethod(paymentMethod));
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setProviderReference(providerReference);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        return toResponse(saved);
    }

    private PaymentMethod resolvePaymentMethod(String raw) {
        if (raw == null || raw.isBlank()) return PaymentMethod.BLIK;
        try {
            return PaymentMethod.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return PaymentMethod.BLIK;
        }
    }

    @Transactional
    public ReservationResponseDTO cancelReservation(Integer customerId, Integer reservationId) {
        ensureCustomerExists(customerId);
        Reservation reservation = reservationRepository.findById(reservationId)
            .filter(item -> item.getCustomer().getCustomerId().equals(customerId))
            .orElseThrow(() -> notFound("Nie znaleziono rezerwacji klienta."));

        expireIfStale(reservation);

        if (reservation.getStatus() != ReservationStatus.PENDING
            && reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Można anulować tylko rezerwację oczekującą lub potwierdzoną.");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation cancelled = reservationRepository.save(reservation);

        // Zwrot płatności jeśli opłacona (status COMPLETED → REFUNDED).
        paymentRepository.findByReservationReservationId(reservationId).forEach(p -> {
            if (p.getStatus() == PaymentStatus.COMPLETED) {
                p.setStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(p);
            }
        });

        return toResponse(cancelled);
    }

    private void validateRequest(ReservationRequestDTO request) {
        if (request == null) {
            throw badRequest("Brak danych rezerwacji.");
        }
        if (request.getCustomerId() == null) {
            throw badRequest("Brak identyfikatora klienta.");
        }
        if (request.getVehicleId() == null) {
            throw badRequest("Brak identyfikatora pojazdu.");
        }
        if (request.getParkingLotId() == null) {
            throw badRequest("Brak identyfikatora parkingu.");
        }
        if (request.getStartAt() == null || request.getEndAt() == null) {
            throw badRequest("Podaj datę rozpoczęcia i zakończenia rezerwacji.");
        }
        if (!request.getEndAt().isAfter(request.getStartAt())) {
            throw badRequest("Data zakończenia musi być późniejsza niż data rozpoczęcia.");
        }
        if (request.getStartAt().isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw badRequest("Nie można utworzyć rezerwacji w przeszłości.");
        }
    }

    private void ensureReservablePlaceAvailable(ParkingLot parkingLot, LocalDateTime startAt, LocalDateTime endAt) {
        int reservableCapacity = parkingLot.getReservablePlacesCount() != null
            ? parkingLot.getReservablePlacesCount()
            : 0;

        if (reservableCapacity <= 0) {
            throw badRequest("Ten parking nie udostępnia miejsc do rezerwacji online.");
        }

        long overlappingReservations = reservationRepository.countOverlappingReservations(
            parkingLot.getParkingLotId(),
            startAt,
            endAt,
            BLOCKING_STATUSES
        );

        if (overlappingReservations >= reservableCapacity) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Brak wolnych miejsc w wybranym terminie.");
        }
    }

    private BigDecimal calculatePrice(PricingPlan pricingPlan, LocalDateTime startAt, LocalDateTime endAt) {
        long minutes = Duration.between(startAt, endAt).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(minutes)
            .divide(BigDecimal.valueOf(60), 2, RoundingMode.CEILING);

        return pricingPlan.getPricePerHour()
            .multiply(hours)
            .setScale(2, RoundingMode.HALF_UP);
    }

    private String generateUniqueReservationCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = randomReservationCode();
            if (!reservationRepository.existsByReservationCode(code)) {
                return code;
            }
        }

        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nie udało się wygenerować kodu rezerwacji.");
    }

    private String randomReservationCode() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(CODE_ALPHABET.charAt(secureRandom.nextInt(CODE_ALPHABET.length())));
        }
        return code.toString();
    }

    private ReservationResponseDTO toResponse(Reservation reservation) {
        ReservationResponseDTO response = new ReservationResponseDTO();
        response.setReservationId(reservation.getReservationId());
        response.setCustomerId(reservation.getCustomer().getCustomerId());
        response.setVehicleId(reservation.getVehicle().getVehicleId());
        response.setReservationCode(reservation.getReservationCode());
        response.setStatus(reservation.getStatus());
        response.setParkingLotId(reservation.getParkingLot().getParkingLotId());
        response.setParkingLotName(reservation.getParkingLot().getName());
        response.setParkingLotAddress(reservation.getParkingLot().getAddress());
        response.setPlateNumber(reservation.getVehicle().getPlateNumber());
        response.setStartAt(reservation.getStartAt());
        response.setEndAt(reservation.getEndAt());
        response.setPriceEstimated(reservation.getPriceEstimated());
        response.setCurrency(reservation.getPricingPlan().getCurrency());
        response.setReservedAt(reservation.getReservedAt());
        response.setExpiresAt(reservation.getExpiresAt());
        return response;
    }

    private Customer ensureCustomerExists(Integer customerId) {
        if (customerId == null) {
            throw badRequest("Brak identyfikatora klienta.");
        }

        return customerRepository.findById(customerId)
            .orElseThrow(() -> notFound("Nie znaleziono klienta."));
    }

    private Reservation findReservation(Integer reservationId) {
        if (reservationId == null) {
            throw badRequest("Brak identyfikatora rezerwacji.");
        }

        return reservationRepository.findById(reservationId)
            .orElseThrow(() -> notFound("Nie znaleziono rezerwacji."));
    }

    private void expireIfStale(Reservation reservation) {
        if (reservation.getStatus() == ReservationStatus.PENDING
            && reservation.getExpiresAt() != null
            && reservation.getExpiresAt().isBefore(LocalDateTime.now())) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Rezerwacja wygasła przed potwierdzeniem.");
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
