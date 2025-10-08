// --- IMPORT AV MODULER ---
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// --- GLOBALA VARIABLER ---
const SENSITIVITY = 0.5;
const MODEL_FILE_1 = './verk1.glb';
const MODEL_FILE_2 = './studios.glb';

let scene;
const renderers = [];
const cameras = [];
const models = []; // Håller reda på varje modell och dess canvas

let activeModel = null; // Håller reda på vilken modell som för tillfället roteras

// --- INITIERING ---
function init() {
    scene = new THREE.Scene();

    // Lägg till ljus i scenen
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 5).normalize();
    scene.add(directionalLight);

    // Ladda båda modellerna
    load3DModel(MODEL_FILE_1, 'canvas-holder-1', 250, 0xfc5858, 0.8, 0);
    load3DModel(MODEL_FILE_2, 'canvas-holder-2', 150, 0x0061ff, 0.9, -Math.PI / 12);

    // Starta renderingsloopen
    animate();
    
    // Sätt upp event listeners
    setupEventListeners();
}

// --- LADDNING AV MODELLER ---
function load3DModel(file, holderId, camZ, colorHex, opacity, initialRotationX) {
    const holder = document.getElementById(holderId);
    if (!holder) return;

    // Skapa en unik kamera och renderer för denna modell
    const camera = new THREE.PerspectiveCamera(75, holder.clientWidth / 600, 0.1, 1000);
    camera.position.z = camZ;
    cameras.push(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(holder.clientWidth, 600);
    renderer.setClearColor(0x000000, 0);
    holder.appendChild(renderer.domElement);
    renderers.push(renderer);

    const loader = new GLTFLoader();
    loader.load(file, (gltf) => {
        const model = gltf.scene;
        model.scale.set(500, 500, 500);
        model.rotation.x = initialRotationX;

        model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(colorHex),
                    metalness: 0.1,
                    roughness: 0.8,
                    transparent: true,
                    opacity: opacity
                });
            }
        });
        
        scene.add(model);
        
        // Spara referenser till allt som hör ihop
        models.push({
            model: model,
            canvas: renderer.domElement
        });
    });
}

// --- RENDERINGS-LOOP ---
function animate() {
    requestAnimationFrame(animate);
    // Rendera scenen från varje kameras perspektiv på sin egen canvas
    for (let i = 0; i < renderers.length; i++) {
        renderers[i].render(scene, cameras[i]);
    }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    let isDragging = false;

    const startRotation = (event) => {
        isDragging = true;
        // Hitta vilken modell som är kopplad till den canvas vi interagerar med
        const targetCanvas = event.target;
        activeModel = models.find(m => m.canvas === targetCanvas)?.model || null;
    };

    const endRotation = () => {
        isDragging = false;
        activeModel = null; // Nollställ aktiv modell
    };

    const handleRotation = (event) => {
        if (!isDragging || !activeModel) return;

        // Förhindra att sidan scrollar på mobilen
        if (event.type === 'touchmove') {
            event.preventDefault();
        }

        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;

        const xNormalized = (clientX / window.innerWidth) - 0.5;
        const yNormalized = (clientY / 600) - 0.5;

        // Rotera endast den aktiva modellen
        activeModel.rotation.y = xNormalized * SENSITIVITY * Math.PI * 2;
        // Behåll initial X-rotation och lägg till den nya
        const initialRotationX = models.find(m => m.model === activeModel)?.model.rotation.x || 0;
        activeModel.rotation.x = initialRotationX + (yNormalized * SENSITIVITY * Math.PI * 2);
    };

    // Koppla events till dokumentet för att kunna "släppa" musknappen var som helst
    document.addEventListener('mousemove', handleRotation, { passive: false });
    document.addEventListener('touchmove', handleRotation, { passive: false });
    document.addEventListener('mouseup', endRotation);
    document.addEventListener('touchend', endRotation);

    // Vi måste lägga till mousedown/touchstart på varje enskild canvas
    // Detta görs när modellerna är laddade och renderaren skapats
    // Vi använder en liten fördröjning för att säkerställa att canvas-elementen finns
    setTimeout(() => {
        models.forEach(obj => {
            obj.canvas.addEventListener('mousedown', startRotation);
            obj.canvas.addEventListener('touchstart', startRotation);
        });
    }, 1000); // 1 sekund fördröjning
    
    // Hantera fönsterstorleksändring
    window.addEventListener('resize', () => {
        renderers.forEach((renderer, i) => {
            const holder = renderer.domElement.parentNode;
            if (holder) {
                cameras[i].aspect = holder.clientWidth / 600;
                cameras[i].updateProjectionMatrix();
                renderer.setSize(holder.clientWidth, 600);
            }
        });
    });
}

// --- START ---
init();