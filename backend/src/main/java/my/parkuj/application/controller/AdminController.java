package my.parkuj.application.controller;

import java.util.List;
import my.parkuj.application.dto.AdminUserDTO;
import my.parkuj.application.dto.CustomerDTO;
import my.parkuj.application.dto.IncidentReportDTO;
import my.parkuj.application.dto.LoginRequestDTO;
import my.parkuj.application.dto.ReservationResponseDTO;
import my.parkuj.application.service.AdminAuthService;
import my.parkuj.application.service.CustomerService;
import my.parkuj.application.service.IncidentReportService;
import my.parkuj.application.service.ReservationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminAuthService adminAuthService;
    private final CustomerService customerService;
    private final ReservationService reservationService;
    private final IncidentReportService incidentReportService;

    public AdminController(
        AdminAuthService adminAuthService,
        CustomerService customerService,
        ReservationService reservationService,
        IncidentReportService incidentReportService
    ) {
        this.adminAuthService = adminAuthService;
        this.customerService = customerService;
        this.reservationService = reservationService;
        this.incidentReportService = incidentReportService;
    }

    @PostMapping("/auth/login")
    public AdminUserDTO login(@RequestBody LoginRequestDTO request) {
        return adminAuthService.login(request);
    }

    // Lista wszystkich klientów (panel admina).
    @GetMapping("/customers")
    public List<CustomerDTO> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    // Lista wszystkich rezerwacji w systemie (panel admina).
    @GetMapping("/reservations")
    public List<ReservationResponseDTO> getAllReservations() {
        return reservationService.getAllReservations();
    }

    // Incydenty (US-A04) — pełen CRUD dla panelu admina.
    @GetMapping("/incidents")
    public List<IncidentReportDTO> getAllIncidents() {
        return incidentReportService.getAll();
    }

    @PostMapping("/incidents")
    public IncidentReportDTO createIncident(
        @RequestParam Integer adminId,
        @RequestBody IncidentReportDTO request
    ) {
        return incidentReportService.create(adminId, request);
    }

    @PatchMapping("/incidents/{id}/status")
    public IncidentReportDTO updateIncidentStatus(
        @PathVariable Integer id,
        @RequestParam String status
    ) {
        return incidentReportService.updateStatus(id, status);
    }
}
