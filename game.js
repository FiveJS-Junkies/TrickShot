import * as THREE from 'three';
import { Octree } from 'three/examples/jsm/math/Octree.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';

import { playJumpSound,playTargetHitSound, playLevelCompleteSound,playBackgroundMusic,stopBackgroundMusic} from './audio';
import { scene,camera,renderer,stats,onWindowResize, minicamera, minimapRenderer,updateMiniCameraPosition } from './gamelogic';
import  {updateTimerDisplay } from './timer';
import { createSpheres,spheresCollisions } from './sphere';
import { loadMap } from './map';
import { createRedTarget ,changeGreenTarget} from './targets';
import {teleportPlayerIfOob,getForwardVector, getSideVector,playerSphereCollision} from './player';

const container = document.getElementById( 'game-container' );
const nextLevelButton = document.getElementById('next-level-btn');
const endScreenHeading = document.getElementById("endScreen-Heading");
const crosshair = document.getElementById('crosshair');
const innerCircle = document.getElementById('circle-inner');
const outerCircle = document.getElementById('circle-outer');
const levelFinishScreen = document.getElementById('level-finish');
const restartButton = document.getElementById('restart-btn');
const exitButton = document.getElementById('exit-btn');
const resumeButton = document.getElementById('resume-btn');

playBackgroundMusic();

const clock = new THREE.Clock();
let initialTime = 50; // Change the time here
let remainingTime = initialTime; // Remaining time is initially the same as the initial time

updateTimerDisplay(remainingTime); // Display the initial time

const timerInterval = setInterval(updateTimer, 1000); // Update every second

function updateTimer() {
    
    if (remainingTime === initialTime) {
        let overlay = document.getElementById('loadingOverlay'); // THE LOADING SCREEN IS REMOVED WHEN THE TIMER STARTS
        overlay.style.display = 'none'; // THE LOADING SCREEN IS REMOVED WHEN THE TIMER STARTS
    }
    if (!paused){
        remainingTime--;

        updateTimerDisplay(remainingTime);
    }
 // Display the updated time

    if (remainingTime <= 0) {
        showLevelFinishScreen(); 
    }

}

let glbMap = 'Map1.glb'; //Change Map here
const worldOctree = new Octree();
loadMap(glbMap,scene,worldOctree,animate);

let targetsLeft = 10; //Change number of targets here
let target1, target2, target3, target4, target5, target6, target7, target8, target9, target10; //Update based on targets 

/**
 * Update here as well based on targets 
 */
const targetOctree = new Octree();
const targetOctree1 = new Octree();
const targetOctree2 = new Octree();
const targetOctree3 = new Octree();
const targetOctree4 = new Octree();
const targetOctree5 = new Octree();
const targetOctree6 = new Octree();
const targetOctree7 = new Octree();
const targetOctree8 = new Octree();
const targetOctree9 = new Octree();
const targetOctree10 = new Octree();

/**
 * Update here as well based on targets 
 */
createRedTarget(scene,7, 4, -14, 0, Math.PI/2, 0, 1, 1, 1, targetOctree1)
    .then((loadedTarget) => {
        target1 = loadedTarget;
    })
    .catch((error) => {
    });

createRedTarget(scene,4.75, 3.56, 16.5, 0, Math.PI/2, 0, 1.5, 1.5, 1.5, targetOctree2)
    .then((loadedTarget) => {
        target2 = loadedTarget;
    })
    .catch((error) => {
    });
createRedTarget(scene,7.4, -1.25, 4.1, 0, Math.PI/2, 0, 0.9, 0.9, 0.9, targetOctree3)
    .then((loadedTarget) => {
        target3 = loadedTarget;
    })
    .catch((error) => {
    });
createRedTarget(scene,-0.708183, -0.5, -20.3813, 0, 0, 0, 1, 1, 1, targetOctree4)
    .then((loadedTarget) => {
        target4 = loadedTarget;
    })
    .catch((error) => {
    });

createRedTarget(scene,-11.2, 3, -34.3, 0, Math.PI/2, 0, 0.75, 0.75, 0.75, targetOctree5)
    .then((loadedTarget) => {
        target5 = loadedTarget;
    })
    .catch((error) => {
    });
createRedTarget(scene,-12.5, 0, -9, 0, 0, 0, 1, 1, 1, targetOctree6)
    .then((loadedTarget) => {
        target6 = loadedTarget;
    })
    .catch((error) => {
    });
createRedTarget(scene,-5, 2.75, -9, 0, 0, 0, 0.9, 0.9, 0.9, targetOctree7)
    .then((loadedTarget) => {
        target7 = loadedTarget;
    })
    .catch((error) => {
    });

