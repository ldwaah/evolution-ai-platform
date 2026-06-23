import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const ROOM = { width: 22, depth: 18, height: 4.2 };
const INTERACT_DISTANCE = 5.5;

export function initStudentWorld(options = {}) {
  const root = document.getElementById("world-root");
  if (!root) return null;

  const onActivateView = typeof options.onActivateView === "function" ? options.onActivateView : () => {};
  const startPrompt = document.getElementById("world-start-prompt");
  const interactHint = document.getElementById("world-interact-hint");
  const crosshair = document.getElementById("world-crosshair");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8f0ff);
  scene.fog = new THREE.Fog(0xe8f0ff, 14, 34);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 1.65, 7);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  root.appendChild(renderer.domElement);

  const controls = new PointerLockControls(camera, renderer.domElement);
  scene.add(controls.getObject());

  const interactables = [];
  let focusedObject = null;

  addLights(scene);
  buildRoom(scene);
  buildFurniture(scene, interactables);

  const keys = { forward: false, backward: false, left: false, right: false };
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const lookTarget = new THREE.Vector2(0, 0);

  function onKeyDown(event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        keys.forward = true;
        break;
      case "ArrowLeft":
      case "KeyA":
        keys.left = true;
        break;
      case "ArrowDown":
      case "KeyS":
        keys.backward = true;
        break;
      case "ArrowRight":
      case "KeyD":
        keys.right = true;
        break;
      case "KeyE":
        if (focusedObject && controls.isLocked) {
          onActivateView(focusedObject.userData.view);
        }
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        keys.forward = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        keys.left = false;
        break;
      case "ArrowDown":
      case "KeyS":
        keys.backward = false;
        break;
      case "ArrowRight":
      case "KeyD":
        keys.right = false;
        break;
      default:
        break;
    }
  }

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  startPrompt?.addEventListener("click", () => {
    controls.lock();
  });

  controls.addEventListener("lock", () => {
    if (startPrompt) startPrompt.style.display = "none";
    crosshair?.classList.add("is-visible");
  });

  controls.addEventListener("unlock", () => {
    if (startPrompt) startPrompt.style.display = "block";
    crosshair?.classList.remove("is-visible");
    if (interactHint) interactHint.classList.remove("is-visible");
  });

  renderer.domElement.addEventListener("click", () => {
    if (focusedObject && controls.isLocked) {
      onActivateView(focusedObject.userData.view);
    }
  });

  function clampPlayerPosition() {
    const pos = controls.getObject().position;
    const margin = 0.55;
    const halfW = ROOM.width / 2 - margin;
    const halfD = ROOM.depth / 2 - margin;
    pos.x = THREE.MathUtils.clamp(pos.x, -halfW, halfW);
    pos.z = THREE.MathUtils.clamp(pos.z, -halfD, halfD);
    pos.y = 1.65;
  }

  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (controls.isLocked) {
      velocity.x -= velocity.x * 8 * delta;
      velocity.z -= velocity.z * 8 * delta;

      direction.set(0, 0, 0);
      direction.z = Number(keys.forward) - Number(keys.backward);
      direction.x = Number(keys.right) - Number(keys.left);
      direction.normalize();

      if (keys.forward || keys.backward) velocity.z -= direction.z * 28 * delta;
      if (keys.left || keys.right) velocity.x -= direction.x * 28 * delta;

      controls.moveRight(-velocity.x * delta);
      controls.moveForward(-velocity.z * delta);
      clampPlayerPosition();
    }

    updateInteractionFocus();
    renderer.render(scene, camera);
  }

  function getInteractableRoot(object) {
    let current = object;
    while (current) {
      if (current.userData?.view) return current;
      current = current.parent;
    }
    return null;
  }

  function updateInteractionFocus() {
    if (!controls.isLocked) {
      if (focusedObject) resetObjectHighlight(focusedObject);
      focusedObject = null;
      if (interactHint) interactHint.classList.remove("is-visible");
      return;
    }

    raycaster.setFromCamera(lookTarget, camera);
    const hits = raycaster.intersectObjects(interactables, true);
    const hit = hits.find((item) => {
      const root = getInteractableRoot(item.object);
      return root && item.distance <= INTERACT_DISTANCE;
    });

    if (hit) {
      const root = getInteractableRoot(hit.object);
      if (focusedObject !== root) {
        if (focusedObject) resetObjectHighlight(focusedObject);
        focusedObject = root;
        highlightObject(focusedObject);
      }
      if (interactHint) {
        interactHint.textContent = `Press E or click to open: ${focusedObject.userData.label}`;
        interactHint.classList.add("is-visible");
      }
    } else {
      if (focusedObject) resetObjectHighlight(focusedObject);
      focusedObject = null;
      if (interactHint) interactHint.classList.remove("is-visible");
    }
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", onResize);
  animate(performance.now());

  return {
    unlock() {
      controls.unlock();
    }
  };
}

function addLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 0.85);
  sun.position.set(6, 12, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const fill = new THREE.PointLight(0x93c5fd, 0.45, 24);
  fill.position.set(-4, 3.2, 0);
  scene.add(fill);
}

function buildRoom(scene) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
    new THREE.MeshStandardMaterial({ color: 0xf1f6ff, roughness: 0.92, metalness: 0.04 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(ROOM.width, 22, 0x93c5fd, 0xdbeafe);
  grid.position.y = 0.01;
  scene.add(grid);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.75 });

  const backWall = makeWall(ROOM.width, ROOM.height, wallMat);
  backWall.position.set(0, ROOM.height / 2, -ROOM.depth / 2);
  scene.add(backWall);

  const frontWall = makeWall(ROOM.width, ROOM.height, wallMat);
  frontWall.position.set(0, ROOM.height / 2, ROOM.depth / 2);
  frontWall.rotation.y = Math.PI;
  scene.add(frontWall);

  const leftWall = makeWall(ROOM.depth, ROOM.height, wallMat);
  leftWall.position.set(-ROOM.width / 2, ROOM.height / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  const rightWall = makeWall(ROOM.depth, ROOM.height, wallMat);
  rightWall.position.set(ROOM.width / 2, ROOM.height / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
    new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.95, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM.height;
  scene.add(ceiling);

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width - 1, 0.08, 0.4),
    accentMat
  );
  strip.position.set(0, 0.04, -ROOM.depth / 2 + 0.22);
  scene.add(strip);
}

function makeWall(width, height, material) {
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  wall.receiveShadow = true;
  return wall;
}

function buildFurniture(scene, interactables) {
  createInteractable(scene, interactables, {
    view: "home",
    label: "Home · Your Subjects",
    position: new THREE.Vector3(-6, 0, 5),
    color: 0x2563eb,
    shape: "desk",
    size: [2.2, 0.9, 1.2]
  });

  createInteractable(scene, interactables, {
    view: "tutors",
    label: "Tutor · Choose Your Tutor",
    position: new THREE.Vector3(-2, 0, -4),
    color: 0x1d4ed8,
    shape: "podium",
    size: [1.4, 1.1, 1.4]
  });

  createInteractable(scene, interactables, {
    view: "lesson",
    label: "Lessons · Demo Schedule",
    position: new THREE.Vector3(0, 1.4, -ROOM.depth / 2 + 0.35),
    color: 0x1e40af,
    shape: "board",
    size: [5.5, 2.4, 0.18]
  });

  createInteractable(scene, interactables, {
    view: "progress",
    label: "Progress · Your Journey",
    position: new THREE.Vector3(6.5, 0, -2),
    color: 0x3b82f6,
    shape: "shelf",
    size: [1.6, 2, 0.55]
  });

  addStudentDesks(scene);
  addRoomLabels(scene);
}

