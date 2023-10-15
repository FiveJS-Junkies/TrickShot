import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { Audio, AudioLoader, AudioListener } from 'three';

// Create an audio listener and add it to the camera

const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccee );
scene.fog = new THREE.Fog( 0x88ccee, 0, 50 );

/* NORMAL CAMERA */
const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';
const listener = new AudioListener();
camera.add(listener);

// Load an audio file (adjust the path to your audio file)
const audioLoader = new AudioLoader();
const collisionSound  = new Audio(listener);
let storedSEVolume = localStorage.getItem('SEVolume');

audioLoader.load('music/ballcollision.mp3', (buffer) => {
  collisionSound.setBuffer(buffer);
  collisionSound.setLoop(false);
  collisionSound.setVolume(storedSEVolume); // Adjust the volume as needed
});

const audioContext = new (window.AudioContext)();
const jumpSound  = new Audio(listener);
const targetActivate = new Audio(listener);
const levelComplete = new Audio(listener);
let targetActivateSource = null;

audioLoader.load('music/jump.mp3', (buffer) => {
    jumpSound.setBuffer(buffer);
    jumpSound.setLoop(false);
    jumpSound.setVolume(storedSEVolume); // Adjust the volume as needed
});

audioLoader.load('music/targetActivatesfx.mp3', (buffer) => {
    targetActivate.setBuffer(buffer);
    targetActivate.setLoop(false);
    targetActivate.setVolume(0.5); // Adjust the volume as needed
});
audioLoader.load('music/level-win-6416.mp3', (buffer) => {
    levelComplete.setBuffer(buffer);
    levelComplete.setLoop(false);
    levelComplete.setVolume(0.5); // Adjust the volume as needed
});

const backgroundMusic = new Audio(listener);

audioLoader.load('music/neon-gaming-128925.mp3', (buffer) => {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.1); // Adjust the volume as needed
    backgroundMusic.play();
});


/* MINIMAP CAMERA */
// Define the orthographic camera's properties
// These 4 affect height of camera
const width = window.innerWidth;
const height = window.innerHeight;

const left = -width / 150;
const right = width / 150;
const top = height / 150;
const bottom = -height / 150;

const near = 0.1;
const far = 1000;
const minicamera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
// Set the camera's position above the scene
minicamera.position.set(0, 10, 0); // Adjust the height (10) as needed
// Rotate the camera to look straight down
minicamera.rotation.set(-Math.PI/2, 0, 0);

const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
fillLight1.position.set( 2, 1, 1 );
scene.add( fillLight1 );

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


const container = document.getElementById( 'fps-container' );
const minimapContainer = document.getElementById('minimap');
// In your game.js file


const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild( renderer.domElement );

// We need to give the minimap its own renderrer
/* 
    Merely doing this for line 69: minimapContainer.appendChild( renderer.domElement ); 
    ont work as it will choose to render the game in this last container only
*/

const minimapRenderer = new THREE.WebGLRenderer({ antialias: true });
minimapRenderer.setPixelRatio(window.devicePixelRatio);
minimapRenderer.setSize(minimapContainer.clientWidth, minimapContainer.clientHeight); //COPIES GAME SIZE TO THE CONTAINER SIZE FOR FULL DISPLAY
minimapRenderer.shadowMap.enabled = true;
minimapRenderer.shadowMap.type = THREE.VSMShadowMap;
minimapRenderer.toneMapping = THREE.ACESFilmicToneMapping;
minimapContainer.appendChild(minimapRenderer.domElement);

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild( stats.domElement );

const GRAVITY = 9.8;
let allowPlayerMovement = true;

const NUM_SPHERES = 20;
const SPHERE_RADIUS = 0.2;

const STEPS_PER_FRAME = 5;

const sphereGeometry = new THREE.IcosahedronGeometry( SPHERE_RADIUS, 5 );
const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xdede8d } );

sphereMaterial.side = THREE.DoubleSide;//piece of code added so that the ball appears in air from top view
//you can see it slightly

const spheres = [];
let sphereIdx = 0;

for ( let i = 0; i < NUM_SPHERES; i ++ ) {

    const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    scene.add( sphere );

    spheres.push( {
        mesh: sphere,
        collider: new THREE.Sphere( new THREE.Vector3( 0, - 100, 0 ), SPHERE_RADIUS ),
        velocity: new THREE.Vector3()
    } );

}

