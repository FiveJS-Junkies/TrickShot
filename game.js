import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
// import Target from './Target';

const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccee );
scene.fog = new THREE.Fog( 0x88ccee, 0, 50 );

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

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

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild( renderer.domElement );

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild( stats.domElement );

const GRAVITY = 9.8;

const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.2;

const STEPS_PER_FRAME = 5;

const sphereGeometry = new THREE.IcosahedronGeometry( SPHERE_RADIUS, 5 );
const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xdede8d } );

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

    document.body.requestPointerLock();

    mouseTime = performance.now();

} );

document.addEventListener( 'mouseup', () => {

    if ( document.pointerLockElement !== null ) throwBall();

} );

document.body.addEventListener( 'mousemove', ( event ) => {

    if (document.pointerLockElement === document.body) {
// Limit how far down the camera can look (adjust the values as needed)
        camera.rotation.x -= event.movementY / 500;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x)); // Clamp the rotation
        camera.rotation.y -= event.movementX / 500;
    }

} );

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}
let ballsLeft = 20;

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
function checkBallSpikeCollisions(ball, spike) {
// Calculate the distance between the ball and the spike
    const distance = ball.collider.center.distanceTo(spike.position);

// Define the minimum distance for collision
    const minDistance = ball.collider.radius + 0.1; // Adjust the 0.1 value as needed

    if (distance < minDistance) {
// Perform collision response here
// You can modify the ball's velocity or position based on the collision
// For example, you can reverse the ball's velocity to simulate a rebound:
        ball.velocity.negate(); // Reverse the velocity
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

    camera.position.copy( playerCollider.end );

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

// Modify the targetCreate function to return a promise that resolves when the model is loaded
function targetCreate(posx, posy, posz, rotx, roty, rotz, scalx, scaly, scalz) {
    return new Promise((resolve, reject) => {
        const targetLoader = new GLTFLoader().setPath('./models/gltf/');
        let target;

        targetLoader.load('target.glb', (gltf) => {
            target = gltf.scene;
            target.position.set(posx, posy, posz);
            target.rotation.set(rotx, roty, rotz);
            target.scale.set(scalx, scaly, scalz);
            scene.add(target);
            targetOctree.fromGraphNode(target);

            target.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material.map) {
                        child.material.map.anisotropy = 4;
                    }
                }
            });

            const helper = new OctreeHelper(targetOctree);
            helper.visible = false;
            scene.add(helper);

            resolve(target); // Resolve the promise with the loaded model
        }, undefined, (error) => {
            reject(error); // Reject the promise if there's an error during loading
        });
    });
}

// Usage of targetCreate with promises
let target1, target2;

targetCreate(0, 0, 10, 0, 0, 0, 1, 1, 1)
    .then((loadedTarget) => {
        target1 = loadedTarget;
        console.log("Target 1 loaded:", target1);
    })
    .catch((error) => {
        console.error("Error loading Target 1:", error);
    });

targetCreate(3, 0, 7, 0, 0, 0, 1, 1, 1)
    .then((loadedTarget) => {
        target2 = loadedTarget;
        console.log("Target 2 loaded:", target2);
    })
    .catch((error) => {
        console.error("Error loading Target 2:", error);
    });


// let target1, target2;
// target1 = targetCreate(0,0,10,0,0,0,1,1,1)
// console.log("after create")
// console.log(target1)
// target2 = targetCreate(3,0,7,0,0,0,1,1,1)
function changeModel(target){

    scene.remove(target)


    const targetHitLoader = new GLTFLoader().setPath('./models/gltf/');
    let targetHit

    targetHitLoader.load('targetHit.glb', (gltf) => {

        targetHit = gltf.scene
        console.log("In chnage model")
        console.log(target.position)
        console.log("position in the function")
        console.log(target)

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


// const customTarget = new Target(scene, new THREE.Vector3(10, 2, -5), new THREE.Euler(0, Math.PI / 4, 0), new THREE.Vector3(2, 2, 2));

function updateSpheres( deltaTime ) {

    spheres.forEach( sphere => {

        sphere.collider.center.addScaledVector( sphere.velocity, deltaTime );

        const result = worldOctree.sphereIntersect( sphere.collider );
        const resultTarget = targetOctree.sphereIntersect( sphere.collider );

        if ( result ) {

            sphere.velocity.addScaledVector( result.normal, - result.normal.dot( sphere.velocity ) * 1.5 );
            sphere.collider.center.add( result.normal.multiplyScalar( result.depth ) );

        } else {

            sphere.velocity.y -= GRAVITY * deltaTime;

        }

        if ( resultTarget ) {
            console.log("b4")
            console.log(target1)
            changeModel(target1)
            sphere.velocity.addScaledVector( resultTarget.normal, - resultTarget.normal.dot( sphere.velocity ) * 1.5 );
            sphere.collider.center.add( resultTarget.normal.multiplyScalar( resultTarget.depth ) );

        } else {

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

            playerVelocity.y = 5;

        }

    }

}

function createSpikeGeometry() {
    const spikeGeometry = new THREE.ConeGeometry(0.1, 0.5, 4);
    const spikeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Red color for spikes
    return new THREE.Mesh(spikeGeometry, spikeMaterial);
}


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


    // Create and position spikes
    const numSpikes = 10; // Adjust the number of spikes as needed
    const spikeSpacing = 2; // Adjust the spacing between spikes as needed

    for (let i = 0; i < numSpikes; i++) {
        const spike = createSpikeGeometry();
        spike.position.set(i * spikeSpacing - numSpikes / 2, 0.25, -5); // Adjust the spike position
        spike.rotation.set(Math.PI / 2, 0, 0); // Rotate the spike to point upward
        scene.add(spike);
    }


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






    renderer.render( scene, camera );

    stats.update();

    requestAnimationFrame( animate );

}
