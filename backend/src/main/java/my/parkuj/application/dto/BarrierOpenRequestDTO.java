package my.parkuj.application.dto;

// Żądanie otwarcia bramy (np. z wezwania z urządzenia bramy)
public class BarrierOpenRequestDTO {
    private String reservationCode; // alternatywnie reservationId
    private Long gateId;

    public String getReservationCode() { return reservationCode; }
    public void setReservationCode(String reservationCode) { this.reservationCode = reservationCode; }
    public Long getGateId() { return gateId; }
    public void setGateId(Long gateId) { this.gateId = gateId; }
}

