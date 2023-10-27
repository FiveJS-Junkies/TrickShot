import * as THREE from 'three';

const SPHERE_RADIUS = 0.2;
const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();
const sphereGeometry = new THREE.IcosahedronGeometry( SPHERE_RADIUS, 5 );
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('textures/ballTexture.jpg');
const sphereMaterial = new THREE.MeshLambertMaterial( { map: texture } );
sphereMaterial.side = THREE.DoubleSide;

function createSpheres(scene, NUM_SPHERES, spheres ) {

    for (let i = 0; i < NUM_SPHERES; i++) {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.castShadow = true;
        sphere.receiveShadow = true;

        scene.add(sphere);

        spheres.push({
            mesh: sphere,
            collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
            velocity: new THREE.Vector3(),
        });
    }

    return spheres;
}


function spheresCollisions(spheres) {

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

export { createSpheres,spheresCollisions };
