// --- IMPORT AV MODULER ---
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// --- GLOBALA VARIABLER ---
const SENSITIVITY = 0.5;
const MODEL_FILE_1 = './verk1.glb';
const MODEL_FILE_2 = './studios.glb';

let scene, renderer;
let activeView = null;
let isDragging = false;
const views = [];

// --- HUVUDFUNKTION: INITIERING ---
function init() {
    scene = new THREE.Scene();

    const canvasContainer = document.getElementById('main-canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    canvasContainer.appendChild(renderer.domElement);

    setupView('canvas-holder-1', './verk1.glb', 250, 0xfc5858, 0.8, 0);
    setupView('canvas-holder-2', './studios.glb', 150, 0x0061ff, 0.9, -Math.PI / 12);

    addLights();
    setupEventListeners();
    animate();
}

// --- INSTÄLLNING AV EN VY ---
function setupView(holderId, modelPath, camZ, color, opacity, rotationX) {
    const holder = document.getElementById(holderId);
    if (!holder) return;

    const camera = new THREE.PerspectiveCamera(75, holder.clientWidth / holder.clientHeight, 0.1, 1000);
    camera.position.z = camZ;

    const view = {
        holder: holder,
        camera: camera,
        model: null,
    };
    views.push(view);

    new GLTFLoader().load(modelPath, (gltf) => {
        const model = gltf.scene;
        model.scale.set(500, 500, 500);
        model.rotation.x = rotationX;

        model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(color),
                    metalness: 0.1,
                    roughness: 0.8,
                    transparent: true,
                    opacity: opacity,
                });
            }
        });

        scene.add(model);
        view.model = model;
    });
}

// --- LJUS ---
function addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 5).normalize();
    scene.add(directionalLight);
}

// --- RENDERINGS-LOOP ---
function animate() {
    requestAnimationFrame(animate);
    renderer.setScissorTest(true);
    views.forEach(view => {
        const { left, right, top, bottom, width, height } = view.holder.getBoundingClientRect();
        if (bottom < 0 || top > renderer.domElement.clientHeight) return;

        const positiveY = renderer.domElement.clientHeight - bottom;
        renderer.setScissor(left, positiveY, width, height);
        renderer.setViewport(left, positiveY, width, height);

        view.camera.aspect = width / height;
        view.camera.updateProjectionMatrix();

        renderer.render(scene, view.camera);
    });
    renderer.setScissorTest(false);
}

// --- EVENT LISTENERS FÖR INTERAKTION ---
function setupEventListeners() {
    let isDragging = false;

    const startDrag = (event) => {
        isDragging = true;
        const x = event.clientX || event.touches[0].clientX;
        const y = event.clientY || event.touches[0].clientY;

        activeView = views.find(view => {
            const rect = view.holder.getBoundingClientRect();
            return y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right;
        });
    };

    const endDrag = () => {
        isDragging = false;
        activeView = null;
    };

    const onDrag = (event) => {
        if (!isDragging || !activeView || !activeView.model) return;

        if (event.type === 'touchmove') event.preventDefault();

        const clientX = event.clientX || event.touches[0].clientX;
        const rect = activeView.holder.getBoundingClientRect();
        const xNormalized = ((clientX - rect.left) / rect.width) * 2 - 1;

        activeView.model.rotation.y = xNormalized * Math.PI;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('touchstart', startDrag, { passive: false });

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
    window.addEventListener('mousemove', onDrag, { passive: false });
    window.addEventListener('touchmove', onDrag, { passive: false });

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        views.forEach(view => {
            const rect = view.holder.getBoundingClientRect();
            view.camera.aspect = rect.width / rect.height;
            view.camera.updateProjectionMatrix();
        });
    });
}

// --- STARTA ALLT ---
init();