const worldOctree = new Octree();
const targetOctree = new Octree();
const fanOctree = new Octree();

const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1, 0 ), 0.35 );

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;
let mouseTime = 0;

const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

document.addEventListener( 'keydown', ( event ) => {

    keyStates[ event.code ] = true;

} );

document.addEventListener( 'keyup', ( event ) => {

    keyStates[ event.code ] = false;

} );

container.addEventListener( 'mousedown', () => {
    if (!allowPlayerMovement) {
        return; // If player movement is not allowed, exit the function
    }

    document.body.requestPointerLock();

    mouseTime = performance.now();

} );

document.addEventListener( 'mouseup', () => {
    if (!allowPlayerMovement) {
        return; // If player movement is not allowed, exit the function
    }

    if ( document.pointerLockElement !== null ) throwBall();

} );
let storedMouseSpeed = localStorage.getItem('MouseSpeed');

document.body.addEventListener( 'mousemove', ( event ) => {

    if (!allowPlayerMovement) {
        return; // If player movement is not allowed, exit the function
    }

    if (document.pointerLockElement === document.body) {
        // Limit how far down the camera can look (adjust the values as needed)
        // Normal FPS camera
        camera.rotation.x -= event.movementY / storedMouseSpeed; //mouse speed default is 500
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x)); // Clamp the rotation
        camera.rotation.y -= event.movementX / storedMouseSpeed; //mouse speed default is 500

        // Minimap camera rotation 
        minicamera.rotation.z -= event.movementX / storedMouseSpeed; 
        // Because the camera is set to point down we need to rotate along z axis
}

} );

function showLevelFinishScreen() {
    if (levelCompleted){
        levelComplete.play();
    }
    backgroundMusic.stop()
    const levelFinishScreen = document.getElementById('level-finish');
    levelFinishScreen.style.display = 'block';
    allowPlayerMovement = false;
    document.exitPointerLock();

    clearInterval(timerInterval);

    const nextLevelButton = document.getElementById('next-level-btn');
    const endScreenHeading = document.getElementById("endScreen-Heading");
    // Check if the time has run out
    if (timeIsUp) {
        // If the time is up, hide the "Next Level" button
        nextLevelButton.style.display = 'none';
        endScreenHeading.textContent = 'You Lost';

    } else {
        // If the time is not up, show the "Next Level" button
        nextLevelButton.style.display = 'block';
    }
}

let levelCompleted = false;

document.addEventListener('DOMContentLoaded', () => {
    const restartButton = document.getElementById('restart-btn');
    const nextLevelButton = document.getElementById('next-level-btn');
    const exitButton = document.getElementById('exit-btn');

    // Add event listeners to buttons
    restartButton.addEventListener('click', () => {
        // Handle restart button click
        window.location.href = 'game.html';
        // console.log('Restart button clicked');
    });

    nextLevelButton.addEventListener('click', () => {
        // Handle next level button click
        console.log('Next Level button clicked');
    });

    exitButton.addEventListener('click', () => {
        // Handle exit button click
        window.location.href = 'menu.html';
    });

    // Call the function to show the level finish screen (you can call it when the level is completed)
    // showLevelFinishScreen();
});



window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}
let ballsLeft = 20;
let targetsLeft = 6;

function throwBall() {

    if (ballsLeft > 0) {
                const sphere = spheres[sphereIdx];

                camera.getWorldDirection(playerDirection);


                sphere.collider.center.copy(playerCollider.end).addScaledVector(playerDirection, playerCollider.radius * 1.5);

        // throw the ball with more force if we hold the button longer, and if we move forward
                const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));

                sphere.velocity.copy(playerDirection).multiplyScalar(impulse);
                sphere.velocity.addScaledVector(playerVelocity, 2);

                sphereIdx = (sphereIdx + 1) % spheres.length;

        // Decrease the balls left count and update the display
                ballsLeft--;
                document.getElementById('balls-left').innerText = `Balls left: ${ballsLeft}`;
        }

}

