package org.itca.arrs.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.AssertTrue;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/attendance")
@Validated
public class AttendanceController {
    private final SystemDataService dataService;

    public AttendanceController(SystemDataService dataService) {
        this.dataService = dataService;
    }

    @GetMapping("/sessions")
    public List<Map<String, Object>> openSessions(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @NotBlank @Size(max = 80) String venueCode) {
        return dataService.openSessions(actorId(jwt), venueCode);
    }

    @PostMapping("/sessions")
    public ResponseEntity<Map<String, String>> createSession(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateSessionRequest request) {
        UUID sessionId = dataService.createSession(
                actorId(jwt),
                request.venueCode(),
                request.title(),
                Timestamp.from(request.startsAt().toInstant()),
                Timestamp.from(request.closesAt().toInstant()));
        if (sessionId == null) {
            return response(HttpStatus.FORBIDDEN, "session_creation_rejected");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("result", "created", "sessionId", sessionId.toString()));
    }

    @PostMapping("/device")
    public ResponseEntity<Map<String, String>> registerDevice(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DeviceRequest request) {
        String result = dataService.registerDevice(actorId(jwt), request.deviceId());
        return switch (result) {
            case "registered", "already_registered" -> response(HttpStatus.OK, result);
            case "admin_reset_required" -> response(HttpStatus.CONFLICT, result);
            default -> response(HttpStatus.FORBIDDEN, "rejected");
        };
    }

    @PostMapping("/check-in")
    public ResponseEntity<Map<String, String>> checkIn(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CheckInRequest request) {
        String result = dataService.checkIn(
                actorId(jwt), request.sessionId(), request.venueCode(), request.deviceId());
        return switch (result) {
            case "accepted" -> response(HttpStatus.CREATED, result);
            case "duplicate" -> response(HttpStatus.CONFLICT, result);
            case "session_closed", "invalid_venue", "invalid_device", "rejected_role" ->
                    response(HttpStatus.FORBIDDEN, result);
            default -> response(HttpStatus.UNPROCESSABLE_ENTITY, "check_in_rejected");
        };
    }

    @PostMapping("/overrides")
    public ResponseEntity<Map<String, String>> overrideAttendance(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody OverrideRequest request) {
        String result = dataService.overrideAttendance(
                actorId(jwt), request.sessionId(), request.studentId(),
                request.status(), request.reason());
        return "updated".equals(result)
                ? response(HttpStatus.OK, result)
                : response(HttpStatus.UNPROCESSABLE_ENTITY, "override_rejected");
    }

    @PostMapping("/device-reset")
    public ResponseEntity<Map<String, String>> resetDevice(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ResetDeviceRequest request) {
        String result = dataService.resetDevice(actorId(jwt), request.studentId(), request.reason());
        return "reset".equals(result)
                ? response(HttpStatus.OK, result)
                : response(HttpStatus.FORBIDDEN, "device_reset_rejected");
    }

    private static UUID actorId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    private static ResponseEntity<Map<String, String>> response(HttpStatus status, String result) {
        return ResponseEntity.status(status).body(Map.of("result", result));
    }

    public record DeviceRequest(@NotNull UUID deviceId) {}

    public record CheckInRequest(
            @NotNull UUID sessionId,
            @NotBlank @Size(max = 80) String venueCode,
            @NotNull UUID deviceId) {}

    public record OverrideRequest(
            @NotNull UUID sessionId,
            @NotNull UUID studentId,
            @NotBlank @Pattern(regexp = "present|absent|excused") String status,
            @NotBlank @Size(min = 5, max = 1000) String reason) {}

    public record ResetDeviceRequest(
            @NotNull UUID studentId,
            @NotBlank @Size(min = 5, max = 1000) String reason) {}

    public record CreateSessionRequest(
            @NotBlank @Size(max = 80) String venueCode,
            @NotBlank @Size(max = 160) String title,
            @NotNull @Future OffsetDateTime startsAt,
            @NotNull @Future OffsetDateTime closesAt) {
        @AssertTrue(message = "Session close time must be after its start time.")
        public boolean isValidWindow() {
            return startsAt == null || closesAt == null || closesAt.isAfter(startsAt);
        }
    }
}
