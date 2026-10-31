-- Supabase/PostgreSQL migration.
-- JWT app_metadata.system_roles and security.system_roles must be assigned only
-- by a trusted administrator. Network location is enforced by the gateway/API.

create schema if not exists security;
create schema if not exists attendance;
create schema if not exists employee;

create role arrs_api nologin inherit nocreatedb nocreaterole noreplication nobypassrls;
create role arrs_data_owner nologin noinherit nocreatedb nocreaterole noreplication nobypassrls;

revoke all on schema security, attendance, employee from public, anon;
grant usage on schema security, attendance, employee to authenticated;
grant usage on schema security, attendance, employee to arrs_api;

create or replace function security.has_system_role(required_role text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' -> 'system_roles' ? required_role, false);
$$;

revoke all on function security.has_system_role(text) from public, anon;
grant execute on function security.has_system_role(text) to authenticated;

create table security.system_roles (
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (
    role in ('student', 'trainer', 'faculty', 'admin', 'employee', 'employee_admin')
  ),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table security.system_roles enable row level security;
revoke all on security.system_roles from public, anon, authenticated;

create or replace function security.user_has_system_role(p_user_id uuid, required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from security.system_roles
    where user_id = p_user_id and role = required_role
  );
$$;

revoke all on function security.user_has_system_role(uuid, text) from public, anon, authenticated;

create table attendance.sessions (
  id uuid primary key default gen_random_uuid(),
  venue_code text not null,
  title text not null,
  starts_at timestamptz not null,
  closes_at timestamptz not null,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint attendance_session_window check (closes_at > starts_at),
  constraint attendance_venue_code_not_blank check (length(btrim(venue_code)) between 1 and 80)
);

create table attendance.device_bindings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id),
  device_id uuid not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint device_revocation_consistent check (
    (active and revoked_at is null) or (not active and revoked_at is not null)
  )
);

create unique index one_active_device_per_student
  on attendance.device_bindings(student_id) where active;

create table attendance.records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references attendance.sessions(id),
  student_id uuid not null references auth.users(id),
  status text not null check (status in ('present', 'absent', 'excused')),
  marked_at timestamptz not null default now(),
  marked_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create table attendance.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  event_type text not null,
  session_id uuid references attendance.sessions(id),
  subject_id uuid references auth.users(id),
  outcome text not null check (outcome in ('accepted', 'rejected', 'changed')),
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table employee.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint department_name_not_blank check (length(btrim(name)) between 1 and 120)
);

create table employee.employee_profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  employee_number text not null unique,
  full_name text not null,
  work_email text not null unique,
  department_id uuid references employee.departments(id),
  job_title text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_number_not_blank check (length(btrim(employee_number)) between 1 and 40),
  constraint employee_name_not_blank check (length(btrim(full_name)) between 1 and 160),
  constraint employee_title_not_blank check (length(btrim(job_title)) between 1 and 120)
);

create or replace function security.user_is_active_employee(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from employee.employee_profiles
    where user_id = p_user_id and active
  );
$$;

revoke all on function security.user_is_active_employee(uuid) from public, anon, authenticated;

create table employee.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  event_type text not null,
  subject_id uuid references auth.users(id),
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create or replace function security.reject_audit_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'Audit events are append-only.' using errcode = '55000';
end;
$$;
revoke all on function security.reject_audit_mutation() from public, anon, authenticated;

create trigger attendance_audit_append_only
  before update or delete on attendance.audit_events
  for each row execute function security.reject_audit_mutation();

create trigger employee_audit_append_only
  before update or delete on employee.audit_events
  for each row execute function security.reject_audit_mutation();

