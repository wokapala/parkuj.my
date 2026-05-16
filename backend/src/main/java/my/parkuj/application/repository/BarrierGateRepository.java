package my.parkuj.application.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import my.parkuj.application.model.BarrierGate;

@Repository
public interface BarrierGateRepository extends JpaRepository<BarrierGate, Long> {

}

