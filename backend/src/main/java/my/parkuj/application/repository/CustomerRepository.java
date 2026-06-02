package my.parkuj.application.repository;

import java.util.Optional;
import my.parkuj.application.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    boolean existsByEmail(String email);

    Optional<Customer> findByEmail(String email);
}
