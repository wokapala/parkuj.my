package my.parkuj.application.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import my.parkuj.application.enums.ReservationStatus;
import my.parkuj.application.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    boolean existsByReservationCode(String reservationCode);

    boolean existsByVehicleVehicleIdAndStatusIn(Integer vehicleId, Collection<ReservationStatus> statuses);

    List<Reservation> findByCustomerCustomerIdOrderByReservedAtDesc(Integer customerId);

    @Query("""
        select count(r)
        from Reservation r
        where r.parkingLot.parkingLotId = :parkingLotId
          and r.status in :statuses
          and r.startAt < :endAt
          and r.endAt > :startAt
        """)
    long countOverlappingReservations(
        @Param("parkingLotId") Integer parkingLotId,
        @Param("startAt") LocalDateTime startAt,
        @Param("endAt") LocalDateTime endAt,
        @Param("statuses") Collection<ReservationStatus> statuses
    );
}