function playerCollisions() {

    const result = worldOctree.capsuleIntersect( playerCollider );
    const resultTarget = targetOctree.capsuleIntersect( playerCollider );

    playerOnFloor = false;

    if ( result ) {

        playerOnFloor = result.normal.y > 0;

        if ( ! playerOnFloor ) {

            playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );

        }

        playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

    }

    if ( resultTarget ) {

        playerOnFloor = resultTarget.normal.y > 0;

        if ( ! playerOnFloor ) {

            playerVelocity.addScaledVector( resultTarget.normal, - resultTarget.normal.dot( playerVelocity ) );

        }

        playerCollider.translate( resultTarget.normal.multiplyScalar( resultTarget.depth ) );

    }

}

function updatePlayer( deltaTime ) {

    let damping = Math.exp( - 4 * deltaTime ) - 1;

    if ( ! playerOnFloor ) {

        playerVelocity.y -= GRAVITY * deltaTime;

        // small air resistance
        damping *= 0.1;

    }

    playerVelocity.addScaledVector( playerVelocity, damping );

    const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
    playerCollider.translate( deltaPosition );

    playerCollisions();

    camera.position.copy( playerCollider.end );//MOVING CAMERA MAINSCREEN

    minicamera.position.copy( playerCollider.end );//MOVING PLAYER ON MINIMAP

}

function playerSphereCollision( sphere ) {

    const center = vector1.addVectors( playerCollider.start, playerCollider.end ).multiplyScalar( 0.5 );

    const sphere_center = sphere.collider.center;

    const r = playerCollider.radius + sphere.collider.radius;
    const r2 = r * r;

    // approximation: player = 3 spheres

    for ( const point of [ playerCollider.start, playerCollider.end, center ] ) {

        const d2 = point.distanceToSquared( sphere_center );

        if ( d2 < r2 ) {

            const normal = vector1.subVectors( point, sphere_center ).normalize();
            const v1 = vector2.copy( normal ).multiplyScalar( normal.dot( playerVelocity ) );
            const v2 = vector3.copy( normal ).multiplyScalar( normal.dot( sphere.velocity ) );

            playerVelocity.add( v2 ).sub( v1 );
            sphere.velocity.add( v1 ).sub( v2 );

            const d = ( r - Math.sqrt( d2 ) ) / 2;
            sphere_center.addScaledVector( normal, - d );

        }

    }

}


function targetCreate(posx, posy, posz, rotx, roty, rotz, scalx, scaly, scalz, octree) {
    return new Promise((resolve, reject) => {
        const targetLoader = new GLTFLoader().setPath('./models/gltf/');
        let target;

        targetLoader.load('target.glb', (gltf) => {
            target = gltf.scene;
            target.position.set(posx, posy, posz);
            target.rotation.set(rotx, roty, rotz);
            target.scale.set(scalx, scaly, scalz);
            scene.add(target);

            octree.fromGraphNode(target);

            target.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material.map) {
                        child.material.map.anisotropy = 4;
                    }
                }
            });

            const helper = new OctreeHelper(octree);
            helper.visible = false;
            scene.add(helper);

            target.modelChanged = false;

            resolve(target); // Resolve the promise with the loaded model
        }, undefined, (error) => {
            reject(error); // Reject the promise if there's an error during loading
        });
    });
}

// ...

// Usage of targetCreate with promises
let target1, target2, target3, target4, target5, target6;

// Create a new octree for each target
const targetOctree1 = new Octree();
const targetOctree2 = new Octree();
const targetOctree3 = new Octree();
const targetOctree4 = new Octree();
const targetOctree5 = new Octree();
const targetOctree6 = new Octree();

targetCreate(0, 0, 10, 0, 0, 0, 1, 1, 1, targetOctree1)
    .then((loadedTarget) => {
        target1 = loadedTarget;
    })
    .catch((error) => {
    });

targetCreate(3, 0, 7, 0, 30, 0, 1, 1, 1, targetOctree2)
    .then((loadedTarget) => {
        target2 = loadedTarget;
    })
    .catch((error) => {
    });

targetCreate(3, 5, 7, 0, 0, 0, 1, 1, 1, targetOctree3)
    .then((loadedTarget) => {
        target3 = loadedTarget;
    })
    .catch((error) => {
    });

targetCreate(-8, 0, 5, 0, 0, 0, 1, 1, 1, targetOctree4)
    .then((loadedTarget) => {
        target4 = loadedTarget;
    })
    .catch((error) => {
    });

