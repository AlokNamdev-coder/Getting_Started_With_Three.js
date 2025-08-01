import * as Three from 'three'
import {OrbitControls} from 'jsm/controls/OrbitControls.js';

const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new Three.WebGLRenderer();

renderer.setSize(w,h)

document.body.appendChild(renderer.domElement)



const fov = 75
const aspect = w/h
const near = 0.1
const far = 1000
const camera = new Three.PerspectiveCamera(fov,aspect,near,far)

camera.position.z=2

const scene = new Three.Scene();

const controls = new OrbitControls(camera,renderer.domElement)

controls.enableDamping=true
controls.dampingFactor=0.003

const geo = new Three.IcosahedronGeometry(1.0,2);
const mat = new Three.MeshStandardMaterial({
    color: 0xffffff,
    flatShading: true
})

const mesh = new Three.Mesh(geo,mat)

const hemiLight = new Three.HemisphereLight(0x0099ff,0xaa5500)

const wireMat = new Three.MeshBasicMaterial(
    {
        wireframe:true
    }
)

const wireframe = new Three.Mesh(geo,wireMat)
wireframe.scale.setScalar(1.001)

mesh.add(wireframe)

scene.add(mesh)



scene.add(hemiLight)

function animate(t=0){
    requestAnimationFrame(animate)
    mesh.rotation.y=t*0.0001
    renderer.render(scene,camera)
    controls.update()
}
animate();

