-- 1. AI MODELS METADATA
create table if not exists ai_models (
    model_id text primary key, -- e.g. 'deepseek_v3'
    name text not null,
    style text,
    capability_radar jsonb, -- {Tactics: 9, Underdogs: 8, ...}
    created_at timestamptz default now()
);

-- 2. AI LEAGUE STATS (History)
create table if not exists ai_league_stats (
    id uuid primary key default uuid_generate_v4(),
    model_id text references ai_models(model_id),
    date date not null default current_date,
    
    -- Multi-wallet tracking
    core_pnl numeric default 0,
    challenge_pnl numeric default 0,
    high_yield_pnl numeric default 0,
    total_day_pnl numeric default 0,
    
    wallet_balance numeric default 10000,
    roi numeric default 0,
    bets_count integer default 0,
    
    created_at timestamptz default now(),
    unique(model_id, date) -- Ensure one entry per model per day
);

-- 3. DAILY NEWS / HEADLINES
create table if not exists ai_league_news (
    id uuid primary key default uuid_generate_v4(),
    date date not null default current_date,
    headline text,
    top_performer text references ai_models(model_id),
    top_pnl numeric,
    created_at timestamptz default now(),
    unique(date) -- One headline per day
);

-- 4. Indexes & RLS
do $$ 
begin
    if not exists (select 1 from pg_indexes where indexname = 'idx_league_stats_date') then
        create index idx_league_stats_date on ai_league_stats(date);
    end if;
    if not exists (select 1 from pg_indexes where indexname = 'idx_league_stats_model') then
        create index idx_league_stats_model on ai_league_stats(model_id);
    end if;
end $$;

alter table ai_models enable row level security;
alter table ai_league_stats enable row level security;
alter table ai_league_news enable row level security;

-- 5. Policies (Safe execution via DO block)
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Public AI models viewable') then
        create policy "Public AI models viewable" on ai_models for select using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Public AI stats viewable') then
        create policy "Public AI stats viewable" on ai_league_stats for select using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Public AI news viewable') then
        create policy "Public AI news viewable" on ai_league_news for select using (true);
    end if;
end $$;

-- 6. Initial Data Seed (Only insert if not exists)
insert into ai_models (model_id, name, style, capability_radar)
select 'deepseek_v3', 'DeepSeek V3', 'Balanced Quant', '{"Tactics": 9, "Underdogs": 8, "High-Value": 9, "Consistency": 6, "Speed": 7}'
where not exists (select 1 from ai_models where model_id = 'deepseek_v3');

insert into ai_models (model_id, name, style, capability_radar)
select 'claude_opus_4_5', 'Claude Opus 4.5', 'Risk Averse', '{"Stability": 8, "Accuracy": 9, "Logic": 9, "Speed": 5, "Value": 7}'
where not exists (select 1 from ai_models where model_id = 'claude_opus_4_5');

insert into ai_models (model_id, name, style, capability_radar)
select 'gpt_5_preview', 'GPT-5 Preview', 'Aggressive Growth', '{"Power": 9, "Vision": 8, "Risk": 9, "Scale": 7, "Alpha": 8}'
where not exists (select 1 from ai_models where model_id = 'gpt_5_preview');

insert into ai_models (model_id, name, style, capability_radar)
select 'qwen_3_max', 'Qwen 3 Max', 'Momentum Algo', '{"Momentum": 9, "Flow": 8, "Trend": 7, "Pattern": 8, "Execution": 6}'
where not exists (select 1 from ai_models where model_id = 'qwen_3_max');
