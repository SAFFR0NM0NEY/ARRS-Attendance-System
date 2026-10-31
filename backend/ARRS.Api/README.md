# ITCA Security API

Spring Boot 3 / Java 21 API for the attendance and employee systems. It
validates Supabase access-token signatures, issuer, audience and expiry, derives
allowed roles from the administrator-managed
`app_metadata.system_roles` claim, and requires trusted-gateway headers plus
an approved CIDR for every attendance/employee API route.

The API connects to PostgreSQL using a restricted `arrs_api_runtime` database
login. It can execute only narrowly scoped `SECURITY DEFINER` functions; it
does not receive a Supabase service-role key and has no direct table grants.
SQL functions independently verify the actor's roles against
`security.system_roles`.

## Required deployment configuration

Set these values using the deployment platform's secret/configuration manager:

- `SUPABASE_JWT_ISSUER`: the project's HTTPS Auth issuer.
- `SUPABASE_JWKS_URI`: that same project's HTTPS JWKS endpoint.
- `SUPABASE_JWT_AUDIENCE`: normally `authenticated`.
- `DATABASE_JDBC_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`: direct or
  pooled PostgreSQL connection. The app forces TLS certificate and hostname
  verification (`sslmode=verify-full`).
- `SECURITY_NETWORK_GATEWAY_TOKEN`: random secret with at least 32 characters.
- `ATTENDANCE_ALLOWED_CIDRS`: comma-separated institution campus and managed
  VPN egress CIDRs.
- `EMPLOYEE_ALLOWED_CIDRS`: comma-separated managed staff/VPN egress CIDRs.

The values must be production-specific. Do not copy sample/documentation
addresses into production. Configure the API gateway to strip incoming
`X-Verified-Client-IP` and `X-Trusted-Gateway-Token` headers, then set them
itself. The origin must be private or firewall-restricted to that gateway;
the token is defense in depth, not a substitute for origin isolation. Rotate
the gateway token in both systems as a coordinated change.

## Database setup

1. Apply `database/migrations/V001__attendance_and_employee_security.sql` as
   the Supabase database owner.
2. Provision a login password out of band and create a restricted login
   member of the migration's non-login `arrs_api` role. For example, execute
   this in the provider's secure SQL console after replacing the placeholder
   with a generated secret; never commit the secret:

   ```sql
   create role arrs_api_runtime login password '<generated-secret>' in role arrs_api;
   grant connect on database postgres to arrs_api_runtime;
   alter role arrs_api_runtime set search_path = pg_catalog;
   alter role arrs_api_runtime set statement_timeout = '5s';
   ```

3. Configure the database firewall/private network to allow only the API
   runtime's egress. Do not expose the database to student or guest networks.
4. Assign `security.system_roles` and Supabase `app_metadata.system_roles`
   through trusted administrator tooling only. Keep both sources synchronized;
   never use editable `user_metadata` for authorization.
5. Run the migration and API integration tests against a non-production
   Supabase project before rollout.

The migration also creates `arrs_data_owner`, a non-login, non-superuser owner
for the new schemas, tables and security-definer functions. Do not grant
membership in either restricted role to end users or administrator accounts.

The `arrs_api_runtime` membership is intentionally limited to API functions.
Authenticated browser roles have no table grants on the new schemas and cannot
call the server-side attendance/employee mutation functions through Supabase
REST directly.

## Routes

| Route | Authorization | Network |
|---|---|---|
| `GET /api/health` | Public health status only | Public |
| `GET /api/attendance/sessions?venueCode=...` | Student | Attendance CIDR |
| `POST /api/attendance/sessions` | Trainer, faculty or admin | Attendance CIDR |
| `POST /api/attendance/device` | Student | Attendance CIDR |
| `POST /api/attendance/check-in` | Student | Attendance CIDR |
| `POST /api/attendance/overrides` | Trainer, faculty or admin | Attendance CIDR |
| `POST /api/attendance/device-reset` | Admin | Attendance CIDR |
| `GET /api/employees/me` | Employee or employee admin | Employee CIDR |
| `GET /api/employees` | Employee or employee admin | Employee CIDR |
| `GET /api/employees/departments` | Employee or employee admin | Employee CIDR |
| `POST /api/employees/profiles` | Employee admin | Employee CIDR |
| `PATCH /api/employees/profiles/{userId}` | Employee admin | Employee CIDR |
| `PUT /api/employees/departments` | Employee admin | Employee CIDR |

No server/API route should accept a role, actor ID, or verified source IP from
the JSON request. Actor identity is taken from the validated JWT subject. SQL
uses the corresponding server-maintained role table as a second authorization
check.

## Run and test

Use Java 21 and Maven:

```powershell
mvn test
mvn spring-boot:run
```

The network filter intentionally refuses to start without non-empty CIDR
allowlists and a gateway secret. The HTML pages in `systems/` are standalone
static prototypes and do not authenticate or call this API yet. Do not enable
attendance or enter real employee data through those pages until an
authenticated frontend integration and end-to-end testing are complete.

When wiring a frontend, serve it and proxy `/api/` through the same HTTPS
origin, or configure a short explicit CORS allowlist and matching CSP
`connect-src` for the exact frontend domain. Do not use wildcard credentialed
CORS. The gateway must add its trusted headers itself; browsers must never
receive the gateway secret.