createRedTarget(scene,-6.2, 3.5,-32.5, 0, Math.PI/2, 0, 0.8, 0.8, 0.8, targetOctree8)
    .then((loadedTarget) => {
        target8 = loadedTarget;
    })
    .catch((error) => {
    });

createRedTarget(scene,16, 3.5, -4.85, 0, Math.PI/2, 0, 1, 1, 1, targetOctree9)
    .then((loadedTarget) => {
        target9 = loadedTarget;
    })
    .catch((error) => {
    });

createRedTarget(scene,-6.65, -1.35, 9.8, 0, Math.PI/2, 0, 0.9, 0.9, 0.9, targetOctree10)
    .then((loadedTarget) => {
        target10 = loadedTarget;
    })
    .catch((error) => {
    });


const NUM_SPHERES = 25; //Change number of spheres here
let ballsLeft = 25; //Update based on number of spheres
const spheres = [];   
let sphereIdx = 0;
createSpheres(scene, NUM_SPHERES, spheres );


const playerCollider = new Capsule( new THREE.Vector3( -10, 3, -40 ), new THREE.Vector3( -10, 4, -40 ), 0.35 );
const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();
let playerOnFloor = false;
let allowPlayerMovement = true;
let paused = false;
let levelCompleted = false;
const keyStates = {};
let storedMouseSpeed = localStorage.getItem('MouseSpeed');
let mouseTime = 0;
let count = 0

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
        return; 
    }

    if ( document.pointerLockElement !== null ) throwBall();

} );

document.body.addEventListener( 'mousemove', ( event ) => {

    if (!allowPlayerMovement) {
        return;
    }

    if (document.pointerLockElement === document.body) {
        // Limit how far down the camera can look (adjust the values as needed)
        camera.rotation.x -= event.movementY / storedMouseSpeed; //mouse speed default is 500
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x)); 
        camera.rotation.y -= event.movementX / storedMouseSpeed; //mouse speed default is 500

        // Minimap camera rotation 
    }

} );

function controls( deltaTime ) {

    if (!allowPlayerMovement) {
        return;
    }

    const speedDelta = deltaTime * ( playerOnFloor ? 25 : 4 );

    if ( keyStates[ 'KeyW' ] ) {

        playerVelocity.add( getForwardVector(camera,playerDirection).multiplyScalar( speedDelta ) );

    }

    if ( keyStates[ 'KeyS' ] ) {

        playerVelocity.add( getForwardVector(camera,playerDirection).multiplyScalar( - speedDelta ) );

    }

    if ( keyStates[ 'KeyA' ] ) {

        playerVelocity.add( getSideVector(camera,playerDirection).multiplyScalar( - speedDelta ) );

    }

    if ( keyStates[ 'KeyD' ] ) {

        playerVelocity.add( getSideVector(camera,playerDirection).multiplyScalar( speedDelta ) );

    }
    if ( keyStates[ 'KeyP' ] ) {
        showPauseScreen();
    }

    if ( playerOnFloor ) {

        if ( keyStates[ 'Space' ] ) {
            playJumpSound();
            playerVelocity.y = 5;
        }

    }

}

function showLevelFinishScreen() {
    if (levelCompleted){
        playLevelCompleteSound();
    }
    stopBackgroundMusic();
    levelFinishScreen.style.display = 'block';
    allowPlayerMovement = false;
    document.exitPointerLock();

    clearInterval(timerInterval);

    if (remainingTime <= 0 || ballsLeft ==0) {
        nextLevelButton.style.display = 'none';
        resumeButton.style.display = 'none';
        endScreenHeading.textContent = 'You Lost';
        crosshair.style.display = 'none';
        innerCircle.style.display = 'none';
        outerCircle.style.display = 'none';

    }
    else {
        endScreenHeading.textContent = 'Level 1 Complete';
        nextLevelButton.style.display = 'block';
        resumeButton.style.display = 'none';
        crosshair.style.display = 'none';
        innerCircle.style.display = 'none';
        outerCircle.style.display = 'none';
    }
}

function showPauseScreen() {
        stopBackgroundMusic();
        levelFinishScreen.style.display = 'block';
        allowPlayerMovement = false;
        document.exitPointerLock();
        paused = true;

        nextLevelButton.style.display = 'none';
        endScreenHeading.textContent = 'Game Paused';
        crosshair.style.display = 'none';
        innerCircle.style.display = 'none';
        outerCircle.style.display = 'none';
}


function hideLevelFinishScreen() {
    crosshair.style.display = 'block';
    innerCircle.style.display = 'block';
    outerCircle.style.display = 'block';
    levelFinishScreen.style.display = 'none';
    allowPlayerMovement = true;
    document.body.requestPointerLock();
    playBackgroundMusic();
    paused = false;

}



