package my.parkuj.application.service;

import java.time.LocalDateTime;
import java.util.List;
import my.parkuj.application.dto.AvailabilityDTO;
import my.parkuj.application.dto.ParkingLotDTO;
import my.parkuj.application.dto.PriceEstimateDTO;
import my.parkuj.application.enums.ReservationStatus;
import my.parkuj.application.model.ParkingLot;
import my.parkuj.application.model.PricingPlan;
import my.parkuj.application.repository.ParkingLotRepository;
import my.parkuj.application.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ParkingLotService {

    private static final List<ReservationStatus> BLOCKING_STATUSES = List.of(
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED,
        ReservationStatus.ACTIVE
    );

    private final ParkingLotRepository parkingLotRepository;
    private final ReservationRepository reservationRepository;
    private final PricingService pricingService;

    public ParkingLotService(
        ParkingLotRepository parkingLotRepository,
        ReservationRepository reservationRepository,
        PricingService pricingService
    ) {
        this.parkingLotRepository = parkingLotRepository;
        this.reservationRepository = reservationRepository;
        this.pricingService = pricingService;
    }

    public List<ParkingLotDTO> getActiveParkingLots() {
        return parkingLotRepository.findByStatusIgnoreCaseOrderByNameAsc("ACTIVE")
            .stream()
            .map(this::toDto)
            .toList();
    }

    public ParkingLotDTO getParkingLot(Integer parkingLotId) {
        return toDto(findParkingLot(parkingLotId));
    }

    public AvailabilityDTO checkAvailability(Integer parkingLotId, LocalDateTime from, LocalDateTime to) {
        validateRange(from, to);
        ParkingLot parkingLot = findParkingLot(parkingLotId);
        int capacity = parkingLot.getReservablePlacesCount() != null ? parkingLot.getReservablePlacesCount() : 0;
        long occupied = reservationRepository.countOverlappingReservations(
            parkingLotId,
            from,
            to,
            BLOCKING_STATUSES
        );
        int occupiedSafe = Math.toIntExact(Math.min(occupied, Integer.MAX_VALUE));
        int availableSpots = Math.max(0, capacity - occupiedSafe);

        AvailabilityDTO dto = new AvailabilityDTO();
        dto.setParkingLotId(parkingLotId);
        dto.setAvailable(availableSpots > 0);
        dto.setTotalReservableSpots(capacity);
        dto.setOccupiedReservableSpots(Math.min(occupiedSafe, capacity));
        dto.setAvailableSpots(availableSpots);
        return dto;
    }

    public PriceEstimateDTO estimatePrice(Integer parkingLotId, LocalDateTime from, LocalDateTime to) {
        findParkingLot(parkingLotId);
        return pricingService.calculatePrice(parkingLotId, from, to);
    }

    private ParkingLot findParkingLot(Integer parkingLotId) {
        return parkingLotRepository.findById(parkingLotId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono parkingu."));
    }

    private ParkingLotDTO toDto(ParkingLot parkingLot) {
        PricingPlan activePlan = null;
        try {
            activePlan = pricingService.getActivePlan(parkingLot.getParkingLotId());
        } catch (ResponseStatusException ignored) {
            activePlan = null;
        }

        ParkingLotDTO dto = new ParkingLotDTO();
        dto.setId(parkingLot.getParkingLotId());
        dto.setName(parkingLot.getName());
        dto.setAddress(parkingLot.getAddress());
        dto.setLatitude(parkingLot.getLatitude());
        dto.setLongitude(parkingLot.getLongitude());
        dto.setPlacesCount(parkingLot.getPlacesCount());
        dto.setReservablePlacesCount(parkingLot.getReservablePlacesCount());
        dto.setWalkInPlacesCount(Math.max(0, parkingLot.getPlacesCount() - parkingLot.getReservablePlacesCount()));
        dto.setStatus(parkingLot.getStatus());
        if (activePlan != null) {
            dto.setPricePerHour(activePlan.getPricePerHour());
            dto.setCurrency(activePlan.getCurrency());
        }
        return dto;
    }

    private void validateRange(LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj parametry from i to.");
        }
        if (!to.isAfter(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parametr to musi być późniejszy niż from.");
        }
    }
}

