-- Phase 9: Payment & Economy Infrastructure (Merchant Base)

-- 1. EXTEND PROFILES WITH PRO STATUS
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_pro') then
        alter table profiles add column is_pro boolean default false;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'pro_expires_at') then
        alter table profiles add column pro_expires_at timestamptz;
    end if;
end $$;

-- 2. CREDIT TRANSACTIONS TABLE
create table if not exists credit_transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    amount numeric not null, -- Positive for inflow, Negative for outflow
    type text not null, -- 'PURCHASE', 'VOTE', 'HEDGE_PREMIUM', 'HEDGE_PAYOUT', 'REWARD', 'SUBSCRIPTION'
    description text,
    transaction_ref text, -- External ref (e.g., Stripe Session ID)
    created_at timestamptz default now()
);

-- 3. RLS for Transactions
alter table credit_transactions enable row level security;

do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Users can view own transactions') then
        create policy "Users can view own transactions" on credit_transactions for select using (auth.uid() = user_id);
    end if;
end $$;

-- 4. ATOMIC CREDIT TOPUP FUNCTION
create or replace function topup_user_credits(
    p_user_id uuid,
    p_amount numeric,
    p_type text,
    p_desc text,
    p_ref text
) returns void as $$
begin
    -- 1. Update Profile Balance
    update profiles 
    set balance = balance + p_amount
    where id = p_user_id;

    -- 2. Log Transaction
    insert into credit_transactions (user_id, amount, type, description, transaction_ref)
    values (p_user_id, p_amount, p_type, p_desc, p_ref);
end;
$$ language plpgsql security definer;
