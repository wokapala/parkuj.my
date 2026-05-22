package my.parkuj.application.service;

import java.time.LocalDateTime;
import my.parkuj.application.dto.PaymentDTO;
import my.parkuj.application.dto.ReservationResponseDTO;
import my.parkuj.application.enums.PaymentMethod;
import my.parkuj.application.enums.PaymentStatus;
import my.parkuj.application.model.Payment;
import my.parkuj.application.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationService reservationService;

    public PaymentService(PaymentRepository paymentRepository, ReservationService reservationService) {
        this.paymentRepository = paymentRepository;
        this.reservationService = reservationService;
    }

    @Transactional
    public PaymentDTO payForReservation(Integer reservationId, PaymentMethod method) {
        ReservationResponseDTO reservation = reservationService.confirmReservation(reservationId, "MOCK_PAYMENT");

        Payment payment = new Payment();
        payment.setAmount(reservation.getPriceEstimated());
        payment.setMethod(method);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);

        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());
        dto.setReservationId(reservationId);
        dto.setAmount(payment.getAmount());
        dto.setMethod(payment.getMethod());
        dto.setStatus(payment.getStatus());
        dto.setPaidAt(payment.getPaidAt());
        return dto;
    }
}

