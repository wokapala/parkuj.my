package my.parkuj.application.controller;

import java.util.List;
import my.parkuj.application.dto.AdminUserDTO;
import my.parkuj.application.dto.CustomerDTO;
import my.parkuj.application.dto.IncidentReportDTO;
import my.parkuj.application.dto.LoginRequestDTO;
import my.parkuj.application.dto.ParkingLotDTO;
import my.parkuj.application.dto.ReservationResponseDTO;
import my.parkuj.application.model.AdminUser;
import my.parkuj.application.repository.AdminUserRepository;
import my.parkuj.application.repository.ReservationRepository;
import my.parkuj.application.service.AdminAuthService;
import my.parkuj.application.service.CustomerService;
import my.parkuj.application.service.IncidentReportService;
import my.parkuj.application.service.ParkingLotService;
import my.parkuj.application.service.ReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminAuthService adminAuthService;
    private final CustomerService customerService;
    private final ReservationService reservationService;
    private final IncidentReportService incidentReportService;
    private final ParkingLotService parkingLotService;
    private final AdminUserRepository adminUserRepository;
    private final ReservationRepository reservationRepository;

    public AdminController(
        AdminAuthService adminAuthService,
        CustomerService customerService,
        ReservationService reservationService,
        IncidentReportService incidentReportService,
        ParkingLotService parkingLotService,
        AdminUserRepository adminUserRepository,
        ReservationRepository reservationRepository
    ) {
        this.adminAuthService = adminAuthService;
        this.customerService = customerService;
        this.reservationService = reservationService;
        this.incidentReportService = incidentReportService;
        this.parkingLotService = parkingLotService;
        this.adminUserRepository = adminUserRepository;
        this.reservationRepository = reservationRepository;
    }

    // Brak JWT w tej fazie projektu (jak przy customerId) — minimum: każdy endpoint admina
    // wymaga adminId istniejącego, aktywnego konta. Wcześniej dane klientów i rezerwacji
    // dało się pobrać czystym curl-em bez logowania.
    private AdminUser requireActiveAdmin(Integer adminId) {
        if (adminId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wymagane konto administratora.");
        return adminUserRepository.findById(adminId)
            .filter(a -> !"INACTIVE".equalsIgnoreCase(a.getStatus()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wymagane konto administratora."));
    }

    private void requireSuperAdmin(Integer adminId) {
        AdminUser admin = requireActiveAdmin(adminId);
        if (admin.getRole() == null || !admin.getRole().name().equals("SUPERADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ta operacja wymaga uprawnień SuperAdmina.");
        }
    }

    @PostMapping("/auth/login")
    public AdminUserDTO login(@RequestBody LoginRequestDTO request) {
        return adminAuthService.login(request);
    }

    // Lista wszystkich klientów (panel admina).
    @GetMapping("/customers")
    public List<CustomerDTO> getAllCustomers(@RequestParam Integer adminId) {
        requireActiveAdmin(adminId);
        return customerService.getAllCustomers();
    }

    // Zbanowanie klienta — status BANNED.
    @PatchMapping("/customers/{id}/ban")
    public CustomerDTO banCustomer(@PathVariable Integer id, @RequestParam Integer adminId) {
        requireSuperAdmin(adminId);
        return customerService.banCustomer(id);
    }

    // Odbanowanie klienta.
    @PatchMapping("/customers/{id}/unban")
    public CustomerDTO unbanCustomer(@PathVariable Integer id, @RequestParam Integer adminId) {
        requireSuperAdmin(adminId);
        return customerService.unbanCustomer(id);
    }

    // Usunięcie konta klienta — tylko SuperAdmin.
    @DeleteMapping("/customers/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Integer id, @RequestParam Integer adminId) {
        requireSuperAdmin(adminId);
        customerService.deleteCustomer(id, reservationRepository);
        return ResponseEntity.noContent().build();
    }

    // Lista wszystkich rezerwacji w systemie (panel admina).
    @GetMapping("/reservations")
    public List<ReservationResponseDTO> getAllReservations(@RequestParam Integer adminId) {
        requireActiveAdmin(adminId);
        return reservationService.getAllReservations();
    }

    // Lista wszystkich parkingów (łącznie z DELETED) — panel admina.
    @GetMapping("/parking-lots")
    public List<ParkingLotDTO> getAllParkingLots(@RequestParam Integer adminId) {
        requireActiveAdmin(adminId);
        return parkingLotService.getAllParkingLotsAdmin();
    }

    // Soft-delete parkingu — status → DELETED. Tylko SuperAdmin.
    @DeleteMapping("/parking-lots/{id}")
    public ResponseEntity<Void> deleteParkingLot(@PathVariable Integer id, @RequestParam Integer adminId) {
        requireSuperAdmin(adminId);
        parkingLotService.deleteParkingLot(id);
        return ResponseEntity.noContent().build();
    }

    // Incydenty (US-A04) — pełen CRUD dla panelu admina.
    @GetMapping("/incidents")
    public List<IncidentReportDTO> getAllIncidents(@RequestParam Integer adminId) {
        requireActiveAdmin(adminId);
        return incidentReportService.getAll();
    }

    @PostMapping("/incidents")
    public IncidentReportDTO createIncident(
        @RequestParam Integer adminId,
        @RequestBody IncidentReportDTO request
    ) {
        requireActiveAdmin(adminId);
        return incidentReportService.create(adminId, request);
    }

    @PatchMapping("/incidents/{id}/status")
    public IncidentReportDTO updateIncidentStatus(
        @PathVariable Integer id,
        @RequestParam String status,
        @RequestParam Integer adminId
    ) {
        requireActiveAdmin(adminId);
        return incidentReportService.updateStatus(id, status, adminId);
    }
}