document.addEventListener('DOMContentLoaded', () => {

    restartButton.addEventListener('click', () => {
        window.location.href = 'game.html';
    });

    nextLevelButton.addEventListener('click', () => {
        window.location.href = 'game2.html';
    });

    exitButton.addEventListener('click', () => {
        window.location.href = 'menu.html';
    });

    resumeButton.addEventListener('click', () => {
        hideLevelFinishScreen();
    });

});

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

                ballsLeft--;
                document.getElementById('balls-left').innerText = `Balls: ${ballsLeft}`;
        }
        if (ballsLeft === 0) {
            showLevelFinishScreen();
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

        playerVelocity.y -= 9.8 * deltaTime;

        damping *= 0.1;

    }

    playerVelocity.addScaledVector( playerVelocity, damping );

    const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
    playerCollider.translate( deltaPosition );

    playerCollisions();

    camera.position.copy( playerCollider.end );//MOVING CAMERA MAINSCREEN

    minicamera.position.copy( playerCollider.end );//MOVING PLAYER ON MINIMAP
    if (playerVelocity.lengthSq() > 0) {
        console.log('Player position:', playerCollider.end);
    }
}

/**
 * Update this function as well based on targets 
 */
function updateSpheres( deltaTime ) {
   // const windForce = new THREE.Vector3(0.5, 0, 0);
    spheres.forEach( sphere => {

        sphere.collider.center.addScaledVector( sphere.velocity, deltaTime );
       // sphere.velocity.add(windForce);
        const result = worldOctree.sphereIntersect( sphere.collider );
        const resultTarget1 = targetOctree1.sphereIntersect( sphere.collider );
        const resultTarget2 = targetOctree2.sphereIntersect( sphere.collider );
        const resultTarget3 = targetOctree3.sphereIntersect( sphere.collider );
        const resultTarget4 = targetOctree4.sphereIntersect( sphere.collider );
        const resultTarget5 = targetOctree5.sphereIntersect( sphere.collider );
        const resultTarget6 = targetOctree6.sphereIntersect( sphere.collider );
        const resultTarget7 = targetOctree7.sphereIntersect( sphere.collider );
        const resultTarget8 = targetOctree8.sphereIntersect( sphere.collider );
        const resultTarget9 = targetOctree9.sphereIntersect( sphere.collider );
        const resultTarget10 = targetOctree10.sphereIntersect( sphere.collider );

        const resultTargets = [
            resultTarget1, resultTarget2, resultTarget3, resultTarget4, resultTarget5,
            resultTarget6, resultTarget7, resultTarget8, resultTarget9, resultTarget10
          ];

          const Targets = [
              target1, target2, target3, target4, target5,
              target6, target7, target8, target9, target10
          ];
          
          for (let i = 0; i < 10; i++) {
              const currentResult = resultTargets[i];
              const currentTarget = Targets[i];
          
              if (currentResult) {
                  if (currentTarget.modelChanged === false) {
                      playTargetHitSound();
                      count++;
                      targetsLeft--;
                      document.getElementById('targets-left').innerText = `Targets: ${targetsLeft}`;
                      currentTarget.modelChanged = true;
                      if (!levelCompleted && targetsLeft === 0) {
                          levelCompleted = true;
                          showLevelFinishScreen();
                      }
                  }
          
                  changeGreenTarget(scene,targetOctree, currentTarget);
                  sphere.velocity.addScaledVector(currentResult.normal, -currentResult.normal.dot(sphere.velocity) * 1.5);
                  sphere.collider.center.add(currentResult.normal.multiplyScalar(currentResult.depth));
              }
          }

        if ( result ) {

            sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
            sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
        }
        
        else{
            sphere.velocity.y -= 9.8 * deltaTime;
        }

        const damping = Math.exp( - 1.5 * deltaTime ) - 1;
        sphere.velocity.addScaledVector( sphere.velocity, damping );

        playerSphereCollision( sphere,playerCollider,playerVelocity );

    } );

    spheresCollisions(spheres);
    for ( const sphere of spheres ) {

        sphere.mesh.position.copy( sphere.collider.center );

    }

}

function animate() {

    const deltaTime = Math.min( 0.05, clock.getDelta() ) / 5;

    if(!paused){
        for ( let i = 0; i < 5; i ++ ) {
            controls( deltaTime );
            updatePlayer( deltaTime );
            updateSpheres( deltaTime );
            teleportPlayerIfOob(camera,playerCollider,playerDirection);
            updateMiniCameraPosition(playerCollider);
    
        }
    }

    renderer.render( scene, camera );
    minimapRenderer.render(scene, minicamera)
    onWindowResize();
    stats.update();
    requestAnimationFrame( animate );
}