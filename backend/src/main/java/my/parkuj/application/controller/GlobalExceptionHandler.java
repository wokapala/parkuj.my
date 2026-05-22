package my.parkuj.application.controller;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import my.parkuj.application.dto.ErrorResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponseDTO> handleResponseStatusException(
        ResponseStatusException exception,
        HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        return buildResponse(status, exception.getReason(), request.getRequestURI());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponseDTO> handleMissingParameter(
        MissingServletRequestParameterException exception,
        HttpServletRequest request
    ) {
        String message = "Brak wymaganego parametru: " + exception.getParameterName() + ".";
        return buildResponse(HttpStatus.BAD_REQUEST, message, request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponseDTO> handleTypeMismatch(
        MethodArgumentTypeMismatchException exception,
        HttpServletRequest request
    ) {
        String message = "Nieprawidłowa wartość parametru: " + exception.getName() + ".";
        return buildResponse(HttpStatus.BAD_REQUEST, message, request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleGenericException(Exception exception, HttpServletRequest request) {
        return buildResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Wystąpił nieoczekiwany błąd serwera.",
            request.getRequestURI()
        );
    }

    private ResponseEntity<ErrorResponseDTO> buildResponse(HttpStatus status, String message, String path) {
        ErrorResponseDTO body = new ErrorResponseDTO(
            LocalDateTime.now(),
            status.value(),
            status.getReasonPhrase(),
            message != null ? message : status.getReasonPhrase(),
            path
        );
        return ResponseEntity.status(status).body(body);
    }
}
