package my.parkuj.application.repository;

import java.util.List;
import java.util.Optional;
import my.parkuj.application.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    Optional<Vehicle> findByVehicleIdAndCustomerCustomerId(Integer vehicleId, Integer customerId);

    List<Vehicle> findByCustomerCustomerIdOrderByPrimaryVehicleDescPlateNumberAsc(Integer customerId);

    boolean existsByPlateNumberAndCountryCode(String plateNumber, String countryCode);
}
