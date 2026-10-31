package org.itca.arrs.api;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SystemController {
    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/api/attendance/network-check")
    public Map<String, String> attendanceNetworkCheck() {
        return Map.of("system", "attendance", "network", "approved");
    }

    @GetMapping("/api/employees/network-check")
    public Map<String, String> employeeNetworkCheck() {
        return Map.of("system", "employees", "network", "approved");
    }
}
