// Frasco 3D do início (Three.js). Vidro com transmissão, perfume âmbar, tampa dourada e rótulo HAYA.
// Se WebGL falhar ou a pessoa preferir menos movimento, fica a foto que já está no arco.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const host = document.getElementById('bottle3d');
const niche = document.getElementById('niche');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function temWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

if (host && niche && !reduce && temWebGL()) iniciar().catch(() => niche.classList.remove('is3d'));

async function iniciar() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0.3, 9);

  // Luzes quentes: a de trás desenha o contorno dourado do vidro
  const key = new THREE.DirectionalLight(0xfff1d6, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0xd9b365, 40, 12); rim.position.set(-2.5, 1.5, -2.5); scene.add(rim);
  const back = new THREE.PointLight(0xffc56b, 30, 10); back.position.set(0, 0.5, -3); scene.add(back);

  const frasco = new THREE.Group();
  scene.add(frasco);

  // Vidro: corpo quadrado com cantos suaves
  const vidro = new THREE.MeshPhysicalMaterial({
    color: 0xfff8ea, metalness: 0.05, roughness: 0.02, transparent: true, opacity: 0.16, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.4, specularIntensity: 1,
  });
  const corpo = new THREE.Mesh(new RoundedBoxGeometry(1.7, 1.95, 0.95, 8, 0.16), vidro);
  frasco.add(corpo);

  // Perfume dentro (um pouco menor, até 82% da altura)
  const liquidoMat = new THREE.MeshPhysicalMaterial({
    color: 0x8f4708, emissive: 0x3a1600, emissiveIntensity: 0.25, metalness: 0.05, roughness: 0.08,
    clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3,
  });
  const liquido = new THREE.Mesh(new RoundedBoxGeometry(1.42, 1.5, 0.7, 6, 0.1), liquidoMat);
  liquido.position.y = -0.14;
  frasco.add(liquido);
  corpo.renderOrder = 2;

  // Ouro escovado para gargalo e tampa
  const ouro = new THREE.MeshPhysicalMaterial({ color: 0xc99a45, metalness: 1, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.6 });
  const gargalo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.26, 40), ouro);
  gargalo.position.y = 1.1;
  frasco.add(gargalo);
  const anel = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 16, 60), ouro);
  anel.rotation.x = Math.PI / 2; anel.position.y = 1.0;
  frasco.add(anel);
  const tampa = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.72, 0.95, 6, 0.08), ouro);
  tampa.position.y = 1.58;
  frasco.add(tampa);
  // Logo H gravado na tampa (duas hastes e a curva, como na logo da Haya)
  const preto = new THREE.MeshStandardMaterial({ color: 0x0a0806, metalness: 0.6, roughness: 0.4 });
  for (const x of [-0.13, 0.13]) {
    const haste = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.42, 0.01), preto);
    haste.position.set(x, 1.58, 0.481); frasco.add(haste);
  }
  const curva = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.13, 1.6, 0.482), new THREE.Vector3(-0.02, 1.62, 0.482), new THREE.Vector3(0.02, 1.52, 0.482), new THREE.Vector3(0.13, 1.54, 0.482)), 24, 0.012, 8), preto);
  frasco.add(curva);

  // Rótulo preto com letras douradas, colado na frente do vidro
  await (document.fonts ? document.fonts.ready : Promise.resolve());
  const c = document.createElement('canvas'); c.width = 1024; c.height = 640;
  const g = c.getContext('2d');
  g.fillStyle = '#100c08'; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#d9b365'; g.lineWidth = 6; g.strokeRect(28, 28, c.width - 56, c.height - 56);
  g.lineWidth = 2; g.strokeRect(48, 48, c.width - 96, c.height - 96);
  g.fillStyle = '#d9b365'; g.textAlign = 'center';
  g.font = '500 220px "Cormorant Garamond", Georgia, serif';
  g.fillText('HAYA', c.width / 2, 360);
  g.font = '400 54px Jost, sans-serif';
  g.fillText('P A R F U M', c.width / 2, 470);
  g.font = 'italic 400 44px "Cormorant Garamond", Georgia, serif';
  g.fillText('Tatuí', c.width / 2, 548);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const rotulo = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.64), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.35, metalness: 0.2, clearcoat: 0.4 }));
  rotulo.position.set(0, -0.12, 0.478);
  frasco.add(rotulo);

  // Sombra macia no pedestal
  const sombraC = document.createElement('canvas'); sombraC.width = sombraC.height = 128;
  const sg = sombraC.getContext('2d'); const grad = sg.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,.55)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = grad; sg.fillRect(0, 0, 128, 128);
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sombraC), transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = -1.0;
  scene.add(sombra);

  frasco.position.y = -0.05;
  frasco.rotation.set(0.04, -0.5, 0);

  // Tamanho do canvas acompanha a caixa
  function medir() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // em telas estreitas, afasta a câmera para o frasco caber inteiro
    camera.position.z = camera.aspect < 0.62 ? 10.2 : 9;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(medir).observe(host);
  medir();

  // Interação: arrastar gira; mouse por cima inclina; rolar a página dá uma volta
  let alvoY = -0.5, alvoX = 0.04, girando = false, x0 = 0, base = 0, rolagem = 0, auto = 0;
  host.addEventListener('pointerdown', e => { girando = true; x0 = e.clientX; base = alvoY; host.setPointerCapture(e.pointerId); });
  host.addEventListener('pointermove', e => {
    if (girando) { alvoY = base + (e.clientX - x0) * 0.012; return; }
    if (e.pointerType === 'mouse') { const r = host.getBoundingClientRect(); alvoX = 0.04 + ((e.clientY - r.top) / r.height - 0.5) * 0.25; }
  });
  const soltar = () => { girando = false; };
  host.addEventListener('pointerup', soltar); host.addEventListener('pointercancel', soltar);
  addEventListener('scroll', () => { rolagem = Math.min(scrollY / innerHeight, 1.2); }, { passive: true });

  // Entrada: o frasco desce girando para o pedestal
  const entrada = { t: 0 };
  const inicio = performance.now() + 2100; // espera a cortina e o arco abrirem

  // Só desenha quando o início está na tela
  let visivel = true;
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }, { threshold: 0 }).observe(host);

  niche.classList.add('is3d');
  const relogio = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visivel) return;
    const dt = Math.min(relogio.getDelta(), 0.05), agora = performance.now();
    entrada.t = Math.min(Math.max((agora - inicio) / 1600, 0), 1);
    const e = 1 - Math.pow(1 - entrada.t, 4); // desaceleração suave
    if (!girando) auto += dt * 0.25;
    const yAlvo = alvoY + Math.sin(auto) * 0.45 + rolagem * Math.PI * 0.9 + (1 - e) * -2.4;
    frasco.rotation.y += (yAlvo - frasco.rotation.y) * 0.08;
    frasco.rotation.x += (alvoX - frasco.rotation.x) * 0.06;
    frasco.position.y = -0.05 + (1 - e) * 2.6 + Math.sin(agora / 1300) * 0.04 * e;
    frasco.scale.setScalar(0.6 + 0.4 * e);
    sombra.material.opacity = e * (0.9 - Math.sin(agora / 1300) * 0.1);
    rotulo.material.opacity = 1;
    renderer.render(scene, camera);
  });
}
