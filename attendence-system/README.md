# ITCA Digital Attendance Register

The frontend is a React application built with Vite and Supabase Auth.

## Run locally

1. Install dependencies with `npm install`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in a local `.env` file.
   The URL must use HTTPS except for localhost development. The anon key is
   intended for browser use; never put a Supabase service-role key in the
   frontend or commit credentials.
3. Start the app with `npm run dev`. Run `npm run lint` and `npm run build` to
   validate changes.

## Current frontend security controls

- Login verifies the authenticated user's `profiles.role` against the known
  application roles before routing, and rejects unsafe post-login destinations.
- Registration does not accept or submit a user-selected role. Accounts require
  an administrator-assigned role before protected pages are available.
- Protected routes fail closed when the session or role cannot be verified.
- The staff-management panel is only rendered in the admin area.
- Supabase must use HTTPS outside local development; auth uses PKCE.

These are frontend safeguards, not authorization boundaries. A browser user can
modify client code or call Supabase APIs directly. Configure Supabase Row Level
Security and server-side authorization for every table and RPC; do not rely on
route guards or hidden UI. The repository currently does not contain the
database schema or attendance backend, so attendance-critical controls are not
implemented here. In particular, session/QR-window checks, campus IP
validation, device binding, duplicate rejection, override authorization, and
append-only audit logging must be enforced and tested on the server before this
app is used for real attendance.
