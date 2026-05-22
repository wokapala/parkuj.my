package my.parkuj.application.repository;

import java.util.Optional;
import my.parkuj.application.model.PricingPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PricingPlanRepository extends JpaRepository<PricingPlan, Integer> {

    Optional<PricingPlan> findFirstByParkingLotParkingLotIdAndValidToIsNullOrderByValidFromDesc(Integer parkingLotId);
}
