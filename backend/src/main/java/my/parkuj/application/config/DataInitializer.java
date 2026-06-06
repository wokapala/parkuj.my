package my.parkuj.application.config;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import my.parkuj.application.enums.AdminRole;
import my.parkuj.application.model.AdminUser;
import my.parkuj.application.model.Customer;
import my.parkuj.application.model.ParkingLot;
import my.parkuj.application.model.PricingPlan;
import my.parkuj.application.model.Vehicle;
import my.parkuj.application.repository.AdminUserRepository;
import my.parkuj.application.repository.CustomerRepository;
import my.parkuj.application.repository.ParkingLotRepository;
import my.parkuj.application.repository.PricingPlanRepository;
import my.parkuj.application.repository.VehicleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final ParkingLotRepository parkingLotRepository;
    private final PricingPlanRepository pricingPlanRepository;
    private final AdminUserRepository adminUserRepository;

    public DataInitializer(
        CustomerRepository customerRepository,
        VehicleRepository vehicleRepository,
        ParkingLotRepository parkingLotRepository,
        PricingPlanRepository pricingPlanRepository,
        AdminUserRepository adminUserRepository
    ) {
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.parkingLotRepository = parkingLotRepository;
        this.pricingPlanRepository = pricingPlanRepository;
        this.adminUserRepository = adminUserRepository;
    }

    @Override
    public void run(String... args) {
        if (customerRepository.count() == 0) {
            seedCustomerWithVehicle();
        }

        if (parkingLotRepository.count() == 0) {
            seedParkingLots();
        }

        if (adminUserRepository.count() == 0) {
            seedDefaultAdmin();
        }
    }

    // Domyślny superadmin do panelu — login: admin@parkuj.my, hasło: admin123.
    private void seedDefaultAdmin() {
        AdminUser admin = new AdminUser();
        admin.setEmail("admin@parkuj.my");
        admin.setPasswordHash(new BCryptPasswordEncoder().encode("admin123"));
        admin.setRole(AdminRole.SUPERADMIN);
        admin.setStatus("ACTIVE");
        adminUserRepository.save(admin);
    }

    private void seedCustomerWithVehicle() {
        Customer customer = new Customer();
        customer.setGoogleSub("mock-google-sub-001");
        customer.setFirstName("Jan");
        customer.setLastName("Testowy");
        customer.setEmail("test@parkuj.my");
        customer.setPhone("500600700");
        customer.setStatus("ACTIVE");
        customer = customerRepository.save(customer);

        Vehicle vehicle = new Vehicle();
        vehicle.setCustomer(customer);
        vehicle.setPlateNumber("WW12345");
        vehicle.setCountryCode("POL");
        vehicle.setPrimaryVehicle(true);
        vehicleRepository.save(vehicle);
    }

    private void seedParkingLots() {
        createParkingLot(
            "Parking Zlote Tarasy",
            "ul. Zlota 59, Warszawa",
            "52.229700",
            "21.002900",
            420,
            120,
            "12.00"
        );

        createParkingLot(
            "Parking Centrum Nauki Kopernik",
            "ul. Wybrzeze Kosciuszkowskie 20, Warszawa",
            "52.241900",
            "21.028800",
            180,
            60,
            "9.50"
        );

        createParkingLot(
            "Parking Arkadia",
            "al. Jana Pawla II 82, Warszawa",
            "52.257000",
            "20.984700",
            900,
            250,
            "7.00"
        );

        createParkingLot(
            "Parking Mokotow Business Park",
            "ul. Postepu 14, Warszawa",
            "52.179600",
            "20.999600",
            260,
            100,
            "8.50"
        );

        createParkingLot(
            "Parking Lotnisko Chopina",
            "ul. Zwirki i Wigury 1, Warszawa",
            "52.165700",
            "20.967100",
            650,
            180,
            "15.00"
        );
    }

    private void createParkingLot(
        String name,
        String address,
        String latitude,
        String longitude,
        int placesCount,
        int reservablePlacesCount,
        String pricePerHour
    ) {
        ParkingLot parkingLot = new ParkingLot();
        parkingLot.setName(name);
        parkingLot.setAddress(address);
        parkingLot.setLatitude(new BigDecimal(latitude));
        parkingLot.setLongitude(new BigDecimal(longitude));
        parkingLot.setPlacesCount(placesCount);
        parkingLot.setReservablePlacesCount(reservablePlacesCount);
        parkingLot.setStatus("ACTIVE");
        parkingLot = parkingLotRepository.save(parkingLot);

        PricingPlan pricingPlan = new PricingPlan();
        pricingPlan.setParkingLot(parkingLot);
        pricingPlan.setPricePerHour(new BigDecimal(pricePerHour));
        pricingPlan.setCurrency("PLN");
        pricingPlan.setValidFrom(LocalDateTime.now());
        pricingPlanRepository.save(pricingPlan);
    }
}
