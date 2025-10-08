// --- IMPORT AV MODULER ---
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';


// --- KONSTANTER OCH GLOBALA VARIABLER ---
const SENSITIVITY = 0.5; 
const MODEL_FILE_1 = 'verk1.glb'; 
const MODEL_FILE_2 = 'studios.glb'; 

let isDragging = false; 
let loadedModels = []; 
let renderers = []; 
let scene; 
let cameras = []; 
let canvasElements = []; 


// --- 1. STARTFUNKTION OCH INITIERING ---
function init() {
    // Skapar EN global scen
    scene = new THREE.Scene();
    
    // Ladda BÅDA modellerna i sina respektive hållare
    // load3DModel(file, holderId, camZ, colorHex, opacity, positionZ, rotationX)
    
    // Modell 1: Rosa/röd färg (Standard framåtvinkel)
    load3DModel(MODEL_FILE_1, 'canvas-holder-1', 250, 0xfc5858, 0.6, 0, 0); 
    
    // Modell 2: Ljusblå (Zoom 60, Vinklad uppifrån)
    load3DModel(MODEL_FILE_2, 'canvas-holder-2', 60, 0x0061ff, 0.9, 10000, -Math.PI / 3); 
    
    setupEventListeners();
    animate();
}

// --- GENERISK MODELLADDNINGSFUNKTION ---
function load3DModel(file, holderId, camZ, colorHex, opacity, positionZ, rotationX) {
    const holder = document.getElementById(holderId);
    if (!holder) return;

    // 1. Skapa lokal kamera och renderer
    const localCamera = new THREE.PerspectiveCamera( 75, holder.clientWidth / 600, 0.01, 20000 ); 
    localCamera.position.z = camZ + positionZ; 
    cameras.push(localCamera); 

    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setClearColor( 0x000000, 0 ); 
    renderer.setSize( holder.clientWidth, 600 ); 
    
    // 2. Placering och Z-Index
    renderer.domElement.style.position = 'relative';
    renderer.domElement.style.zIndex = '50';
    holder.appendChild(renderer.domElement);
    
    renderers.push(renderer); 
    canvasElements.push(renderer.domElement); // Lagra DOM-elementet för eventlyssnare

    // 3. Ljus
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.8 ); 
    scene.add( ambientLight );
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 ); 
    directionalLight.position.set( 5, 10, 5 ).normalize();
    scene.add( directionalLight );


    const loader = new GLTFLoader(); 
    loader.load(
        file,
        function ( gltf ) {
            const model = gltf.scene; 
            scene.add( model );

            // FÄRGFIX OCH MATERIAL
            model.traverse((child) => {
                 if (child.isMesh) {
                    const originalMaterial = child.material;
                    const newMaterial = originalMaterial.clone(); 
                    
                    newMaterial.color.setHex( colorHex ); 
                    newMaterial.metalness = 0.1;
                    newMaterial.roughness = 0.8;
                    newMaterial.vertexColors = false; 
                    newMaterial.transparent = true; 
                    newMaterial.opacity = opacity; 
                    newMaterial.needsUpdate = true;
                    
                    child.material = newMaterial;
                }
            });
            
            // 5. SKALNING OCH POSITIONERING
            model.scale.set(500, 500, 500); 
            model.position.set(0, 0, positionZ); 
            
            model.rotation.y = Math.PI / 4; 
            model.rotation.x = rotationX; 
            
            loadedModels.push(model); 
            console.log(`Modell ${file} laddad och redo.`);
        }, 
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% laddad' );
        },
        function ( error ) {
            console.error( `Ett fel uppstod vid laddning av ${file}:`, error );
        }
    );
}

// --- HUVUDLOOP OCH EVENT-HANTERING ---
function animate() {
    requestAnimationFrame( animate );
    
    // RENDER FIX: Rendera scenen med den LOKALA KAMERAN
    renderers.forEach((renderer, index) => {
        if (cameras[index]) {
            renderer.render(scene, cameras[index]);
        }
    });
}

// NY FUNKTION: Hanterar både mus och touch-input
function handleRotationEvent(event) {
    if (!isDragging || loadedModels.length === 0) return;
    
    // Hämta inputkoordinaterna: Använder touch om det finns, annars mus.
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    // Beräkna höjden av 3D-vyn för Y-normalisering
    const viewHeight = 600; 

    // Beräkna normaliserad position
    const xNormalized = (clientX / window.innerWidth) - 0.5;
    const yNormalized = (clientY / viewHeight) - 0.5; 
    
    // Roterar BÅDA modellerna samtidigt
    loadedModels.forEach(model => {
        model.rotation.y = xNormalized * SENSITIVITY * Math.PI * 2;
        model.rotation.x = yNormalized * SENSITIVITY * Math.PI * 2;
    });
}


function setupEventListeners() {
    // MUSKONTROLL (fästs vid alla renderade canvasar):
    canvasElements.forEach(canvas => {
        // Mus-events:
        canvas.addEventListener('mousedown', () => { isDragging = true; });
        document.addEventListener('mouseup', () => { isDragging = false; });
        canvas.addEventListener('mousemove', handleRotationEvent); 

        // Touch-events för mobilen (KRITISK FIX)
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault(); 
            isDragging = true;
            handleRotationEvent(event);
        }, { passive: false }); 
        
        document.addEventListener('touchend', () => { isDragging = false; });
        
        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault(); // FÖRHINDRAR SKROLLNING/ZOOM
            handleRotationEvent(event);
        }, { passive: false });
    });


    // FÖNSTERSTORLEK:
    window.addEventListener( 'resize', onWindowResize, false ); 
    function onWindowResize(){
        renderers.forEach((renderer, index) => {
             const holderWidth = renderer.domElement.parentNode.clientWidth;
             const newAspect = holderWidth / 600;

             // Uppdatera kameran
             if (cameras[index]) {
                 cameras[index].aspect = newAspect;
                 cameras[index].updateProjectionMatrix();
             }
             // Uppdatera renderstorleken
             renderer.setSize( holderWidth, 600 );
        });
    }
}

// Kör igång allting!
init();