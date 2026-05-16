package my.parkuj.application.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import my.parkuj.application.dto.PlateEventDTO;

@RestController
@RequestMapping("/api/barrier")
public class BarrierController {

    // Odbiera zdarzenia OCR z zewnętrznego serwisu Python
    @PostMapping("/events")
    public void handleOcrEvent(@RequestBody PlateEventDTO event) {
        // TODO: deleguj do OcrEventService
    }
}

