-- whoiam.love v2 schema
-- Run this in the Supabase SQL editor (dashboard.supabase.com → SQL Editor)

-- profiles: extends auth.users, auto-created via trigger on signup
create table if not exists profiles (
  id                    uuid references auth.users on delete cascade primary key,
  email                 text,
  subscription_status   text not null default 'free'
    check (subscription_status in ('free', 'active', 'canceled')),
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  created_at            timestamptz default now()
);

-- conversations: one row per chat session
create table if not exists conversations (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  started_at    timestamptz default now(),
  message_count int default 0,
  mood_checkin  text check (
    mood_checkin in ('foggy','heavy','restless','okay','curious','open','alive')
  )
);

-- messages: individual turns within a conversation
create table if not exists messages (
  id              uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations on delete cascade not null,
  user_id         uuid references auth.users on delete cascade not null,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  created_at      timestamptz default now()
);

-- weekly_portraits: AI-generated self-summaries
create table if not exists weekly_portraits (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  portrait_text text not null,
  session_count int not null,
  generated_at  timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table weekly_portraits enable row level security;

create policy "own profile"
  on profiles for all using (id = auth.uid());

create policy "own conversations"
  on conversations for all using (user_id = auth.uid());

create policy "own messages"
  on messages for all using (user_id = auth.uid());

create policy "own portraits"
  on weekly_portraits for all using (user_id = auth.uid());

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
