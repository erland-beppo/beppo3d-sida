// --- IMPORT AV MODULER ---
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// --- GLOBALA VARIABLER ---
let scene, camera, renderer, model;
let isDragging = false;
const sensitivity = 0.5;

// --- STARTFUNKTION ---
function init() {
    console.log("Initializing simplified debug script...");

    // Hämta behållaren för vår canvas
    const holder = document.getElementById('canvas-holder-1');
    if (!holder) {
        console.error("Kunde inte hitta div med id='canvas-holder-1'");
        return;
    }

    // 1. Skapa en scen
    scene = new THREE.Scene();

    // 2. Skapa en kamera
    camera = new THREE.PerspectiveCamera(75, holder.clientWidth / 600, 0.1, 1000);
    camera.position.z = 250; // Flytta kameran bakåt så vi ser objektet

    // 3. Skapa en renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(holder.clientWidth, 600);
    renderer.setClearColor(0x000000, 0); // Transparent bakgrund
    holder.appendChild(renderer.domElement);

    // 4. Lägg till ljus
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 5).normalize();
    scene.add(directionalLight);

    // 5. Ladda 3D-modellen
    const loader = new GLTFLoader();
    loader.load(
        './verk1.glb', // Sökväg till din första modell
        (gltf) => {
            console.log("Model loaded successfully!");
            model = gltf.scene;

            // Anpassa materialet på modellen
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xfc5858,
                        metalness: 0.1,
                        roughness: 0.8,
                        transparent: true,
                        opacity: 0.8
                    });
                }
            });

            // Skala och positionera
            model.scale.set(500, 500, 500);
            model.position.set(0, 0, 0);
            scene.add(model);
            console.log("Model added to the scene!");
            
            // Starta renderingsloopen FÖRST när modellen är laddad
            animate();
        },
        undefined, // Vi hoppar över progress-funktionen för nu
        (error) => {
            console.error('Ett fel inträffade vid laddning av modellen:', error);
            holder.innerHTML = `<p style="color: red;">Ett fel inträffade. Modellen kunde inte laddas.</p>`;
        }
    );

    // 6. Sätt upp event listeners för rotation
    setupEventListeners();
}

// --- RENDERINGS-LOOP ---
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// --- FUNKTIONER FÖR INTERAKTION OCH FÖNSTERÄNDRING ---
function handleRotationEvent(event) {
    if (!isDragging || !model) return;
    
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const xNormalized = (clientX / window.innerWidth) - 0.5;
    const yNormalized = (clientY / 600) - 0.5;
    
    model.rotation.y = xNormalized * sensitivity * Math.PI * 2;
    model.rotation.x = yNormalized * sensitivity * Math.PI * 2;
}

function onWindowResize() {
    const holder = document.getElementById('canvas-holder-1');
    if (!holder) return;
    camera.aspect = holder.clientWidth / 600;
    camera.updateProjectionMatrix();
    renderer.setSize(holder.clientWidth, 600);
}

function setupEventListeners() {
    renderer.domElement.addEventListener('mousedown', () => { isDragging = true; });
    document.addEventListener('mouseup', () => { isDragging = false; });
    document.addEventListener('mouseleave', () => { isDragging = false; });
    document.addEventListener('mousemove', handleRotationEvent);
    
    renderer.domElement.addEventListener('touchstart', (e) => { isDragging = true; handleRotationEvent(e); });
    document.addEventListener('touchend', () => { isDragging = false; });
    document.addEventListener('touchmove', handleRotationEvent);

    window.addEventListener('resize', onWindowResize);
}

// --- KÖR SCRIPTET ---
init();