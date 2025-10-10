// --- IMPORT AV MODULER (Stabil länk) ---
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';


// --- KONSTANTER OCH GLOBALA VARIABLER ---
const SENSITIVITY = 0.5; 
// Filnamn för de två modellerna:
const MODEL_FILE_1 = 'verk1.glb'; // Rosa/röd
const MODEL_FILE_2 = 'studios.glb'; // Ljusblå

let isDragging = false; 
let loadedModel; // Den enda modellen i scenen
let scene; 
let camera; 
let renderer; 
let activeModelIndex = 0; // Spårar vilken modell som är aktiv (0 eller 1)

// Inställningar för material
const MODEL_SETTINGS = [
    { file: MODEL_FILE_1, color: 0xfc5858, opacity: 0.6, camZ: 250, rotX: 0 },
    { file: MODEL_FILE_2, color: 0x0061ff, opacity: 0.9, camZ: 60, rotX: -Math.PI / 3 }
];


// --- FUNKTION FÖR ROTATION ---
function handleRotationEvent(event) {
    if (!isDragging || !loadedModel) return;
    
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const viewHeight = 600; 

    const xNormalized = (clientX / window.innerWidth) - 0.5;
    const yNormalized = (clientY / viewHeight) - 0.5; 
    
    // Roterar den laddade modellen
    loadedModel.rotation.y = xNormalized * SENSITIVITY * Math.PI * 2;
    loadedModel.rotation.x = yNormalized * SENSITIVITY * Math.PI * 2;
}

// --- ÄNDRA MATERIAL BASERAT PÅ INDEX ---
function applyModelSettings(index) {
    const settings = MODEL_SETTINGS[index];
    
    // Hitta det existerande materialet
    loadedModel.traverse((child) => {
        if (child.isMesh) {
            const material = child.material;
            
            material.color.setHex(settings.color);
            material.opacity = settings.opacity;
            material.needsUpdate = true;
        }
    });
    
    // Ändra kamerans position och modellens rotation
    camera.position.z = settings.camZ;
    loadedModel.rotation.x = settings.rotX;
    
    console.log(`Visar nu Modell ${index + 1} (${settings.file})`);
}

// --- LADDAR MODELL OCH LJUS (ENDAST EN GÅNG) ---
function loadModel() {
    // Lägg till Ljus
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.8 ); 
    scene.add( ambientLight );
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 ); 
    directionalLight.position.set( 5, 10, 5 ).normalize();
    scene.add( directionalLight );

    const loader = new GLTFLoader(); 
    // Vi laddar den första modellen och använder den som bas
    loader.load(
        MODEL_FILE_1, 
        function ( gltf ) {
            loadedModel = gltf.scene; 
            scene.add( loadedModel );

            // Sätter initial skala
            loadedModel.scale.set(500, 500, 500); 
            loadedModel.position.set(0, 0, 0); 
            loadedModel.rotation.y = Math.PI / 4; 
            
            // Applica de initiala rosa inställningarna
            applyModelSettings(0); 
            
            console.log("Modell laddad och initierad.");
        }, 
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% laddad' );
        },
        function ( error ) {
            console.error( `Ett fel uppstod vid laddning av ${MODEL_FILE_1}:`, error );
        }
    );
}

// --- 1. STARTFUNKTION OCH INITIERING ---
function init() {
    // 1. Skapar EN global scen, EN kamera, EN renderare
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / 600, 0.01, 20000 ); 
    camera.position.z = MODEL_SETTINGS[0].camZ; // Sätter initial position

    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setClearColor( 0x000000, 0 ); 
    renderer.setSize( window.innerWidth, 600 ); 
    
    // Z-INDEX FIX
    renderer.domElement.style.position = 'relative';
    renderer.domElement.style.zIndex = '50';
    
    // Fäst renderaren i den första hållaren
    const holder1 = document.getElementById('canvas-holder-1');
    if (holder1) {
        holder1.appendChild(renderer.domElement); 
    } else {
        document.body.appendChild(renderer.domElement); 
    }
    
    loadModel(); 
    setupEventListeners();
    animate();
}

// --- HUVUDLOOP OCH EVENT-HANTERING ---
function animate() {
    requestAnimationFrame( animate );
    
    // Rendera scenen med den LOKALA KAMERAN
    if (loadedModel) {
        renderer.render(scene, camera);
    }
}

function setupEventListeners() {
    // MUSKONTROLL:
    const mainCanvas = renderer.domElement;

    mainCanvas.addEventListener('mousedown', () => { isDragging = true; });
    document.addEventListener('mouseup', () => { isDragging = false; });
    mainCanvas.addEventListener('mousemove', handleRotationEvent); 
    
    mainCanvas.addEventListener('touchstart', (event) => {
        event.preventDefault(); 
        isDragging = true;
        handleRotationEvent(event);
    }, { passive: false }); 
    
    document.addEventListener('touchend', () => { isDragging = false; });
    
    mainCanvas.addEventListener('touchmove', (event) => {
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
    
    // FIX: Lägg till klick för att byta modell
    mainCanvas.addEventListener('click', () => {
        // Växla index mellan 0 och 1
        activeModelIndex = 1 - activeModelIndex; 
        applyModelSettings(activeModelIndex);
    });
}

// Kör igång allting!
init();
