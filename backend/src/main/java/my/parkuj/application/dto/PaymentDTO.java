package my.parkuj.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import my.parkuj.application.enums.PaymentMethod;
import my.parkuj.application.enums.PaymentStatus;

public class PaymentDTO {
    private Long id;
    private Integer reservationId;
    private BigDecimal amount;
    private PaymentMethod method;
    private PaymentStatus status;
    private LocalDateTime paidAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getReservationId() { return reservationId; }
    public void setReservationId(Integer reservationId) { this.reservationId = reservationId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public PaymentMethod getMethod() { return method; }
    public void setMethod(PaymentMethod method) { this.method = method; }
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}

