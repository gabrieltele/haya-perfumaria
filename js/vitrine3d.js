// Vitrine 3D "Em destaque" (Three.js): as fotos reais dos perfumes em molduras de arco, numa roda que gira.
// Arrastar gira, as setas passam um a um, tocar no da frente abre o perfume.
// Sem WebGL ou com movimento reduzido, fica o carrossel comum (a seção não ganha a classe is3d).
import * as THREE from 'three';

const sec = document.getElementById('destaques');
const stage = document.getElementById('v3dStage');
const info = document.getElementById('v3dInfo');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function temWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

function comecar() {
  const lista = window.hayaVitrine || [];
  if (!sec || !stage || reduce || !temWebGL() || lista.length < 3) return;
  iniciar(lista).catch(e => { console.error('vitrine3d', e); sec.classList.remove('is3d'); });
}

// Desenha a foto dentro de um arco com filete dourado (vira a textura do cartão)
function cartao(img) {
  const W = 600, H = 820, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const arco = (m) => { g.beginPath(); g.moveTo(m, H - m); g.lineTo(m, W / 2); g.arc(W / 2, W / 2, W / 2 - m, Math.PI, 0); g.lineTo(W - m, H - m); g.closePath(); };
  g.save(); arco(0); g.clip();
  const k = Math.max(W / img.naturalWidth, H / img.naturalHeight), iw = img.naturalWidth * k, ih = img.naturalHeight * k;
  g.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
  const sombra = g.createLinearGradient(0, H * 0.6, 0, H); sombra.addColorStop(0, 'rgba(20,12,4,0)'); sombra.addColorStop(1, 'rgba(20,12,4,.25)');
  g.fillStyle = sombra; g.fillRect(0, 0, W, H);
  g.restore();
  g.strokeStyle = '#B8862F'; g.lineWidth = 6; arco(3); g.stroke();
  g.strokeStyle = 'rgba(255,244,220,.85)'; g.lineWidth = 2; arco(18); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const carregar = src => new Promise((ok, erro) => { const im = new Image(); im.decoding = 'async'; im.onload = () => ok(im); im.onerror = erro; im.src = src; });

async function iniciar(lista) {
  const imagens = await Promise.all(lista.map(p => carregar(p.foto)));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf3ebdb, 7, 13); // os de trás somem no papel creme do fundo
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);

  const N = lista.length, passo = (Math.PI * 2) / N;
  const larg = 1.5, alt = larg * 820 / 600;
  const R = Math.max(2.4, (N * (larg + 0.55)) / (Math.PI * 2));
  const roda = new THREE.Group(); scene.add(roda);
  const cartoes = [];

  imagens.forEach((img, i) => {
    const tex = cartao(img);
    const a = i * passo;
    const g = new THREE.Group();
    g.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
    g.rotation.y = a;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), mat);
    m.userData.i = i;
    // reflexo no chão: a mesma foto de cabeça para baixo, bem clarinha
    const refl = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.14, depthWrite: false }));
    refl.scale.y = -1; refl.position.y = -alt - 0.04;
    g.add(m, refl);
    roda.add(g);
    cartoes.push({ m, mat });
  });
  roda.position.y = 0.35;

  function medir() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const longe = camera.aspect < 0.8 ? R + 6.4 : R + 4.6; // no celular, mais longe
    camera.position.set(0, 0.55, longe); camera.lookAt(0, 0.1, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(medir).observe(stage); medir();

  // Ângulo: alvo encaixa num cartão; arrastar mexe livre
  let alvo = 0, atual = 0, arrastando = false, x0 = 0, base = 0, moveu = false, ultimaMexida = performance.now();
  const frente = () => ((Math.round(atual / passo) % N) + N) % N; // o que está de fato na frente agora
  let mostrado = -1;
  function mostrar() {
    const i = frente(); if (i === mostrado) return; mostrado = i;
    const p = lista[i];
    info.innerHTML = `<small>${esc(p.marca)}</small><h3>${esc(p.nome)}</h3>${p.notas ? `<p>${esc(p.notas)}</p>` : ''}<button class="btn dark" data-id="${esc(p.id)}">Ver detalhes</button>`;
    if (window.gsap) window.gsap.fromTo(info.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .6, stagger: .06, ease: 'power3.out' });
  }
  const ir = d => { alvo = (Math.round(alvo / passo) + d) * passo; /* passo a passo */ ultimaMexida = performance.now(); };

  stage.addEventListener('pointerdown', e => { arrastando = true; moveu = false; x0 = e.clientX; base = alvo; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => { if (!arrastando) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) moveu = true; alvo = base - dx * 0.006; ultimaMexida = performance.now(); });
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  stage.addEventListener('pointerup', e => {
    if (!arrastando) return; arrastando = false;
    if (moveu) { alvo = Math.round(alvo / passo) * passo; return; }
    // toque sem arrastar: abre o da frente ou gira até o tocado
    const r = stage.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(cartoes.map(c => c.m))[0];
    if (!hit) return;
    const i = hit.object.userData.i;
    if (i === frente()) { window.hayaAbrir && window.hayaAbrir(String(lista[i].id)); return; }
    let d = i - frente(); if (d > N / 2) d -= N; if (d < -N / 2) d += N; ir(d);
  });
  stage.addEventListener('pointercancel', () => { arrastando = false; alvo = Math.round(alvo / passo) * passo; });

  // As setas da seção passam a girar a roda
  const prev = document.getElementById('carPrev'), next = document.getElementById('carNext');
  if (prev && next) { prev.disabled = next.disabled = false; prev.onclick = () => ir(-1); next.onclick = () => ir(1); }
  stage.tabIndex = 0;
  stage.addEventListener('keydown', e => { if (e.key === 'ArrowRight') ir(1); if (e.key === 'ArrowLeft') ir(-1); if (e.key === 'Enter') window.hayaAbrir && window.hayaAbrir(String(lista[frente()].id)); });

  let visivel = false;
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !visivel) ultimaMexida = performance.now(); visivel = e.isIntersecting; }, { rootMargin: '100px' }).observe(stage);

  sec.classList.add('is3d');
  mostrar();
  const branco = new THREE.Color(0xffffff), apagado = new THREE.Color(0xcfc4b0);
  renderer.setAnimationLoop(t => {
    if (!visivel) return;
    if (!arrastando && performance.now() - ultimaMexida > 4500) ir(1); // passa sozinho
    atual += (alvo - atual) * 0.075;
    roda.rotation.y = -atual;
    roda.position.y = 0.35 + Math.sin(t / 1600) * 0.03;
    // o da frente fica com cor cheia; os outros mais apagados
    cartoes.forEach(({ mat }, i) => {
      let d = Math.abs(((i * passo - atual) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      mat.color.copy(apagado).lerp(branco, Math.max(0, 1 - d / passo));
    });
    mostrar();
    renderer.render(scene, camera);
  });
}

// Começa quando o site avisar que a lista de perfumes está pronta
if (window.hayaVitrine) comecar(); else addEventListener('haya:vitrine', comecar, { once: true });
