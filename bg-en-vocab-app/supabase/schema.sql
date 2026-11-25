-- =============================================================================
-- LinguaKid BG <-> EN — Схема базы данных для Supabase (PostgreSQL + Realtime)
-- Выполните этот скрипт целиком в Supabase Dashboard -> SQL Editor -> New Query
-- =============================================================================

create extension if not exists pgcrypto;

-- 1. Темы уроков (привязаны к семейному коду family_code)
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  title text not null,
  emoji text not null default '📚',
  color text not null default 'emerald',
  created_at timestamptz not null default now()
);

create index if not exists idx_topics_family_code on public.topics(family_code);

-- 2. Слова в темах (Болгарский <-> Английский)
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  family_code text not null,
  bg text not null,
  en text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_words_topic_id on public.words(topic_id);
create index if not exists idx_words_family_code on public.words(family_code);

-- 3. Прогресс ребёнка по каждой теме
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  topic_id uuid not null references public.topics(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  current_stage int not null default 1,
  best_accuracy int not null default 0,
  last_accuracy int not null default 0,
  stars int not null default 0,
  points int not null default 0,
  mistake_words jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (family_code, topic_id)
);

create index if not exists idx_progress_family_code on public.progress(family_code);

-- 4. Включаем Row Level Security (RLS) с доступом по семейному коду
alter table public.topics enable row level security;
alter table public.words enable row level security;
alter table public.progress enable row level security;

-- Политики для простого семейного доступа по коду (без сложной регистрации для ребёнка)
drop policy if exists "family_topics_all" on public.topics;
create policy "family_topics_all" on public.topics
  for all using (true) with check (true);

drop policy if exists "family_words_all" on public.words;
create policy "family_words_all" on public.words
  for all using (true) with check (true);

drop policy if exists "family_progress_all" on public.progress;
create policy "family_progress_all" on public.progress
  for all using (true) with check (true);

-- 5. Включаем Supabase Realtime для мгновенного появления слов на телефоне ребёнка
do $$
begin
  alter publication supabase_realtime add table public.topics;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.words;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.progress;
exception when duplicate_object then null;
end $$;
