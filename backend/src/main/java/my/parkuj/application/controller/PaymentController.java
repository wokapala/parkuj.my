package my.parkuj.application.controller;

import my.parkuj.application.dto.PaymentDTO;
import my.parkuj.application.enums.PaymentMethod;
import my.parkuj.application.service.PaymentService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/reservation/{reservationId}")
    public PaymentDTO payForReservation(
        @PathVariable Integer reservationId,
        @RequestParam(defaultValue = "MOBILE_APP") PaymentMethod method
    ) {
        return paymentService.payForReservation(reservationId, method);
    }
}

