package my.parkuj.application.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import my.parkuj.application.dto.IncidentReportDTO;
import my.parkuj.application.model.AdminUser;
import my.parkuj.application.model.IncidentReport;
import my.parkuj.application.repository.AdminUserRepository;
import my.parkuj.application.repository.IncidentReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IncidentReportService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("OPEN", "IN_PROGRESS", "RESOLVED");
    private static final Set<String> ALLOWED_SEVERITIES = Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL");
    private static final Set<String> ALLOWED_TYPES = Set.of(
        "BARRIER_FAILURE", "PAYMENT_ISSUE", "VEHICLE_BLOCKED", "OTHER"
    );

    private final IncidentReportRepository incidentRepository;
    private final AdminUserRepository adminUserRepository;

    public IncidentReportService(
        IncidentReportRepository incidentRepository,
        AdminUserRepository adminUserRepository
    ) {
        this.incidentRepository = incidentRepository;
        this.adminUserRepository = adminUserRepository;
    }

    public List<IncidentReportDTO> getAll() {
        return incidentRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(IncidentReportDTO::fromEntity)
            .toList();
    }

    @Transactional
    public IncidentReportDTO create(Integer adminId, IncidentReportDTO request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak danych incydentu.");
        }
        String type = normalize(request.getIncidentType());
        String severity = normalize(request.getSeverity());
        String description = request.getDescription() != null ? request.getDescription().trim() : "";

        if (!ALLOWED_TYPES.contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nieznany typ incydentu.");
        }
        if (!ALLOWED_SEVERITIES.contains(severity)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nieznana waga incydentu.");
        }
        if (description.length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Opis musi mieć co najmniej 10 znaków.");
        }

        AdminUser admin = adminUserRepository.findById(adminId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono administratora."));

        IncidentReport incident = new IncidentReport();
        incident.setAdminUser(admin);
        incident.setIncidentType(type);
        incident.setSeverity(severity);
        incident.setDescription(description);
        incident.setStatus("OPEN");
        return IncidentReportDTO.fromEntity(incidentRepository.save(incident));
    }

    @Transactional
    public IncidentReportDTO updateStatus(Integer incidentId, String newStatus) {
        String status = normalize(newStatus);
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nieznany status incydentu.");
        }
        IncidentReport incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono incydentu."));

        incident.setStatus(status);
        if ("RESOLVED".equals(status)) {
            incident.setResolvedAt(LocalDateTime.now());
        } else if (incident.getResolvedAt() != null) {
            // Cofnięcie z RESOLVED — zerujemy timestamp.
            incident.setResolvedAt(null);
        }
        return IncidentReportDTO.fromEntity(incidentRepository.save(incident));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}
