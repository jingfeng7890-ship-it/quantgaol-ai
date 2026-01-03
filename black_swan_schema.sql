-- Phase 6: Black Swan Protocol & AI RPG Evolution

-- 1. AI ACHIEVEMENTS (RPG System)
create table if not exists ai_achievements (
    id uuid primary key default uuid_generate_v4(),
    model_id text references ai_models(model_id),
    achievement_type text not null, -- 'God Slayer', 'Iron Shield', 'Alpha King', etc.
    description text,
    earned_at timestamptz default now()
);

-- 2. BLACK SWAN OPTIONS (Hedging Protocol)
create table if not exists black_swan_options (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    model_id text references ai_models(model_id),
    match_id text, -- ID from matches table
    premium numeric not null default 0, -- Cost to buy (virtual coins)
    strike_confidence numeric not null, -- The AI confidence being hedged (e.g. 85%)
    payout_multiplier numeric not null default 2.0, -- Default payout ratio
    status text not null default 'PENDING', -- PENDING, SETTLED, EXPIRED
    result text, -- 'PAYOUT', 'LOST'
    created_at timestamptz default now()
);

-- 3. Indexes for Performance
create index if not exists idx_achievements_model on ai_achievements(model_id);
create index if not exists idx_options_user on black_swan_options(user_id);
create index if not exists idx_options_status on black_swan_options(status);

-- 4. RLS Policies
alter table ai_achievements enable row level security;
alter table black_swan_options enable row level security;

-- Achievements are public
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Public AI achievements viewable') then
        create policy "Public AI achievements viewable" on ai_achievements for select using (true);
    end if;
end $$;

-- Options are private to the user
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Users can view own options') then
        create policy "Users can view own options" on black_swan_options for select using (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can insert own options') then
        create policy "Users can insert own options" on black_swan_options for insert with check (auth.uid() = user_id);
    end if;
end $$;

-- 5. RPC Helpers
create or replace function increment_profile_balance(usr_id uuid, amt numeric)
returns void as $$
begin
    update profiles
    set balance = balance + amt
    where id = usr_id;
end;
$$ language plpgsql security definer;
