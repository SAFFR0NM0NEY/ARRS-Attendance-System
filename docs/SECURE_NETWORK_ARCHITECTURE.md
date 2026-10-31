# Secure Network Architecture

## Status and scope

This is the provider-neutral production target for ITCA attendance and the
separate employee directory system. The repository now includes standalone
HTML UI prototypes, a Spring Boot API scaffold, and a Supabase/PostgreSQL
migration. No cloud network, gateway, database login, DNS, campus CIDR, or
production domain has been provisioned. The code defines application-side
checks; this document defines the infrastructure controls still required.

The policy is to make the portal reachable over HTTPS, but accept attendance
check-in and overrides only when the request originates from an approved campus
network or managed campus VPN. Authentication may be available off campus.
Network location is an additional condition, never a substitute for identity,
authorization, or attendance-session validation.

## Target topology

```text
                  Public Internet
                         |
              DNS (managed, DNSSEC if available)
                         |
               CDN / DDoS protection / WAF
                  HTTPS :443 only
                         |
             Static frontend (public read-only)
                  |                 |
       Supabase Auth :443    Attendance API :443
       (public endpoint)          |
                             WAF / API gateway
                       real client-IP allowlist
                       campus + managed VPN egress
                                  |
                      private application runtime
                     HTTPS only; no public admin
                         |                |
               Supabase Auth/JWKS     Supabase DB
                    HTTPS :443      TLS :5432 or HTTPS
                         |
          centralized, restricted audit/alert service

Campus managed Wi-Fi/VPN -- outbound HTTPS :443 --> approved services
Guest Wi-Fi              -- outbound Internet only; no internal routes
Admin access             -- managed VPN + MFA + bastion/SSM; never public SSH/RDP
```

Keep the frontend, identity provider, attendance API, database, and management
plane as distinct trust zones. The frontend is public and untrusted. Do not put
database credentials, service-role keys, signing keys, or administrative
endpoints in frontend assets, source maps, browser storage, or build variables.

## Network zones and access rules

| Source | Destination | Allow | Deny |
|---|---|---|---|
| Public clients | Frontend CDN/WAF | TCP 443 | All other inbound ports |
| Public clients | Supabase Auth | TCP 443 as required for login and token refresh | Direct attendance table writes or privileged RPCs |
| Campus public egress / managed VPN egress | Attendance API gateway | TCP 443 | All other source networks for attendance routes |
| Public clients | Attendance API gateway | TCP 443 only for explicitly public, non-attendance endpoints | Check-in, override, device registration, and attendance-report mutation routes |
| API gateway | Private application service | Configured service port, authenticated gateway-to-origin connection | Direct public access to the origin |
| Application service | Supabase | TLS only, minimum required endpoints and credentials | Unencrypted database connections and broad administrative access |
| Application service | Log/monitoring collector | TLS outbound | Public inbound access to log systems |
| Admin workstation | Cloud management plane | Managed VPN or identity-aware access with MFA | Public SSH/RDP, shared admin accounts, unmanaged networks |
| Guest Wi-Fi | Campus LAN, management, database, printers | None | All private campus destinations |
| Student Wi-Fi | Attendance API | TCP 443 through approved egress | Lateral access to other campus clients and private services |

Use default-deny inbound and east-west rules. Permit only established return
traffic and explicitly required egress. Where a managed service cannot expose
fixed destination addresses, use its documented private connectivity or
service-aware egress controls; do not solve this by opening unrestricted
outbound traffic without recording the exception and owner.

### Campus access points and egress

- Put student devices on a dedicated SSID/VLAN with client isolation; they
  should not be able to connect to one another or to staff, server, or
  management subnets.
- Keep guest devices on a separate internet-only network with a captive portal
  if required. Do not treat guest Wi-Fi as an approved attendance network.
- Route approved attendance traffic through managed egress with one or more
  stable public IPv4/IPv6 addresses. Record the exact CIDRs, owners, ISP, and
  failover addresses in deployment secrets/configuration, not in frontend
  code. Allowlist only those current, institution-controlled ranges.
- Permit managed VPN egress only if it is institution-controlled, MFA-protected,
  logged, and intended for eligible users. A public consumer VPN is not an
  approved source.
- Restrict internal network administration to staff/admin networks and
  managed VPN. Never expose database, cloud consoles, SSH, RDP, or device
  management interfaces to the student or guest VLAN.

## Request and trust requirements

1. A user signs in with Supabase Auth over HTTPS. The browser receives only the
   public anon/publishable key and a user session.
2. Attendance actions go to the server-side API, not direct table writes from
   the browser. The gateway derives the source address from the network
   connection, checks it against the approved campus/VPN ranges, applies
   request limits, and forwards only to the private API origin.
3. The API independently validates the Supabase JWT signature, issuer,
   audience, expiry, and subject; obtains the user's role from a
   trusted server-side source; and applies least-privilege authorization.
   Never authorize based on a client-supplied role, student ID, IP header, or
   device identifier.
4. The API validates the active class/session, fixed venue QR context,
   server-side time window, registered device policy, and duplicate state in a
   single database transaction. A static venue QR is an identifier, not
   proof-of-presence or authorization.
5. Database permissions deny anonymous and ordinary authenticated clients
   direct writes to attendance, device-binding, override, and audit records.
   Row Level Security is enabled and tested for every exposed table and RPC.
   Privileged service credentials exist only on the server and have narrowly
   scoped use.
