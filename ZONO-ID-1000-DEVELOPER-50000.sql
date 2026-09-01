-- =========================================================
-- ZONO V1 — Public ID 1000+ + Developer ID 1 + 50,000 Feathers
-- شغّل هذا الملف مرة واحدة داخل Supabase > SQL Editor
-- =========================================================

begin;

-- 1) التأكد من وجود تسلسل أرقام الحسابات.
create sequence if not exists public.zuno_public_id_seq
    as bigint
    start with 1000
    increment by 1
    minvalue 1000
    no cycle;

-- 2) ربط public_id بالتسلسل للحسابات الجديدة.
alter table public.profiles
    alter column public_id set default nextval('public.zuno_public_id_seq');

-- 3) تثبيت حساب المطور:
-- نعتمد الحساب الموجود حالياً برقم 1 أو الدور developer.
do $$
declare
    v_dev uuid;
begin
    select id
      into v_dev
      from public.profiles
     where public_id = 1
        or role = 'developer'
     order by case when public_id = 1 then 0 else 1 end, created_at
     limit 1;

    if v_dev is null then
        raise exception 'لم يتم العثور على حساب المطور. ثبّت حساب المطور أولاً ثم شغّل هذا الملف.';
    end if;

    -- ننقل أي حساب آخر يحمل رقم 1 إلى رقم مؤقت آمن.
    update public.profiles
       set public_id = 900000000 + row_number_value
      from (
            select id,
                   row_number() over(order by created_at, id) as row_number_value
              from public.profiles
             where public_id = 1
               and id <> v_dev
           ) x
     where public.profiles.id = x.id;

    -- حساب المطور دائماً ID = 1 ورصيده 50,000 ريشة.
    update public.profiles
       set public_id = 1,
           role = 'developer',
           feathers = 50000,
           updated_at = now()
     where id = v_dev;
end $$;

-- 4) إعادة ترقيم كل الحسابات العادية الحالية من 1000 تصاعدياً.
-- أولاً ننقلها مؤقتاً بعيداً لتجنب تعارض UNIQUE.
with numbered as (
    select id,
           row_number() over(order by created_at, id) as rn
      from public.profiles
     where public_id <> 1
)
update public.profiles p
   set public_id = 800000000 + numbered.rn
  from numbered
 where p.id = numbered.id;

with numbered as (
    select id,
           row_number() over(order by created_at, id) as rn
      from public.profiles
     where public_id <> 1
)
update public.profiles p
   set public_id = 999 + numbered.rn
  from numbered
 where p.id = numbered.id;

-- 5) ضبط أول ID جديد ليكمل بعد آخر حساب موجود، وبحد أدنى 1000.
select setval(
    'public.zuno_public_id_seq',
    greatest(
        1000,
        coalesce((select max(public_id) + 1 from public.profiles where public_id <> 1), 1000)
    ),
    false
);

-- 6) حماية تلقائية: إذا أُنشئ profile بدون public_id يأخذ الرقم التالي.
create or replace function public.zuno_assign_public_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.public_id is null then
        new.public_id := nextval('public.zuno_public_id_seq');
    end if;
    return new;
end;
$$;

drop trigger if exists trg_zuno_assign_public_id on public.profiles;
create trigger trg_zuno_assign_public_id
before insert on public.profiles
for each row
execute function public.zuno_assign_public_id();

commit;

notify pgrst, 'reload schema';

-- فحص سريع بعد التنفيذ:
-- select public_id, display_name, role, feathers
-- from public.profiles
-- order by case when public_id = 1 then 0 else 1 end, public_id;
