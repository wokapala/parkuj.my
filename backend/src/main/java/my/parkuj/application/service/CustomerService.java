package my.parkuj.application.service;

import java.util.Locale;
import my.parkuj.application.dto.CustomerDTO;
import my.parkuj.application.model.Customer;
import my.parkuj.application.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public CustomerDTO getCurrentCustomer(Integer customerId) {
        return CustomerDTO.fromEntity(findCustomer(customerId));
    }

    // Dla panelu admina — wszyscy klienci posortowani od najnowszych.
    @Transactional(readOnly = true)
    public java.util.List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
            .sorted((a, b) -> {
                if (a.getCreatedAt() == null) return 1;
                if (b.getCreatedAt() == null) return -1;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            })
            .map(CustomerDTO::fromEntity)
            .toList();
    }

    @Transactional
    public CustomerDTO updateCurrentCustomer(Integer customerId, CustomerDTO updates) {
        if (updates == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak danych do aktualizacji.");
        }
        Customer customer = findCustomer(customerId);

        // Konwencja: null = nie zmieniaj, "" = wyczyść (user usunął wartość).
        // Imię i nazwisko muszą zostać niepuste — DB wymaga, nie pozwalamy ich wyzerować.
        if (updates.getFirstName() != null && !updates.getFirstName().isBlank()) {
            customer.setFirstName(updates.getFirstName().trim());
        }
        if (updates.getLastName() != null && !updates.getLastName().isBlank()) {
            customer.setLastName(updates.getLastName().trim());
        }
        // Telefon użytkownik może wyczyścić — pole jest opcjonalne.
        if (updates.getPhone() != null) {
            String trimmed = updates.getPhone().trim();
            customer.setPhone(trimmed.isBlank() ? null : trimmed);
        }

        // Email tylko jeśli się zmienił — i tylko jeśli nie zajęty przez kogoś innego.
        if (updates.getEmail() != null && !updates.getEmail().isBlank()) {
            String newEmail = updates.getEmail().trim().toLowerCase(Locale.ROOT);
            if (!newEmail.equals(customer.getEmail())) {
                if (customerRepository.existsByEmail(newEmail)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Adres e-mail jest już zajęty.");
                }
                customer.setEmail(newEmail);
            }
        }

        return CustomerDTO.fromEntity(customerRepository.save(customer));
    }

    // Zbanowanie klienta — status BANNED, konto istnieje ale nie może się logować.
    @Transactional
    public CustomerDTO banCustomer(Integer customerId) {
        Customer customer = findCustomer(customerId);
        customer.setStatus("BANNED");
        return CustomerDTO.fromEntity(customerRepository.save(customer));
    }

    // Odbanowanie klienta.
    @Transactional
    public CustomerDTO unbanCustomer(Integer customerId) {
        Customer customer = findCustomer(customerId);
        customer.setStatus("ACTIVE");
        return CustomerDTO.fromEntity(customerRepository.save(customer));
    }

    // Usunięcie konta — fizyczne. Kaskady usuną pojazdy i rezerwacje (CascadeType.ALL na vehicles).
    // Rezerwacje nie mają CASCADE z Customer, więc trzeba je wyczyścić ręcznie przez repozytorium.
    @Transactional
    public void deleteCustomer(Integer customerId, my.parkuj.application.repository.ReservationRepository reservationRepository) {
        Customer customer = findCustomer(customerId);
        // Parkingów nie usuwamy razem z właścicielem (osobna operacja SuperAdmina).
        // Zerujemy tylko referencję do właściciela, żeby parking nie zniknął.
        if (customer.getParkingLots() != null) {
            for (my.parkuj.application.model.ParkingLot lot : customer.getParkingLots()) {
                lot.setOwner(null);
            }
        }
        // Rezerwacje tego klienta: nie kaskadujemy (inne encje mogą trzymać referencje),
        // tylko nullujemy customer — rezerwacja zostaje jako rekord historyczny.
        reservationRepository.findByCustomerCustomerIdOrderByReservedAtDesc(customerId)
            .forEach(r -> r.setCustomer(null));
        customerRepository.delete(customer);
    }

    private Customer findCustomer(Integer customerId) {
        if (customerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak identyfikatora klienta.");
        }
        return customerRepository.findById(customerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono klienta."));
    }

}
