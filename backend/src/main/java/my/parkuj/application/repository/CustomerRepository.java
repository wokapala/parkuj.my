package my.parkuj.application.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import my.parkuj.application.model.Customer;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

}

