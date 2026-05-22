package my.parkuj.application.dto;

import java.math.BigDecimal;

public class PriceEstimateDTO {
    private Integer parkingLotId;
    private BigDecimal hours;
    private BigDecimal pricePerHour;
    private BigDecimal estimatedPrice;
    private String currency;

    public Integer getParkingLotId() { return parkingLotId; }
    public void setParkingLotId(Integer parkingLotId) { this.parkingLotId = parkingLotId; }
    public BigDecimal getHours() { return hours; }
    public void setHours(BigDecimal hours) { this.hours = hours; }
    public BigDecimal getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(BigDecimal pricePerHour) { this.pricePerHour = pricePerHour; }
    public BigDecimal getEstimatedPrice() { return estimatedPrice; }
    public void setEstimatedPrice(BigDecimal estimatedPrice) { this.estimatedPrice = estimatedPrice; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}

