import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

let storedFOV = localStorage.getItem('FOV');
const container = document.getElementById( 'game-container' );


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

export { scene,camera,renderer,stats };