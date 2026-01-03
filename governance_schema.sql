-- Phase 7: Governor RPG Decision Logic

-- 1. GOVERNANCE PROPOSALS
create table if not exists governance_proposals (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text not null,
    category text default 'MONETARY_POLICY', -- MONETARY_POLICY, AI_SANCTION, BANKROLL_ALLOCATION
    target_model_id text references ai_models(model_id),
    adjustment_value numeric, -- e.g. 0.15 for +15% boost, -0.10 for 10% reduction
    status text not null default 'ACTIVE', -- ACTIVE, EXECUTED, DEFEATED, EXPIRED
    yes_votes numeric default 0,
    no_votes numeric default 0,
    threshold numeric default 1000, -- Required power to pass
    expires_at timestamptz not null, -- Voting deadline
    active_from timestamptz, -- When the policy starts
    active_until timestamptz, -- When the policy ends
    created_at timestamptz default now()
);

-- 2. GOVERNANCE VOTES
create table if not exists governance_votes (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    proposal_id uuid references governance_proposals(id),
    vote_type text not null, -- YES, NO
    power numeric not null, -- Amount of "Governance Power" (credits burned)
    created_at timestamptz default now(),
    unique(user_id, proposal_id) -- One vote per user per proposal
);

-- 3. RPC: Casting a Vote (Atomic)
create or replace function cast_governance_vote(
    p_user_id uuid,
    p_proposal_id uuid,
    p_vote_type text,
    p_power numeric
) returns void as $$
begin
    -- 1. Deduct balance from profile
    update profiles 
    set balance = balance - p_power
    where id = p_user_id and balance >= p_power;

    if not found then
        raise exception 'Insufficient balance to cast vote';
    end if;

    -- 2. Insert the vote
    insert into governance_votes (user_id, proposal_id, vote_type, power)
    values (p_user_id, p_proposal_id, p_vote_type, p_power);

    -- 3. Update the proposal tally
    if p_vote_type = 'YES' then
        update governance_proposals 
        set yes_votes = yes_votes + p_power
        where id = p_proposal_id;
    else
        update governance_proposals 
        set no_votes = no_votes + p_power
        where id = p_proposal_id;
    end if;
end;
$$ language plpgsql security definer;

-- 3. RLS Policies
alter table governance_proposals enable row level security;
alter table governance_votes enable row level security;

-- Proposals are public
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Public governance proposals viewable') then
        create policy "Public governance proposals viewable" on governance_proposals for select using (true);
    end if;
end $$;

-- Votes are private to the user
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Users can view own votes') then
        create policy "Users can view own votes" on governance_votes for select using (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Users can insert own votes') then
        create policy "Users can insert own votes" on governance_votes for insert with check (auth.uid() = user_id);
    end if;
end $$;

-- 4. Initial Proposals Seeding (Sample for the Parliament)
insert into governance_proposals (title, description, target_model_id, adjustment_value, threshold, expires_at)
values 
('The DeepSeek Stimulus', 'Increase DeepSeek V3 consensus weight by 20% to capitalize on recent tactical edge.', 'deepseek_v3', 0.20, 5000, now() + interval '3 days'),
('Claude Value Sanction', 'Reduce Claude Opus 4.5 weight by 15% due to excessive risk aversion in high-confidence streaks.', 'claude_opus_4_5', -0.15, 3000, now() + interval '2 days'),
('Aggressive Bankroll Shift', 'Shift 10% of total consensus bankroll towards GPT-5 High-Yield strategies.', 'gpt_5_preview', 0.10, 8000, now() + interval '5 days');
