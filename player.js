import * as THREE from 'three';

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

function teleportPlayerIfOob(camera,playerCollider,playerDirection) {

    if ( camera.position.y <= - 5 ) {

        playerCollider.start.set( 0, 0.35, 0 );
        playerCollider.end.set( 0, 1, 0 );
        playerCollider.radius = 0.35;
        camera.position.copy( playerCollider.end );
        camera.rotation.set( 0, 0, 0 );

    }
}

function getForwardVector(camera,playerDirection) {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();

    return playerDirection;

}

function getSideVector(camera,playerDirection) {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross( camera.up );

    return playerDirection;

}

function playerSphereCollision(sphere, playerCollider, playerVelocity) {
    const center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);
    const sphere_center = sphere.collider.center;
    const r = playerCollider.radius + sphere.collider.radius;
    const r2 = r * r;

    // approximation: player = 3 spheres

    for (const point of [playerCollider.start, playerCollider.end, center]) {
        const d2 = point.distanceToSquared(sphere_center);

        if (d2 < r2) {
            const normal = vector1.subVectors(point, sphere_center).normalize();
            const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
            const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

            // Update only the x and z components of playerVelocity and sphere.velocity
            playerVelocity.x += v2.x - v1.x;
            playerVelocity.z += v2.z - v1.z;
            sphere.velocity.x += v1.x - v2.x;
            sphere.velocity.z += v1.z - v2.z;

            const d = (r - Math.sqrt(d2)) / 2;
            sphere_center.addScaledVector(normal, -d);
        }
    }
}

export { teleportPlayerIfOob,getForwardVector,getSideVector,playerSphereCollision};