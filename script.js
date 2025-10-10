// --- IMPORT AV MODULER (Stabil länk) ---
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';


// --- KONSTANTER OCH GLOBALA VARIABLER ---
const SENSITIVITY = 0.5; 
const MODEL_FILE_1 = 'verk1.glb'; // Fokus på denna fil
// const MODEL_FILE_2 = 'studios.glb'; <-- BORTTAGEN

let isDragging = false; 
let loadedModel; // Återgår till en enda modell variabel
let renderer, camera, scene; 
let canvasElement;


// --- FUNKTION FÖR ROTATION (Touch fixad) ---
function handleRotationEvent(event) {
    if (!isDragging || !loadedModel) return;
    
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const viewHeight = 600; 

    const xNormalized = (clientX / window.innerWidth) - 0.5;
    const yNormalized = (clientY / viewHeight) - 0.5; 
    
    // Roterar den ENDA modellen
    loadedModel.rotation.y = xNormalized * SENSITIVITY * Math.PI * 2;
    loadedModel.rotation.x = yNormalized * SENSITIVITY * Math.PI * 2;
}


// --- 1. STARTFUNKTION OCH INITIERING ---
function init() {
    // 1. Skapar EN global scen, EN kamera, EN renderare
    scene = new THREE.Scene();
    
    // Kamerainställning (Säker bas)
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / 600, 0.01, 20000 ); 
    camera.position.z = 250; 
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setClearColor( 0x000000, 0 ); 
    renderer.setSize( window.innerWidth, 600 ); 
    
    // Fäster renderaren i den ENDA hållaren
    const holder1 = document.getElementById('canvas-holder-1');
    if (holder1) {
        holder1.appendChild(renderer.domElement); 
        canvasElement = renderer.domElement; // Lagrar canvasen
    } else {
        document.body.appendChild(renderer.domElement); 
        canvasElement = renderer.domElement;
    }
    
    // Z-INDEX FIX
    canvasElement.style.position = 'relative'; 
    canvasElement.style.zIndex = '50'; 
    
    loadModel(); // Kör den ENDA laddningsfunktionen
    setupEventListeners();
    animate();
}

// --- 2. LADDAR MODELL OCH LJUS ---
function loadModel() {
    // Lägg till Ljus (Ökat ljus)
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.8 ); 
    scene.add( ambientLight );
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 ); 
    directionalLight.position.set( 5, 10, 5 ).normalize();
    scene.add( directionalLight );

    const loader = new GLTFLoader(); 
    loader.load(
        MODEL_FILE_1, // Laddar den ENDA filen
        function ( gltf ) {
            loadedModel = gltf.scene; 
            scene.add( loadedModel );

            // FÄRGFIX OCH MATERIAL (Rosa/Transparent)
            loadedModel.traverse((child) => {
                 if (child.isMesh) {
                    const originalMaterial = child.material;
                    const newMaterial = originalMaterial.clone(); 
                    
                    newMaterial.color.setHex( 0xfc5858 ); 
                    newMaterial.metalness = 0.1;
                    newMaterial.roughness = 0.8;
                    newMaterial.vertexColors = false; 
                    newMaterial.transparent = true; 
                    newMaterial.opacity = 0.6; 
                    newMaterial.needsUpdate = true;
                    
                    child.material = newMaterial;
                }
            });
            
            // SKALNING OCH POSITIONERING
            loadedModel.scale.set(500, 500, 500); 
            loadedModel.position.set(0, 0, 0); 
            loadedModel.rotation.y = Math.PI / 4; 
            loadedModel.rotation.x = 0; 
            
            console.log(`Modell ${MODEL_FILE_1} laddad och redo.`);
        }, 
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% laddad' );
        },
        function ( error ) {
            console.error( `Ett fel uppstod vid laddning av ${MODEL_FILE_1}:`, error );
        }
    );
}

// --- HUVUDLOOP OCH EVENT-HANTERING ---
function animate() {
    requestAnimationFrame( animate );
    renderer.render(scene, camera);
}

function setupEventListeners() {
    // MUSKONTROLL:
    // Fästs vid den ENDA canvasen (renderer.domElement)
    renderer.domElement.addEventListener('mousedown', () => { isDragging = true; });
    document.addEventListener('mouseup', () => { isDragging = false; });
    renderer.domElement.addEventListener('mousemove', handleRotationEvent); 
    
    // Touch-events för mobilen (NU STABIL)
    renderer.domElement.addEventListener('touchstart', (event) => {
        event.preventDefault(); 
        isDragging = true;
        handleRotationEvent(event);
    }, { passive: false }); 
    
    document.addEventListener('touchend', () => { isDragging = false; });
    
    renderer.domElement.addEventListener('touchmove', (event) => {
        event.preventDefault(); 
        handleRotationEvent(event);
    }, { passive: false });


    // FÖNSTERSTORLEK:
    window.addEventListener( 'resize', onWindowResize, false ); 
    function onWindowResize(){
        camera.aspect = window.innerWidth / 600;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, 600 );
    }
}

// Kör igång allting!
init();
