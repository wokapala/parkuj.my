package my.parkuj.application.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

import my.parkuj.application.enums.BarrierActionType;
import my.parkuj.application.enums.BarrierDirection;

@Entity
public class BarrierAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BarrierActionType actionType;
    private BarrierDirection direction;
    private LocalDateTime actionTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BarrierActionType getActionType() {
        return actionType;
    }

    public void setActionType(BarrierActionType actionType) {
        this.actionType = actionType;
    }

    public BarrierDirection getDirection() {
        return direction;
    }

    public void setDirection(BarrierDirection direction) {
        this.direction = direction;
    }

    public LocalDateTime getActionTime() {
        return actionTime;
    }

    public void setActionTime(LocalDateTime actionTime) {
        this.actionTime = actionTime;
    }
}

