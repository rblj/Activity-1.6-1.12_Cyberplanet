import * as THREE from './three.js-master/build/three.module.js';
import { FontLoader } from './three.js-master/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from './three.js-master/examples/jsm/geometries/TextGeometry.js';
import { GLTFLoader } from './three.js-master/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from './three.js-master/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// Utility function to load textures
const loadTexture = (path) => {
    const loader = new THREE.TextureLoader();
    return loader.load(path, undefined, undefined, (error) => console.error(`Error loading texture: ${path}`, error));
};

// Canvas and Scene
const canvas = document.querySelector('.webgl');
if (!canvas) {
    throw new Error("Canvas element with class 'webgl' not found.");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Set a clear background

// Sizes
const sizes = { width: window.innerWidth, height: window.innerHeight };

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500);
camera.position.set(0, 50, 200);
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Orbit Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Lighting Setup
const setupLighting = () => {
    const directionalLight = new THREE.DirectionalLight(0xad8e6, 2);
    directionalLight.position.set(500, 500, 500);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024); // Optimized for performance
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x4444ff, 0.3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff00ff, 3, 100);
    pointLight.position.set(150, 50, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);

    return { directionalLight, ambientLight };
};

const lights = setupLighting();

// Reusable function for enabling shadows
const enableShadows = (object) => {
    object.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
};

// GLTF Loader
const loadModel = (path, options = {}) => {
    const loader = new GLTFLoader();
    loader.load(
        path,
        (glb) => {
            const model = glb.scene;
            model.scale.set(...(options.scale || [1, 1, 1]));
            model.position.set(...(options.position || [0, 0, 0]));
            model.rotation.set(...(options.rotation || [0, 0, 0]));
            enableShadows(model);
            scene.add(model);
            console.log(`${path} loaded successfully.`);
        },
        undefined,
        (error) => console.error(`Error loading model: ${path}`, error)
    );
};

// Load Models
loadModel('models/store.glb', {
    scale: [300, 300, 300],
    position: [-21, -20, 0],
    rotation: [0, Math.PI / 6, 0],
});
loadModel('models/building.glb', {
    scale: [7, 7, 7],
    position: [21, -10, 0],
    rotation: [0, Math.PI / 4, 0],
});

// Create Cyberpunk Planet
const createPlanet = () => {
    const texture = loadTexture('./textures/cyber_planet.jpg');
    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(50, 64, 64),
        new THREE.MeshStandardMaterial({ map: texture })
    );
    planet.position.set(0, -66, 0);
    enableShadows(planet);
    scene.add(planet);
};
createPlanet();

// Create Rotating Moon
const createMoon = () => {
    const texture = loadTexture('./textures/moon_texture.jpg');
    const moon = new THREE.Mesh(
        new THREE.SphereGeometry(10, 64, 64),
        new THREE.MeshStandardMaterial({ map: texture })
    );
    moon.position.set(150, 50, 0);
    enableShadows(moon);
    scene.add(moon);

    let moonAngle = 0;
    const updateMoonPosition = (deltaTime) => {
        moonAngle += deltaTime * 0.1;
        moon.position.x = 150 * Math.cos(moonAngle);
        moon.position.z = 150 * Math.sin(moonAngle);
    };

    return updateMoonPosition;
};
const updateMoonPosition = createMoon();

// Add CYBERPLANET Text
const addText = () => {
    const fontLoader = new FontLoader();
    fontLoader.load('./fonts/cyberfont.json', (font) => {
        const textGeometry = new TextGeometry('CYBERPLANET', {
            font,
            size: 15,
            height: 3,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelSegments: 5,
        });
        const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        const text = new THREE.Mesh(textGeometry, textMaterial);
        text.position.set(-80, 130, 0);
        enableShadows(text);
        scene.add(text);
    });
};
addText();

// Create Particles
const createParticles = () => {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(1000 * 3).map(() => (Math.random() - 0.5) * 500);
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        color: 0x44ff88,
        size: 0.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    scene.add(new THREE.Points(particlesGeometry, particlesMaterial));
};
createParticles();

// GUI Setup
const setupGUI = () => {
    const gui = new GUI();
    gui.add(lights.directionalLight, 'intensity', 0, 5).name('Directional Light Intensity');
    gui.addColor({ color: lights.directionalLight.color.getHex() }, 'color')
        .name('Directional Light Color')
        .onChange((value) => lights.directionalLight.color.set(value));
    gui.add(lights.ambientLight, 'intensity', 0, 1).name('Ambient Light Intensity');
};
setupGUI();

// Resize Event
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Render Loop
const clock = new THREE.Clock();
const animate = () => {
    const deltaTime = clock.getDelta();
    updateMoonPosition(deltaTime);
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};
animate();
