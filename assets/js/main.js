import * as THREE from "three";
import Stats from "../jsm/libs/stats.module.js";
import { OrbitControls } from "../jsm/controls/OrbitControls.js";
import { FBXLoader } from "../jsm/loaders/FBXLoader.js";

const manager = new THREE.LoadingManager();
let camera, scene, renderer, stats, object, loader;
let mixer;

const clock = new THREE.Clock();
const actions = {};
let activeAction, previousAction;

// --- LISTA DE ANIMACIONES ACTUALIZADA ---
const animFiles = [
    { name: "Reaction", file: "Reaction.fbx", key: "1" },
    { name: "BrooklynUprock", file: "Brooklyn Uprock.fbx", key: "2" },
    { name: "Kicking", file: "Kicking.fbx", key: "3" },
    { name: "LivershotKnockdown", file: "Livershot Knockdown.fbx", key: "4" },
    { name: "WalkBackward", file: "Walking Backwards.fbx", key: "5" },
    { name: "SambaDancing", file: "Samba Dancing.fbx", key: "6" }
];

init();

function init() {
    const container = document.getElementById("canvas-container");

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.002);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 80000, 500);
    cyanLight.position.set(100, 100, 100);
    scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xec4899, 80000, 500);
    magentaLight.position.set(-100, 50, -100);
    scene.add(magentaLight);

    const gridHelper = new THREE.GridHelper(1000, 40, 0x06b6d4, 0xffffff);
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    const planeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshPhongMaterial({ 
            color: 0x050505, 
            depthWrite: false, 
            transparent: true, 
            opacity: 0.8 
        })
    );
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.receiveShadow = true;
    scene.add(planeMesh);

    loader = new FBXLoader(manager);
    
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
        loadAnimations();
    });

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
    setupUIButtons(); 

    stats = new Stats();
    stats.dom.style.position = 'absolute';
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
                // Iniciar con la primera animación (Reaction)
                triggerAnimation(animFiles[0].name, animFiles[0].key); 
            }
        });
    });
}

function triggerAnimation(name, key) {
    if (actions[name] && activeAction !== actions[name]) {
        previousAction = activeAction;
        activeAction = actions[name];

        if (previousAction) {
            previousAction.fadeOut(0.5);
        }

        activeAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.5).play();
        
        document.querySelectorAll('.anim-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.anim-btn[data-key="${key}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

function onKeyDown(event) {
    const key = event.key;
    const anim = animFiles.find(a => a.key === key);
    if (anim) {
        triggerAnimation(anim.name, anim.key);
    }
}

function setupUIButtons() {
    const buttons = document.querySelectorAll('.anim-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = e.target.getAttribute('data-key');
            const anim = animFiles.find(a => a.key === key);
            if (anim) triggerAnimation(anim.name, anim.key);
        });
    });
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