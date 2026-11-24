import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();
// TODO 3: initial background color
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 5, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(4, 6, 5);
scene.add(sun);

scene.add(new THREE.GridHelper(20, 20));

const control = new OrbitControls(camera, renderer.domElement);

// TODO 1: different geometries, colors and sizes
// "y" is the height of the object's center so it sits on the floor
const shapes = [
  { geo: new THREE.BoxGeometry(1, 1, 1),                    color: 0x00ffff, y: 0.5 },
  { geo: new THREE.SphereGeometry(0.5, 32, 16),             color: 0xff00ff, y: 0.5 },
  { geo: new THREE.ConeGeometry(0.5, 1.2, 32),              color: 0xffa500, y: 0.6 },
  { geo: new THREE.CylinderGeometry(0.4, 0.4, 1.4, 32),     color: 0x800080, y: 0.7 },
  { geo: new THREE.TorusGeometry(0.5, 0.2, 16, 48),         color: 0xffff00, y: 0.7 },
  { geo: new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16),   color: 0x00ff66, y: 0.7 },
];

const pickables = [];

shapes.forEach((s, i) => {
  const material = new THREE.MeshStandardMaterial({ color: s.color });
  const mesh = new THREE.Mesh(s.geo, material);

  mesh.name = 'Objekti' + (i + 1);
  mesh.userData.baseY = s.y; // used to keep the object on the floor when scaling
  mesh.position.set(-7.5 + i * 3, s.y, 0);

  scene.add(mesh);
  pickables.push(mesh);
});

// ---- Pointer -> NDC ----
const pointer = new THREE.Vector2();

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;

  pointer.x = (2 * px) / rect.width - 1;
  pointer.y = 1 - (2 * py) / rect.height;
  return pointer;
}

// ---- Picking & dragging ----
let selected = null;
let dragging = false;
const raycaster = new THREE.Raycaster();

renderer.domElement.addEventListener('pointerdown', (event) => {
  raycaster.setFromCamera(updatePointer(event), camera);
  const hits = raycaster.intersectObjects(pickables);

  // heqim glow-in te objekti i vjeter
  if (selected) {
    selected.material.emissive.setHex(0x000000);
  }
  selected = hits.length > 0 ? hits[0].object : null;

  // objekti i ri i selektuar
  if (selected) {
    selected.material.emissive.setHex(0x882200);
    dragging = true;
    control.enabled = false;
    params.scale = selected.scale.x; // sync slider with selected object
    scaleCtrl.updateDisplay();
  }
});

const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const intersect = new THREE.Vector3();

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  raycaster.setFromCamera(updatePointer(event), camera);
  if (raycaster.ray.intersectPlane(plane, intersect)) {
    selected.position.x = intersect.x;
    selected.position.z = intersect.z;
  }
});

window.addEventListener('pointerup', () => {
  dragging = false;
  control.enabled = true;
});

// ---- GUI ----
const startPositions = pickables.map((obj) => obj.position.clone());
const startScales = pickables.map((obj) => obj.scale.clone());

const params = {
  scale: 1,
  background: '#202020',
  reset() {
    // TODO 2: restore BOTH position and scale of every object
    for (let i = 0; i < pickables.length; i++) {
      pickables[i].position.copy(startPositions[i]);
      pickables[i].scale.copy(startScales[i]);
    }
    params.scale = 1;
    scaleCtrl.updateDisplay();
  },
};

const gui = new GUI();

// Scale slider for the selected object (gives the reset something to restore)
const scaleCtrl = gui.add(params, 'scale', 0.3, 3, 0.01)
  .name('Shkalla (e zgjedhurit)')
  .onChange((v) => {
    if (!selected) return;
    selected.scale.setScalar(v);
    selected.position.y = selected.userData.baseY * v; // stay on the floor
  });

// TODO 3: background color
gui.addColor(params, 'background')
  .name('Ngjyra e sfondit')
  .onChange((v) => scene.background.set(v));

gui.add(params, 'reset').name('Rivendos Objektet');

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function loop() {
  requestAnimationFrame(loop);
  control.update();
  renderer.render(scene, camera);
}
loop();