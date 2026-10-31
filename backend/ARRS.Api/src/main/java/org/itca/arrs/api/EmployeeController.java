package org.itca.arrs.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/employees")
@Validated
public class EmployeeController {
    private final SystemDataService dataService;

    public EmployeeController(SystemDataService dataService) {
        this.dataService = dataService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> myProfile(@AuthenticationPrincipal Jwt jwt) {
        List<Map<String, Object>> profiles = dataService.myEmployeeProfile(actorId(jwt));
        if (profiles.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "employee_profile_not_found"));
        }
        return ResponseEntity.ok(profiles.getFirst());
    }

    @GetMapping
    public List<Map<String, Object>> directory(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @Size(max = 120) String search,
            @RequestParam(required = false) UUID departmentId) {
        return dataService.employeeDirectory(actorId(jwt), search, departmentId);
    }

    @GetMapping("/departments")
    public List<Map<String, Object>> departments(@AuthenticationPrincipal Jwt jwt) {
        return dataService.departments(actorId(jwt));
    }

    @PostMapping("/profiles")
    public ResponseEntity<Map<String, String>> createProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateEmployeeRequest request) {
        String result = dataService.createEmployee(
                actorId(jwt), request.userId(), request.employeeNumber(), request.fullName(),
                request.workEmail(), request.departmentId(), request.jobTitle());
        return "created".equals(result)
                ? ResponseEntity.status(HttpStatus.CREATED).body(Map.of("result", result))
                : ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("result", "rejected"));
    }

    @PatchMapping("/profiles/{userId}")
    public ResponseEntity<Map<String, String>> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        String result = dataService.updateEmployee(
                actorId(jwt), userId, request.employeeNumber(), request.fullName(),
                request.workEmail(), request.departmentId(), request.jobTitle(), request.active());
        return switch (result) {
            case "updated" -> ResponseEntity.ok(Map.of("result", result));
            case "not_found" -> ResponseEntity.notFound().build();
            default -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("result", "rejected"));
        };
    }

    @PutMapping("/departments")
    public ResponseEntity<Map<String, String>> saveDepartment(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DepartmentRequest request) {
        String result = dataService.saveDepartment(actorId(jwt), request.name());
        return "saved".equals(result)
                ? ResponseEntity.ok(Map.of("result", result))
                : ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("result", "rejected"));
    }

    private static UUID actorId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    public record CreateEmployeeRequest(
            @NotNull UUID userId,
            @NotBlank @Size(max = 40) String employeeNumber,
            @NotBlank @Size(max = 160) String fullName,
            @NotBlank @Email @Size(max = 254) String workEmail,
            UUID departmentId,
            @NotBlank @Size(max = 120) String jobTitle) {}

    public record UpdateEmployeeRequest(
            @NotBlank @Size(max = 40) String employeeNumber,
            @NotBlank @Size(max = 160) String fullName,
            @NotBlank @Email @Size(max = 254) String workEmail,
            UUID departmentId,
            @NotBlank @Size(max = 120) String jobTitle,
            @NotNull Boolean active) {}

    public record DepartmentRequest(@NotBlank @Size(max = 120) String name) {}
}
