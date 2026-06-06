package my.parkuj.application.dto;

import java.time.LocalDateTime;
import my.parkuj.application.model.ContactMessage;

public class ContactMessageDTO {
    private Integer contactMessageId;
    private String firstName;
    private String lastName;
    private String email;
    private String subject;
    private String message;
    private LocalDateTime createdAt;

    public Integer getContactMessageId() { return contactMessageId; }
    public void setContactMessageId(Integer contactMessageId) { this.contactMessageId = contactMessageId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static ContactMessageDTO fromEntity(ContactMessage entity) {
        if (entity == null) return null;
        ContactMessageDTO dto = new ContactMessageDTO();
        dto.contactMessageId = entity.getContactMessageId();
        dto.firstName = entity.getFirstName();
        dto.lastName = entity.getLastName();
        dto.email = entity.getEmail();
        dto.subject = entity.getSubject();
        dto.message = entity.getMessage();
        dto.createdAt = entity.getCreatedAt();
        return dto;
    }
}
