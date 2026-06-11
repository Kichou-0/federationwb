-- ============================================================
-- WorkTracker - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  job_title text,
  company text,
  avatar_url text,
  theme_color text default '#6366f1',
  theme_mode text default 'light',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by authenticated users"
  on profiles for select using (auth.role() = 'authenticated');

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ============================================================
-- PROJECTS
-- ============================================================
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================
create table public.project_members (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  invited_at timestamptz default now(),
  unique(project_id, user_id)
);

alter table public.project_members enable row level security;

-- ============================================================
-- PROJECT INVITE LINKS
-- ============================================================
create table public.project_invites (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  role text default 'viewer' check (role in ('editor', 'viewer')),
  created_by uuid references public.profiles(id) on delete cascade not null,
  expires_at timestamptz,
  max_uses int,
  use_count int default 0,
  created_at timestamptz default now()
);

alter table public.project_invites enable row level security;

-- ============================================================
-- PROJECT FILES / ATTACHMENTS
-- ============================================================
create table public.project_files (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size bigint,
  created_at timestamptz default now()
);

alter table public.project_files enable row level security;

-- ============================================================
-- PROJECT REVIEWS / AVIS
-- ============================================================
create table public.project_reviews (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  rating int check (rating between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, author_id)
);

alter table public.project_reviews enable row level security;

-- ============================================================
-- REACTIONS
-- ============================================================
create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_type text not null check (target_type in ('review', 'comment', 'project')),
  target_id uuid not null,
  reaction_type text not null check (reaction_type in ('check', 'cross', 'comment')),
  created_at timestamptz default now(),
  unique(user_id, target_type, target_id, reaction_type)
);

alter table public.reactions enable row level security;

-- ============================================================
-- COMMENTS
-- ============================================================
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  target_type text not null check (target_type in ('review', 'project')),
  target_id uuid not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.comments enable row level security;

-- ============================================================
-- TASKS (suivi de projet)
-- ============================================================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Helper: is user a member of project?
create or replace function public.is_project_member(p_project_id uuid, p_user_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = p_user_id
  );
$$;

-- Helper: is user editor or owner?
create or replace function public.is_project_editor(p_project_id uuid, p_user_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = p_user_id
      and role in ('owner', 'editor')
  );
$$;

-- PROJECTS
create policy "Members can view projects"
  on projects for select
  using (is_project_member(id, auth.uid()) or owner_id = auth.uid());

create policy "Owners can insert projects"
  on projects for insert with check (auth.uid() = owner_id);

create policy "Owners/editors can update projects"
  on projects for update
  using (is_project_editor(id, auth.uid()) or owner_id = auth.uid());

create policy "Owners can delete projects"
  on projects for delete using (owner_id = auth.uid());

-- PROJECT MEMBERS
create policy "Members can view project members"
  on project_members for select
  using (is_project_member(project_id, auth.uid()));

create policy "Owners can manage members"
  on project_members for all
  using (
    exists (
      select 1 from public.projects
      where id = project_id and owner_id = auth.uid()
    )
  );

create policy "Anyone authenticated can join via invite"
  on project_members for insert with check (auth.uid() = user_id);

-- PROJECT INVITES
create policy "Members can view invites"
  on project_invites for select
  using (is_project_member(project_id, auth.uid()));

create policy "Owners can manage invites"
  on project_invites for all
  using (
    exists (
      select 1 from public.projects
      where id = project_id and owner_id = auth.uid()
    )
  );

create policy "Authenticated users can read invites by token"
  on project_invites for select
  using (auth.role() = 'authenticated');

-- PROJECT FILES
create policy "Members can view files"
  on project_files for select
  using (is_project_member(project_id, auth.uid()));

create policy "Editors can upload files"
  on project_files for insert
  with check (is_project_editor(project_id, auth.uid()));

create policy "Editors can delete files"
  on project_files for delete
  using (is_project_editor(project_id, auth.uid()) or uploaded_by = auth.uid());

-- REVIEWS
create policy "Members can view reviews"
  on project_reviews for select
  using (is_project_member(project_id, auth.uid()));

create policy "Members can write own review"
  on project_reviews for insert
  with check (auth.uid() = author_id and is_project_member(project_id, auth.uid()));

create policy "Authors can update own review"
  on project_reviews for update
  using (auth.uid() = author_id);

-- REACTIONS
create policy "Members can view reactions"
  on reactions for select
  using (auth.role() = 'authenticated');

create policy "Users can manage own reactions"
  on reactions for all
  using (auth.uid() = user_id);

-- COMMENTS
create policy "All authenticated can view comments"
  on comments for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can comment"
  on comments for insert
  with check (auth.uid() = author_id);

create policy "Authors can update comments"
  on comments for update
  using (auth.uid() = author_id);

-- TASKS
create policy "Members can view tasks"
  on tasks for select
  using (is_project_member(project_id, auth.uid()));

create policy "Editors can manage tasks"
  on tasks for all
  using (is_project_editor(project_id, auth.uid()));

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, first_name, last_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: add owner as project member on project creation
-- ============================================================
create or replace function public.handle_new_project()
returns trigger language plpgsql security definer as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute procedure public.handle_new_project();

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard or SQL)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('project-files', 'project-files', false);

-- Storage policies for avatars
-- create policy "Avatar images are publicly accessible"
--   on storage.objects for select using (bucket_id = 'avatars');
-- create policy "Anyone can upload an avatar"
--   on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
-- create policy "Users can update own avatar"
--   on storage.objects for update using (auth.uid()::text = (storage.foldername(name))[1] and bucket_id = 'avatars');

-- Storage policies for project-files
-- create policy "Project members can view files"
--   on storage.objects for select using (bucket_id = 'project-files' and auth.role() = 'authenticated');
-- create policy "Project editors can upload files"
--   on storage.objects for insert with check (bucket_id = 'project-files' and auth.role() = 'authenticated');
