package my.parkuj.application.controller;

import java.util.List;
import my.parkuj.application.dto.AdminUserDTO;
import my.parkuj.application.dto.CustomerDTO;
import my.parkuj.application.dto.LoginRequestDTO;
import my.parkuj.application.dto.ReservationResponseDTO;
import my.parkuj.application.service.AdminAuthService;
import my.parkuj.application.service.CustomerService;
import my.parkuj.application.service.ReservationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminAuthService adminAuthService;
    private final CustomerService customerService;
    private final ReservationService reservationService;

    public AdminController(
        AdminAuthService adminAuthService,
        CustomerService customerService,
        ReservationService reservationService
    ) {
        this.adminAuthService = adminAuthService;
        this.customerService = customerService;
        this.reservationService = reservationService;
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
}
