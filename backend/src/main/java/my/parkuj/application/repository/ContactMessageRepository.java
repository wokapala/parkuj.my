package my.parkuj.application.repository;

import java.util.List;
import my.parkuj.application.model.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Integer> {
    List<ContactMessage> findAllByOrderByCreatedAtDesc();
}
