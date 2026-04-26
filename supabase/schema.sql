-- ============================================================
-- Quad — complete schema with admin approval system
-- Paste this ENTIRE file into Supabase SQL Editor → Run
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Profiles ─────────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  first_name   text not null,
  last_name    text not null,
  username     text unique not null,
  email        text not null,
  bio          text,
  department   text,
  year         text,
  section      text,
  usn          text,
  id_card_path text,          -- storage path; deleted by admin after approval
  id_verified  boolean default false,
  avatar_url   text,
  website      text,
  role         text default 'student' check (role in ('student','admin')),
  status       text default 'pending' check (status in ('pending','approved','rejected')),
  created_at   timestamptz default now()
);

-- ── Posts (home feed + help feed) ────────────────────────────
create table posts (
  id         uuid default uuid_generate_v4() primary key,
  author_id  uuid references profiles(id) on delete cascade not null,
  content    text not null,
  type       text default 'general' check (type in ('general','help','project')),
  visibility text default 'public'  check (visibility in ('public','private')),
  created_at timestamptz default now()
);

-- ── Help offers ───────────────────────────────────────────────
create table help_offers (
  id         uuid default uuid_generate_v4() primary key,
  post_id    uuid references posts(id) on delete cascade not null,
  offerer_id uuid references profiles(id) on delete cascade not null,
  message    text not null,
  created_at timestamptz default now(),
  unique(post_id, offerer_id)
);

-- ── Direct messages ───────────────────────────────────────────
create table messages (
  id              uuid default uuid_generate_v4() primary key,
  conversation_id text not null,
  sender_id       uuid references profiles(id) on delete cascade not null,
  receiver_id     uuid references profiles(id) on delete cascade not null,
  content         text not null,
  read            boolean default false,
  created_at      timestamptz default now()
);
create index on messages (conversation_id, created_at);

-- ── Community messages ────────────────────────────────────────
create table community_messages (
  id          uuid default uuid_generate_v4() primary key,
  sender_id   uuid references profiles(id) on delete cascade not null,
  group_id    text not null,
  content     text not null,
  is_question boolean default false,
  created_at  timestamptz default now()
);
create index on community_messages (group_id, created_at);

-- ── Events ───────────────────────────────────────────────────
create table events (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  description text,
  event_date  text not null,
  tag         text,
  is_dept     boolean default false,
  created_at  timestamptz default now()
);

-- ── Event RSVPs ───────────────────────────────────────────────
create table event_rsvps (
  id         uuid default uuid_generate_v4() primary key,
  event_id   uuid references events(id) on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

-- ── Notifications ─────────────────────────────────────────────
create table notifications (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references profiles(id) on delete cascade not null,
  type       text not null,
  text       text not null,
  read       boolean default false,
  related_id uuid,
  created_at timestamptz default now()
);
create index on notifications (user_id, created_at desc);

-- ── Friendships ───────────────────────────────────────────────
create table friendships (
  id           uuid default uuid_generate_v4() primary key,
  requester_id uuid references profiles(id) on delete cascade not null,
  addressee_id uuid references profiles(id) on delete cascade not null,
  status       text default 'pending' check (status in ('pending','accepted')),
  created_at   timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles           enable row level security;
alter table posts              enable row level security;
alter table help_offers        enable row level security;
alter table messages           enable row level security;
alter table community_messages enable row level security;
alter table events             enable row level security;
alter table event_rsvps        enable row level security;
alter table notifications      enable row level security;
alter table friendships        enable row level security;

-- ── Helper functions ─────────────────────────────────────────

-- Returns true if the logged-in user is approved OR is an admin
create or replace function is_active_user()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and (status = 'approved' or role = 'admin')
  )
$$;

-- Returns true if the logged-in user is an admin
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  )
$$;

-- ── Policies ─────────────────────────────────────────────────

-- profiles: any authenticated user can read (needed for admin to see pending)
--           only self can insert; self OR admin can update/delete
create policy "profiles_select" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id or is_admin());
create policy "profiles_delete" on profiles for delete using (auth.uid() = id or is_admin());

-- posts: only approved students + admins
create policy "posts_select" on posts for select using (is_active_user());
create policy "posts_insert" on posts for insert with check (auth.uid() = author_id and is_active_user());
create policy "posts_delete" on posts for delete using (auth.uid() = author_id or is_admin());

-- help_offers
create policy "offers_select" on help_offers for select using (is_active_user());
create policy "offers_insert" on help_offers for insert with check (auth.uid() = offerer_id and is_active_user());

