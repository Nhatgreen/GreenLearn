-- 0010_onboarding.sql: Add onboarding_done status flag to user profiles

alter table public.profiles
  add column if not exists onboarding_done boolean not null default false;

create or replace function public.complete_onboarding()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;

  update public.profiles
  set onboarding_done = true,
      updated_at = timezone('utc'::text, now())
  where id = v_uid;

  return true;
end;
$$;
