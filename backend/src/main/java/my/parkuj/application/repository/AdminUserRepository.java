package my.parkuj.application.repository;

import java.util.Optional;
import my.parkuj.application.model.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, Integer> {

    Optional<AdminUser> findByEmail(String email);

    boolean existsByEmail(String email);
}