-- messages
create policy "messages_select" on messages for select using ((auth.uid() = sender_id or auth.uid() = receiver_id) and is_active_user());
create policy "messages_insert" on messages for insert with check (auth.uid() = sender_id and is_active_user());
create policy "messages_update" on messages for update using (auth.uid() = receiver_id);

-- community_messages
create policy "comm_select" on community_messages for select using (is_active_user());
create policy "comm_insert" on community_messages for insert with check (auth.uid() = sender_id and is_active_user());

-- events: admins can create/edit; active users can read
create policy "events_select" on events for select using (is_active_user());
create policy "events_insert" on events for insert with check (is_admin());
create policy "events_update" on events for update using (is_admin());
create policy "events_delete" on events for delete using (is_admin());

-- event_rsvps
create policy "rsvp_select" on event_rsvps for select using (is_active_user());
create policy "rsvp_insert" on event_rsvps for insert with check (auth.uid() = user_id and is_active_user());
create policy "rsvp_delete" on event_rsvps for delete using (auth.uid() = user_id);

-- notifications
create policy "notif_select" on notifications for select using (auth.uid() = user_id);
create policy "notif_insert" on notifications for insert with check (true);
create policy "notif_update" on notifications for update using (auth.uid() = user_id);
create policy "notif_delete" on notifications for delete using (auth.uid() = user_id or is_admin());

-- friendships
create policy "friends_select" on friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friends_insert" on friendships for insert with check (auth.uid() = requester_id and is_active_user());
create policy "friends_update" on friendships for update using (auth.uid() = addressee_id or auth.uid() = requester_id);

-- ============================================================
-- Triggers — auto-create notifications
-- ============================================================

create or replace function notify_on_message()
returns trigger language plpgsql security definer as $$
declare sender_name text;
begin
  select first_name || ' ' || last_name into sender_name from profiles where id = new.sender_id;
  insert into notifications (user_id, type, text, related_id)
  values (new.receiver_id, 'messages', sender_name || ' sent you a message.', new.sender_id);
  return new;
end;
$$;

create trigger trg_notify_message
  after insert on messages
  for each row execute function notify_on_message();

create or replace function notify_on_offer()
returns trigger language plpgsql security definer as $$
declare offerer_name text; post_author uuid;
begin
  select first_name || ' ' || last_name into offerer_name from profiles where id = new.offerer_id;
  select author_id into post_author from posts where id = new.post_id;
  insert into notifications (user_id, type, text, related_id)
  values (post_author, 'help', offerer_name || ' offered help on your post.', new.offerer_id);
  return new;
end;
$$;

create trigger trg_notify_offer
  after insert on help_offers
  for each row execute function notify_on_offer();

-- ============================================================
-- Enable Realtime
-- ============================================================

alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table community_messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table help_offers;
alter publication supabase_realtime add table profiles;

-- ============================================================
-- Seed events
-- ============================================================

insert into events (name, description, event_date, tag, is_dept) values
  ('Spring Hackathon',         '24 hours of building. Free food, sponsors, demo night.',   'Apr 28 · 6pm',  'CS',           true),
  ('Distributed systems talk', 'CS Society hosts Dr. Lin from MIT — Q&A after.',           'May 2 · 5pm',   'CS',           true),
  ('Open Mic — Whitman',       'Bring a poem, song, or set. Sign up at the door.',         'May 4 · 8pm',   'All Students', false),
  ('Type Workshop',            'Hands-on letterform basics with Theo Park.',               'May 5 · 6pm',   'Design',       true),
  ('Bio Ethics Panel',         'Three faculty, one topic: CRISPR in the classroom.',       'May 8 · 4pm',   'Bio',          true),
  ('Spring Formal',            'Dress code: smart casual. Hosted by Student Council.',     'May 12 · 8pm',  'All Students', false);

-- ============================================================
-- Admin accounts: create via Supabase Dashboard → Authentication → Users
-- Then run this SQL to grant admin role:
--
-- insert into profiles (id, first_name, last_name, username, email, role, status)
-- select u.id, split_part(u.email,'@',1), 'Admin', '@'||split_part(u.email,'@',1), u.email, 'admin', 'approved'
-- from auth.users u
-- where u.email in ('dwiraj06@gmail.com','pramod.gowdaaaaa@gmail.com','saisugeet20044@gmail.com')
-- on conflict (id) do update set role='admin', status='approved';
-- ============================================================
