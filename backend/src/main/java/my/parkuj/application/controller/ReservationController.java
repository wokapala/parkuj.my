package my.parkuj.application.controller;

import java.util.List;
import my.parkuj.application.dto.ReservationRequestDTO;
import my.parkuj.application.dto.ReservationResponseDTO;
import my.parkuj.application.service.ReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ReservationResponseDTO> createReservation(@RequestBody ReservationRequestDTO request) {
        ReservationResponseDTO response = reservationService.createReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<ReservationResponseDTO> getReservations(@RequestParam Integer customerId) {
        return reservationService.getReservationsForCustomer(customerId);
    }

    @GetMapping("/{id}")
    public ReservationResponseDTO getReservation(
        @PathVariable Integer id,
        @RequestParam Integer customerId
    ) {
        return reservationService.getReservation(customerId, id);
    }

    @PostMapping("/{id}/confirm")
    public ReservationResponseDTO confirmReservation(
        @PathVariable Integer id,
        @RequestParam(required = false) String providerReference
    ) {
        return reservationService.confirmReservation(id, providerReference);
    }

    @DeleteMapping("/{id}")
    public ReservationResponseDTO cancelReservation(
        @PathVariable Integer id,
        @RequestParam Integer customerId
    ) {
        return reservationService.cancelReservation(customerId, id);
    }
}
