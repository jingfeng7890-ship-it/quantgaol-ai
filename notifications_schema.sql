-- Phase 11: Notification Center (Ledger Pulse)

-- 1. NOTIFICATIONS TABLE
create table if not exists user_notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null, -- 'FINANCIAL', 'RANK', 'GOVERNANCE', 'SYSTEM'
    is_read boolean default false,
    link text, -- Optional redirect URL
    created_at timestamptz default now()
);

-- 2. RLS
alter table user_notifications enable row level security;

do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Users can manage own notifications') then
        create policy "Users can manage own notifications" on user_notifications 
            for all using (auth.uid() = user_id);
    end if;
end $$;

-- 3. HELPER FUNCTION: CREATE NOTIFICATION
create or replace function create_user_notification(
    p_user_id uuid,
    p_title text,
    p_message text,
    p_type text,
    p_link text default null
) returns void as $$
begin
    insert into user_notifications (user_id, title, message, type, link)
    values (p_user_id, p_title, p_message, p_type, p_link);
end;
$$ language plpgsql security definer;

-- 4. INDEXES
create index if not exists idx_notifications_user_read on user_notifications(user_id, is_read);
