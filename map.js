import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper.js';

function loadMap(glbMap,scene,worldOctree,animate){
    
const loader = new GLTFLoader().setPath( './models/gltf/' );

loader.load( glbMap, ( gltf ) => {

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
}

export { loadMap };