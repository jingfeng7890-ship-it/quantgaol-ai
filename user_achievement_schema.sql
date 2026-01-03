-- Phase 8: Governor RPG Rank System

-- 1. EXTEND PROFILES WITH RPG STATS
-- We use a DO block to safely add columns if they don't exist
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'xp') then
        alter table profiles add column xp numeric default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'rank_level') then
        alter table profiles add column rank_level integer default 1;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'governor_title') then
        alter table profiles add column governor_title text default 'Apprentice Analyst';
    end if;
end $$;

-- 2. USER ACHIEVEMENTS TABLE (Medals)
create table if not exists user_achievements (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    achievement_type text not null, -- 'The Oracle', 'Master Lobbyist', 'Whale'
    description text,
    earned_at timestamptz default now(),
    unique(user_id, achievement_type)
);

-- 3. RLS Policies for Achievements
alter table user_achievements enable row level security;

do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Users can view own achievements') then
        create policy "Users can view own achievements" on user_achievements for select using (auth.uid() = user_id);
    end if;
end $$;

-- 4. RPC for XP Awarding (Atomic)
create or replace function award_user_xp(
    p_user_id uuid,
    p_xp_amount numeric
) returns void as $$
declare
    v_new_xp numeric;
    v_new_level integer;
    v_new_title text;
    v_is_pro boolean;
    v_final_xp numeric;
begin
    -- 0. Check Pro Status
    select is_pro into v_is_pro from profiles where id = p_user_id;
    
    -- Apply 1.2x multiplier for Pro users
    if v_is_pro then
        v_final_xp := p_xp_amount * 1.2;
    else
        v_final_xp := p_xp_amount;
    end if;

    -- 1. Update XP
    update profiles 
    set xp = xp + v_final_xp
    where id = p_user_id
    returning xp into v_new_xp;

    -- 2. Calculate Level and Title
    -- Level 1: 0-1000, Level 2: 1000-5000, Level 3: 5000-20000, Level 4: 20000+
    if v_new_xp >= 20000 then
        v_new_level := 4;
        v_new_title := 'Prime Governor';
    elsif v_new_xp >= 5000 then
        v_new_level := 3;
        v_new_title := 'Council Member';
    elsif v_new_xp >= 1000 then
        v_new_level := 2;
        v_new_title := 'Senior Researcher';
    else
        v_new_level := 1;
        v_new_title := 'Apprentice Analyst';
    end if;

    -- 3. Update Profile Level & Title if changed
    update profiles 
    set rank_level = v_new_level,
        governor_title = v_new_title
    where id = p_user_id;
end;
$$ language plpgsql security definer;