targetCreate(-3, -0.5, -3, 0, 0, 0, 1, 1, 1, targetOctree5)
    .then((loadedTarget) => {
        target5 = loadedTarget;
    })
    .catch((error) => {
    });

targetCreate(3, 0, -3, 0, 0, 0, 1, 1, 1, targetOctree6)
    .then((loadedTarget) => {
        target6 = loadedTarget;
    })
    .catch((error) => {
    });


function changeModel(target){
    const targetHitLoader = new GLTFLoader().setPath('./models/gltf/');
    let targetHit

    targetHitLoader.load('targetHit.glb', (gltf) => {

        targetHit = gltf.scene

        targetHit.position.copy(target.position);
        targetHit.rotation.copy(target.rotation);
        targetHit.scale.copy(target.scale);
        scene.add( targetHit );

        targetOctree.fromGraphNode( targetHit );

        targetHit.traverse( child => {

            if ( child.isMesh ) {

                child.castShadow = true;
                child.receiveShadow = true;

                if ( child.material.map ) {

                    child.material.map.anisotropy = 4;

                }

            }

        } );

        const helper = new OctreeHelper( targetOctree );
        helper.visible = false;
        scene.add(helper)

        target.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });


    });
}






function spheresCollisions() {

    for ( let i = 0, length = spheres.length; i < length; i ++ ) {

        const s1 = spheres[ i ];

        for ( let j = i + 1; j < length; j ++ ) {

            const s2 = spheres[ j ];

            const d2 = s1.collider.center.distanceToSquared( s2.collider.center );
            const r = s1.collider.radius + s2.collider.radius;
            const r2 = r * r;

            if ( d2 < r2 ) {

                const normal = vector1.subVectors( s1.collider.center, s2.collider.center ).normalize();
                const v1 = vector2.copy( normal ).multiplyScalar( normal.dot( s1.velocity ) );
                const v2 = vector3.copy( normal ).multiplyScalar( normal.dot( s2.velocity ) );

                s1.velocity.add( v2 ).sub( v1 );
                s2.velocity.add( v1 ).sub( v2 );

                const d = ( r - Math.sqrt( d2 ) ) / 2;

                s1.collider.center.addScaledVector( normal, d );
                s2.collider.center.addScaledVector( normal, - d );

            }

        }

    }

}

function playTargetActivateSound() {
    // Check if the audio is currently playing
    if (targetActivateSource && targetActivateSource.state === 'running') {
        // If it is, stop the current playback
        targetActivateSource.stop();
    }

    // Create a new source node and play the audio
    targetActivateSource = audioContext.createBufferSource();
    targetActivateSource.buffer = targetActivate.buffer;
    targetActivateSource.connect(audioContext.destination);
    targetActivateSource.start();
}


let count = 0


