package my.parkuj.application.dto;

import java.time.LocalDateTime;

import my.parkuj.application.enums.ReservationStatus;

public class ReservationResponseDTO {
    private Long id;
    private ReservationStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long version;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}

