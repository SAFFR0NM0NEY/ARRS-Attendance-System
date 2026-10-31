package org.itca.arrs.api;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.sql.Timestamp;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SystemDataService {
    private final JdbcTemplate jdbc;

    public SystemDataService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public String registerDevice(UUID actorId, UUID deviceId) {
        return scalar("select attendance.register_device(?, ?)", actorId, deviceId);
    }

    public String checkIn(UUID actorId, UUID sessionId, String venueCode, UUID deviceId) {
        return scalar(
                "select attendance.submit_check_in(?, ?, ?, ?)",
                actorId, sessionId, venueCode, deviceId);
    }

    public UUID createSession(
            UUID actorId, String venueCode, String title, Timestamp startsAt, Timestamp closesAt) {
        return jdbc.queryForObject(
                "select attendance.create_session(?, ?, ?, ?, ?)",
                UUID.class, actorId, venueCode, title, startsAt, closesAt);
    }

    public List<Map<String, Object>> openSessions(UUID actorId, String venueCode) {
        return jdbc.queryForList(
                "select * from attendance.list_open_sessions(?, ?)", actorId, venueCode);
    }

    public String overrideAttendance(
            UUID actorId, UUID sessionId, UUID studentId, String status, String reason) {
        return scalar(
                "select attendance.override_record(?, ?, ?, ?, ?)",
                actorId, sessionId, studentId, status, reason);
    }

    public String resetDevice(UUID actorId, UUID studentId, String reason) {
        return scalar("select attendance.reset_device(?, ?, ?)", actorId, studentId, reason);
    }

    public List<Map<String, Object>> myEmployeeProfile(UUID actorId) {
        return jdbc.queryForList("select * from employee.get_my_profile(?)", actorId);
    }

    public List<Map<String, Object>> employeeDirectory(UUID actorId, String search, UUID departmentId) {
        return jdbc.queryForList(
                "select * from employee.list_directory(?, ?, ?)",
                actorId, search, departmentId);
    }

    public String createEmployee(
            UUID actorId,
            UUID userId,
            String employeeNumber,
            String fullName,
            String workEmail,
            UUID departmentId,
            String jobTitle) {
        return scalar(
                "select employee.create_profile(?, ?, ?, ?, ?, ?, ?)",
                actorId, userId, employeeNumber, fullName, workEmail, departmentId, jobTitle);
    }

    public String updateEmployee(
            UUID actorId,
            UUID userId,
            String employeeNumber,
            String fullName,
            String workEmail,
            UUID departmentId,
            String jobTitle,
            boolean active) {
        return scalar(
                "select employee.update_profile(?, ?, ?, ?, ?, ?, ?, ?)",
                actorId, userId, employeeNumber, fullName, workEmail,
                departmentId, jobTitle, active);
    }

    public String saveDepartment(UUID actorId, String name) {
        return scalar("select employee.upsert_department(?, ?)", actorId, name);
    }

    public List<Map<String, Object>> departments(UUID actorId) {
        return jdbc.queryForList("select * from employee.list_departments(?)", actorId);
    }

    private String scalar(String sql, Object... parameters) {
        return jdbc.queryForObject(sql, String.class, parameters);
    }
}
