// Vitrine 3D "Em destaque" (Three.js) com as fotos reais dos perfumes em molduras de arco.
// Celular: roda vista de fora (os cartões giram na frente da câmera).
// Computador: galeria curva vista por dentro, como uma tela de cinema que envolve quem olha.
// Arrastar gira, as setas passam um a um, tocar no da frente abre o perfume, passa sozinho e pausa fora da tela.
// Sem WebGL ou com movimento reduzido, fica o carrossel comum (a seção não ganha a classe is3d).
import * as THREE from 'three';

const sec = document.getElementById('destaques');
const stage = document.getElementById('v3dStage');
const info = document.getElementById('v3dInfo');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const telaGrande = matchMedia('(min-width: 861px)');

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function temWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
const carregar = src => new Promise((ok, erro) => { const im = new Image(); im.decoding = 'async'; im.onload = () => ok(im); im.onerror = erro; im.src = src; });

// Desenha a foto dentro de um arco com filete dourado (vira a textura do cartão)
function cartao(img) {
  const W = 600, H = 820, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const arco = m => { g.beginPath(); g.moveTo(m, H - m); g.lineTo(m, W / 2); g.arc(W / 2, W / 2, W / 2 - m, Math.PI, 0); g.lineTo(W - m, H - m); g.closePath(); };
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

let desmontar = null, imagens = null, lista = null;

async function montar() {
  if (desmontar) { desmontar(); desmontar = null; }
  const grande = telaGrande.matches;
  imagens = imagens || await Promise.all(lista.map(p => carregar(p.foto)));
  const N = lista.length;
  const texturas = imagens.map(cartao);

  const ctl = new AbortController(), on = (el, ev, fn, op) => el.addEventListener(ev, fn, { ...op, signal: ctl.signal });
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  const roda = new THREE.Group(); scene.add(roda);
  const cartoes = []; // { m, mat, slot }

  // Quantas "vagas" na roda: no computador repete os perfumes para a curva ficar cheia
  const M = grande ? Math.max(N, Math.ceil(14 / N) * N) : N;
  const passo = (Math.PI * 2) / M;
  let R, alt, sinal; // sinal: para que lado arrastar gira

  if (grande) {
    // Galeria por dentro: cada cartão é um pedaço curvo de cilindro, a câmera fica no centro
    R = 6; sinal = 1;
    const ang = passo * 0.8, larg = R * ang; alt = larg * 820 / 600;
    for (let k = 0; k < M; k++) {
      const tex = texturas[k % N].clone(); tex.needsUpdate = true;
      tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1; tex.offset.x = 1; // visto por dentro fica espelhado: desvira
      const geo = new THREE.CylinderGeometry(R, R, alt, 32, 1, true, Math.PI + k * passo - ang / 2, ang);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide });
      const m = new THREE.Mesh(geo, mat); m.userData.slot = k;
      const refl = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false }));
      refl.scale.y = -1; refl.position.y = -alt - 0.06;
      roda.add(m, refl);
      cartoes.push({ m, mat, slot: k });
    }
  } else {
    // Roda vista de fora (celular)
    sinal = -1;
    const larg = 1.5; alt = larg * 820 / 600;
    R = Math.max(2.4, (N * (larg + 0.55)) / (Math.PI * 2));
    scene.fog = new THREE.Fog(0xf3ebdb, 7, 13); // os de trás somem no papel creme do fundo
    for (let k = 0; k < M; k++) {
      const a = k * passo, g = new THREE.Group();
      g.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); g.rotation.y = a;
      const mat = new THREE.MeshBasicMaterial({ map: texturas[k], transparent: true });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), mat); m.userData.slot = k;
      const refl = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshBasicMaterial({ map: texturas[k], transparent: true, opacity: 0.14, depthWrite: false }));
      refl.scale.y = -1; refl.position.y = -alt - 0.04;
      g.add(m, refl); roda.add(g);
      cartoes.push({ m, mat, slot: k });
    }
  }
  roda.position.y = grande ? 0.5 : 0.35;

  let mouseX = 0;
  function medir() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    if (grande) {
      // ângulo de visão para o cartão ocupar ~62% da altura do palco
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((alt / 0.62) / 2 / R));
      camera.position.set(0, 0.25, 0);
    } else {
      camera.fov = 32;
      camera.position.set(0, 0.55, camera.aspect < 0.8 ? R + 6.4 : R + 4.6);
    }
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(medir); ro.observe(stage); medir();

  let alvo = 0, atual = 0, arrastando = false, x0 = 0, base = 0, moveu = false, ultimaMexida = performance.now();
  const frente = () => ((Math.round(atual / passo) % M) + M) % M; // vaga que está de fato na frente
  let mostrado = -1;
  function mostrar() {
    const i = frente() % N; if (i === mostrado) return; mostrado = i;
    const p = lista[i];
    info.innerHTML = `<small>${esc(p.marca)}</small><h3>${esc(p.nome)}</h3>${p.notas ? `<p>${esc(p.notas)}</p>` : ''}<button class="btn dark" data-id="${esc(p.id)}">Ver detalhes</button>`;
    if (window.gsap) window.gsap.fromTo(info.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .6, stagger: .06, ease: 'power3.out' });
  }
  const ir = d => { alvo = (Math.round(alvo / passo) + d) * passo; ultimaMexida = performance.now(); };
  const pxPorVaga = () => grande ? stage.clientWidth / 4 : 170;

  on(stage, 'pointerdown', e => { arrastando = true; moveu = false; x0 = e.clientX; base = alvo; stage.setPointerCapture(e.pointerId); });
  on(stage, 'pointermove', e => {
    if (e.pointerType === 'mouse') { const r = stage.getBoundingClientRect(); mouseX = (e.clientX - r.left) / r.width - 0.5; }
    if (!arrastando) return;
    const dx = e.clientX - x0; if (Math.abs(dx) > 4) moveu = true;
    alvo = base + sinal * (dx / pxPorVaga()) * passo; ultimaMexida = performance.now();
  });
  on(stage, 'pointerleave', () => { mouseX = 0; });
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  on(stage, 'pointerup', e => {
    if (!arrastando) return; arrastando = false;
    if (moveu) { alvo = Math.round(alvo / passo) * passo; return; }
    const r = stage.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(cartoes.map(c => c.m))[0];
    if (!hit) return;
    const slot = hit.object.userData.slot;
    if (slot === frente()) { window.hayaAbrir && window.hayaAbrir(String(lista[slot % N].id)); return; }
    let d = slot - frente(); if (d > M / 2) d -= M; if (d < -M / 2) d += M; ir(d);
  });
  on(stage, 'pointercancel', () => { arrastando = false; alvo = Math.round(alvo / passo) * passo; });
  stage.tabIndex = 0;
  on(stage, 'keydown', e => { if (e.key === 'ArrowRight') ir(1); if (e.key === 'ArrowLeft') ir(-1); if (e.key === 'Enter') window.hayaAbrir && window.hayaAbrir(String(lista[frente() % N].id)); });
  const prev = document.getElementById('carPrev'), next = document.getElementById('carNext');
  if (prev && next) { prev.disabled = next.disabled = false; prev.onclick = () => ir(-1); next.onclick = () => ir(1); }

  let visivel = false;
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !visivel) ultimaMexida = performance.now(); visivel = e.isIntersecting; }, { rootMargin: '100px' });
  io.observe(stage);

  sec.classList.add('is3d');
  mostrar();
  const branco = new THREE.Color(0xffffff), apagado = new THREE.Color(grande ? 0xb9ad98 : 0xcfc4b0);
  let olhar = 0;
  renderer.setAnimationLoop(t => {
    if (!visivel) return;
    if (!arrastando && performance.now() - ultimaMexida > 4500) ir(1); // passa sozinho
    atual += (alvo - atual) * 0.075;
    roda.rotation.y = -atual;
    roda.position.y = (grande ? 0.5 : 0.35) + Math.sin(t / 1600) * 0.03;
    if (grande) { olhar += (-mouseX * 0.12 - olhar) * 0.05; camera.rotation.set(-0.04, olhar, 0); }
    cartoes.forEach(({ mat, slot }) => {
      const d = Math.abs(((slot * passo - atual) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      mat.color.copy(apagado).lerp(branco, Math.max(0, 1 - d / passo));
    });
    mostrar();
    renderer.render(scene, camera);
  });

  desmontar = () => {
    renderer.setAnimationLoop(null); ctl.abort(); ro.disconnect(); io.disconnect();
    scene.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.map && o.material.map.dispose(); o.material.dispose(); } });
    renderer.dispose(); renderer.domElement.remove();
  };
}

function comecar() {
  lista = window.hayaVitrine || [];
  if (!sec || !stage || reduce || !temWebGL() || lista.length < 3) return;
  montar().catch(e => { console.error('vitrine3d', e); sec.classList.remove('is3d'); });
  // trocou de celular para computador (ou girou o tablet): monta o outro modo
  telaGrande.addEventListener('change', () => montar().catch(() => sec.classList.remove('is3d')));
}

// Começa quando o site avisar que a lista de perfumes está pronta
if (window.hayaVitrine) comecar(); else addEventListener('haya:vitrine', comecar, { once: true });
