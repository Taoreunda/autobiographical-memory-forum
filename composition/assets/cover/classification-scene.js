import * as THREE from '../three/three.module.js';

export function initCover(document, idPrefix = '') {
  // Original conceptual scene. No neural-network layers; one sample's three
  // information sources are combined, then one prediction follows one branch.
  const canvas = document.getElementById(idPrefix + 'classification-canvas');
  const W = 1120,
    H = 735;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-7.5, 7.5, 4.92, -4.92, 0.1, 80);
  camera.position.set(7.8, 13.4, 14.5);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(1.5);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xf3f6fa, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb4c3d7, 2.5));
  const key = new THREE.DirectionalLight(0xfffaf2, 4.1);
  key.position.set(-5, 13, 8);
  key.castShadow = true;
  Object.assign(key.shadow.camera, {
    left: -12,
    right: 12,
    top: 12,
    bottom: -12,
    near: 0.1,
    far: 40,
  });
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 5;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc5ddff, 1.5);
  fill.position.set(9, 5, -8);
  scene.add(fill);
  const world = new THREE.Group();
  scene.add(world);
  const material = (color, roughness = 0.34) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04 });
  const white = material(0xfdfefe),
    rim = material(0xd7e1ee),
    blue = material(0x2767f3),
    ice = material(0xaac8ff),
    pipeMat = material(0xf5f8ff, 0.24);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.ShadowMaterial({ color: 0x60799e, opacity: 0.18 }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.06;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  function roundedGeometry(w, d, h, r = 0.2) {
    const s = new THREE.Shape(),
      x = -w / 2,
      z = -d / 2;
    s.moveTo(x + r, z);
    s.lineTo(x + w - r, z);
    s.quadraticCurveTo(x + w, z, x + w, z + r);
    s.lineTo(x + w, z + d - r);
    s.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
    s.lineTo(x + r, z + d);
    s.quadraticCurveTo(x, z + d, x, z + d - r);
    s.lineTo(x, z + r);
    s.quadraticCurveTo(x, z, x + r, z);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: h,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      curveSegments: 10,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  }
  function plate(w, d, h, mat, x, y, z, r = 0.2, parent = world) {
    const m = new THREE.Mesh(roundedGeometry(w, d, h, r), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function tile(x, z, w = 2.25, d = 1.65) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    world.add(group);
    plate(w, d, 0.18, rim, 0, 0.12, 0, 0.22, group);
    plate(w, d, 0.13, white, 0, 0.3, 0, 0.22, group);
    return group;
  }
  function line(parent, x, z, w, d, mat = blue, y = 0.47) {
    return plate(w, d, 0.055, mat, x, y, z, Math.min(0.06, d / 2), parent);
  }
  const inputPositions = [
    [-4.4, -3],
    [-4.4, 0],
    [-4.4, 3],
  ];
  const inputTiles = inputPositions.map(([x, z]) => tile(x, z));
  // Raised strokes and discs keep the icons consistent with the existing tiles.
  function stroke(parent, points, mat = blue, r = 0.035) {
    const path = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, 0.71, z)),
    );
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(path, 32, r, 8, false),
      mat,
    );
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function disc(parent, x, z, r, mat = blue, y = 0.71) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 0.045, 40),
      mat,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  // Memory: an aligned portrait photograph stack, without a warped spline.
  plate(1.28, 1.1, 0.045, ice, -0.1, 0.48, -0.08, 0.07, inputTiles[0]);
  plate(1.28, 1.1, 0.045, blue, 0, 0.55, 0, 0.07, inputTiles[0]);
  plate(1.12, 0.94, 0.035, white, 0, 0.63, 0, 0.045, inputTiles[0]);
  disc(inputTiles[0], 0, -0.18, 0.17, blue, 0.71);
  plate(0.61, 0.27, 0.035, blue, 0, 0.7, 0.21, 0.12, inputTiles[0]);
  // Voice: preserve the original relief bars.
  [0.22, 0.49, 0.76, 0.94, 0.64, 0.38, 0.2].forEach((d, i) =>
    line(inputTiles[1], -0.69 + i * 0.23, 0, 0.12, d, blue, 0.48),
  );
  // Text: a raised sheet with a heading and three text rows.
  plate(1.05, 1.26, 0.065, ice, 0, 0.47, 0, 0.08, inputTiles[2]);
  plate(0.94, 1.15, 0.055, white, 0, 0.55, -0.02, 0.06, inputTiles[2]);
  line(inputTiles[2], -0.15, -0.37, 0.43, 0.1, blue, 0.66);
  [0.66, 0.66, 0.43].forEach((w, i) =>
    line(inputTiles[2], (w - 0.66) / 2, -0.08 + i * 0.23, w, 0.055, blue, 0.66),
  );
  // Three compared algorithms, printed on separate raised badges.
  const model = new THREE.Group();
  world.add(model);
  plate(2.7, 2.3, 0.22, rim, 0, 0.1, 0, 0.26, model);
  plate(2.55, 2.16, 0.53, blue, 0, 0.33, 0, 0.25, model);
  const algorithmBadges = ['SVM', 'RF', 'XGB'].map((name, i) => {
    const badge = new THREE.Group();
    badge.position.set(0, 0.94, -0.66 + i * 0.66);
    model.add(badge);
    plate(1.95, 0.52, 0.055, white, 0, 0, 0, 0.08, badge);
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 128;
    const ctx = textureCanvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#1754bf';
    ctx.font = '800 98px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 256, 68);
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const text = new THREE.Mesh(
      new THREE.PlaneGeometry(1.66, 0.415),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
    );
    text.rotation.x = -Math.PI / 2;
    text.position.y = 0.105;
    badge.add(text);
    return badge;
  });
  const outputs = [tile(4.25, -2, 2.4, 1.8), tile(4.25, 2, 2.4, 1.8)];
  // Person icons with restrained neutral / downturned expressions.
  outputs.forEach((parent, i) => {
    const icon = new THREE.Group();
    parent.add(icon);
    disc(icon, 0, -0.22, 0.44, ice, 0.51);
    const outline = Array.from({ length: 49 }, (_, j) => {
      const a = (j / 48) * Math.PI * 2;
      return [Math.cos(a) * 0.43, -0.22 + Math.sin(a) * 0.43];
    });
    stroke(icon, outline, blue, 0.035);
    disc(icon, -0.15, -0.33, 0.038, blue);
    disc(icon, 0.15, -0.33, 0.038, blue);
    stroke(
      icon,
      i === 0
        ? [
            [-0.16, -0.07],
            [0, -0.07],
            [0.16, -0.07],
          ]
        : [
            [-0.16, 0.02],
            [0, -0.08],
            [0.16, 0.02],
          ],
      blue,
      0.028,
    );
    stroke(
      icon,
      [
        [-0.63, 0.61],
        [-0.44, 0.34],
        [0, 0.24],
        [0.44, 0.34],
        [0.63, 0.61],
      ],
      blue,
      0.055,
    );
  });
  function curve(points) {
    return new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      false,
      'centripetal',
    );
  }
  const inputs = inputPositions.map(([x, z]) =>
    curve([
      [x + 0.9, 0.48, z],
      [-2.65, 0.48, z],
      [-1.95, 0.48, z * 0.55],
      [-1.05, 0.55, z * 0.13],
    ]),
  );
  const outgoing = [-2, 2].map((z) =>
    curve([
      [1.24, 0.54, 0],
      [2.05, 0.48, 0],
      [2.75, 0.48, z],
      [3.55, 0.48, z],
    ]),
  );
  [...inputs, ...outgoing].forEach((c) => {
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(c, 70, 0.115, 12, false),
      pipeMat,
    );
    m.castShadow = true;
    m.receiveShadow = true;
    world.add(m);
  });
  const sphereGeo = new THREE.SphereGeometry(0.2, 28, 20);
  const incomingBalls = inputs.map((c, i) => {
    const m = new THREE.Mesh(
      sphereGeo,
      material([0x2466ed, 0x6e99f3, 0x9dbcf7][i], 0.21),
    );
    m.castShadow = true;
    world.add(m);
    return m;
  });
  const outputBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 30, 22),
    blue,
  );
  outputBall.castShadow = true;
  world.add(outputBall);
  const ringMaterial = ice.clone();
  ringMaterial.transparent = true;
  const resultRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.04, 12, 64),
    ringMaterial,
  );
  resultRing.rotation.x = -Math.PI / 2;
  resultRing.position.set(4.25, 0.54, 2);
  world.add(resultRing);

  const outputSurfaces = outputs.map((tile) => {
    const mat = white.clone();
    tile.children[1].material = mat;
    return mat;
  });
  const baseSurfaceColor = white.color.clone(),
    selectedSurfaceColor = ice.color.clone();
  incomingBalls.forEach((ball) => {
    ball.material.transparent = true;
  });
  outputBall.material = blue.clone();
  outputBall.material.transparent = true;

  const labels = [
    ['label-memory', [-4.4, 0.12, -1.87]],
    ['label-voice', [-4.4, 0.12, 1.12]],
    ['label-language', [-4.4, 0.12, 4.13]],
    ['label-model', [0, 0.1, 1.55]],
    ['label-low', [4.25, 0.1, -0.78]],
    ['label-high', [4.25, 0.1, 3.22]],
  ];
  camera.updateMatrixWorld();
  // Project HTML labels through the same ground-plane axes as the 3D tiles.
  // Keep actual editable text while matching the diagram's angle and depth.
  const screenPoint = (xyz) => {
    const v = new THREE.Vector3(...xyz).project(camera);
    return new THREE.Vector2(((v.x + 1) * W) / 2, ((-v.y + 1) * H) / 2);
  };
  const origin = screenPoint([0, 0, 0]);
  const axisX = screenPoint([1, 0, 0]).sub(origin),
    axisZ = screenPoint([0, 0, 1]).sub(origin);
  const unit = axisX.length();
  const labelMatrix = [
    axisX.x / unit,
    axisX.y / unit,
    (axisZ.x / unit) * 1.15,
    (axisZ.y / unit) * 1.15,
  ];
  labels.forEach(([id, xyz]) => {
    const v = screenPoint(xyz),
      el = document.getElementById(idPrefix + id);
    el.style.left = v.x + 'px';
    el.style.top = v.y + 'px';
    el.style.transformOrigin = '50% 0';
    el.style.transform = `translateX(-50%) matrix(${labelMatrix.join(',')},0,0)`;
  });
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => {
    v = clamp(v);
    return v * v * (3 - 2 * v);
  };
  // Each eight-second pass returns to the same resting frame before switching.
  const bump = (t, start, duration) =>
    Math.sin(Math.PI * ease((t - start) / duration)) ** 2;
  function renderAt(time) {
    const branch = time < 8 ? 0 : 1;
    const t = time % 8;
    // Bases and pipe joints stay anchored. Only the algorithm badges respond.
    inputTiles.forEach((tile) => {
      tile.position.y = 0;
      tile.rotation.z = 0;
    });
    model.position.y = 0;
    model.scale.setScalar(1);
    incomingBalls.forEach((ball, i) => {
      const start = 0.55 + i * 0.2,
        end = start + 2.05;
      const u = ease((t - start) / (end - start));
      ball.position.copy(inputs[i].getPointAt(u));
      ball.position.y += 0.25;
      const alpha =
        ease((t - start) / 0.22) * (1 - ease((t - (end - 0.2)) / 0.2));
      ball.material.opacity = alpha;
      ball.visible = alpha > 0.001;
    });
    algorithmBadges.forEach((badge, i) => {
      badge.position.y = 0.94 + 0.065 * bump(t, 2.85 + i * 0.1, 0.85);
    });
    const u = ease((t - 3.65) / 2.05);
    outputBall.position.copy(outgoing[branch].getPointAt(u));
    outputBall.position.y += 0.25;
    const settle = ease((t - 5.65) / 0.35);
    const reset = 1 - ease((t - 7.05) / 0.7);
    const alpha = ease((t - 3.65) / 0.22) * reset;
    outputBall.material.opacity = alpha;
    outputBall.visible = alpha > 0.001;
    outputBall.scale.setScalar(1 - 0.12 * settle);
    const emphasis = settle * reset;
    outputs.forEach((tile, i) => {
      tile.position.y = 0;
      outputSurfaces[i].color
        .copy(baseSurfaceColor)
        .lerp(selectedSurfaceColor, i === branch ? emphasis : 0);
    });
    resultRing.position.set(3.55, 0.53, branch === 0 ? -2 : 2);
    resultRing.material.opacity = emphasis * 0.85;
    resultRing.visible = emphasis > 0.001;
    resultRing.scale.setScalar(0.8 + 0.2 * settle);
    ['label-low', 'label-high'].forEach((id, i) => {
      const el = document.getElementById(idPrefix + id);
      const a = i === branch ? emphasis : 0;
      const from = [76, 97, 123],
        to = [7, 93, 221];
      el.style.color = `rgb(${from.map((v, j) => Math.round(v + (to[j] - v) * a)).join(',')})`;
    });
    canvas.dataset.branch = branch === 0 ? 'low' : 'high';
    canvas.dataset.phase =
      t < 2.9
        ? 'inputs'
        : t < 3.65
          ? 'integrated'
          : t < 5.7
            ? 'classifying'
            : t < 7.05
              ? 'classified'
              : 'reset';
    renderer.render(scene, camera);
  }

  renderAt(0);
  return renderAt;
}