create or replace function security.audit_employee_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into employee.audit_events(actor_id, event_type, subject_id, details)
  values (
    coalesce(
      nullif(current_setting('app.actor_id', true), '')::uuid,
      auth.uid()
    ),
    case when tg_op = 'INSERT' then 'employee.created'
         when tg_op = 'UPDATE' then 'employee.updated'
         else 'employee.deleted' end,
    case when tg_op = 'DELETE' then old.user_id else new.user_id end,
    case when tg_op = 'UPDATE' then jsonb_build_object(
      'employee_number_changed', old.employee_number is distinct from new.employee_number,
      'full_name_changed', old.full_name is distinct from new.full_name,
      'work_email_changed', old.work_email is distinct from new.work_email,
      'department_changed', old.department_id is distinct from new.department_id,
      'job_title_changed', old.job_title is distinct from new.job_title,
      'active_changed', old.active is distinct from new.active
    ) else '{}'::jsonb end
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
revoke all on function security.audit_employee_change() from public, anon, authenticated;

create trigger employee_profile_audit
  after insert or update or delete on employee.employee_profiles
  for each row execute function security.audit_employee_change();

create or replace function security.audit_department_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into employee.audit_events(actor_id, event_type, details)
  values (
    coalesce(
      nullif(current_setting('app.actor_id', true), '')::uuid,
      auth.uid()
    ),
    case when tg_op = 'INSERT' then 'department.created'
         when tg_op = 'UPDATE' then 'department.updated'
         else 'department.deleted' end,
    jsonb_build_object(
      'department_id',
      case when tg_op = 'DELETE' then old.id else new.id end
    )
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
revoke all on function security.audit_department_change() from public, anon, authenticated;

create trigger department_audit
  after insert or update or delete on employee.departments
  for each row execute function security.audit_department_change();

alter table attendance.sessions enable row level security;
alter table attendance.device_bindings enable row level security;
alter table attendance.records enable row level security;
alter table attendance.audit_events enable row level security;
alter table employee.departments enable row level security;
alter table employee.employee_profiles enable row level security;
alter table employee.audit_events enable row level security;

create policy attendance_sessions_staff_read
  on attendance.sessions for select to authenticated
  using (
    security.has_system_role('trainer')
    or security.has_system_role('faculty')
    or security.has_system_role('admin')
  );

create policy attendance_device_self_read
  on attendance.device_bindings for select to authenticated
  using (student_id = (select auth.uid()) or security.has_system_role('admin'));

create policy attendance_records_self_or_staff_read
  on attendance.records for select to authenticated
  using (
    student_id = (select auth.uid())
    or security.has_system_role('faculty')
    or security.has_system_role('admin')
  );

create policy attendance_audit_admin_read
  on attendance.audit_events for select to authenticated
  using (security.has_system_role('admin'));

create policy employee_departments_directory_read
  on employee.departments for select to authenticated
  using (
    security.has_system_role('employee')
    or security.has_system_role('employee_admin')
  );

create policy employee_directory_read
  on employee.employee_profiles for select to authenticated
  using (
    (active and (
      security.has_system_role('employee')
      or security.has_system_role('employee_admin')
    ))
    or user_id = (select auth.uid())
  );

create policy employee_audit_admin_read
  on employee.audit_events for select to authenticated
  using (security.has_system_role('employee_admin'));

revoke all on all tables in schema security, attendance, employee
  from public, anon, authenticated;

create or replace function attendance.register_device(p_actor_id uuid, p_device_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := p_actor_id;
  bound_device_id uuid;
begin
  if current_user_id is null
     or not security.user_has_system_role(current_user_id, 'student')
     or p_device_id is null then
    if current_user_id is not null then
      insert into attendance.audit_events(actor_id, event_type, outcome)
      values (current_user_id, 'device.registration', 'rejected');
    end if;
    return 'rejected';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));
  select device_id into bound_device_id
  from attendance.device_bindings
  where student_id = current_user_id and active
  for update;

  if bound_device_id is not null then
    if bound_device_id = p_device_id then
      return 'already_registered';
    end if;
    insert into attendance.audit_events(actor_id, event_type, outcome)
    values (current_user_id, 'device.change_attempt', 'rejected');
    return 'admin_reset_required';
  end if;

  insert into attendance.device_bindings(student_id, device_id)
  values (current_user_id, p_device_id);
  insert into attendance.audit_events(actor_id, event_type, outcome)
  values (current_user_id, 'device.registered', 'accepted');
  return 'registered';
end;
$$;

create or replace function attendance.create_session(
  p_actor_id uuid,
  p_venue_code text,
  p_title text,
  p_starts_at timestamptz,
  p_closes_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_session_id uuid;
begin
  if p_actor_id is null
     or not (
       security.user_has_system_role(p_actor_id, 'trainer')
       or
       security.user_has_system_role(p_actor_id, 'faculty')
       or security.user_has_system_role(p_actor_id, 'admin')
     )
     or length(btrim(coalesce(p_venue_code, ''))) not between 1 and 80
     or length(btrim(coalesce(p_title, ''))) not between 1 and 160
     or p_starts_at is null
     or p_closes_at is null
     or p_closes_at <= p_starts_at then
    insert into attendance.audit_events(actor_id, event_type, outcome)
    values (p_actor_id, 'attendance.session.create', 'rejected');
    return null;
  end if;

  insert into attendance.sessions(venue_code, title, starts_at, closes_at, created_by)
  values (btrim(p_venue_code), btrim(p_title), p_starts_at, p_closes_at, p_actor_id)
  returning id into created_session_id;

  insert into attendance.audit_events(actor_id, event_type, session_id, outcome)
  values (p_actor_id, 'attendance.session.create', created_session_id, 'accepted');
  return created_session_id;
end;
$$;

create or replace function attendance.list_open_sessions(
  p_actor_id uuid,
  p_venue_code text
)
returns table (
  id uuid,
  title text,
  venue_code text,
  starts_at timestamptz,
  closes_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null
     or not security.user_has_system_role(p_actor_id, 'student')
     or p_venue_code is null then
    return;
  end if;

  return query
  select session.id, session.title, session.venue_code,
         session.starts_at, session.closes_at
  from attendance.sessions session
  where session.active
    and session.venue_code = p_venue_code
    and session.starts_at <= now()
    and session.closes_at >= now()
  order by session.starts_at
  limit 50;
end;
$$;

create or replace function attendance.submit_check_in(
  p_actor_id uuid,
  p_session_id uuid,
  p_venue_code text,
  p_device_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := p_actor_id;
  session_record attendance.sessions%rowtype;
  registered_device uuid;
  inserted_count integer;
begin
  if current_user_id is null
     or not security.user_has_system_role(current_user_id, 'student') then
    insert into attendance.audit_events(actor_id, event_type, session_id, outcome)
    values (current_user_id, 'attendance.check_in', p_session_id, 'rejected');
    return 'rejected_role';
  end if;

  if p_session_id is null or p_device_id is null or p_venue_code is null then
    insert into attendance.audit_events(actor_id, event_type, session_id, outcome)
    values (current_user_id, 'attendance.check_in', p_session_id, 'rejected');
    return 'invalid_request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));
  select * into session_record
  from attendance.sessions
  where id = p_session_id and active
    and starts_at <= now() and closes_at >= now()
  for share;

  if not found then
    insert into attendance.audit_events(actor_id, event_type, session_id, outcome)
    values (current_user_id, 'attendance.check_in', p_session_id, 'rejected');
    return 'session_closed';
  end if;

  if p_venue_code is null or session_record.venue_code <> p_venue_code then
    insert into attendance.audit_events(actor_id, event_type, session_id, outcome)
    values (current_user_id, 'attendance.check_in', p_session_id, 'rejected');
    return 'invalid_venue';
  end if;

  select device_id into registered_device
  from attendance.device_bindings
  where student_id = current_user_id and active;

  if registered_device is null or registered_device <> p_device_id then
    insert into attendance.audit_events(actor_id, event_type, session_id, outcome)
    values (current_user_id, 'attendance.check_in', p_session_id, 'rejected');
    return 'invalid_device';
  end if;

  insert into attendance.records(session_id, student_id, status, marked_by)
  values (p_session_id, current_user_id, 'present', current_user_id)
  on conflict (session_id, student_id) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    insert into attendance.audit_events(actor_id, event_type, session_id, outcome)
    values (current_user_id, 'attendance.duplicate_check_in', p_session_id, 'rejected');
    return 'duplicate';
  end if;

  insert into attendance.audit_events(actor_id, event_type, session_id, outcome)
  values (current_user_id, 'attendance.check_in', p_session_id, 'accepted');
  return 'accepted';
end;
$$;

create or replace function attendance.override_record(
  p_actor_id uuid,
  p_session_id uuid,
  p_student_id uuid,
  p_status text,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := p_actor_id;
  previous_status text;
begin
  if current_user_id is null
     or not (
       security.user_has_system_role(current_user_id, 'trainer')
       or
       security.user_has_system_role(current_user_id, 'faculty')
       or security.user_has_system_role(current_user_id, 'admin')
     )
     or length(btrim(coalesce(p_reason, ''))) < 5
     or p_status is null
     or p_status not in ('present', 'absent', 'excused') then
    insert into attendance.audit_events(actor_id, event_type, session_id, subject_id, outcome)
    values (current_user_id, 'attendance.override', p_session_id, p_student_id, 'rejected');
    return 'rejected';
  end if;

  if not exists (select 1 from attendance.sessions where id = p_session_id) then
    insert into attendance.audit_events(actor_id, event_type, session_id, subject_id, outcome)
    values (current_user_id, 'attendance.override', p_session_id, p_student_id, 'rejected');
    return 'session_not_found';
  end if;

  select status into previous_status
  from attendance.records
  where session_id = p_session_id and student_id = p_student_id
  for update;

  insert into attendance.records(session_id, student_id, status, marked_by)
  values (p_session_id, p_student_id, p_status, current_user_id)
  on conflict (session_id, student_id) do update
    set status = excluded.status,
        marked_by = excluded.marked_by,
        marked_at = now(),
        updated_at = now();

  insert into attendance.audit_events(
    actor_id, event_type, session_id, subject_id, outcome, details
  )
  values (
    current_user_id, 'attendance.override', p_session_id, p_student_id, 'changed',
    jsonb_build_object(
      'previous_status', previous_status,
      'status', p_status,
      'reason', left(btrim(p_reason), 1000)
    )
  );
  return 'updated';
end;
$$;

create or replace function attendance.reset_device(
  p_actor_id uuid,
  p_student_id uuid,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := p_actor_id;
begin
  if current_user_id is null
     or not security.user_has_system_role(current_user_id, 'admin')
     or length(btrim(coalesce(p_reason, ''))) < 5 then
    insert into attendance.audit_events(actor_id, event_type, subject_id, outcome)
    values (current_user_id, 'device.reset', p_student_id, 'rejected');
    return 'rejected';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_student_id::text, 0));
  update attendance.device_bindings
  set active = false, revoked_at = now()
  where student_id = p_student_id and active;

  insert into attendance.audit_events(
    actor_id, event_type, subject_id, outcome, details
  )
  values (
    current_user_id, 'device.reset', p_student_id, 'changed',
    jsonb_build_object('reason', left(btrim(p_reason), 1000))
  );
  return 'reset';
end;
$$;

revoke all on function attendance.register_device(uuid, uuid) from public, anon, authenticated;
revoke all on function attendance.create_session(uuid, text, text, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function attendance.list_open_sessions(uuid, text) from public, anon, authenticated;
revoke all on function attendance.submit_check_in(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function attendance.override_record(uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function attendance.reset_device(uuid, uuid, text) from public, anon, authenticated;
grant execute on function attendance.register_device(uuid, uuid) to arrs_api;
grant execute on function attendance.create_session(uuid, text, text, timestamptz, timestamptz)
  to arrs_api;
grant execute on function attendance.list_open_sessions(uuid, text) to arrs_api;
grant execute on function attendance.submit_check_in(uuid, uuid, text, uuid) to arrs_api;
grant execute on function attendance.override_record(uuid, uuid, uuid, text, text) to arrs_api;
grant execute on function attendance.reset_device(uuid, uuid, text) to arrs_api;

create or replace function employee.get_my_profile(p_actor_id uuid)
returns table (
  user_id uuid,
  employee_number text,
  full_name text,
  work_email text,
  department_id uuid,
  department_name text,
  job_title text,
  active boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null or not (
    security.user_has_system_role(p_actor_id, 'employee')
    or security.user_has_system_role(p_actor_id, 'employee_admin')
  ) or not security.user_is_active_employee(p_actor_id) then
    return;
  end if;

  return query
  select profile.user_id, profile.employee_number, profile.full_name,
         profile.work_email, profile.department_id, department.name,
         profile.job_title, profile.active
  from employee.employee_profiles profile
  left join employee.departments department on department.id = profile.department_id
  where profile.user_id = p_actor_id and profile.active;
end;
$$;

create or replace function employee.list_directory(
  p_actor_id uuid,
  p_search text default null,
  p_department_id uuid default null
)
returns table (
  user_id uuid,
  employee_number text,
  full_name text,
  work_email text,
  department_id uuid,
  department_name text,
  job_title text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null or not (
    security.user_has_system_role(p_actor_id, 'employee')
    or security.user_has_system_role(p_actor_id, 'employee_admin')
  ) or not security.user_is_active_employee(p_actor_id) then
    return;
  end if;

  return query
  select profile.user_id, profile.employee_number, profile.full_name,
         profile.work_email, profile.department_id, department.name,
         profile.job_title
  from employee.employee_profiles profile
  left join employee.departments department on department.id = profile.department_id
  where profile.active
    and (p_department_id is null or profile.department_id = p_department_id)
    and (
      nullif(btrim(p_search), '') is null
      or profile.full_name ilike '%' || left(btrim(p_search), 120) || '%'
      or profile.job_title ilike '%' || left(btrim(p_search), 120) || '%'
    )
  order by profile.full_name
  limit 100;
end;
$$;

create or replace function employee.create_profile(
  p_actor_id uuid,
  p_user_id uuid,
  p_employee_number text,
  p_full_name text,
  p_work_email text,
  p_department_id uuid,
  p_job_title text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null
     or not security.user_has_system_role(p_actor_id, 'employee_admin')
     or not security.user_is_active_employee(p_actor_id) then
    insert into employee.audit_events(actor_id, event_type, subject_id)
    values (p_actor_id, 'employee.profile.create_rejected', p_user_id);
    return 'rejected';
  end if;

  perform set_config('app.actor_id', p_actor_id::text, true);
  insert into employee.employee_profiles(
    user_id, employee_number, full_name, work_email, department_id, job_title
  )
  values (
    p_user_id, btrim(p_employee_number), btrim(p_full_name), lower(btrim(p_work_email)),
    p_department_id, btrim(p_job_title)
  );
  return 'created';
end;
$$;

create or replace function employee.update_profile(
  p_actor_id uuid,
  p_user_id uuid,
  p_employee_number text,
  p_full_name text,
  p_work_email text,
  p_department_id uuid,
  p_job_title text,
  p_active boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if p_actor_id is null
     or not security.user_has_system_role(p_actor_id, 'employee_admin')
     or not security.user_is_active_employee(p_actor_id) then
    insert into employee.audit_events(actor_id, event_type, subject_id)
    values (p_actor_id, 'employee.profile.update_rejected', p_user_id);
    return 'rejected';
  end if;

  perform set_config('app.actor_id', p_actor_id::text, true);
  update employee.employee_profiles
  set employee_number = btrim(p_employee_number),
      full_name = btrim(p_full_name),
      work_email = lower(btrim(p_work_email)),
      department_id = p_department_id,
      job_title = btrim(p_job_title),
      active = p_active,
      updated_at = now()
  where user_id = p_user_id;
  get diagnostics affected_rows = row_count;

  if affected_rows = 0 then
    return 'not_found';
  end if;
  return 'updated';
end;
$$;

create or replace function employee.upsert_department(p_actor_id uuid, p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null
     or not security.user_has_system_role(p_actor_id, 'employee_admin')
     or not security.user_is_active_employee(p_actor_id)
     or length(btrim(coalesce(p_name, ''))) not between 1 and 120 then
    insert into employee.audit_events(actor_id, event_type)
    values (p_actor_id, 'department.update_rejected');
    return 'rejected';
  end if;

  perform set_config('app.actor_id', p_actor_id::text, true);
  insert into employee.departments(name)
  values (btrim(p_name))
  on conflict (name) do update set active = true;
  return 'saved';
end;
$$;

create or replace function employee.list_departments(p_actor_id uuid)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null or not (
    security.user_has_system_role(p_actor_id, 'employee')
    or security.user_has_system_role(p_actor_id, 'employee_admin')
  ) or not security.user_is_active_employee(p_actor_id) then
    return;
  end if;

  return query
  select department.id, department.name
  from employee.departments department
  where department.active
  order by department.name;
end;
$$;

revoke all on function employee.get_my_profile(uuid) from public, anon, authenticated;
revoke all on function employee.list_directory(uuid, text, uuid) from public, anon, authenticated;
revoke all on function employee.create_profile(uuid, uuid, text, text, text, uuid, text)
  from public, anon, authenticated;
revoke all on function employee.update_profile(uuid, uuid, text, text, text, uuid, text, boolean)
  from public, anon, authenticated;
revoke all on function employee.upsert_department(uuid, text) from public, anon, authenticated;
revoke all on function employee.list_departments(uuid) from public, anon, authenticated;
grant execute on function employee.get_my_profile(uuid) to arrs_api;
grant execute on function employee.list_directory(uuid, text, uuid) to arrs_api;
grant execute on function employee.create_profile(uuid, uuid, text, text, text, uuid, text)
  to arrs_api;
grant execute on function employee.update_profile(uuid, uuid, text, text, text, uuid, text, boolean)
  to arrs_api;
grant execute on function employee.upsert_department(uuid, text) to arrs_api;
grant execute on function employee.list_departments(uuid) to arrs_api;

comment on table attendance.device_bindings is
  'Browser device IDs are copyable and are risk signals only, not hardware identity.';
comment on table attendance.audit_events is
  'Append-only application audit events. Export to a separately restricted log service for tamper resistance.';
comment on table employee.employee_profiles is
  'Minimal employee directory data only; payroll and sensitive HR records are out of scope.';

grant usage, create on schema security, attendance, employee to arrs_data_owner;
grant usage on schema auth to arrs_data_owner;

alter table security.system_roles owner to arrs_data_owner;
alter table attendance.sessions owner to arrs_data_owner;
alter table attendance.device_bindings owner to arrs_data_owner;
alter table attendance.records owner to arrs_data_owner;
alter table attendance.audit_events owner to arrs_data_owner;
alter table employee.departments owner to arrs_data_owner;
alter table employee.employee_profiles owner to arrs_data_owner;
alter table employee.audit_events owner to arrs_data_owner;

alter function security.has_system_role(text) owner to arrs_data_owner;
alter function security.user_has_system_role(uuid, text) owner to arrs_data_owner;
alter function security.user_is_active_employee(uuid) owner to arrs_data_owner;
alter function security.reject_audit_mutation() owner to arrs_data_owner;
alter function security.audit_employee_change() owner to arrs_data_owner;
alter function security.audit_department_change() owner to arrs_data_owner;
alter function attendance.register_device(uuid, uuid) owner to arrs_data_owner;
alter function attendance.create_session(uuid, text, text, timestamptz, timestamptz)
  owner to arrs_data_owner;
alter function attendance.list_open_sessions(uuid, text) owner to arrs_data_owner;
alter function attendance.submit_check_in(uuid, uuid, text, uuid) owner to arrs_data_owner;
alter function attendance.override_record(uuid, uuid, uuid, text, text) owner to arrs_data_owner;
alter function attendance.reset_device(uuid, uuid, text) owner to arrs_data_owner;
alter function employee.get_my_profile(uuid) owner to arrs_data_owner;
alter function employee.list_directory(uuid, text, uuid) owner to arrs_data_owner;
alter function employee.create_profile(uuid, uuid, text, text, text, uuid, text)
  owner to arrs_data_owner;
alter function employee.update_profile(uuid, uuid, text, text, text, uuid, text, boolean)
  owner to arrs_data_owner;
alter function employee.upsert_department(uuid, text) owner to arrs_data_owner;
alter function employee.list_departments(uuid) owner to arrs_data_owner;
