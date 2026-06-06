package my.parkuj.application.controller;

import java.util.List;
import my.parkuj.application.dto.ContactMessageDTO;
import my.parkuj.application.model.ContactMessage;
import my.parkuj.application.repository.ContactMessageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactMessageRepository repository;

    public ContactController(ContactMessageRepository repository) {
        this.repository = repository;
    }

    // Publiczny endpoint — formularz kontaktowy nie wymaga logowania.
    @PostMapping
    public ResponseEntity<ContactMessageDTO> send(@RequestBody ContactMessageDTO request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Brak danych wiadomości.");
        }
        if (isBlank(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj adres e-mail.");
        }
        if (isBlank(request.getMessage()) || request.getMessage().trim().length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Treść wiadomości musi mieć co najmniej 10 znaków.");
        }

        ContactMessage entity = new ContactMessage();
        entity.setFirstName(trimOrNull(request.getFirstName()));
        entity.setLastName(trimOrNull(request.getLastName()));
        entity.setEmail(request.getEmail().trim());
        entity.setSubject(trimOrNull(request.getSubject()));
        entity.setMessage(request.getMessage().trim());

        return ResponseEntity.status(HttpStatus.CREATED).body(ContactMessageDTO.fromEntity(repository.save(entity)));
    }

    // Lista wiadomości (do panelu admina — przyszłość; teraz przydatne do testu).
    @GetMapping
    public List<ContactMessageDTO> list() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
            .map(ContactMessageDTO::fromEntity)
            .toList();
    }

    private boolean isBlank(String value) { return value == null || value.isBlank(); }
    private String trimOrNull(String value) { return value == null ? null : value.trim(); }
}
