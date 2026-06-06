package my.parkuj.application.dto;

import my.parkuj.application.enums.AdminRole;
import my.parkuj.application.model.AdminUser;

public class AdminUserDTO {
    private Integer adminUserId;
    private String email;
    private AdminRole role;
    private String status;

    public Integer getAdminUserId() { return adminUserId; }
    public void setAdminUserId(Integer adminUserId) { this.adminUserId = adminUserId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public AdminRole getRole() { return role; }
    public void setRole(AdminRole role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static AdminUserDTO fromEntity(AdminUser entity) {
        if (entity == null) return null;
        AdminUserDTO dto = new AdminUserDTO();
        dto.adminUserId = entity.getAdminUserId();
        dto.email = entity.getEmail();
        dto.role = entity.getRole();
        dto.status = entity.getStatus();
        return dto;
    }
}
