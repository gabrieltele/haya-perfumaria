# Haya Perfumaria — site

Site e painel da Haya Perfumaria (Galeria Coop, Rua Onze de Agosto, 3043 — Tatuí/SP · @hayaperfumaria).

- `index.html` — o site: abertura animada, coleções, curadoria, catálogo com busca e filtros, detalhe com notas olfativas, Visite.
- `admin.html` — painel da dona (abre em `/admin`): cadastrar, editar, apagar, marcar esgotado, destaque e ordem.
- `supabase/setup.sql` — banco, regras de segurança e pasta de fotos. Pode rodar de novo.
- `supabase-config.js` — `url`, `anonKey` do Supabase e o número do WhatsApp.
- `vercel.json` — cabeçalhos de segurança (CSP, HSTS, sem iframe) e `/admin` sem indexação.

Visual inspirado em perfumarias clássicas (Granado, Jo Malone, Penhaligon's): papel creme, preto e o dourado da logo, Cormorant Garamond + Jost. Animações com GSAP 3.13.0 (+ ScrollTrigger e SplitText), Lenis 1.1.13 e Three.js 0.170.0 (frasco 3D do início, em `js/frasco3d.js`), todos por CDN e respeitando `prefers-reduced-motion`. Sem WebGL, o início mostra a foto do perfume.

## Colocar no ar
1. Crie um projeto no [Supabase](https://supabase.com) e rode `supabase/setup.sql` no SQL Editor.
2. Em Authentication → Sign In / Providers, desligue "Allow new users to sign up". Em Authentication → Users → Add user, crie a conta da dona.
3. Rode a última linha do `setup.sql` (comentada) com o e-mail da dona, para ela virar administradora.
4. Preencha `supabase-config.js` (Project Settings → API) e o WhatsApp.
5. Importe o repositório na [Vercel](https://vercel.com) — publica sozinho a cada envio para a `main`.

## Segurança
- Visitante só lê perfumes não esgotados; só quem está na tabela `admins` grava (função `e_admin()`), inclusive fotos.
- Login com sessão só na aba, sai após 30 min parado, 5 senhas erradas = espera 60 s.
- Todo texto do banco é escapado (`esc()`); fotos só do próprio Supabase (`fotoSegura()`).
- Os perfumes do `index.html` (`PRODUCTS`) são **exemplos**: somem quando o Supabase estiver ligado.
