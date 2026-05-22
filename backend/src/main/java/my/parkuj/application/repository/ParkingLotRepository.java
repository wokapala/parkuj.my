package my.parkuj.application.repository;

import java.util.List;
import my.parkuj.application.model.ParkingLot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParkingLotRepository extends JpaRepository<ParkingLot, Integer> {

    List<ParkingLot> findByStatusIgnoreCaseOrderByNameAsc(String status);
}
