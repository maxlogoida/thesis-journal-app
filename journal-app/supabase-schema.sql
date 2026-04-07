-- ============================================================
-- ЖУРНАЛ ОБЛІКУ ПЕДАГОГІЧНОГО НАВАНТАЖЕННЯ — Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES (розширює auth.users) ─────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('super_admin', 'teacher', 'student')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup (for super_admin seeded manually)
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Only insert if profile doesn't already exist (admin creates profiles manually)
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── GROUPS ──────────────────────────────────────────────────
create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);

-- ─── SUBJECTS ────────────────────────────────────────────────
create table subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  teacher_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- ─── STUDENT ↔ SUBJECT ───────────────────────────────────────
create table student_subjects (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  group_id uuid not null references groups(id),
  unique(student_id, subject_id)
);

-- ─── SCHEDULE EVENTS ─────────────────────────────────────────
-- btree_gist needed for UUID + range exclusion
create extension if not exists btree_gist;

create table schedule_events (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references subjects(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('lecture', 'lab', 'seminar', 'control', 'practice')),
  title text not null,
  room text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now(),
  -- Prevent same teacher double-booking at overlapping time on same day
  constraint no_teacher_overlap exclude using gist (
    teacher_id with =,
    date with =,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp
    ) with &&
  ),
  -- Prevent same room double-booking
  constraint no_room_overlap exclude using gist (
    room with =,
    date with =,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp
    ) with &&
  )
);

create index idx_schedule_room_date on schedule_events(room, date);
create index idx_schedule_teacher_date on schedule_events(teacher_id, date);

-- ─── GRADES ──────────────────────────────────────────────────
create table grades (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  schedule_id uuid references schedule_events(id) on delete set null,
  teacher_id uuid not null references profiles(id) on delete cascade,
  grade_type text not null check (grade_type in ('class', 'control', 'monthly', 'semester', 'annual')),
  value integer not null check (value >= 0 and value <= 100),
  date date not null default current_date,
  note text,
  created_at timestamptz default now()
);

create index idx_grades_student on grades(student_id);
create index idx_grades_subject on grades(subject_id);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references subjects(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  recipient_count integer not null default 0,
  sent_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table groups enable row level security;
alter table student_subjects enable row level security;
alter table schedule_events enable row level security;
alter table grades enable row level security;
alter table notifications enable row level security;

-- Helper: get current user role
create or replace function get_my_role()
returns text language sql security definer as $$
  select role from profiles where id = auth.uid()
$$;

-- PROFILES
create policy "Anyone can read profiles" on profiles for select using (true);
create policy "Super admin can insert" on profiles for insert with check (get_my_role() = 'super_admin');
create policy "Super admin or self can update" on profiles for update using (auth.uid() = id or get_my_role() = 'super_admin');
create policy "Super admin can delete" on profiles for delete using (get_my_role() = 'super_admin');

-- GROUPS
create policy "All authenticated can read groups" on groups for select using (auth.uid() is not null);
create policy "Teachers and admin can manage groups" on groups for all using (get_my_role() in ('super_admin', 'teacher'));

-- SUBJECTS
create policy "All can read subjects" on subjects for select using (auth.uid() is not null);
create policy "Teacher owns subject or admin" on subjects for insert with check (
  get_my_role() = 'super_admin' or
  (get_my_role() = 'teacher' and teacher_id = auth.uid())
);
create policy "Teacher or admin update subject" on subjects for update using (
  get_my_role() = 'super_admin' or teacher_id = auth.uid()
);
create policy "Teacher or admin delete subject" on subjects for delete using (
  get_my_role() = 'super_admin' or teacher_id = auth.uid()
);

-- STUDENT_SUBJECTS
create policy "All can read student_subjects" on student_subjects for select using (auth.uid() is not null);
create policy "Teacher manages own subject students" on student_subjects for insert with check (
  get_my_role() = 'super_admin' or
  exists (select 1 from subjects where id = subject_id and teacher_id = auth.uid())
);
create policy "Teacher removes from own subject" on student_subjects for delete using (
  get_my_role() = 'super_admin' or
  exists (select 1 from subjects where id = subject_id and teacher_id = auth.uid())
);

-- SCHEDULE
create policy "All can read schedule" on schedule_events for select using (auth.uid() is not null);
create policy "Teacher manages own schedule" on schedule_events for insert with check (
  get_my_role() = 'super_admin' or (get_my_role() = 'teacher' and teacher_id = auth.uid())
);
create policy "Teacher or admin update schedule" on schedule_events for update using (
  get_my_role() = 'super_admin' or teacher_id = auth.uid()
);
create policy "Teacher or admin delete schedule" on schedule_events for delete using (
  get_my_role() = 'super_admin' or teacher_id = auth.uid()
);

-- GRADES
create policy "Student sees own grades" on grades for select using (
  get_my_role() = 'super_admin' or
  get_my_role() = 'teacher' or
  student_id = auth.uid()
);
create policy "Teacher manages grades" on grades for insert with check (
  get_my_role() = 'teacher' and teacher_id = auth.uid()
);
create policy "Teacher updates own grades" on grades for update using (
  get_my_role() = 'teacher' and teacher_id = auth.uid()
);
create policy "Teacher deletes own grades" on grades for delete using (
  get_my_role() = 'teacher' and teacher_id = auth.uid()
);

-- NOTIFICATIONS
create policy "Teacher sees own notifications" on notifications for select using (
  get_my_role() = 'super_admin' or teacher_id = auth.uid()
);
create policy "Teacher creates notifications" on notifications for insert with check (
  get_my_role() = 'teacher' and teacher_id = auth.uid()
);

-- ─── SEED: default super admin ───────────────────────────────
-- Run this AFTER creating the super admin user via Supabase Dashboard Auth
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@school.edu';
