import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

const SENSITIVITY = 0.5;
const instances = []; // En array för att hålla våra två 3D-instanser

// Funktion för att skapa en komplett 3D-instans
function createThreeInstance(config) {
    const holder = document.getElementById(config.holderId);
    if (!holder) {
        console.error(`Holder element with id ${config.holderId} not found.`);
        return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, holder.clientWidth / 600, 0.1, 1000);
    camera.position.z = config.camZ;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(holder.clientWidth, 600);
    renderer.setClearColor(0x000000, 0);
    holder.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 5).normalize();
    scene.add(directionalLight);

    let model = null;

    new GLTFLoader().load(config.modelPath, (gltf) => {
        model = gltf.scene;
        model.scale.set(500, 500, 500);
        model.rotation.x = config.rotationX;
        
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(config.color),
                    metalness: 0.1, roughness: 0.8,
                    transparent: true, opacity: config.opacity
                });
            }
        });
        
        scene.add(model);
        console.log(`Model ${config.modelPath} loaded successfully.`);
    });
    
    const instance = { holder, renderer, scene, camera, modelRef: () => model };
    instances.push(instance);

    // Event listeners specifika för denna canvas
    let isDragging = false;
    renderer.domElement.addEventListener('mousedown', () => { isDragging = true; });
    renderer.domElement.addEventListener('touchstart', () => { isDragging = true; });

    const handleRotation = (clientX) => {
        if (!isDragging || !model) return;
        const xNormalized = (clientX / window.innerWidth) - 0.5;
        model.rotation.y = xNormalized * SENSITIVITY * Math.PI * 2;
    };

    renderer.domElement.addEventListener('mousemove', (e) => handleRotation(e.clientX));
    renderer.domElement.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleRotation(e.touches[0].clientX);
    }, { passive: false });

    // Globala "släpp"-händelser
    document.addEventListener('mouseup', () => { isDragging = false; });
    document.addEventListener('touchend', () => { isDragging = false; });
}

// Animation loop som hanterar alla instanser
function animate() {
    requestAnimationFrame(animate);
    instances.forEach(instance => {
        instance.renderer.render(instance.scene, instance.camera);
    });
}

// Skapa våra två 3D-vyer
createThreeInstance({
    holderId: 'canvas-holder-1',
    modelPath: './verk1.glb',
    camZ: 250,
    color: 0xfc5858,
    opacity: 0.8,
    rotationX: 0
});

createThreeInstance({
    holderId: 'canvas-holder-2',
    modelPath: './studios.glb',
    camZ: 150,
    color: 0x0061ff,
    opacity: 0.9,
    rotationX: -Math.PI / 12
});

// Starta den globala animationsloopen
animate();
