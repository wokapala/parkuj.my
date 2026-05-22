package my.parkuj.application.dto;

import java.math.BigDecimal;

public class ParkingLotDTO {
    private Integer id;
    private String name;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer placesCount;
    private Integer reservablePlacesCount;
    private Integer walkInPlacesCount;
    private String status;
    private BigDecimal pricePerHour;
    private String currency;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public Integer getPlacesCount() { return placesCount; }
    public void setPlacesCount(Integer placesCount) { this.placesCount = placesCount; }
    public Integer getReservablePlacesCount() { return reservablePlacesCount; }
    public void setReservablePlacesCount(Integer reservablePlacesCount) { this.reservablePlacesCount = reservablePlacesCount; }
    public Integer getWalkInPlacesCount() { return walkInPlacesCount; }
    public void setWalkInPlacesCount(Integer walkInPlacesCount) { this.walkInPlacesCount = walkInPlacesCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(BigDecimal pricePerHour) { this.pricePerHour = pricePerHour; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}