function createInteractable(scene, interactables, config) {
  let mesh;

  if (config.shape === "board") {
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...config.size),
      new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: new THREE.Color(0x072a6b),
        emissiveIntensity: 0.15,
        roughness: 0.55
      })
    );
    mesh.position.copy(config.position);
    mesh.castShadow = true;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(config.size[0] + 0.2, config.size[1] + 0.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })
    );
    frame.position.set(config.position.x, config.position.y, config.position.z - 0.08);
    scene.add(frame);
  } else if (config.shape === "shelf") {
    mesh = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(...config.size),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 })
    );
    body.position.y = config.size[1] / 2;
    body.castShadow = true;
    mesh.add(body);

    for (let i = 0; i < 3; i += 1) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.55, 0.7),
        new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.7 })
      );
      book.position.set(-0.35 + i * 0.35, 0.55 + i * 0.45, 0.05);
      mesh.add(book);
    }
    mesh.position.copy(config.position);
  } else if (config.shape === "podium") {
    mesh = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(config.size[0] / 2, config.size[0] / 2 + 0.15, config.size[1], 16),
      new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.65 })
    );
    base.position.y = config.size[1] / 2;
    base.castShadow = true;
    mesh.add(base);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 20),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(0x2563eb),
        emissiveIntensity: 0.35,
        roughness: 0.35
      })
    );
    orb.position.y = config.size[1] + 0.35;
    mesh.add(orb);
    mesh.position.copy(config.position);
  } else {
    mesh = new THREE.Group();
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(config.size[0], 0.12, config.size[2]),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 })
    );
    top.position.y = config.size[1];
    top.castShadow = true;
    mesh.add(top);

    const legMat = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.7 });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, config.size[1], 0.12), legMat);
      leg.position.set(sx * (config.size[0] / 2 - 0.12), config.size[1] / 2, sz * (config.size[2] / 2 - 0.12));
      mesh.add(leg);
    });

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.04, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        emissive: new THREE.Color(0x2563eb),
        emissiveIntensity: 0.45
      })
    );
    glow.position.y = config.size[1] + 0.08;
    mesh.add(glow);
    mesh.position.copy(config.position);
  }

  mesh.userData.view = config.view;
  mesh.userData.label = config.label;
  mesh.userData.baseEmissive = mesh.material?.emissiveIntensity || 0;
  mesh.userData.isInteractable = true;

  if (mesh.type === "Group") {
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.userData.view = config.view;
        child.userData.label = config.label;
        child.userData.isInteractable = true;
      }
    });
  }

  interactables.push(mesh);
  scene.add(mesh);
  addFloatingLabel(scene, config.label, config.position.clone().add(new THREE.Vector3(0, config.shape === "board" ? 1.6 : 1.35, 0)));
}

function addFloatingLabel(scene, text, position) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(7, 17, 31, 0.78)";
  roundRect(ctx, 8, 20, 496, 88, 18);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 256, 78);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.8, 0.95, 1);
  sprite.position.copy(position);
  scene.add(sprite);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function addStudentDesks(scene) {
  const positions = [
    [-5, 0, 0], [-2.5, 0, 0], [2.5, 0, 0], [5, 0, 0],
    [-5, 0, 2.8], [-2.5, 0, 2.8], [2.5, 0, 2.8], [5, 0, 2.8]
  ];

  positions.forEach(([x, y, z]) => {
    const desk = new THREE.Group();
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.1, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86 })
    );
    top.position.y = 0.75;
    top.castShadow = true;
    desk.add(top);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
    [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), legMat);
      leg.position.set(lx, 0.375, lz);
      desk.add(leg);
    });

    desk.position.set(x, y, z);
    scene.add(desk);
  });
}

function addRoomLabels(scene) {
  addFloatingLabel(scene, "Evolution Classroom", new THREE.Vector3(0, 3.2, -ROOM.depth / 2 + 1.2));
}

function highlightObject(object) {
  const root = object.userData.isInteractable ? object : object.parent;
  root.traverse?.((child) => {
    if (child.isMesh && child.material?.emissive) {
      child.material.emissive.setHex(0x2563eb);
      child.material.emissiveIntensity = 0.35;
    }
  });
}

function resetObjectHighlight(object) {
  object.traverse?.((child) => {
    if (child.isMesh && child.material?.emissive) {
      child.material.emissive.setHex(0x000000);
      child.material.emissiveIntensity = object.userData.baseEmissive || 0;
    }
  });
}
