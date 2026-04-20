import * as THREE from "three";

// Rutas actualizadas a tu carpeta local 'jsm'
import Stats from "../jsm/libs/stats.module.js";
import { OrbitControls } from "../jsm/controls/OrbitControls.js";
import { FBXLoader } from "../jsm/loaders/FBXLoader.js";

const manager = new THREE.LoadingManager();
let camera, scene, renderer, stats, object, loader;
let mixer;

const clock = new THREE.Clock();
const actions = {};
let activeAction, previousAction;

// Lista de movimientos actualizada con el nombre exacto de tu archivo
const animFiles = [
    { name: "RunToRolling", file: "Run To Rolling.fbx", key: "1" },
    { name: "BrooklynUprock", file: "Brooklyn Uprock.fbx", key: "2" },
    { name: "Kicking", file: "Kicking.fbx", key: "3" },
    { name: "LivershotKnockdown", file: "Livershot Knockdown.fbx", key: "4" },
    { name: "WalkBackward", file: "Walking Backwards.fbx", key: "5" } // <-- Nombre corregido aquí
];

init();

function init() {
    const container = document.getElementById("canvas-container");

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    loader = new FBXLoader(manager);
    
    // Cargar el Modelo Base
    loader.load("./assets/models/fbx/character.fbx", function (group) {
        object = group;
        mixer = new THREE.AnimationMixer(object);

        object.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(object);

        // Cargar las Animaciones
        loadAnimations();
    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener("resize", onWindowResize);
    window.addEventListener("keydown", onKeyDown);

    stats = new Stats();
    container.appendChild(stats.dom);
}

function loadAnimations() {
    let animsLoaded = 0;

    animFiles.forEach((anim) => {
        loader.load("./assets/models/fbx/" + anim.file, function (animObject) {
            const clip = animObject.animations[0];
            const action = mixer.clipAction(clip);
            
            actions[anim.name] = action;
            animsLoaded++;

            if (animsLoaded === animFiles.length) {
                fadeToAction("BrooklynUprock", 0.5);
            }
        });
    });
}

function fadeToAction(name, duration) {
    previousAction = activeAction;
    activeAction = actions[name];

    if (previousAction && previousAction !== activeAction) {
        previousAction.fadeOut(duration);
    }

    activeAction
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(duration)
        .play();
}

function onKeyDown(event) {
    const key = event.key;
    const anim = animFiles.find(a => a.key === key);
    
    if (anim && activeAction !== actions[anim.name]) {
        fadeToAction(anim.name, 0.5);
    }
}

function onWindowResize() {
    const container = document.getElementById("canvas-container");
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
    stats.update();
}