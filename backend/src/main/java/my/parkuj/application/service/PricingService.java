package my.parkuj.application.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import my.parkuj.application.dto.PriceEstimateDTO;
import my.parkuj.application.model.PricingPlan;
import my.parkuj.application.repository.PricingPlanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PricingService {

    private final PricingPlanRepository pricingPlanRepository;

    public PricingService(PricingPlanRepository pricingPlanRepository) {
        this.pricingPlanRepository = pricingPlanRepository;
    }

    public PricingPlan getActivePlan(Integer parkingLotId) {
        return pricingPlanRepository
            .findFirstByParkingLotParkingLotIdAndValidToIsNullOrderByValidFromDesc(parkingLotId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parking nie ma aktywnego cennika."));
    }

    public PriceEstimateDTO calculatePrice(Integer parkingLotId, LocalDateTime from, LocalDateTime to) {
        validateRange(from, to);

        PricingPlan pricingPlan = getActivePlan(parkingLotId);
        BigDecimal hours = calculateHours(from, to);
        BigDecimal totalPrice = pricingPlan.getPricePerHour()
            .multiply(hours)
            .setScale(2, RoundingMode.HALF_UP);

        PriceEstimateDTO dto = new PriceEstimateDTO();
        dto.setParkingLotId(parkingLotId);
        dto.setHours(hours);
        dto.setPricePerHour(pricingPlan.getPricePerHour());
        dto.setEstimatedPrice(totalPrice);
        dto.setCurrency(pricingPlan.getCurrency());
        return dto;
    }

    private BigDecimal calculateHours(LocalDateTime from, LocalDateTime to) {
        long minutes = Duration.between(from, to).toMinutes();
        return BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.CEILING);
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

