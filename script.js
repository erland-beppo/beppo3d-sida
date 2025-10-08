// --- IMPORT AV MODULER ---
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';


// --- KONSTANTER OCH GLOBALA VARIABLER ---
const SENSITIVITY = 0.5;
const MODEL_FILE_1 = './verk1.glb'; 
const MODEL_FILE_2 = './studios.glb';

let isDragging = false;
let loadedModels = [];
let renderers = [];
let scene;
let cameras = [];
let canvasElements = [];


// --- FUNKTION FÖR ROTATION ---
function handleRotationEvent(event) {
    if (!isDragging || loadedModels.length === 0) return;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const viewHeight = 600;

    const xNormalized = (clientX / window.innerWidth) - 0.5;
    const yNormalized = (clientY / viewHeight) - 0.5;

    loadedModels.forEach(model => {
        model.rotation.y = xNormalized * SENSITIVITY * Math.PI * 2;
        model.rotation.x = yNormalized * SENSITIVITY * Math.PI * 2;
    });
}


// --- 1. STARTFUNKTION OCH INITIERING ---
function init() {
    console.log("Initializing Beppo3D script...");
    scene = new THREE.Scene();
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 5).normalize();
    scene.add(directionalLight);

    load3DModel(MODEL_FILE_1, 'canvas-holder-1', 250, 0xfc5858, 0.6, 0, 0);
    load3DModel(MODEL_FILE_2, 'canvas-holder-2', 60, 0x0061ff, 0.9, 0, -Math.PI / 3);

    setupEventListeners();
    window.addEventListener('load', onWindowResize, false);
    
    animate();
}

// --- GENERISK MODELLADDNINGSFUNKTION ---
function load3DModel(file, holderId, camZ, colorHex, opacity, positionZ, rotationX) {
    console.log(`Attempting to load model '${file}' into '#${holderId}'`);
    const holder = document.getElementById(holderId);
    if (!holder) {
        console.error(`Error: Could not find container with id '${holderId}'.`);
        return;
    }

    const localCamera = new THREE.PerspectiveCamera(75, holder.clientWidth / 600, 0.1, 20000);
    localCamera.position.z = camZ;
    cameras.push(localCamera);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(holder.clientWidth, 600);

    renderer.domElement.style.position = 'relative';
    renderer.domElement.style.zIndex = '50';
    holder.appendChild(renderer.domElement);

    renderers.push(renderer);
    canvasElements.push(renderer.domElement);

    const loader = new GLTFLoader();
    loader.load(
        file,
        function (gltf) {
            const model = gltf.scene;
            
            model.traverse((child) => {
                if (child.isMesh) {
                    const originalMaterial = child.material;
                    const newMaterial = originalMaterial.clone();

                    newMaterial.color.setHex(colorHex);
                    newMaterial.metalness = 0.1;
                    newMaterial.roughness = 0.8;
                    newMaterial.vertexColors = false;
                    newMaterial.transparent = true;
                    newMaterial.opacity = opacity;
                    newMaterial.needsUpdate = true;

                    child.material = newMaterial;
                }
            });

            model.scale.set(500, 500, 500);
            model.position.set(0, 0, positionZ);
            model.rotation.y = Math.PI / 4;
            model.rotation.x = rotationX;

            const modelWrapper = new THREE.Group();
            modelWrapper.add(model);
            scene.add(modelWrapper);

            loadedModels.push(modelWrapper);
            console.log(`Successfully loaded and added '${file}' to the scene.`);
        },
        function (xhr) {
            // FIX: Ändrade från 'total' till 'xhr.total'
            if (xhr.total > 0) {
                 console.log(`Model '${file}': ` + (xhr.loaded / xhr.total * 100) + '% loaded');
            }
        },
        function (error) {
            console.error(`An error occurred while loading model '${file}':`, error);
            holder.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">
                Kunde inte ladda 3D-modell: ${file}.<br>
                Kontrollera webbläsarens konsol (tryck F12) för mer information.
                </p>`;
        }
    );
}


// --- HUVUDLOOP OCH EVENT-HANTERING ---
function animate() {
    requestAnimationFrame(animate);

    renderers.forEach((renderer, index) => {
        if (cameras[index]) {
            renderer.render(scene, cameras[index]);
        }
    });
}

function onWindowResize() {
    renderers.forEach((renderer, index) => {
        const holder = renderer.domElement.parentNode;
        if (!holder) return;

        const holderWidth = holder.clientWidth;
        const holderHeight = 600;

        if (holderWidth === 0) return;

        const newAspect = holderWidth / holderHeight;

        if (cameras[index]) {
            cameras[index].aspect = newAspect;
            cameras[index].updateProjectionMatrix();
        }
        renderer.setSize(holderWidth, holderHeight);
    });
}


function setupEventListeners() {
    document.addEventListener('mouseup', () => { isDragging = false; });
    document.addEventListener('touchend', () => { isDragging = false; });
    document.addEventListener('mousemove', handleRotationEvent); 
    document.addEventListener('touchmove', (event) => {
        if (isDragging) {
            event.preventDefault();
            handleRotationEvent(event);
        }
    }, { passive: false });

    canvasElements.forEach(canvas => {
        canvas.addEventListener('mousedown', () => { isDragging = true; });
        canvas.addEventListener('touchstart', (event) => {
            isDragging = true;
            handleRotationEvent(event);
        }, { passive: false });
    });
    
    window.addEventListener('resize', onWindowResize, false);
}

// Kör igång allting!
init();