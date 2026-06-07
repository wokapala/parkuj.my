package my.parkuj.application.repository;

import java.util.List;
import my.parkuj.application.model.IncidentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Integer> {

    List<IncidentReport> findAllByOrderByCreatedAtDesc();

    long countByStatusIgnoreCase(String status);
}
