package my.parkuj.application.controller;

import java.util.List;
import my.parkuj.application.dto.VehicleDTO;
import my.parkuj.application.service.VehicleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public List<VehicleDTO> getVehicles(@RequestParam Integer customerId) {
        return vehicleService.getVehiclesForCustomer(customerId);
    }

    @PostMapping
    public ResponseEntity<VehicleDTO> addVehicle(@RequestBody VehicleDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.addVehicle(request));
    }

    @PatchMapping("/{vehicleId}/primary")
    public VehicleDTO setPrimaryVehicle(
        @PathVariable Integer vehicleId,
        @RequestParam Integer customerId
    ) {
        return vehicleService.setPrimaryVehicle(customerId, vehicleId);
    }

    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<Void> deleteVehicle(
        @PathVariable Integer vehicleId,
        @RequestParam Integer customerId
    ) {
        vehicleService.deleteVehicle(customerId, vehicleId);
        return ResponseEntity.noContent().build();
    }
}

