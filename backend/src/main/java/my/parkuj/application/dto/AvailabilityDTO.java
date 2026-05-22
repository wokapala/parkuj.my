package my.parkuj.application.dto;

public class AvailabilityDTO {
    private Integer parkingLotId;
    private boolean available;
    private Integer totalReservableSpots;
    private Integer occupiedReservableSpots;
    private Integer availableSpots;

    public Integer getParkingLotId() { return parkingLotId; }
    public void setParkingLotId(Integer parkingLotId) { this.parkingLotId = parkingLotId; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    public Integer getTotalReservableSpots() { return totalReservableSpots; }
    public void setTotalReservableSpots(Integer totalReservableSpots) { this.totalReservableSpots = totalReservableSpots; }
    public Integer getOccupiedReservableSpots() { return occupiedReservableSpots; }
    public void setOccupiedReservableSpots(Integer occupiedReservableSpots) { this.occupiedReservableSpots = occupiedReservableSpots; }
    public Integer getAvailableSpots() { return availableSpots; }
    public void setAvailableSpots(Integer availableSpots) { this.availableSpots = availableSpots; }
}

