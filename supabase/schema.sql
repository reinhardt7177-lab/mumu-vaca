-- 슬기로운 방학 요정: Supabase 초기 스키마
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'teacher', 'admin')),
  full_name text not null,
  grade int check (grade between 1 and 6),
  class_code text,
  xp int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade int not null check (grade between 1 and 6),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text,
  quest_type text not null default 'required' check (quest_type in ('required', 'optional', 'survival')),
  due_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  evidence_url text,
  completed_at timestamptz not null default now(),
  unique (quest_id, student_id)
);

create table if not exists public.survival_checkins (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  sky_color text,
  image_url text,
  checked_at timestamptz not null default now()
);

create table if not exists public.xp_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_teacher_of_class(target_class_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.classes c
    where c.id = target_class_id
      and c.teacher_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.quests enable row level security;
alter table public.quest_completions enable row level security;
alter table public.survival_checkins enable row level security;
alter table public.xp_logs enable row level security;

-- profiles: 본인만 조회/수정
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- classes: 담당 교사와 해당 반 학생 조회
create policy "classes_select_teacher_or_student"
  on public.classes for select
  using (
    teacher_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.class_code = classes.id::text
    )
  );

-- quests: 담당 교사 작성/조회, 학생은 자기 반만 조회
create policy "quests_select_teacher_or_class_students"
  on public.quests for select
  using (
    public.is_teacher_of_class(class_id)
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.class_code = quests.class_id::text
    )
  );

create policy "quests_insert_teacher_only"
  on public.quests for insert
  with check (public.is_teacher_of_class(class_id));

create policy "quests_update_teacher_only"
  on public.quests for update
  using (public.is_teacher_of_class(class_id))
  with check (public.is_teacher_of_class(class_id));

-- quest_completions: 학생 본인 기록, 교사는 자기 반 조회
create policy "quest_completions_select_owner_or_teacher"
  on public.quest_completions for select
  using (
    student_id = auth.uid()
    or exists (
      select 1
      from public.quests q
      where q.id = quest_completions.quest_id
        and public.is_teacher_of_class(q.class_id)
    )
  );

create policy "quest_completions_insert_owner"
  on public.quest_completions for insert
  with check (student_id = auth.uid());

create policy "quest_completions_update_owner"
  on public.quest_completions for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- survival_checkins: 학생 본인 작성/조회, 교사는 자기 반 조회
create policy "survival_checkins_select_owner_or_teacher"
  on public.survival_checkins for select
  using (
    student_id = auth.uid()
    or public.is_teacher_of_class(class_id)
  );

create policy "survival_checkins_insert_owner"
  on public.survival_checkins for insert
  with check (student_id = auth.uid());

-- xp_logs: 학생 본인 조회, 교사는 자기 반 학생 로그 조회
create policy "xp_logs_select_owner_or_teacher"
  on public.xp_logs for select
  using (
    student_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      join public.classes c on c.id::text = p.class_code
      where p.id = xp_logs.student_id
        and c.teacher_id = auth.uid()
    )
  );

-- 게임 경제 1단계 확장
alter table public.profiles
  add column if not exists acorns int not null default 0;

create table if not exists public.student_streaks (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak int not null default 0,
  best_streak int not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('quest', 'combo', 'streak', 'event')),
  reason text not null,
  xp_amount int not null default 0,
  acorn_amount int not null default 0,
  quest_id uuid references public.quests(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.student_inventory (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  item_key text not null,
  item_name text not null,
  quantity int not null default 1,
  acquired_at timestamptz not null default now(),
  unique (student_id, item_key)
);

alter table public.student_streaks enable row level security;
alter table public.reward_logs enable row level security;
alter table public.student_inventory enable row level security;

create policy "student_streaks_select_owner_or_teacher"
  on public.student_streaks for select
  using (
    student_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      join public.classes c on c.id::text = p.class_code
      where p.id = student_streaks.student_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "student_streaks_insert_owner"
  on public.student_streaks for insert
  with check (student_id = auth.uid());

create policy "student_streaks_update_owner"
  on public.student_streaks for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "reward_logs_select_owner_or_teacher"
  on public.reward_logs for select
  using (
    student_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      join public.classes c on c.id::text = p.class_code
      where p.id = reward_logs.student_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "student_inventory_select_owner_or_teacher"
  on public.student_inventory for select
  using (
    student_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      join public.classes c on c.id::text = p.class_code
      where p.id = student_inventory.student_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "student_inventory_insert_owner"
  on public.student_inventory for insert
  with check (student_id = auth.uid());

create policy "student_inventory_update_owner"
  on public.student_inventory for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- 게임 경제 2단계 확장 (상점 구매 로그)
create table if not exists public.shop_purchase_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  item_key text not null,
  item_name text not null,
  price_acorns int not null,
  purchased_at timestamptz not null default now()
);

alter table public.shop_purchase_logs enable row level security;

create policy "shop_purchase_logs_select_owner_or_teacher"
  on public.shop_purchase_logs for select
  using (
    student_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      join public.classes c on c.id::text = p.class_code
      where p.id = shop_purchase_logs.student_id
        and c.teacher_id = auth.uid()
    )
  );

-- 게임 경제 3단계 확장 (장착 슬롯)
create table if not exists public.student_equips (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('background', 'title', 'companion')),
  item_key text not null,
  item_name text not null,
  equipped_at timestamptz not null default now(),
  unique (student_id, category)
);

alter table public.student_equips enable row level security;

create policy "student_equips_select_owner_or_teacher"
  on public.student_equips for select
  using (
    student_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      join public.classes c on c.id::text = p.class_code
      where p.id = student_equips.student_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "student_equips_insert_owner"
  on public.student_equips for insert
  with check (student_id = auth.uid());

create policy "student_equips_update_owner"
  on public.student_equips for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- 게임 확장: 오늘의 랜덤 퀘스트 + 주간 배지
create table if not exists public.student_daily_quests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  quest_date date not null,
  quest_id uuid not null references public.quests(id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, quest_date)
);

create table if not exists public.student_weekly_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  week_start_date date not null,
  badge_key text not null,
  badge_name text not null,
  badge_level int not null,
  completion_count int not null default 0,
  earned_at timestamptz not null default now(),
  unique (student_id, week_start_date)
);

alter table public.student_daily_quests enable row level security;
alter table public.student_weekly_badges enable row level security;

create policy "student_daily_quests_select_owner_or_teacher"
  on public.student_daily_quests for select
  using (
    student_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      join public.classes c on c.id::text = p.class_code
      where p.id = student_daily_quests.student_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "student_daily_quests_insert_owner"
  on public.student_daily_quests for insert
  with check (student_id = auth.uid());

create policy "student_daily_quests_update_owner"
  on public.student_daily_quests for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "student_weekly_badges_select_owner_or_teacher"
  on public.student_weekly_badges for select
  using (
    student_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      join public.classes c on c.id::text = p.class_code
      where p.id = student_weekly_badges.student_id
        and c.teacher_id = auth.uid()
    )
  );
