package my.parkuj.application.dto;

import my.parkuj.application.model.Customer;

public class CustomerDTO {
    private Integer customerId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String status;
    private boolean isOwner;

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isOwner() { return isOwner; }
    public void setOwner(boolean owner) { isOwner = owner; }

    public static CustomerDTO fromEntity(Customer customer) {
        if (customer == null) return null;
        CustomerDTO dto = new CustomerDTO();
        dto.customerId = customer.getCustomerId();
        dto.firstName = customer.getFirstName();
        dto.lastName = customer.getLastName();
        dto.email = customer.getEmail();
        dto.phone = customer.getPhone();
        dto.status = customer.getStatus();
        dto.isOwner = customer.getParkingLots() != null && !customer.getParkingLots().isEmpty();
        return dto;
    }
}

