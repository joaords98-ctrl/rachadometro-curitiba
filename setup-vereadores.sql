-- ============================================================================
-- RACHADÔMETRO CURITIBA — Controle de assinatura dos vereadores
-- Rode este script inteiro no SQL Editor do Supabase (em inglês, sem tradução).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA 1: vereadores (fonte de verdade do painel)
-- status: 'signed' | 'refused' | 'no-response' | 'waiting'
-- ----------------------------------------------------------------------------
create table public.vereadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  partido text not null,
  status text not null default 'waiting',
  whatsapp text,
  ordem int,
  updated_at timestamptz default now()
);

alter table public.vereadores enable row level security;

-- Qualquer visitante pode LER a lista de vereadores (é informação pública).
create policy "publico pode ler vereadores"
  on public.vereadores for select
  to anon
  using (true);

-- ----------------------------------------------------------------------------
-- TABELA 2: adesoes (fila de pendentes — NÃO afeta o painel até você aprovar)
-- ----------------------------------------------------------------------------
create table public.adesoes (
  id uuid primary key default gen_random_uuid(),
  vereador_nome text not null,
  partido text,
  email text,
  observacao text,
  aprovado boolean default false,
  created_at timestamptz default now()
);

alter table public.adesoes enable row level security;

-- Qualquer visitante pode INSERIR uma adesão (o vereador declara pelo site).
-- Ninguém anônimo pode LER nem APROVAR — só você, pelo Table Editor.
create policy "publico pode declarar adesao"
  on public.adesoes for insert
  to anon
  with check (true);

-- ----------------------------------------------------------------------------
-- POPULAR a tabela de vereadores com os 38 nomes (todos começam 'waiting').
-- ----------------------------------------------------------------------------
insert into public.vereadores (nome, partido, status, ordem) values
  ('Andressa Bianchessi', 'União', 'waiting', 1),
  ('Angelo Vanhoni', 'PT', 'waiting', 2),
  ('Beto Moraes', 'PSD', 'waiting', 3),
  ('Bruno Rossi', 'Agir', 'waiting', 4),
  ('Bruno Secco', 'PMB', 'waiting', 5),
  ('Camilla Gonda', 'PSB', 'waiting', 6),
  ('Carlise Kwiatkowski', 'PL', 'waiting', 7),
  ('Da Costa', 'União', 'waiting', 8),
  ('Delegada Tathiana Guzella', 'União', 'waiting', 9),
  ('Eder Borges', 'PL', 'waiting', 10),
  ('Fernando Klinger', 'PL', 'waiting', 11),
  ('Giorgia Prates (Mandata Preta)', 'PT', 'waiting', 12),
  ('Guilherme Kilter', 'Novo', 'waiting', 13),
  ('Hernani', 'Republicanos', 'waiting', 14),
  ('Indiara Barbosa', 'Novo', 'waiting', 15),
  ('Jasson Goulart', 'Republicanos', 'waiting', 16),
  ('João Bettega', 'União', 'waiting', 17),
  ('João 5 Irmãos', 'MDB', 'waiting', 18),
  ('Laís Leão', 'PDT', 'waiting', 19),
  ('Leonidas Dias', 'Pode', 'waiting', 20),
  ('Lórens Nogueira', 'PP', 'waiting', 21),
  ('Marcos Vieira', 'PDT', 'waiting', 22),
  ('Meri Martins', 'Republicanos', 'waiting', 23),
  ('Nori Seto', 'PP', 'waiting', 24),
  ('Olimpio Araujo Junior', 'PL', 'waiting', 25),
  ('Pier Petruzziello', 'PP', 'waiting', 26),
  ('Professora Angela', 'PSOL', 'waiting', 27),
  ('Rafaela Lupion', 'PSD', 'waiting', 28),
  ('Renan Ceschin', 'Pode', 'waiting', 29),
  ('Rodrigo Marcial', 'Novo', 'waiting', 30),
  ('Sargento Tânia Guerreiro', 'Pode', 'waiting', 31),
  ('Serginho do Posto', 'PSD', 'waiting', 32),
  ('Sidnei Toaldo', 'PRD', 'waiting', 33),
  ('Tiago Zeglin', 'MDB', 'waiting', 34),
  ('Tico Kuzma', 'PSD', 'waiting', 35),
  ('Toninho da Farmácia', 'PSD', 'waiting', 36),
  ('Vanda de Assis', 'PT', 'waiting', 37),
  ('Zezinho Sabará', 'PSD', 'waiting', 38);

-- ============================================================================
-- COMO APROVAR UMA ADESÃO (no Table Editor):
-- 1. Abra a tabela `adesoes` e veja os pendentes (aprovado = false).
-- 2. Confirme que a adesão é legítima.
-- 3. Abra a tabela `vereadores`, ache o vereador e troque `status` para 'signed'.
-- 4. (Opcional) Na tabela `adesoes`, marque `aprovado` = true para arquivar.
-- O painel do site reflete a mudança automaticamente ao recarregar.
--
-- Para marcar quem RECUSOU: status = 'refused'.
-- Para marcar quem NÃO respondeu: status = 'no-response'.
-- ============================================================================
