package my.parkuj.application.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "incident_reports")
public class IncidentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "incident_report_id")
    private Integer incidentReportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_session_id")
    private ParkingSession parkingSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_user_id", nullable = true)
    private AdminUser adminUser;

    private String incidentType;

    private String severity;

    private String description;

    private String status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Integer getIncidentReportId() { return incidentReportId; }
    public void setIncidentReportId(Integer incidentReportId) { this.incidentReportId = incidentReportId; }

    public ParkingSession getParkingSession() { return parkingSession; }
    public void setParkingSession(ParkingSession parkingSession) { this.parkingSession = parkingSession; }

    public AdminUser getAdminUser() { return adminUser; }
    public void setAdminUser(AdminUser adminUser) { this.adminUser = adminUser; }

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
}

