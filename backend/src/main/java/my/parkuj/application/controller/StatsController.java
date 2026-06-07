package my.parkuj.application.controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import my.parkuj.application.enums.PaymentStatus;
import my.parkuj.application.enums.ReservationStatus;
import my.parkuj.application.model.ParkingLot;
import my.parkuj.application.model.Payment;
import my.parkuj.application.model.Reservation;
import my.parkuj.application.repository.CustomerRepository;
import my.parkuj.application.repository.IncidentReportRepository;
import my.parkuj.application.repository.ParkingLotRepository;
import my.parkuj.application.repository.PaymentRepository;
import my.parkuj.application.repository.ReservationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private static final List<ReservationStatus> BLOCKING_STATUSES = List.of(
        ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.ACTIVE
    );

    private final ParkingLotRepository parkingLotRepository;
    private final CustomerRepository customerRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final IncidentReportRepository incidentReportRepository;

    public StatsController(
        ParkingLotRepository parkingLotRepository,
        CustomerRepository customerRepository,
        ReservationRepository reservationRepository,
        PaymentRepository paymentRepository,
        IncidentReportRepository incidentReportRepository
    ) {
        this.parkingLotRepository = parkingLotRepository;
        this.customerRepository = customerRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.incidentReportRepository = incidentReportRepository;
    }

    // Publiczne statystyki sieci — kafelki na HomePage.
    @GetMapping("/overview")
    public Map<String, Object> getOverview() {
        List<ParkingLot> active = parkingLotRepository.findByStatusIgnoreCaseOrderByNameAsc("ACTIVE");
        int totalPlaces = active.stream()
            .mapToInt(lot -> lot.getPlacesCount() != null ? lot.getPlacesCount() : 0)
            .sum();
        Map<String, Object> response = new HashMap<>();
        response.put("totalPlaces", totalPlaces);
        response.put("totalParkingLots", active.size());
        return response;
    }

    // Statystyki dla panelu admina — 4 hero kafelki.
    @GetMapping("/admin")
    public Map<String, Object> getAdminStats() {
        BigDecimal totalRevenue = paymentRepository.findAll().stream()
            .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
            .map(Payment::getAmount)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalCustomers = customerRepository.count();

        long activeReservations = reservationRepository.findAll().stream()
            .filter(r -> BLOCKING_STATUSES.contains(r.getStatus()))
            .count();

        long openIncidents = incidentReportRepository.countByStatusIgnoreCase("OPEN");

        Map<String, Object> response = new HashMap<>();
        response.put("totalRevenue", totalRevenue);
        response.put("totalCustomers", totalCustomers);
        response.put("activeReservations", activeReservations);
        response.put("openIncidents", openIncidents);
        return response;
    }

    // Statystyki dla profilu klienta — UserPage.
    @GetMapping("/customer")
    public Map<String, Object> getCustomerStats(@RequestParam Integer customerId) {
        List<Reservation> reservations =
            reservationRepository.findByCustomerCustomerIdOrderByReservedAtDesc(customerId);
        long total = reservations.size();
        BigDecimal spent = reservations.stream()
            .filter(r -> r.getStatus() != ReservationStatus.CANCELLED
                && r.getStatus() != ReservationStatus.EXPIRED)
            .map(Reservation::getPriceEstimated)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> response = new HashMap<>();
        response.put("totalReservations", total);
        response.put("totalSpent", spent);
        return response;
    }
}
