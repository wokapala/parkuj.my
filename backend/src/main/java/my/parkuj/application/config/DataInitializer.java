package my.parkuj.application.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import my.parkuj.application.enums.AdminRole;
import my.parkuj.application.enums.PaymentMethod;
import my.parkuj.application.enums.PaymentStatus;
import my.parkuj.application.enums.ReservationStatus;
import my.parkuj.application.model.AdminUser;
import my.parkuj.application.model.Customer;
import my.parkuj.application.model.ParkingLot;
import my.parkuj.application.model.Payment;
import my.parkuj.application.model.PricingPlan;
import my.parkuj.application.model.Reservation;
import my.parkuj.application.model.Vehicle;
import my.parkuj.application.repository.AdminUserRepository;
import my.parkuj.application.repository.CustomerRepository;
import my.parkuj.application.repository.ParkingLotRepository;
import my.parkuj.application.repository.PaymentRepository;
import my.parkuj.application.repository.PricingPlanRepository;
import my.parkuj.application.repository.ReservationRepository;
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
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final AdminUserRepository adminUserRepository;

    public DataInitializer(
        CustomerRepository customerRepository,
        VehicleRepository vehicleRepository,
        ParkingLotRepository parkingLotRepository,
        PricingPlanRepository pricingPlanRepository,
        ReservationRepository reservationRepository,
        PaymentRepository paymentRepository,
        AdminUserRepository adminUserRepository
    ) {
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.parkingLotRepository = parkingLotRepository;
        this.pricingPlanRepository = pricingPlanRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.adminUserRepository = adminUserRepository;
    }

    @Override
    public void run(String... args) {
        if (adminUserRepository.count() == 0) {
            seedDefaultAdmin();
        }

        // Klient testowy — szukamy po e-mailu, tworzymy tylko jeśli brak.
        Customer testCustomer = customerRepository.findByEmail("test@parkuj.my").orElse(null);
        if (testCustomer == null) {
            testCustomer = seedCustomerWithVehicle();
        }
        Vehicle testVehicle = vehicleRepository
            .findByCustomerCustomerIdOrderByPrimaryVehicleDescPlateNumberAsc(testCustomer.getCustomerId())
            .stream().findFirst().orElse(null);

        // Publiczne parkingi — seed tylko gdy nic nie ma w bazie.
        if (parkingLotRepository.count() == 0) {
            seedPublicParkingLots();
        }

        // Owned lot dla klienta testowego — niezależnie od kolejności inicjalizacji.
        ParkingLot ownedLot = parkingLotRepository
            .findByOwnerCustomerIdOrderByCreatedAtDesc(testCustomer.getCustomerId())
            .stream().findFirst().orElse(null);
        if (ownedLot == null) {
            ownedLot = seedOwnedParkingLot(testCustomer);
        }

        if (reservationRepository.count() == 0 && testVehicle != null) {
            seedHistoricalReservations(testCustomer, testVehicle, ownedLot);
        }
    }

    private void seedDefaultAdmin() {
        AdminUser admin = new AdminUser();
        admin.setEmail("admin@parkuj.my");
        admin.setPasswordHash(new BCryptPasswordEncoder().encode("admin123"));
        admin.setRole(AdminRole.SUPERADMIN);
        admin.setStatus("ACTIVE");
        adminUserRepository.save(admin);
    }

    private Customer seedCustomerWithVehicle() {
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

        return customer;
    }

    private void seedPublicParkingLots() {
        createParkingLot(null, "Parking Zlote Tarasy",                     "ul. Zlota 59, Warszawa",                   "52.229700", "21.002900", 420, 120, "12.00");
        createParkingLot(null, "Parking Centrum Nauki Kopernik",            "ul. Wybrzeze Kosciuszkowskie 20, Warszawa", "52.241900", "21.028800", 180,  60, "9.50");
        createParkingLot(null, "Parking Arkadia",                           "al. Jana Pawla II 82, Warszawa",            "52.257000", "20.984700", 900, 250, "7.00");
        createParkingLot(null, "Parking Mokotow Business Park",             "ul. Postepu 14, Warszawa",                  "52.179600", "20.999600", 260, 100, "8.50");
        createParkingLot(null, "Parking Lotnisko Chopina",                  "ul. Zwirki i Wigury 1, Warszawa",           "52.165700", "20.967100", 650, 180, "15.00");
    }

    private ParkingLot seedOwnedParkingLot(Customer owner) {
        return createParkingLot(owner, "Parking Srodmiescie (demo)",
            "ul. Marszalkowska 84, Warszawa", "52.234700", "21.011200", 80, 60, "10.00");
    }

    // 22 historyczne rezerwacje (COMPLETED) rozłożone na ostatnie 7 dni — dla wykresów w dashboardzie.
    private void seedHistoricalReservations(Customer customer, Vehicle vehicle, ParkingLot lot) {
        PricingPlan plan = pricingPlanRepository
            .findFirstByParkingLotParkingLotIdAndValidToIsNullOrderByValidFromDesc(lot.getParkingLotId())
            .orElse(null);
        if (plan == null) return;

        // Liczba rezerwacji na każdy dzień: 6 dni temu → dziś
        int[] countsByDay = {1, 2, 3, 4, 5, 4, 3};
        // Godziny startowe dla każdej rezerwacji w ciągu dnia (różne, by nie nakładać)
        int[][] slots = {{7, 9}, {10, 12}, {13, 16}, {17, 19}, {8, 11}};

        LocalDate today = LocalDate.now();
        int idx = 0;

        for (int daysAgo = 6; daysAgo >= 0; daysAgo--) {
            LocalDate day = today.minusDays(daysAgo);
            int count = countsByDay[6 - daysAgo];

            for (int i = 0; i < count; i++) {
                int[] slot = slots[idx % slots.length];
                LocalDateTime start = day.atTime(LocalTime.of(slot[0], 0));
                LocalDateTime end   = day.atTime(LocalTime.of(slot[1], 0));
                long hours = slot[1] - slot[0];
                BigDecimal price = plan.getPricePerHour().multiply(BigDecimal.valueOf(hours));

                Reservation r = new Reservation();
                r.setCustomer(customer);
                r.setVehicle(vehicle);
                r.setParkingLot(lot);
                r.setPricingPlan(plan);
                r.setReservationCode(String.format("SEED%08d", idx));
                r.setStartAt(start);
                r.setEndAt(end);
                r.setStatus(ReservationStatus.COMPLETED);
                r.setPriceEstimated(price);
                r.setReservedAt(start.minusHours(2));
                r.setExpiresAt(start.minusHours(1));
                Reservation saved = reservationRepository.save(r);

                Payment p = new Payment();
                p.setReservation(saved);
                p.setAmount(price);
                p.setCurrency("PLN");
                p.setPaymentMethod(PaymentMethod.BLIK);
                p.setStatus(PaymentStatus.COMPLETED);
                p.setPaidAt(start.minusHours(2));
                paymentRepository.save(p);

                idx++;
            }
        }
    }

    private ParkingLot createParkingLot(
        Customer owner,
        String name,
        String address,
        String latitude,
        String longitude,
        int placesCount,
        int reservablePlacesCount,
        String pricePerHour
    ) {
        ParkingLot parkingLot = new ParkingLot();
        parkingLot.setOwner(owner);
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

        return parkingLot;
    }
}
