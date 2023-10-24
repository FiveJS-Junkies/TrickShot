import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

let storedFOV = localStorage.getItem('FOV');
const container = document.getElementById( 'game-container' );
const minimapContainer = document.getElementById('minimap');

const width = window.innerWidth;
const height = window.innerHeight;
const left = -width / 150;
const right = width / 150;
const top = height / 150;
const bottom = -height / 150;
const near = 0.1;
const far = 1000;

//Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccee );
scene.fog = new THREE.Fog( 0x88ccee, 0, 50 );

//Camera
const camera = new THREE.PerspectiveCamera( storedFOV, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(7.92125, 0,27)
camera.rotation.set(0, Math.PI, 0); // 180 degrees rotation, facing the opposite direction
camera.rotation.order = 'YXZ';

//Fill Light
const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
fillLight1.position.set( 2, 1, 1 );
scene.add( fillLight1 );

//Directional Light
const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
directionalLight.position.set( - 5, 25, - 1 );
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top	= 30;
directionalLight.shadow.camera.bottom = - 30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = - 0.00006;
scene.add( directionalLight );

//Renderer
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild( renderer.domElement );

//FPS
const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild( stats.domElement );

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Attach the event listener to the window
window.addEventListener('resize', onWindowResize);


const minicamera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
minicamera.position.set(0, 10, 0); // Adjust the height (10) as needed
minicamera.rotation.set(-Math.PI/2, 0, Math.PI);

const minimapRenderer = new THREE.WebGLRenderer({ antialias: true });
minimapRenderer.setPixelRatio(window.devicePixelRatio);
minimapRenderer.setSize(300, 200); //COPIES GAME SIZE TO THE CONTAINER SIZE FOR FULL DISPLAY
minimapRenderer.shadowMap.enabled = true;
minimapRenderer.shadowMap.type = THREE.VSMShadowMap;
minimapRenderer.toneMapping = THREE.ACESFilmicToneMapping;
minimapContainer.appendChild(minimapRenderer.domElement);

function updateMiniCameraPosition(playerCollider) {
   const playerPosition = playerCollider.end;
   const minPosition = new THREE.Vector3(-2, 20, -34.595107629588924);
const maxPosition = new THREE.Vector3(6, 20, 34.595107629588924);


    // Limit the minicamera's position
    minicamera.position.copy(playerPosition);
    minicamera.position.clamp(minPosition, maxPosition);

   
    playerPositionIndicator.position.copy(playerPosition);
}

const playerPositionIndicator = new THREE.Mesh(
    new THREE.CircleGeometry(0.25, 32), // You can adjust the size of the dot
    new THREE.MeshBasicMaterial({ color: 0x000000 })
);
playerPositionIndicator.rotation.x = -Math.PI / 2; // Lay the dot flat
scene.add(playerPositionIndicator);

export { scene,camera,renderer,stats, onWindowResize, minicamera, minimapRenderer, updateMiniCameraPosition};