package my.parkuj.application.dto;

// Dane przychodzące z formularza rejestracji (AuthPage.jsx, tryb "register").
public class RegisterRequestDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String plate;        // opcjonalna tablica — tworzy pojazd główny
    private String countryCode;  // opcjonalny kod kraju pojazdu (domyślnie POL)
    private String password;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPlate() { return plate; }
    public void setPlate(String plate) { this.plate = plate; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
