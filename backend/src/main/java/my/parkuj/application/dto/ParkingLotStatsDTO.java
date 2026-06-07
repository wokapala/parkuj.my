package my.parkuj.application.dto;

import java.math.BigDecimal;
import java.util.List;

// Statystyki parkingu dla panelu operatora — wszystko z prawdziwych SQL,
// frontend renderuje wykresy bez konieczności drugiego requesta.
public class ParkingLotStatsDTO {
    private Integer parkingLotId;
    private String parkingLotName;
    private Integer placesCount;
    private Integer reservablePlacesCount;
    private Integer walkInPlacesCount;
    private BigDecimal pricePerHour;
    private long activeReservationsCount;
    private long reservationsThisMonth;
    private BigDecimal revenueThisMonth;
    private List<DailyPoint> revenueLast7Days;
    private List<DailyPoint> reservationsLast7Days;

    public static class DailyPoint {
        private String day; // yyyy-MM-dd
        private BigDecimal value;
        private long count;

        public DailyPoint() { }
        public DailyPoint(String day, BigDecimal value, long count) {
            this.day = day;
            this.value = value;
            this.count = count;
        }

        public String getDay() { return day; }
        public void setDay(String day) { this.day = day; }
        public BigDecimal getValue() { return value; }
        public void setValue(BigDecimal value) { this.value = value; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public Integer getParkingLotId() { return parkingLotId; }
    public void setParkingLotId(Integer parkingLotId) { this.parkingLotId = parkingLotId; }

    public String getParkingLotName() { return parkingLotName; }
    public void setParkingLotName(String parkingLotName) { this.parkingLotName = parkingLotName; }

    public Integer getPlacesCount() { return placesCount; }
    public void setPlacesCount(Integer placesCount) { this.placesCount = placesCount; }

    public Integer getReservablePlacesCount() { return reservablePlacesCount; }
    public void setReservablePlacesCount(Integer reservablePlacesCount) { this.reservablePlacesCount = reservablePlacesCount; }

    public Integer getWalkInPlacesCount() { return walkInPlacesCount; }
    public void setWalkInPlacesCount(Integer walkInPlacesCount) { this.walkInPlacesCount = walkInPlacesCount; }

    public BigDecimal getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(BigDecimal pricePerHour) { this.pricePerHour = pricePerHour; }

    public long getActiveReservationsCount() { return activeReservationsCount; }
    public void setActiveReservationsCount(long activeReservationsCount) { this.activeReservationsCount = activeReservationsCount; }

    public long getReservationsThisMonth() { return reservationsThisMonth; }
    public void setReservationsThisMonth(long reservationsThisMonth) { this.reservationsThisMonth = reservationsThisMonth; }

    public BigDecimal getRevenueThisMonth() { return revenueThisMonth; }
    public void setRevenueThisMonth(BigDecimal revenueThisMonth) { this.revenueThisMonth = revenueThisMonth; }

    public List<DailyPoint> getRevenueLast7Days() { return revenueLast7Days; }
    public void setRevenueLast7Days(List<DailyPoint> revenueLast7Days) { this.revenueLast7Days = revenueLast7Days; }

    public List<DailyPoint> getReservationsLast7Days() { return reservationsLast7Days; }
    public void setReservationsLast7Days(List<DailyPoint> reservationsLast7Days) { this.reservationsLast7Days = reservationsLast7Days; }
}
