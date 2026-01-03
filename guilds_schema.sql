-- Phase 10: Dynamic Fund Guilds (Syndicate Mode)

-- 1. GUILDS TABLE
create table if not exists guilds (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    description text,
    strategy text default 'Balanced Growth',
    risk_level text default 'Medium Risk', -- 'Low Risk', 'Medium Risk', 'High Risk'
    min_entry numeric default 500,
    total_capital numeric default 0,
    owner_id uuid references auth.users(id),
    roi_7d numeric default 0,
    created_at timestamptz default now()
);

-- 2. GUILD MEMBERSHIPS
create table if not exists guild_memberships (
    id uuid primary key default uuid_generate_v4(),
    guild_id uuid references guilds(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    staked_capital numeric default 0,
    joined_at timestamptz default now(),
    unique(guild_id, user_id)
);

-- 3. RLS
alter table guilds enable row level security;
alter table guild_memberships enable row level security;

do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Public guilds are visible to everyone') then
        create policy "Public guilds are visible to everyone" on guilds for select using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Members can view their memberships') then
        create policy "Members can view their memberships" on guild_memberships for select using (auth.uid() = user_id);
    end if;
end $$;

-- 4. RPC: JOIN GUILD
create or replace function join_guild(
    p_user_id uuid,
    p_guild_id uuid,
    p_amount numeric
) returns void as $$
declare
    v_balance numeric;
begin
    -- 1. Check user balance
    select balance into v_balance from profiles where id = p_user_id;
    if v_balance < p_amount then
        raise exception 'Insufficient balance to join guild';
    end if;

    -- 2. Deduct credits via topup_user_credits logic (negative)
    perform topup_user_credits(
        p_user_id,
        -p_amount,
        'GUILD_STAKE',
        'Staked capital to join guild',
        'MOCK_GUILD_' || p_guild_id
    );

    -- 3. Create membership
    insert into guild_memberships (guild_id, user_id, staked_capital)
    values (p_guild_id, p_user_id, p_amount)
    on conflict (guild_id, user_id) 
    do update set staked_capital = guild_memberships.staked_capital + p_amount;

    -- 4. Update Guild Total Capital
    update guilds 
    set total_capital = total_capital + p_amount
    where id = p_guild_id;
end;
$$ language plpgsql security definer;

-- 5. SEED INITIAL DATA
insert into guilds (name, description, strategy, risk_level, min_entry, roi_7d)
values 
('The Vanguard', 'Aggressive growth syndicate focusing on Asian leagues.', 'High Growth', 'High Risk', 1000, 12.5),
('Silver Shield', 'Defensive betting using black-swan hedging exclusively.', 'Capital Protection', 'Low Risk', 500, 4.2),
('Nexus Alpha', 'Quant-driven signals for European football.', 'Market Neutral', 'Medium Risk', 750, 8.8)
on conflict do nothing;
