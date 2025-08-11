import * as Three from 'three';
import { RGBELoader } from 'jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'jsm/loaders/GLTFLoader.js';


const loader = new Three.TextureLoader();

const renderer = new Three.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 8);

const scene = new Three.Scene();
const controls = new OrbitControls(camera, renderer.domElement);
const pmremGenerator = new Three.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Lights
scene.add(new Three.AmbientLight(0xffffff, 0.5));
const dirLight = new Three.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 3, 3);
scene.add(dirLight);

let modelLoaded = false;
let envLoaded = false;
let loadedModel = null;

// Load HDR background
new RGBELoader().load('assets/space.hdr', (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.background = envMap;
    envLoaded = true;
}, undefined, (err) => {
    console.warn('HDRI load failed', err);
    scene.background = new Three.Color(0x222233);
    envLoaded = true;
});

// Load Sun model
new GLTFLoader().load('assets/scene.gltf', (gltf) => {
    const model = gltf.scene;
    loadedModel = model;

    // Center and scale
    const box = new Three.Box3().setFromObject(model);
    const center = box.getCenter(new Three.Vector3());
    model.position.sub(center);

    const size = box.getSize(new Three.Vector3()).length();
    model.scale.setScalar(3 / size);

    

    scene.add(model);
    modelLoaded = true;
});

const sunLight = new Three.PointLight(0xffffff, 2, 100);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Function to create a planet + orbit
function createPlanetOrbit(radius, speed, size,texture) {
    const orbitGeometry = new Three.RingGeometry(radius, radius + 0.02, 64);
    orbitGeometry.rotateX(-Math.PI / 2);

    const orbitMat = new Three.MeshBasicMaterial({
        color: 0xffffff,
        side: Three.DoubleSide,
        transparent: true,
        opacity: 0.3
    });

    const orbitMesh = new Three.Mesh(orbitGeometry, orbitMat);
    

    // Create planet
    const planetGeometry = new Three.SphereGeometry(size, 32, 16);
    const planetMat = new Three.MeshStandardMaterial({map:loader.load(texture) });
    const planetMesh = new Three.Mesh(planetGeometry, planetMat);

    
    planetMesh.position.z = radius - 0.05;
    planetMesh.rotation.y +=0.001

    const planetLight = new Three.PointLight(0xffffff, 0.5, 2); // soft light
    planetMesh.add(planetLight);
    orbitMesh.add(planetMesh);

    // Store rotation speed
    orbitMesh.userData.speed = speed;

    scene.add(orbitMesh);
    return orbitMesh;
}

// Add planets
const planets = [
    createPlanetOrbit(1.5, 0.01, 0.1,'assets/mercurymap.jpg'), // Mercury
    createPlanetOrbit(2.2, 0.008, 0.253,'assets/venusmap.jpg'), // Venus
    createPlanetOrbit(3.0, 0.006, 0.260,'assets/earthmap1k.jpg'), // Earth
    createPlanetOrbit(4.0, 0.004, 0.138,'assets/mars_1k_color.jpg'),// Mars
    createPlanetOrbit(6.0,0.005,1.121,'assets/jupitermap.jpg'),
    createPlanetOrbit(9.0,0.0045,0.945,'assets/saturnmap.jpg'), 
    createPlanetOrbit(11.0,0.006,0.401,'assets/uranusmap.jpg'),
    createPlanetOrbit(11.0,0.007,0.388,'assets/neptunemap.jpg'),
];

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (envLoaded && modelLoaded) {
        renderer.render(scene, camera);
    }

    if (loadedModel) {
        loadedModel.rotation.y += 0.001; // Sun rotation
    }

    // Rotate each planet's orbit
    planets.forEach(p => {
        p.rotation.y += p.userData.speed;
        
    });

    controls.update();
}
animate();
