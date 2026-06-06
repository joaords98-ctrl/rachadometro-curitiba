# Rachadômetro Curitiba

Painel cidadão de transparência monitorando o posicionamento dos 38 vereadores
da Câmara Municipal de Curitiba sobre o compromisso público contra rachadinha e
nepotismo, com abaixo-assinado e captação de assinaturas via Supabase.

Feito com React + Vite.

---

## 1. Pré-requisito: banco de dados (Supabase) — JÁ CONFIGURADO

O banco já está pronto se você rodou os SQLs anteriores. Caso precise recriar,
rode no **SQL Editor** do Supabase:

```sql
create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  whatsapp text,
  cidade_bairro text,
  mensagem text,
  consentimento boolean default true,
  created_at timestamptz default now()
);
alter table public.assinaturas enable row level security;
create policy "publico pode assinar" on public.assinaturas
  for insert to anon with check (true);

create or replace function public.total_assinaturas()
returns integer language sql security definer set search_path = public
as $$ select count(*)::int from public.assinaturas $$;
grant execute on function public.total_assinaturas() to anon;
```

---

## 2. Testar localmente (opcional)

Você precisa do Node.js instalado (https://nodejs.org).

```bash
npm install
cp .env.example .env.local   # edite .env.local com suas chaves
npm run dev
```

Abra o endereço que aparecer (geralmente http://localhost:5173).

---

## 3. Publicar na Vercel

1. Crie uma conta grátis em https://vercel.com (pode entrar com GitHub).
2. Suba este projeto:
   - **Opção A (GitHub):** crie um repositório, suba esta pasta, e na Vercel
     clique em "Add New > Project" e importe o repositório.
   - **Opção B (sem GitHub):** instale a CLI com `npm i -g vercel`, rode `vercel`
     dentro desta pasta e siga as instruções.
3. Em **Settings > Environment Variables** do projeto na Vercel, adicione:
   - `VITE_SUPABASE_URL`  = sua Project URL
   - `VITE_SUPABASE_ANON` = sua Publishable key
4. A Vercel detecta o Vite sozinho (build: `npm run build`, saída: `dist`).
   Clique em **Deploy**. Em ~1 min seu site estará no ar em `xxxx.vercel.app`.

> Importante: depois de adicionar/alterar variáveis de ambiente, faça um novo
> deploy (Deployments > ... > Redeploy) para que elas entrem em vigor.

---

## 4. Conectar seu domínio próprio

1. Compre o domínio num registrador (Registro.br para .com.br; Namecheap,
   Cloudflare ou GoDaddy para .com).
2. Na Vercel, vá em **Settings > Domains**, adicione seu domínio e siga as
   instruções de DNS que aparecerem (geralmente um registro A ou CNAME no
   painel do registrador). O HTTPS é configurado automaticamente.

---

## 5. Teste final

Abra o site publicado, assine o abaixo-assinado (nome + e-mail + consentimento)
e confira no Supabase em **Table Editor > assinaturas** se a linha apareceu.
O contador deve subir.

---

## Manutenção do conteúdo

- **Status dos vereadores:** edite o campo `status` de cada um na lista
  `VEREADORES_INICIAIS` no topo de `src/RachadometroCuritiba.jsx`
  (`"signed"` | `"refused"` | `"no-response"` | `"waiting"`).
- **WhatsApp dos gabinetes:** adicione `whatsapp: "5541999999999"` (só dígitos,
  com 55 + DDD) a cada vereador para o botão abrir a conversa direto.
- **Política de privacidade:** revise o texto da seção `#privacidade` e inclua
  um e-mail de contato real para solicitações de LGPD.
- **Total de assinaturas:** é lido automaticamente do banco; não precisa editar.
