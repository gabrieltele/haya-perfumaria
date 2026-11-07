---
name: padrao-agencia
description: Padrão de qualidade da agência para criar ou refazer sites de clientes (lojas, perfumarias, brechós, serviços locais). Use sempre que for criar um site novo, refazer uma seção, escolher animações, colocar fotos ou publicar. Complementa a skill frontend-design.
---

# Padrão da agência — sites que não parecem modelo

Leia também a skill `frontend-design` (direção visual). Esta aqui é o **como fazemos**: processo, caixa de ferramentas, regras e checklist. Tudo em português para o cliente; código e comentários também.

## 1. Antes de escrever código

1. **Brief em 5 respostas** (pergunte ao cliente se faltar): público; o que mais vende; como compram (WhatsApp, loja, entrega); 3 sites/perfis que admira; o que **não** quer.
2. **Material real** do cliente: logo (de preferência SVG/PNG sem fundo), fotos próprias, endereço, horário, WhatsApp, lista de produtos. Foto real > banco de imagens > desenho.
3. **Referências**: quando o cliente mandar imagens (Pinterest etc.), escreva em uma linha o que tirar de cada uma (“palavra gigante atrás do produto”, “nicho em arco iluminado”). Referência é ideia, não asset — nunca use a imagem do Pinterest no site.
4. **Plano de design** (como pede a frontend-design): 4–6 cores com nome e hex, fontes e papéis, um esboço ASCII do layout e **um único momento memorável** (ex.: produto em 3D, letreiro animado). O resto fica calmo.
5. Opcional: desenhar no **Figma** (o MCP do Figma está conectado) e aprovar com o cliente antes de programar.

## 2. Caixa de ferramentas (CDN com versão fixa — nunca “latest”)

| Para quê | Biblioteca | Onde |
|---|---|---|
| Animação e linha do tempo | GSAP 3.13.0 (grátis, com todos os plugins) | cdnjs `gsap/3.13.0/` |
| Animar ao rolar | ScrollTrigger | mesmo pacote |
| Letras/palavras/linhas animadas | **SplitText** (com `mask`) | mesmo pacote |
| Rolagem suave | Lenis 1.1.13 | jsdelivr |
| 3D (produto girando, vidro, reflexo) | **Three.js 0.170.0** (`MeshPhysicalMaterial` com `transmission`, `RoomEnvironment`) | jsdelivr, via `importmap` |
| Transição entre páginas | Barba.js ou Swup | jsdelivr |
| Ideias de efeito | Codrops (tympanus.net/codrops), Awwwards, Godly | — |

Regras: anime só `transform`/`opacity` (e `clip-path` quando precisar); `will-change` só no que mexe; 3D com `setPixelRatio(min(devicePixelRatio, 2))` e **pausado fora da tela** (IntersectionObserver); sempre ter **plano B** (foto) se WebGL falhar.

## 3. Regras que não se quebram

- **`prefers-reduced-motion`**: tudo que se move tem versão parada.
- **Celular primeiro de verdade**: testar em 390px; sem rolagem horizontal; botões ≥ 44px.
- **Acessibilidade**: foco visível, `alt` nas fotos, textos com contraste, navegação por teclado (carrossel com setas).
- **Segurança**: textos vindos do banco sempre escapados (`esc()`), fotos só de origem conhecida (`fotoSegura()`), CSP no `vercel.json` listando **só** os CDNs usados — ao adicionar biblioteca/serviço, atualize o CSP. Painel com login, RLS no Supabase, sessão por aba, saída por inatividade.
- **Direitos de imagem**: Unsplash/Pexels grátis (nunca Unsplash+), fotos do próprio cliente com autorização. Nada de Pinterest/Google Imagens.
- **Desempenho**: fotos em WebP ≤ ~150 KB (até 1400px), `loading="lazy"` fora do início, `fetchpriority="high"` na imagem principal.

## 4. Fechando uma entrega

1. Tirar print no computador (1440px) e no celular (390px) de cada seção mexida, **olhar** e corrigir o que ficar torto, encostado ou sobreposto.
2. Conferir console sem erro e `scrollWidth - innerWidth = 0`.
3. Commit claro em português, `git push`, conferir a publicação na Vercel (estado READY) e abrir o link.
4. Contar ao cliente o que mudou em linguagem simples, mandar os prints e dizer o que ainda falta (fotos, WhatsApp, Supabase).

## 5. Diário de ideias (atualize a cada projeto)

Anote aqui o que já foi feito para não repetir a mesma fórmula no próximo cliente.

- **Haya Perfumaria**: preto + dourado da logo; HAYA gigante vazado atrás do produto; nicho em arco iluminado com pedestal e fotos reais se revezando; vitrine 3D em roda (Three.js) com as fotos reais em arcos, reflexo no chão e névoa creme. O cliente **não gostou** do frasco 3D desenhado à mão: prefere produto real. Para 3D de produto, só com modelo `.glb` do produto de verdade.
- **Casinha do Garimpo**: papel, colagem, cinema mudo, gatinhos em SVG, mão articulada no scroll.
