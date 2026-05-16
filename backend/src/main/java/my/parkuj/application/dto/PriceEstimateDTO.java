package my.parkuj.application.dto;

import java.math.BigDecimal;

public class PriceEstimateDTO {
    private BigDecimal estimatedPrice;

    public BigDecimal getEstimatedPrice() { return estimatedPrice; }
    public void setEstimatedPrice(BigDecimal estimatedPrice) { this.estimatedPrice = estimatedPrice; }
}

