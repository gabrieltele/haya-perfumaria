-- Haya Perfumaria — banco de dados (Supabase). Pode rodar de novo: não duplica nada.

-- 1) Quem é administrador (só estes entram no painel)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.e_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admin ve admins" on public.admins;
create policy "admin ve admins" on public.admins for select using (user_id = auth.uid());

-- 2) Perfumes
create table if not exists public.perfumes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 120),
  marca text check (char_length(marca) <= 80),
  categoria text not null default 'Unissex' check (char_length(categoria) <= 40),
  descricao text check (char_length(descricao) <= 1200),
  notas_topo text check (char_length(notas_topo) <= 200),
  notas_coracao text check (char_length(notas_coracao) <= 200),
  notas_fundo text check (char_length(notas_fundo) <= 200),
  tamanho text check (char_length(tamanho) <= 30),
  preco numeric(10,2) check (preco is null or preco >= 0),
  foto text,
  destaque boolean not null default false,
  esgotado boolean not null default false,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);
alter table public.perfumes enable row level security;

drop policy if exists "visitante le perfumes" on public.perfumes;
create policy "visitante le perfumes" on public.perfumes for select
  using (esgotado = false or public.e_admin());

drop policy if exists "admin altera perfumes" on public.perfumes;
create policy "admin altera perfumes" on public.perfumes for all
  using (public.e_admin()) with check (public.e_admin());

-- 3) Fotos (pasta pública para leitura; só admin envia/apaga)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('perfumes', 'perfumes', true, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/webp','image/jpeg','image/png'];

drop policy if exists "fotos leitura" on storage.objects;
create policy "fotos leitura" on storage.objects for select using (bucket_id = 'perfumes');
drop policy if exists "fotos admin envia" on storage.objects;
create policy "fotos admin envia" on storage.objects for insert with check (bucket_id = 'perfumes' and public.e_admin());
drop policy if exists "fotos admin troca" on storage.objects;
create policy "fotos admin troca" on storage.objects for update using (bucket_id = 'perfumes' and public.e_admin());
drop policy if exists "fotos admin apaga" on storage.objects;
create policy "fotos admin apaga" on storage.objects for delete using (bucket_id = 'perfumes' and public.e_admin());

-- 4) Depois de criar a conta da dona em Authentication → Users, rode UMA vez (troque o e-mail):
-- insert into public.admins (user_id) select id from auth.users where email = 'EMAIL_DA_DONA@exemplo.com' on conflict do nothing;