6. Every accepted or rejected check-in, override, device reset, and
   authorization failure produces a server-side audit event. The application
   role cannot edit or delete audit entries. Export security events to a
   separate restricted log destination with retention and alerting.

The API filter accepts `X-Verified-Client-IP` and
`X-Trusted-Gateway-Token` only as a contract with a private trusted gateway.
The gateway must remove client-supplied copies and set its own values. The SQL
migration grants browser roles no direct access to the new attendance or
employee tables and grants the API's restricted database role only function
execution. The new static HTML pages are prototypes and are not connected to
Supabase Auth or the API.

At deployment, apply the campus/VPN allowlist at the gateway as well as in the
API. Restrict the API origin to gateway traffic, and restrict PostgreSQL ingress
to the API runtime. Populate the allowlists only with institution-controlled
egress CIDRs. The gateway token must be random, at least 32 characters, stored
as a secret at both ends, and rotated without logging its value.

### Client IP and proxy handling

- The gateway must use the source address it observes on the connection (or a
  platform-provided authenticated client-IP field). It must remove
  client-provided `Forwarded`, `X-Forwarded-For`, and similar headers, then set
  a canonical value for the application.
- The application must trust forwarded-IP headers only when the immediate
  peer is an explicitly trusted gateway. Requests reaching the API origin
  directly must be blocked by private networking/firewall rules and rejected
  by origin authentication.
- Do not use browser JavaScript, geolocation, `Origin`, or user-supplied IP
  fields as proof that a device is on campus.
- NAT, mobile carriers, IPv6 privacy addressing, and ISP failover can change
  source addresses. Test the actual campus and VPN egress addresses, include
  approved IPv6 ranges if IPv6 is available, and alert on allowlist drift.

### Device identity

A browser-generated UUID, cookie, or fingerprint can be copied, cleared, or
spoofed; it is a risk signal, not strong proof of a physical device. Keep any
device registration and reset flow server-authorized, logged, and revocable.
If stronger device assurance is required, use managed devices with hardware-
backed keys and a managed client application. Do not issue downloadable
student private keys from a public web page or rely on browser mTLS support
without validating the supported devices and lifecycle.

## TLS, DNS, and edge protections

- Serve the frontend, gateway, API, and service-to-service connections over
  TLS 1.2 or newer; prefer TLS 1.3 where all required clients support it.
  Automate certificate renewal and alert before expiry.
- Redirect HTTP to HTTPS at the edge and enable HSTS after confirming every
  production subdomain supports HTTPS. Do not use `TrustServerCertificate`
  or disable certificate validation.
- Use a managed DNS provider, restrict DNS administration with MFA and least
  privilege, enable DNSSEC where supported, and monitor unexpected record or
  certificate changes.
- Put DDoS protection and a WAF/rate limiter in front of public web/API
  endpoints. Apply stricter per-user and per-source limits to login,
  registration, check-in, and override endpoints. A WAF does not replace
  authentication, RLS, or application validation.
- Set a restrictive Content Security Policy and other browser security headers
  at the frontend host. Allow only the specific production Supabase and API
  origins needed by the app; do not use wildcard origins for credentials.
- Keep development, staging, and production in separate projects/accounts,
  with separate hostnames, keys, databases, and campus allowlists.

## Operations and monitoring

- Centralize gateway firewall/WAF events, authentication events, API security
  decisions, database audit events, and cloud control-plane events. Restrict
  log access to authorized operators and retain logs under the institution's
  approved retention policy.
- Alert on off-network attendance attempts, blocked origin requests, repeated
  login failures, rate-limit spikes, role/privilege changes, device resets,
  overrides, audit-log delivery failures, and changes to firewall rules,
  DNS, certificates, or campus egress CIDRs.
- Synchronize clocks with trusted time sources. Attendance-window decisions
  use server time, not browser time.
- Keep infrastructure changes reviewed and auditable. Back up database and
  configuration, test restoration, and maintain an incident runbook for
  credential revocation, source-IP changes, and service outages.
- Define a documented administrative break-glass path with MFA, short-lived
  access, approval, and audit logging; do not bypass normal controls silently.

## Deployment gates

Do not enable real attendance until all of these are verified:

- [ ] Production domains and stable campus/VPN egress CIDRs are confirmed.
- [ ] The attendance API is deployed behind a gateway; the origin is not
      publicly reachable.
- [ ] Attendance UI calls the API; no browser path can write attendance,
      overrides, device bindings, or audit rows directly.
- [ ] JWT validation, server-side role checks, RLS, and least-privilege
      database grants are tested using anonymous, student, staff, and admin
      identities.
- [ ] Check-in attempts from public/non-campus networks fail server-side;
      approved campus and managed-VPN networks pass; spoofed forwarding
      headers do not change the result.
- [ ] Duplicate/replay requests are rejected atomically; session/time/QR
      policy is enforced using server time and a database transaction.
- [ ] Override and device-reset paths require the authorized role, mandatory
      reason, and append-only audit event.
- [ ] WAF/rate limits, TLS, certificate renewal, DNS protection, alerts, log
      retention, backups, restore tests, and incident procedures are active.

## Information required to provision actual resources

Provider-specific firewall, gateway, WAF, private networking, and DNS
configuration cannot be safely generated from this repository alone. Before
deploying resources, the administrator must supply the hosting provider and
regions, production domain, campus and VPN public CIDRs (including IPv6),
availability/backup requirements, and the chosen server-side attendance
runtime. Do not put these values or credentials into the public frontend.
