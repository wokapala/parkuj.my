package my.parkuj.application.dto;

import java.time.LocalDateTime;

import my.parkuj.application.enums.PlateRecognitionResult;

// DTO przychodzący z Python OCR serwisu
public class PlateEventDTO {
    private String plate;
    private Double confidence;
    private PlateRecognitionResult result;
    private LocalDateTime eventTime;
    private Long gateId; // opcjonalnie id bramy/kamery

    public String getPlate() { return plate; }
    public void setPlate(String plate) { this.plate = plate; }
    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
    public PlateRecognitionResult getResult() { return result; }
    public void setResult(PlateRecognitionResult result) { this.result = result; }
    public LocalDateTime getEventTime() { return eventTime; }
    public void setEventTime(LocalDateTime eventTime) { this.eventTime = eventTime; }
    public Long getGateId() { return gateId; }
    public void setGateId(Long gateId) { this.gateId = gateId; }
}

