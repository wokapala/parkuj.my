package my.parkuj.application.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import my.parkuj.application.dto.AvailabilityDTO;
import my.parkuj.application.dto.ParkingLotConfigDTO;
import my.parkuj.application.dto.ParkingLotCreateDTO;
import my.parkuj.application.dto.ParkingLotDTO;
import my.parkuj.application.dto.ParkingLotStatsDTO;
import my.parkuj.application.dto.PriceEstimateDTO;
import my.parkuj.application.enums.ReservationStatus;
import my.parkuj.application.model.Customer;
import my.parkuj.application.model.ParkingLot;
import my.parkuj.application.model.PricingPlan;
import my.parkuj.application.model.Reservation;
import my.parkuj.application.repository.CustomerRepository;
import my.parkuj.application.repository.ParkingLotRepository;
import my.parkuj.application.repository.PricingPlanRepository;
import my.parkuj.application.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final CustomerRepository customerRepository;
    private final PricingPlanRepository pricingPlanRepository;

    public ParkingLotService(
        ParkingLotRepository parkingLotRepository,
        ReservationRepository reservationRepository,
        PricingService pricingService,
        CustomerRepository customerRepository,
        PricingPlanRepository pricingPlanRepository
    ) {
        this.parkingLotRepository = parkingLotRepository;
        this.reservationRepository = reservationRepository;
        this.pricingService = pricingService;
        this.customerRepository = customerRepository;
        this.pricingPlanRepository = pricingPlanRepository;
    }

    public List<ParkingLotDTO> getActiveParkingLots() {
        return parkingLotRepository.findByStatusIgnoreCaseOrderByNameAsc("ACTIVE")
            .stream()
            .map(this::toDto)
            .toList();
    }

    // Parkingi zarejestrowane przez konkretnego właściciela (po wizardzie /join).
    public List<ParkingLotDTO> getLotsForOwner(Integer ownerCustomerId) {
        if (ownerCustomerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak identyfikatora właściciela.");
        }
        return parkingLotRepository.findByOwnerCustomerIdOrderByCreatedAtDesc(ownerCustomerId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    // Tworzy parking + powiązany pricing_plan + przypisuje właściciela. Wywoływane z /join wizardu.
    @Transactional
    public ParkingLotDTO createForOwner(ParkingLotCreateDTO request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak danych parkingu.");
        }
        if (request.getOwnerCustomerId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak identyfikatora właściciela.");
        }
        Customer owner = customerRepository.findById(request.getOwnerCustomerId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono klienta."));

        String name = request.getName() == null ? "" : request.getName().trim();
        String address = request.getAddress() == null ? "" : request.getAddress().trim();
        if (name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj nazwę parkingu.");
        }
        if (address.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj adres parkingu.");
        }
        int totalPlaces = request.getPlacesCount() == null ? 0 : request.getPlacesCount();
        int reservable = request.getReservablePlacesCount() == null ? 0 : request.getReservablePlacesCount();
        if (totalPlaces < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Liczba miejsc musi być większa niż 0.");
        }
        if (reservable < 0 || reservable > totalPlaces) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Liczba miejsc rezerwowanych nie może przekraczać liczby miejsc ogółem.");
        }

        String fullAddress = request.getCity() != null && !request.getCity().isBlank()
            ? address + ", " + request.getCity().trim()
            : address;

        ParkingLot lot = new ParkingLot();
        lot.setOwner(owner);
        lot.setName(name);
        lot.setAddress(fullAddress);
        lot.setLatitude(request.getLatitude());
        lot.setLongitude(request.getLongitude());
        lot.setPlacesCount(totalPlaces);
        lot.setReservablePlacesCount(reservable);
        lot.setStatus("ACTIVE");
        lot = parkingLotRepository.save(lot);

        BigDecimal price = request.getPricePerHour() != null ? request.getPricePerHour() : BigDecimal.ZERO;
        if (price.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cena nie może być ujemna.");
        }
        if (price.compareTo(new BigDecimal("9999.99")) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cena nie może przekraczać 9999.99 zł/h.");
        }

        lot.setOpenFrom(parseTime(request.getOpenFrom()));
        lot.setOpenTo(parseTime(request.getOpenTo()));
        lot = parkingLotRepository.save(lot);

        PricingPlan plan = new PricingPlan();
        plan.setParkingLot(lot);
        plan.setPricePerHour(price.setScale(2, RoundingMode.HALF_UP));
        plan.setCurrency("PLN");
        plan.setValidFrom(LocalDateTime.now());
        pricingPlanRepository.save(plan);

        return toDto(lot);
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

    // Zmiana ceny godzinowej — append-only: zamknięcie bieżącego planu + nowy rekord.
    @Transactional
    public ParkingLotDTO updatePrice(Integer parkingLotId, Integer ownerCustomerId, BigDecimal newPrice) {
        if (newPrice == null || newPrice.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cena musi być liczbą nieujemną.");
        }
        if (newPrice.compareTo(new BigDecimal("9999.99")) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cena nie może przekraczać 9999.99 zł/h.");
        }
        ParkingLot lot = findParkingLot(parkingLotId);
        ensureOwner(lot, ownerCustomerId);
        pricingPlanRepository
            .findFirstByParkingLotParkingLotIdAndValidToIsNullOrderByValidFromDesc(parkingLotId)
            .ifPresent(plan -> {
                plan.setValidTo(LocalDateTime.now());
                pricingPlanRepository.save(plan);
            });
        PricingPlan newPlan = new PricingPlan();
        newPlan.setParkingLot(lot);
        newPlan.setPricePerHour(newPrice.setScale(2, RoundingMode.HALF_UP));
        newPlan.setCurrency("PLN");
        newPlan.setValidFrom(LocalDateTime.now());
        pricingPlanRepository.save(newPlan);
        return toDto(lot);
    }

    // US-A05 — operator zmienia podział miejsc i godziny otwarcia.
    @Transactional
    public ParkingLotDTO updateConfig(Integer parkingLotId, Integer ownerCustomerId, ParkingLotConfigDTO config) {
        if (config == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak danych konfiguracji.");
        }
        ParkingLot lot = findParkingLot(parkingLotId);
        ensureOwner(lot, ownerCustomerId);

        if (config.getPlacesCount() != null) {
            if (config.getPlacesCount() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Liczba miejsc nie może być ujemna.");
            }
            lot.setPlacesCount(config.getPlacesCount());
        }
        if (config.getReservablePlacesCount() != null) {
            if (config.getReservablePlacesCount() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Liczba miejsc rezerwowanych nie może być ujemna.");
            }
            lot.setReservablePlacesCount(config.getReservablePlacesCount());
        }
        if (lot.getReservablePlacesCount() > lot.getPlacesCount()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Liczba miejsc rezerwowanych nie może przekraczać liczby miejsc ogółem.");
        }

        // null = bez zmiany, "" = czyszczenie (parking czynny całą dobę).
        if (config.getOpenFrom() != null) {
            lot.setOpenFrom(parseTime(config.getOpenFrom()));
        }
        if (config.getOpenTo() != null) {
            lot.setOpenTo(parseTime(config.getOpenTo()));
        }

        return toDto(parkingLotRepository.save(lot));
    }

    // Modyfikować parking może tylko jego właściciel. Parkingi seedowane (owner == null)
    // nie mają właściciela i nie są edytowalne z poziomu API.
    private void ensureOwner(ParkingLot lot, Integer ownerCustomerId) {
        if (ownerCustomerId == null
            || lot.getOwner() == null
            || !lot.getOwner().getCustomerId().equals(ownerCustomerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Brak uprawnień do zarządzania tym parkingiem.");
        }
    }

    // Statystyki dla panelu właściciela — bieżący stan + 7-dniowa historia rezerwacji i przychodu.
    public ParkingLotStatsDTO getStats(Integer parkingLotId, Integer ownerCustomerId) {
        ParkingLot lot = findParkingLot(parkingLotId);
        ensureOwner(lot, ownerCustomerId);

        ParkingLotStatsDTO stats = new ParkingLotStatsDTO();
        stats.setParkingLotId(lot.getParkingLotId());
        stats.setParkingLotName(lot.getName());
        stats.setPlacesCount(lot.getPlacesCount());
        stats.setReservablePlacesCount(lot.getReservablePlacesCount());
        stats.setWalkInPlacesCount(Math.max(0, lot.getPlacesCount() - lot.getReservablePlacesCount()));

        try {
            PricingPlan activePlan = pricingService.getActivePlan(parkingLotId);
            stats.setPricePerHour(activePlan.getPricePerHour());
        } catch (ResponseStatusException ignored) { /* brak cennika */ }

        stats.setActiveReservationsCount(
            reservationRepository.countByParkingLotAndStatuses(parkingLotId, BLOCKING_STATUSES)
        );

        // Bieżący miesiąc — liczba i suma priceEstimated dla wszystkich rezerwacji.
        YearMonth thisMonth = YearMonth.from(LocalDate.now());
        LocalDateTime monthStart = thisMonth.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = thisMonth.atEndOfMonth().atTime(23, 59, 59);
        List<Reservation> monthly = reservationRepository
            .findByParkingLotParkingLotIdAndReservedAtBetween(parkingLotId, monthStart, monthEnd);
        stats.setReservationsThisMonth(monthly.size());
        BigDecimal monthRevenue = monthly.stream()
            .filter(r -> r.getPriceEstimated() != null)
            .filter(r -> r.getStatus() != ReservationStatus.CANCELLED && r.getStatus() != ReservationStatus.EXPIRED)
            .map(Reservation::getPriceEstimated)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setRevenueThisMonth(monthRevenue);

        // 7-dniowa historia — agregacja po dniu reservedAt.
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);
        List<Reservation> weekly = reservationRepository.findByParkingLotParkingLotIdAndReservedAtBetween(
            parkingLotId, weekStart.atStartOfDay(), today.atTime(23, 59, 59)
        );

        Map<LocalDate, BigDecimal> revenueByDay = new HashMap<>();
        Map<LocalDate, Long> countsByDay = new HashMap<>();
        for (Reservation r : weekly) {
            if (r.getReservedAt() == null) continue;
            LocalDate day = r.getReservedAt().toLocalDate();
            countsByDay.merge(day, 1L, Long::sum);
            if (r.getPriceEstimated() != null
                && r.getStatus() != ReservationStatus.CANCELLED
                && r.getStatus() != ReservationStatus.EXPIRED) {
                revenueByDay.merge(day, r.getPriceEstimated(), BigDecimal::add);
            }
        }

        List<ParkingLotStatsDTO.DailyPoint> revenuePoints = new ArrayList<>();
        List<ParkingLotStatsDTO.DailyPoint> countPoints = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = weekStart.plusDays(i);
            String iso = d.toString();
            revenuePoints.add(new ParkingLotStatsDTO.DailyPoint(
                iso, revenueByDay.getOrDefault(d, BigDecimal.ZERO), 0
            ));
            countPoints.add(new ParkingLotStatsDTO.DailyPoint(
                iso, BigDecimal.ZERO, countsByDay.getOrDefault(d, 0L)
            ));
        }
        stats.setRevenueLast7Days(revenuePoints);
        stats.setReservationsLast7Days(countPoints);

        return stats;
    }

    // Wszystkie parkingi (łącznie z DELETED) — tylko dla panelu SuperAdmina.
    public List<ParkingLotDTO> getAllParkingLotsAdmin() {
        return parkingLotRepository.findAll().stream()
            .sorted((a, b) -> {
                if (a.getParkingLotId() == null) return 1;
                if (b.getParkingLotId() == null) return -1;
                return a.getParkingLotId().compareTo(b.getParkingLotId());
            })
            .map(this::toDto)
            .toList();
    }

    // Soft-delete parkingu przez SuperAdmina: status → DELETED.
    // Fizyczne usunięcie jest ryzykowne gdy są aktywne rezerwacje — zamiast tego ukrywamy parking.
    @Transactional
    public void deleteParkingLot(Integer parkingLotId) {
        ParkingLot lot = findParkingLot(parkingLotId);
        lot.setStatus("DELETED");
        parkingLotRepository.save(lot);
    }

    // Weryfikacja właściciela bez ładowania rezerwacji — do autoryzacji w innych endpointach.
    public void verifyOwner(Integer parkingLotId, Integer ownerCustomerId) {
        ParkingLot lot = findParkingLot(parkingLotId);
        ensureOwner(lot, ownerCustomerId);
    }

    // Rezerwacje konkretnego parkingu — panel administracyjny właściciela.
    // ensureOwner gwarantuje, że właściciel widzi wyłącznie rezerwacje swoich parkingów.
    @Transactional(readOnly = true)
    public List<my.parkuj.application.dto.ReservationResponseDTO> getReservationsForLot(
        Integer parkingLotId, Integer ownerCustomerId
    ) {
        ParkingLot lot = findParkingLot(parkingLotId);
        ensureOwner(lot, ownerCustomerId);
        return reservationRepository
            .findByParkingLotParkingLotIdOrderByReservedAtDesc(parkingLotId)
            .stream()
            .map(my.parkuj.application.dto.ReservationResponseDTO::fromEntity)
            .toList();
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
        if (parkingLot.getOpenFrom() != null) dto.setOpenFrom(parkingLot.getOpenFrom().toString());
        if (parkingLot.getOpenTo() != null) dto.setOpenTo(parkingLot.getOpenTo().toString());
        return dto;
    }

    private LocalTime parseTime(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try { return LocalTime.parse(raw.trim()); } catch (Exception e) { return null; }
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

