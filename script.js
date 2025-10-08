import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

let scene, renderer;
let activeView = null;
let isDragging = false;
const views = [];

// --- HUVUDFUNKTION: INITIERING ---
function init() {
    // Skapa en enda scen
    scene = new THREE.Scene();

    // Skapa en enda renderer som fyller hela fönstret
    const canvasContainer = document.getElementById('main-canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    canvasContainer.appendChild(renderer.domElement);

    // Definiera våra två vyer/modeller
    setupView('canvas-holder-1', './verk1.glb', 250, 0xfc5858, 0.8, 0);
    setupView('canvas-holder-2', './studios.glb', 150, 0x0061ff, 0.9, -Math.PI / 12);
    
    // Lägg till ljus
    addLights();
    
    // Sätt upp event listeners
    setupEventListeners();
    
    // Starta renderingsloopen
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
        model: null, // Modellen läggs till när den är laddad
    };
    views.push(view);

    // Ladda modellen för denna vy
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
        view.model = model; // Koppla den laddade modellen till vyn
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

    // Gå igenom varje vy och rita ut den på sin plats
    views.forEach(view => {
        const { left, right, top, bottom, width, height } = view.holder.getBoundingClientRect();
        
        // Hoppa över om den inte är synlig på skärmen
        if (bottom < 0 || top > renderer.domElement.clientHeight) return;

        const positiveY = renderer.domElement.clientHeight - bottom;
        renderer.setScissor(left, positiveY, width, height);
        renderer.setViewport(left, positiveY, width, height);
        
        view.camera.aspect = width / height;
        view.camera.updateProjectionMatrix();

        renderer.setScissorTest(true);
        renderer.render(scene, view.camera);
    });
}

// --- EVENT LISTENERS FÖR INTERAKTION ---
function setupEventListeners() {
    const startDrag = (event) => {
        isDragging = true;
        const x = event.clientX || event.touches[0].clientX;
        const y = event.clientY || event.touches[0].clientY;

        // Kolla vilken vy vi klickade i
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

        event.preventDefault();
        const clientX = event.clientX || event.touches[0].clientX;
        
        const rect = activeView.holder.getBoundingClientRect();
        const xNormalized = ((clientX - rect.left) / rect.width) * 2 - 1;

        // Rotera endast den aktiva modellen
        activeView.model.rotation.y = xNormalized * Math.PI;
    };

    window.addEventListener('mousedown', startDrag);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('mousemove', onDrag);

    window.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchmove', onDrag, { passive: false });

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- STARTA ALLT ---
init();