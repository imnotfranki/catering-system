create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'rola') then
    create type public.rola as enum ('admin', 'placowka', 'kuchnia', 'kierowca');
  end if;
end
$$;

create table if not exists public.placowki (
  id uuid primary key default gen_random_uuid(),
  nazwa text not null,
  adres text,
  typ text,
  aktywna boolean default true,
  utworzona_o timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rola public.rola not null,
  placowka_id uuid references public.placowki(id),
  imie text,
  nazwisko text
);

create table if not exists public.zamowienia (
  id uuid primary key default gen_random_uuid(),
  placowka_id uuid references public.placowki(id),
  data date not null,
  posilek text not null check (posilek in ('sniadanie', 'obiad', 'podwieczorek')),
  ilosc_normalnych integer not null default 0,
  diety jsonb default '[]'::jsonb,
  status text default 'oczekujace' check (status in ('oczekujace', 'w_realizacji', 'gotowe', 'dostarczone')),
  utworzone_o timestamptz default now(),
  zaktualizowane_o timestamptz default now()
);

create table if not exists public.jadlospisy (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  posilek text not null check (posilek in ('sniadanie', 'obiad', 'podwieczorek')),
  opis text,
  skladniki jsonb default '[]'::jsonb,
  utworzone_o timestamptz default now()
);

create table if not exists public.dostawy (
  id uuid primary key default gen_random_uuid(),
  placowka_id uuid references public.placowki(id),
  data date not null,
  kierowca_id uuid references public.profiles(id),
  status text default 'oczekujaca',
  czas_wyjazdu timestamptz,
  czas_dostawy timestamptz
);

create table if not exists public.ustawienia (
  klucz text primary key,
  wartosc text not null,
  opis text
);

insert into public.ustawienia (klucz, wartosc, opis) values
  ('deadline_godzina', '10', 'Godzina do której placówki mogą składać zamówienia'),
  ('deadline_minuta', '30', 'Minuta deadline zamówień'),
  ('nazwa_systemu', 'CateringSystem', 'Nazwa wyświetlana w systemie')
on conflict (klucz) do update
set wartosc = excluded.wartosc,
    opis = excluded.opis;

alter table public.zamowienia drop constraint if exists zamowienia_status_check;
alter table public.zamowienia
add constraint zamowienia_status_check
check (status in ('oczekujace', 'w_realizacji', 'gotowe', 'dostarczone'));

create or replace function public.current_user_role()
returns public.rola
language sql
security definer
set search_path = public
stable
as $$
  select rola from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_placowka_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select placowka_id from public.profiles where id = auth.uid()
$$;

create or replace function public.set_zaktualizowane_o()
returns trigger
language plpgsql
as $$
begin
  new.zaktualizowane_o = now();
  return new;
end;
$$;

drop trigger if exists zamowienia_set_zaktualizowane_o on public.zamowienia;
create trigger zamowienia_set_zaktualizowane_o
before update on public.zamowienia
for each row
execute function public.set_zaktualizowane_o();

alter table public.profiles enable row level security;
alter table public.placowki enable row level security;
alter table public.zamowienia enable row level security;
alter table public.jadlospisy enable row level security;
alter table public.dostawy enable row level security;
alter table public.ustawienia enable row level security;

drop policy if exists "admin full access profiles" on public.profiles;
create policy "admin full access profiles"
on public.profiles
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "admin full access placowki" on public.placowki;
create policy "admin full access placowki"
on public.placowki
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "admin full access zamowienia" on public.zamowienia;
create policy "admin full access zamowienia"
on public.zamowienia
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "placowka select own zamowienia" on public.zamowienia;
create policy "placowka select own zamowienia"
on public.zamowienia
for select
to authenticated
using (
  public.current_user_role() = 'placowka'
  and placowka_id = public.current_user_placowka_id()
);

drop policy if exists "placowka insert own zamowienia" on public.zamowienia;
create policy "placowka insert own zamowienia"
on public.zamowienia
for insert
to authenticated
with check (
  public.current_user_role() = 'placowka'
  and placowka_id = public.current_user_placowka_id()
);

drop policy if exists "placowka update own zamowienia" on public.zamowienia;
create policy "placowka update own zamowienia"
on public.zamowienia
for update
to authenticated
using (
  public.current_user_role() = 'placowka'
  and placowka_id = public.current_user_placowka_id()
)
with check (
  public.current_user_role() = 'placowka'
  and placowka_id = public.current_user_placowka_id()
);

drop policy if exists "kuchnia select zamowienia" on public.zamowienia;
create policy "kuchnia select zamowienia"
on public.zamowienia
for select
to authenticated
using (public.current_user_role() = 'kuchnia');

drop policy if exists "kuchnia update zamowienia" on public.zamowienia;
create policy "kuchnia update zamowienia"
on public.zamowienia
for update
to authenticated
using (public.current_user_role() = 'kuchnia')
with check (public.current_user_role() = 'kuchnia');

drop policy if exists "kuchnia select placowki" on public.placowki;
create policy "kuchnia select placowki"
on public.placowki
for select
to authenticated
using (public.current_user_role() = 'kuchnia');

drop policy if exists "admin full access jadlospisy" on public.jadlospisy;
create policy "admin full access jadlospisy"
on public.jadlospisy
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "kuchnia select jadlospisy" on public.jadlospisy;
create policy "kuchnia select jadlospisy"
on public.jadlospisy
for select
to authenticated
using (public.current_user_role() = 'kuchnia');

drop policy if exists "admin full access dostawy" on public.dostawy;
create policy "admin full access dostawy"
on public.dostawy
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "kierowca select assigned dostawy" on public.dostawy;
create policy "kierowca select assigned dostawy"
on public.dostawy
for select
to authenticated
using (
  public.current_user_role() = 'kierowca'
  and kierowca_id = auth.uid()
);

drop policy if exists "kierowca update assigned dostawy" on public.dostawy;
create policy "kierowca update assigned dostawy"
on public.dostawy
for update
to authenticated
using (
  public.current_user_role() = 'kierowca'
  and kierowca_id = auth.uid()
)
with check (
  public.current_user_role() = 'kierowca'
  and kierowca_id = auth.uid()
);

drop policy if exists "wszyscy czytaja ustawienia" on public.ustawienia;
create policy "wszyscy czytaja ustawienia"
on public.ustawienia
for select
to authenticated
using (true);

drop policy if exists "admin edytuje ustawienia" on public.ustawienia;
create policy "admin edytuje ustawienia"
on public.ustawienia
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