function updateSpheres( deltaTime ) {

    spheres.forEach( sphere => {

        sphere.collider.center.addScaledVector( sphere.velocity, deltaTime );

        const result = worldOctree.sphereIntersect( sphere.collider );
        const fanResult = fanOctree.sphereIntersect( sphere.collider );
        const resultTarget1 = targetOctree1.sphereIntersect( sphere.collider );
        const resultTarget2 = targetOctree2.sphereIntersect( sphere.collider );
        const resultTarget3 = targetOctree3.sphereIntersect( sphere.collider );
        const resultTarget4 = targetOctree4.sphereIntersect( sphere.collider );
        const resultTarget5 = targetOctree5.sphereIntersect( sphere.collider );
        const resultTarget6 = targetOctree6.sphereIntersect( sphere.collider );

        if ( result ) {

            sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
            sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
        }
        else if ( resultTarget1 ) {
            if (target1.modelChanged === false){
                playTargetActivateSound()
                count++
                target1.modelChanged = true
                targetsLeft--;
                if (!levelCompleted && targetsLeft === 0) {
                    levelCompleted = true;
                    showLevelFinishScreen();
                }
            }
            changeModel(target1)
            sphere.velocity.addScaledVector(resultTarget1.normal, -resultTarget1.normal.dot(sphere.velocity) * 1.5);
            sphere.collider.center.add(resultTarget1.normal.multiplyScalar(resultTarget1.depth));
        }
        else if ( resultTarget2 ) {
            if (target2.modelChanged === false){
                playTargetActivateSound()
                count++
                targetsLeft--;
                target2.modelChanged = true
                if (!levelCompleted && targetsLeft === 0) {
                    levelCompleted = true;
                    showLevelFinishScreen();
                }
            }

            changeModel(target2)
            sphere.velocity.addScaledVector( resultTarget2.normal, - resultTarget2.normal.dot( sphere.velocity ) * 1.5 );
            sphere.collider.center.add( resultTarget2.normal.multiplyScalar( resultTarget2.depth ) );
        }
        else if ( resultTarget3 ) {
            if (target3.modelChanged === false){
                playTargetActivateSound()
                count++
                targetsLeft--;
                target3.modelChanged = true
                if (!levelCompleted && targetsLeft === 0) {
                    levelCompleted = true;
                    console.log('Level completed!');
                    showLevelFinishScreen();
                }
                console.log(count)
                console.log(targetsLeft)
            }

            changeModel(target3)
            sphere.velocity.addScaledVector( resultTarget3.normal, - resultTarget3.normal.dot( sphere.velocity ) * 1.5 );
            sphere.collider.center.add( resultTarget3.normal.multiplyScalar( resultTarget3.depth ) );
        }
        else if ( resultTarget4 ) {
            if (target4.modelChanged === false){
                playTargetActivateSound()
                count++
                targetsLeft--;
                target4.modelChanged = true
                if (!levelCompleted && targetsLeft === 0) {
                    levelCompleted = true;
                    console.log('Level completed!');
                    showLevelFinishScreen();
                }
                console.log(count)
                console.log(targetsLeft)
            }

            changeModel(target4)
            sphere.velocity.addScaledVector( resultTarget4.normal, - resultTarget4.normal.dot( sphere.velocity ) * 1.5 );
            sphere.collider.center.add( resultTarget4.normal.multiplyScalar( resultTarget4.depth ) );
        }
        else if ( resultTarget5 ) {
            if (target5.modelChanged === false){
                playTargetActivateSound()
                count++
                targetsLeft--;
                target5.modelChanged = true
                if (!levelCompleted && targetsLeft === 0) {
                    levelCompleted = true;
                    console.log('Level completed!');
                    showLevelFinishScreen();
                }
                console.log(count)
                console.log(targetsLeft)
            }

            changeModel(target5)
            sphere.velocity.addScaledVector( resultTarget5.normal, - resultTarget5.normal.dot( sphere.velocity ) * 1.5 );
            sphere.collider.center.add( resultTarget5.normal.multiplyScalar( resultTarget5.depth ) );
        }
        else if ( resultTarget6 ) {
            if (target6.modelChanged === false){
                playTargetActivateSound()
                count++
                targetsLeft--;
                target6.modelChanged = true
                if (!levelCompleted && targetsLeft === 0) {
                    levelCompleted = true;
                    console.log('Level completed!');
                    showLevelFinishScreen();
                }
                console.log(count)
                console.log(targetsLeft)
            }

            changeModel(target6)
            sphere.velocity.addScaledVector( resultTarget6.normal, - resultTarget6.normal.dot( sphere.velocity ) * 1.5 );
            sphere.collider.center.add( resultTarget6.normal.multiplyScalar( resultTarget6.depth ) );
        }
        else if ( fanResult ) {
            // Play the collision sound only if it's not already playing
            collisionSound.play();
            console.log('Sphere hit blades');
            //Complete the bounce off the fan
            sphere.velocity.addScaledVector( fanResult.normal, - fanResult.normal.dot( sphere.velocity ) * 1.5 );
            sphere.collider.center.add( fanResult.normal.multiplyScalar( fanResult.depth ) );

        }
        else{
            sphere.velocity.y -= GRAVITY * deltaTime;
        }



        const damping = Math.exp( - 1.5 * deltaTime ) - 1;
        sphere.velocity.addScaledVector( sphere.velocity, damping );

        playerSphereCollision( sphere );

    } );

    spheresCollisions();
    for ( const sphere of spheres ) {

        sphere.mesh.position.copy( sphere.collider.center );
        // customTarget.checkCollision(sphere.collider);

    }

}


function getForwardVector() {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();

    return playerDirection;

}

function getSideVector() {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross( camera.up );

    return playerDirection;

}

