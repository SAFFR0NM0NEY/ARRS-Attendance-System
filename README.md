# ARRS-Attendance-System

See [docs/SECURE_NETWORK_ARCHITECTURE.md](docs/SECURE_NETWORK_ARCHITECTURE.md)
for the provider-neutral production network design, campus-only attendance
access requirements, and deployment gates.

The initial standalone UI prototypes are [attendance](systems/attendance/attendance.html)
and [employees](systems/employees/employees.html). The Java API scaffold and
deployment requirements are documented in [backend/ARRS.Api/README.md](backend/ARRS.Api/README.md).
Apply the Supabase/PostgreSQL migration in
[database/migrations/V001__attendance_and_employee_security.sql](database/migrations/V001__attendance_and_employee_security.sql)
only after reviewing its role, network, and database-login prerequisites.