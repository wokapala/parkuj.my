package my.parkuj.application.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import my.parkuj.application.model.Payment;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

}