function controls( deltaTime ) {

    if (!allowPlayerMovement) {
        return; // If player movement is not allowed, exit the function
    }

    // gives a bit of air control
    const speedDelta = deltaTime * ( playerOnFloor ? 25 : 4 );

    if ( keyStates[ 'KeyW' ] ) {

        playerVelocity.add( getForwardVector().multiplyScalar( speedDelta ) );

    }

    if ( keyStates[ 'KeyS' ] ) {

        playerVelocity.add( getForwardVector().multiplyScalar( - speedDelta ) );

    }

    if ( keyStates[ 'KeyA' ] ) {

        playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );

    }

    if ( keyStates[ 'KeyD' ] ) {

        playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );

    }

    if ( playerOnFloor ) {

        if ( keyStates[ 'Space' ] ) {
            jumpSound.play();
            playerVelocity.y = 5;
            

        }

    }

}

let blades;

const fanloader = new GLTFLoader().setPath( './models/gltf/' );

fanloader.load( 'fan.glb', ( gltf ) => {
    blades = gltf.scene.getObjectByName('blades');

    const assets = {
        blades
    };
    //if (blades) blades.position.y = 5;
    scene.add( gltf.scene );

    fanOctree.fromGraphNode( gltf.scene );

    gltf.scene.traverse( child => {

        if ( child.isMesh ) {

            child.castShadow = true;
            child.receiveShadow = true;

            if ( child.material.map ) {

                child.material.map.anisotropy = 4;

            }

        }

    } );

    const helper = new OctreeHelper( fanOctree );
    helper.visible = false;
    scene.add( helper );

    animate();

} );



const loader = new GLTFLoader().setPath( './models/gltf/' );

loader.load( 'collision-world.glb', ( gltf ) => {

    scene.add( gltf.scene );

    worldOctree.fromGraphNode( gltf.scene );

    gltf.scene.traverse( child => {

        if ( child.isMesh ) {

            child.castShadow = true;
            child.receiveShadow = true;

            if ( child.material.map ) {

                child.material.map.anisotropy = 4;

            }

        }

    } );

    const helper = new OctreeHelper( worldOctree );
    helper.visible = false;
    scene.add( helper );

    animate();

} );


function teleportPlayerIfOob() {

    if ( camera.position.y <= - 25 ) {

        playerCollider.start.set( 0, 0.35, 0 );
        playerCollider.end.set( 0, 1, 0 );
        playerCollider.radius = 0.35;
        camera.position.copy( playerCollider.end );
        camera.rotation.set( 0, 0, 0 );

    }

}
let fanRotation = 0;

const initialTime = 10; // 5 minutes
let remainingTime = initialTime;
let timeIsUp = false;

// Display the initial time
document.getElementById('timer').innerText = `Time left: ${formatTime(remainingTime)}`;

// Set up the timer interval
const timerInterval = setInterval(updateTimer, 1000); // Update every second

function updateTimer() {
    remainingTime--;

    // Display the updated time
    document.getElementById('timer').innerText = `Time left: ${formatTime(remainingTime)}`;

    // Check if the time has run out
    if (remainingTime <= 0) {
        clearInterval(timerInterval); // Stop the timer
        timeIsUp = true;
        showLevelFinishScreen(); // Your function to handle time-out (e.g., end the game)
    }
}

// Function to format the time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secondsPart = seconds % 60;
    return `${padZero(minutes)}:${padZero(secondsPart)}`;
}

// Function to pad single-digit numbers with a leading zero
function padZero(number) {
    return number < 10 ? `0${number}` : number;
}
function animate() {

    const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;
    // we look for collisions in substeps to mitigate the risk of
    // an object traversing another too quickly for detection.

    for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {

        controls( deltaTime );

        updatePlayer( deltaTime );

        updateSpheres( deltaTime );

        teleportPlayerIfOob();


    }

    // if (blades) {
    //     fanRotation += 0.003; // Adjust the rotation speed as needed
    //     blades.rotation.z = fanRotation;
    // }



    renderer.render( scene, camera );

    minimapRenderer.render(scene, minicamera);//RENDER SAME SCREEN BUT DIFF CAMERA PERSPECTIVE FOR THE MINIMAP

    stats.update();

    requestAnimationFrame( animate );

}


