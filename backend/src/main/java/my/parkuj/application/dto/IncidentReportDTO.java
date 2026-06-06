package my.parkuj.application.dto;

import java.time.LocalDateTime;
import my.parkuj.application.model.IncidentReport;

public class IncidentReportDTO {
    private Integer incidentReportId;
    private String incidentType;
    private String severity;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private String createdByEmail;

    public Integer getIncidentReportId() { return incidentReportId; }
    public void setIncidentReportId(Integer incidentReportId) { this.incidentReportId = incidentReportId; }

    public String getIncidentType() { return incidentType; }
    public void setIncidentType(String incidentType) { this.incidentType = incidentType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getCreatedByEmail() { return createdByEmail; }
    public void setCreatedByEmail(String createdByEmail) { this.createdByEmail = createdByEmail; }

    public static IncidentReportDTO fromEntity(IncidentReport entity) {
        if (entity == null) return null;
        IncidentReportDTO dto = new IncidentReportDTO();
        dto.incidentReportId = entity.getIncidentReportId();
        dto.incidentType = entity.getIncidentType();
        dto.severity = entity.getSeverity();
        dto.description = entity.getDescription();
        dto.status = entity.getStatus();
        dto.createdAt = entity.getCreatedAt();
        dto.resolvedAt = entity.getResolvedAt();
        dto.createdByEmail = entity.getAdminUser() != null ? entity.getAdminUser().getEmail() : null;
        return dto;
    }
}
