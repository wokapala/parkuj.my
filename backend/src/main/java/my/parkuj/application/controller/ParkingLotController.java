package my.parkuj.application.controller;

import java.time.LocalDateTime;
import java.util.List;
import my.parkuj.application.dto.AvailabilityDTO;
import my.parkuj.application.dto.ParkingLotConfigDTO;
import my.parkuj.application.dto.ParkingLotCreateDTO;
import my.parkuj.application.dto.ParkingLotDTO;
import my.parkuj.application.dto.ParkingLotStatsDTO;
import my.parkuj.application.dto.IncidentReportDTO;
import my.parkuj.application.dto.PriceEstimateDTO;
import my.parkuj.application.dto.ReservationResponseDTO;
import my.parkuj.application.service.IncidentReportService;
import my.parkuj.application.service.ParkingLotService;
import java.math.BigDecimal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/parking-lots")
public class ParkingLotController {

    private final ParkingLotService parkingLotService;
    private final IncidentReportService incidentReportService;

    public ParkingLotController(ParkingLotService parkingLotService, IncidentReportService incidentReportService) {
        this.parkingLotService = parkingLotService;
        this.incidentReportService = incidentReportService;
    }

    @GetMapping
    public List<ParkingLotDTO> getParkingLots() {
        return parkingLotService.getActiveParkingLots();
    }

    // Parkingi należące do zalogowanego właściciela — dla panelu /dashboard.
    @GetMapping("/my")
    public List<ParkingLotDTO> getMyParkingLots(@RequestParam Integer customerId) {
        return parkingLotService.getLotsForOwner(customerId);
    }

    // Tworzy nowy parking + cennik. Wywoływane z wizardu /join po ostatnim kroku.
    @PostMapping
    public ResponseEntity<ParkingLotDTO> createParkingLot(@RequestBody ParkingLotCreateDTO request) {
        ParkingLotDTO created = parkingLotService.createForOwner(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ParkingLotDTO getParkingLot(@PathVariable Integer id) {
        return parkingLotService.getParkingLot(id);
    }

    @GetMapping("/{id}/availability")
    public AvailabilityDTO getAvailability(
        @PathVariable Integer id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return parkingLotService.checkAvailability(id, from, to);
    }

    @GetMapping("/{id}/price")
    public PriceEstimateDTO getPrice(
        @PathVariable Integer id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return parkingLotService.estimatePrice(id, from, to);
    }

    // Statystyki parkingu dla panelu właściciela — wymagany customerId właściciela
    // żeby nie dało się podejrzeć cudzych obrotów znając ID parkingu.
    @GetMapping("/{id}/stats")
    public ParkingLotStatsDTO getStats(
        @PathVariable Integer id,
        @RequestParam Integer customerId
    ) {
        return parkingLotService.getStats(id, customerId);
    }

    // Zmiana ceny godzinowej (append-only: tworzy nowy PricingPlan, zamyka poprzedni).
    // customerId musi być właścicielem parkingu.
    @PatchMapping("/{id}/price")
    public ParkingLotDTO updatePrice(
        @PathVariable Integer id,
        @RequestParam Integer customerId,
        @RequestParam BigDecimal newPrice
    ) {
        return parkingLotService.updatePrice(id, customerId, newPrice);
    }

    // Rezerwacje danego parkingu — panel administracyjny właściciela.
    // customerId musi być właścicielem parkingu (widzi tylko swoje parkingi).
    @GetMapping("/{id}/reservations")
    public List<ReservationResponseDTO> getLotReservations(
        @PathVariable Integer id,
        @RequestParam Integer customerId
    ) {
        return parkingLotService.getReservationsForLot(id, customerId);
    }

    // Zgłoszenie incydentu przez właściciela parkingu (bez konta admina).
    // customerId musi być właścicielem parkingu — weryfikacja przez ensureOwner w serwisie.
    @PostMapping("/{id}/incidents")
    public IncidentReportDTO reportIncident(
        @PathVariable Integer id,
        @RequestParam Integer customerId,
        @RequestBody IncidentReportDTO request
    ) {
        parkingLotService.getReservationsForLot(id, customerId); // rzuca 403 jeśli nie właściciel
        return incidentReportService.createByOwner(id, request);
    }

    // US-A05 — zmiana podziału miejsc i godzin otwarcia. customerId musi być właścicielem.
    @PatchMapping("/{id}/config")
    public ParkingLotDTO updateConfig(
        @PathVariable Integer id,
        @RequestParam Integer customerId,
        @RequestBody ParkingLotConfigDTO config
    ) {
        return parkingLotService.updateConfig(id, customerId, config);
    }
}

