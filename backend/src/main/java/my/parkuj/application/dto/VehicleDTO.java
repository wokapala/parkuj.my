package my.parkuj.application.dto;

public class VehicleDTO {
    private Integer id;
    private Integer customerId;
    private String name;
    private String plateNumber;
    private String countryCode;
    private boolean primaryVehicle;
    private boolean hasActiveReservation;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPlateNumber() { return plateNumber; }
    public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public boolean isPrimaryVehicle() { return primaryVehicle; }
    public void setPrimaryVehicle(boolean primaryVehicle) { this.primaryVehicle = primaryVehicle; }
    public boolean isHasActiveReservation() { return hasActiveReservation; }
    public void setHasActiveReservation(boolean hasActiveReservation) { this.hasActiveReservation = hasActiveReservation; }
}

