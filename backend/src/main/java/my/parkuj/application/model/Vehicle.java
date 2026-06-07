package my.parkuj.application.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "vehicle",
    uniqueConstraints = @UniqueConstraint(name = "uq_vehicle_plate_country", columnNames = {"plate_number", "country_code"})
)
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer vehicleId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "plate_number", nullable = false)
    private String plateNumber;

    @Column(name = "country_code", nullable = false, length = 3)
    private String countryCode = "POL";

    // Przyjazna nazwa nadana przez właściciela ("Toyota Corolla").
    // Nullable — opcjonalna; fallback w UI na samą tablicę.
    @Column(name = "name")
    private String name;

    @Column(nullable = false)
    private boolean primaryVehicle;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "vehicle")
    private List<Reservation> reservations = new ArrayList<>();

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Integer getVehicleId() { return vehicleId; }
    public void setVehicleId(Integer vehicleId) { this.vehicleId = vehicleId; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public String getPlateNumber() { return plateNumber; }
    public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isPrimaryVehicle() { return primaryVehicle; }
    public void setPrimaryVehicle(boolean primaryVehicle) { this.primaryVehicle = primaryVehicle; }

    public boolean isPrimary() { return primaryVehicle; }
    public void setPrimary(boolean primary) { this.primaryVehicle = primary; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<Reservation> getReservations() { return reservations; }
    public void setReservations(List<Reservation> reservations) { this.reservations = reservations; }
}
