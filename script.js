// --- IMPORT AV MODULER ---
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader';


// --- KONSTANTER OCH GLOBALA VARIABLER ---
const SENSITIVITY = 0.5; 
// Filnamn för de två modellerna:
const MODEL_FILE_1 = 'verk1.glb'; 
const MODEL_FILE_2 = 'studios.glb'; 

let isDragging = false; 
let loadedModels = []; // Array för att lagra båda modellerna
let renderers = []; // Array för att lagra renderare för båda vyerna
let scene; 
let canvasElements = []; // Array för canvas-elementen


// --- 1. STARTFUNKTION OCH INITIERING ---
function init() {
    // Skapar en global scen
    scene = new THREE.Scene();
    
    // Ladda BÅDA modellerna i sina respektive hållare
    // load3DModel(file, holderId, camZ, colorHex, opacity, positionZ)
    
    // load3DModel(file, holderId, camZ, colorHex, opacity, positionZ, rotationX) 
    
    // Modell 1: Rosa/röd färg (Standard framåtvinkel: 0)
    load3DModel(MODEL_FILE_1, 'canvas-holder-1', 250, 0xfc5858, 0.8, 0, 0); 
    
    // Modell 2: Ljusblå (Zoom 50, Z-position 10000, NY FIX: Rotation uppifrån: -Math.PI / 3)
    load3DModel(MODEL_FILE_2, 'canvas-holder-2', 60, 0x0061ff, 0.9, 10000, Math.PI / 2); 
    
    setupEventListeners();
    animate();
}

// --- GENERISK MODELLADDNINGSFUNKTION ---
// ÄNDRA FUNKTIONSDEFINITIONEN HÄR (Lägg till rotationX)
function load3DModel(file, holderId, camZ, colorHex, opacity, positionZ, rotationX) { // <-- LÄGG TILL rotationX
    const holder = document.getElementById(holderId);
    // ... resten av koden ...
    if (!holder) return;

    // KRITISK FIX: SKAPA NY LOKAL KAMERA med ett säkert bildförhållande
    const localCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / 600, 0.01, 20000 ); 
    localCamera.position.z = camZ + positionZ; 

    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setClearColor( 0x000000, 0 ); 
    renderer.setSize( holder.clientWidth, 600 ); 
    
    // Z-INDEX FIX
    renderer.domElement.style.position = 'relative';
    renderer.domElement.style.zIndex = '50';
    
    holder.appendChild(renderer.domElement);
    
    // Lagra både renderer och dess unika kamera
    renderer.myCamera = localCamera; 
    renderers.push(renderer); 
    canvasElements.push(renderer.domElement); 

    // Lägg till Ljus
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.1 ); 
    scene.add( ambientLight );
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.4 ); 
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
            
             // SKALNING OCH POSITIONERING
            model.scale.set(500, 500, 500); 
            model.position.set(0, 0, positionZ); 
            
            // FIX: ANVÄND DEN NYA PARAMETERN FÖR X-ROTATION
            model.rotation.y = Math.PI / 4; 
            model.rotation.x = rotationX; // <-- NY KOD: Rotation uppifrån/nerifrån
            
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
    
    // Rendera scenen för alla renderare och använd deras LOKALA KAMERA
    renderers.forEach(renderer => {
        renderer.render(scene, renderer.myCamera);
    });
}

function setupEventListeners() {
    // MUSKONTROLL:
    canvasElements.forEach(canvas => {
        canvas.addEventListener('mousedown', () => { isDragging = true; });
        canvas.addEventListener('mouseup', () => { isDragging = false; });
        canvas.addEventListener('mousemove', (event) => {
            if (!isDragging || loadedModels.length === 0) return;
            
            const xNormalized = (event.clientX / window.innerWidth) - 0.5;
            const yNormalized = (event.clientY / window.innerHeight) - 0.5;
            
            // Roterar BÅDA modellerna samtidigt baserat på musrörelse
            loadedModels.forEach(model => {
                model.rotation.y = xNormalized * SENSITIVITY * Math.PI * 2;
                model.rotation.x = yNormalized * SENSITIVITY * Math.PI * 2;
            });
        });
    });


    // FÖNSTERSTORLEK:
    window.addEventListener( 'resize', onWindowResize, false ); 
    function onWindowResize(){
        const newAspect = window.innerWidth / 600;

        // Uppdatera storleken för båda renderarna vid fönsterändring
        renderers.forEach(renderer => {
             // Uppdatera kameran
             if (renderer.myCamera) {
                 renderer.myCamera.aspect = newAspect;
                 renderer.myCamera.updateProjectionMatrix();
             }
             // Uppdatera renderstorleken
             renderer.setSize( renderer.domElement.parentNode.clientWidth, 600 );
        });
    }
}

// Kör igång allting!
init();