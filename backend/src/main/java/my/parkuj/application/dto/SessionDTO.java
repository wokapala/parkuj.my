package my.parkuj.application.dto;

import java.time.LocalDateTime;

import my.parkuj.application.enums.ParkingSessionStatus;

public class SessionDTO {
    private Long id;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private ParkingSessionStatus status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getEntryTime() { return entryTime; }
    public void setEntryTime(LocalDateTime entryTime) { this.entryTime = entryTime; }
    public LocalDateTime getExitTime() { return exitTime; }
    public void setExitTime(LocalDateTime exitTime) { this.exitTime = exitTime; }
    public ParkingSessionStatus getStatus() { return status; }
    public void setStatus(ParkingSessionStatus status) { this.status = status; }
}

