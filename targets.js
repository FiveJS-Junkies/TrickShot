import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper.js';

function createRedTarget(scene,posx, posy, posz, rotx, roty, rotz, scalx, scaly, scalz, octree) {
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

function changeGreenTarget(scene,targetOctree,target){
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


export { createRedTarget, changeGreenTarget };