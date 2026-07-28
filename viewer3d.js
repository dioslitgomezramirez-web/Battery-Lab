/* ============================================================
   BATTERY LAB — Visor 3D interactivo
   Construido sobre Three.js. Representa la celda de forma
   esquemática pero fiel a su arquitectura real: colectores,
   electrodos, separador/electrolito y carcasa, con animación
   de flujo de electrones (circuito externo) y de iones
   (a través del electrolito).
   ============================================================ */

const Viewer3D = (() => {
  let scene, camera, renderer, controls, container;
  let lastW = 0, lastH = 0;
  let modelGroup, tabAnodo, tabCatodo;
  let electronCurve, ionGaps = [];
  let electronParticles = [], ionParticles = [];
  let xrayOn = false, flowMode = 'descarga', flowSpeed = 1;
  let raycaster, mouseVec;
  let onInfoClick = null;
  let clock;
  let animId = null;

  const COLOR = {
    cobre: 0xC77B45, aluminio: 0xB9C2CC, niquel: 0xD8D3C4,
    grafito: 0x2E3238, sic: 0x3B4048, litioMetal: 0xC9CDD3, carbonoduro: 0x3a352c,
    lco: 0x3E5A8C, nmc: 0x4A6FA5, lfp: 0x3F7A5C, nca: 0x5A5A9B, sodio: 0x7A8C5C, azufre: 0xA6A03A,
    separador: 0xDDE3E8, electrolitoSolido: 0x8FD9E3,
    pouch: 0xB8BCC4, canAl: 0xC7CCD3, canSteel: 0x8A8F97, polymer: 0xEDE7DC,
    electron: 0xE3985E, ion: 0x4DD4E8
  };

  function hashColor(str, sat, light) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    const c = new THREE.Color();
    c.setHSL((h % 360) / 360, sat, light);
    return c.getHex();
  }

  function colorAnodo(mat) {
    const known = { grafito: COLOR.grafito, silicio_carbono: COLOR.sic, silicio_puro: COLOR.sic,
      litio_metalico: COLOR.litioMetal, carbono_duro: COLOR.carbonoduro, lto: 0x555b63 };
    if (known[mat.id] !== undefined) return known[mat.id];
    return hashColor(mat.nombre || mat.id, 0.28, 0.26);
  }
  function colorCatodo(mat) {
    const known = { lco: COLOR.lco, nmc622: COLOR.nmc, nmc811: COLOR.nmc, lfp: COLOR.lfp,
      nca: COLOR.nca, sodio_np: COLOR.sodio, azufre: COLOR.azufre };
    if (known[mat.id] !== undefined) return known[mat.id];
    return hashColor(mat.nombre || mat.id, 0.42, 0.4);
  }
  /* Apariencia de la carcasa (y de cualquier material personalizado) derivada de sus
     propiedades reales: metálico o no, en vez de una lista fija de colores por id. */
  function aparienciaCarcasa(mat) {
    if (mat.metalico) {
      const known = { lata_aluminio: 0xC7CCD3, lata_acero: 0x8A8F97, titanio: 0x9198A0, magnesio: 0xBFC9CA };
      const color = known[mat.id] !== undefined ? known[mat.id] : hashColor(mat.nombre || mat.id, 0.05, 0.64);
      return { color, metalness: 0.85, roughness: 0.28 };
    }
    const known = { bolsa_aluminio: 0xB8BCC4, polimero_rigido: 0xEDE7DC };
    const color = known[mat.id] !== undefined ? known[mat.id] : hashColor(mat.nombre || mat.id, 0.12, 0.58);
    return { color, metalness: 0.06, roughness: 0.8 };
  }

  /* Textura de etiqueta impresa (como las de las baterías reales de teléfono):
     texto de especificaciones, icono de advertencia y código de barras. Da el
     aspecto de una celda real en vez de una caja lisa esquemática. */
  let labelTextureCache = null;
  function buildLabelTexture(nombreMaterial) {
    if (labelTextureCache) return labelTextureCache;
    if (typeof document === 'undefined' || !document.createElement) return null;
    try {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 320;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#eef0f2'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = '#9aa2ad'; ctx.lineWidth = 3;
      ctx.strokeRect(14, 14, c.width - 28, c.height - 28);
      ctx.fillStyle = '#2a2f36';
      ctx.font = 'bold 30px Arial'; ctx.fillText('Li-ion BATTERY', 34, 58);
      ctx.font = '16px Arial'; ctx.fillStyle = '#4a505a';
      ctx.fillText('3.87V  \u2022  DESIGNED IN BATTERY LAB', 34, 86);
      ctx.fillText('MODEL: BL-' + (Math.abs(((nombreMaterial || '').length * 137) % 900) + 100), 34, 110);
      ctx.strokeStyle = '#c94b3f'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(70, 150); ctx.lineTo(40, 205); ctx.lineTo(100, 205); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#c94b3f'; ctx.font = 'bold 26px Arial'; ctx.fillText('!', 63, 198);
      ctx.fillStyle = '#4a505a'; ctx.font = '12px Arial';
      ctx.fillText('No perforar  \u2022  No incinerar  \u2022  No cortocircuitar', 118, 165);
      ctx.fillText('Reciclar según normativa local', 118, 182);
      let bx = 34;
      for (let i = 0; i < 40; i++) {
        const bw = 1 + (i % 3);
        ctx.fillStyle = i % 2 === 0 ? '#20242c' : '#eef0f2';
        ctx.fillRect(bx, 240, bw, 50);
        bx += bw + 2;
      }
      ctx.fillStyle = '#2a2f36'; ctx.font = '11px monospace';
      ctx.fillText('CE   Li-ion   \u2014   MADE IN SIMULATION', 34, 305);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      labelTextureCache = tex;
      return tex;
    } catch (e) { return null; }
  }

  function init(containerEl, callbacks) {
    container = containerEl;
    onInfoClick = (callbacks && callbacks.onInfoClick) || null;
    clock = new THREE.Clock();

    const w0 = Math.max(container.clientWidth, 1);
    const h0 = Math.max(container.clientHeight, 1);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, w0 / h0, 0.1, 100);
    camera.position.set(5.5, 4.2, 6.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w0, h0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 16;
    controls.target.set(0, 0, 0);

    const amb = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(6, 8, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6ea8ff, 0.25);
    fill.position.set(-6, 2, -4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x4dd4e8, 0.3);
    rim.position.set(0, -3, -6);
    scene.add(rim);

    modelGroup = new THREE.Group();
    scene.add(modelGroup);

    raycaster = new THREE.Raycaster();
    mouseVec = new THREE.Vector2();
    renderer.domElement.addEventListener('click', onClick);

    window.addEventListener('resize', resize);

    // ResizeObserver detecta cambios de tamaño del propio contenedor por cualquier
    // causa (no solo el evento resize de la ventana): apertura de paneles, cambio
    // de orientación, la barra de direcciones del móvil, fuentes que terminan de
    // cargar y desplazan el layout, etc. Es la causa más probable de que el visor
    // quedara en blanco en pantallas pequeñas: el contenedor medía 0x0 en el
    // instante exacto de crear el canvas y nunca se volvía a ajustar.
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => resize());
      ro.observe(container);
    }
    // Reintentos cortos adicionales por si el layout inicial aún no estaba listo
    // en el momento de construir el renderer (típico justo tras DOMContentLoaded).
    setTimeout(resize, 60);
    setTimeout(resize, 300);
    setTimeout(resize, 900);

    animate();
  }

  function resize() {
    if (!container || !renderer) return;
    const w = container.clientWidth, h = container.clientHeight;
    if (w < 2 || h < 2) return;
    if (Math.abs(w - lastW) < 1 && Math.abs(h - lastH) < 1) return;
    lastW = w; lastH = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function clearGroup() {
    while (modelGroup.children.length) {
      const obj = modelGroup.children.pop();
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
    electronParticles = [];
    ionParticles = [];
    ionGaps = [];
  }

  function makeBox(w, h, d, color, opts) {
    opts = opts || {};
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color, roughness: opts.roughness !== undefined ? opts.roughness : 0.55,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.35,
      transparent: !!opts.transparent, opacity: opts.opacity !== undefined ? opts.opacity : 1
    });
    const mesh = new THREE.Mesh(geo, mat);
    if (opts.info) mesh.userData.info = opts.info;
    return mesh;
  }

  function addEdges(mesh, color) {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: color || 0x000000, transparent: true, opacity: 0.25 }));
    mesh.add(line);
  }

  /* Contorno 2D real de cada forma de batería (vista desde arriba). Esto es lo que
     antes faltaba: "forma" solo afectaba el cálculo de volumen, nunca se veía. */
  function crossSectionShape(forma, w, d) {
    const shape = new THREE.Shape();
    const hw = w / 2, hd = d / 2;
    if (forma === 'forma_l') {
      const nw = w * 0.38, nd = d * 0.38;
      shape.moveTo(-hw, -hd);
      shape.lineTo(hw, -hd);
      shape.lineTo(hw, hd - nd);
      shape.lineTo(hw - nw, hd - nd);
      shape.lineTo(hw - nw, hd);
      shape.lineTo(-hw, hd);
      shape.closePath();
    } else if (forma === 'escalonada') {
      const nw = w * 0.26, nd = d * 0.46;
      shape.moveTo(-hw, -hd);
      shape.lineTo(hw - nw, -hd);
      shape.lineTo(hw - nw, -hd + nd);
      shape.lineTo(hw, -hd + nd);
      shape.lineTo(hw, hd);
      shape.lineTo(-hw + nw, hd);
      shape.lineTo(-hw + nw, hd - nd);
      shape.lineTo(-hw, hd - nd);
      shape.closePath();
    } else if (forma === 'curva') {
      const rad = Math.min(w, d) * 0.18;
      shape.moveTo(-hw + rad, -hd);
      shape.lineTo(hw - rad, -hd);
      shape.quadraticCurveTo(hw, -hd, hw, -hd + rad);
      shape.lineTo(hw, hd - rad);
      shape.quadraticCurveTo(hw, hd, hw - rad, hd);
      shape.lineTo(-hw + rad, hd);
      shape.quadraticCurveTo(-hw, hd, -hw, hd - rad);
      shape.lineTo(-hw, -hd + rad);
      shape.quadraticCurveTo(-hw, -hd, -hw + rad, -hd);
    } else {
      const rad = Math.min(w, d) * 0.07;
      shape.moveTo(-hw + rad, -hd);
      shape.lineTo(hw - rad, -hd);
      shape.quadraticCurveTo(hw, -hd, hw, -hd + rad);
      shape.lineTo(hw, hd - rad);
      shape.quadraticCurveTo(hw, hd, hw - rad, hd);
      shape.lineTo(-hw + rad, hd);
      shape.quadraticCurveTo(-hw, hd, -hw, hd - rad);
      shape.lineTo(-hw, -hd + rad);
      shape.quadraticCurveTo(-hw, -hd, -hw + rad, -hd);
    }
    return shape;
  }

  function buildLayerGeometry(forma, w, h, d) {
    const shape = crossSectionShape(forma, w, d);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 10 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -h / 2, 0);
    return geo;
  }

  function makeShapedLayer(forma, w, h, d, color, opts) {
    opts = opts || {};
    const geo = buildLayerGeometry(forma, w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color, roughness: opts.roughness !== undefined ? opts.roughness : 0.55,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.35,
      transparent: !!opts.transparent, opacity: opts.opacity !== undefined ? opts.opacity : 1,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    if (opts.info) mesh.userData.info = opts.info;
    return mesh;
  }

  /* Reconstruye el modelo 3D a partir de config + resultados de simulación */
  function rebuild(config, r) {
    clearGroup();

    // Escala única mm -> unidades 3D: el mismo factor para largo, ancho y espesor,
    // para que el modelo visual guarde la proporción REAL del diseño (una batería de
    // teléfono real es muy delgada frente a su superficie; antes el espesor usaba una
    // escala aparte y siempre se veía como un bloque grueso, sin importar los mm reales).
    const MM_A_UNIDADES = 3.2 / 90;
    const W = config.largoMm * MM_A_UNIDADES;
    const depth = config.anchoMm * MM_A_UNIDADES;
    const H = Math.max(config.espesorMm * MM_A_UNIDADES, 0.018);

    const nVisual = Math.max(4, Math.min(10, Math.round(r.geometria.numCapas / 3)));
    const layerH = H / (nVisual * 2 + 1);
    const gapH = layerH * 0.35;
    const unitH = layerH * 2 + layerH * 0.28 * 2 + gapH; // altura de un bloque ánodo+colectores+separador+cátodo
    const totalStackH = unitH * nVisual;

    let y = -(totalStackH / 2);

    const infoAnodo = { titulo: r.materiales.anodo.nombre, texto: r.materiales.anodo.descripcion, tipo: 'Ánodo' };
    const infoCatodo = { titulo: r.materiales.catodo.nombre, texto: r.materiales.catodo.descripcion, tipo: 'Cátodo' };
    const infoSep = { titulo: r.materiales.separador.nombre, texto: r.materiales.separador.descripcion, tipo: 'Separador / electrolito' };
    const infoElectrolito = { titulo: r.materiales.electrolito.nombre, texto: r.materiales.electrolito.descripcion, tipo: 'Electrolito' };
    const infoColA = { titulo: r.materiales.colectorA.nombre, texto: r.materiales.colectorA.descripcion, tipo: 'Colector (ánodo)' };
    const infoColC = { titulo: r.materiales.colectorC.nombre, texto: r.materiales.colectorC.descripcion, tipo: 'Colector (cátodo)' };
    const infoCarcasa = { titulo: r.materiales.carcasa.nombre, texto: r.materiales.carcasa.descripcion, tipo: 'Carcasa' };

    const colorAnodoVal = colorAnodo(r.materiales.anodo);
    const colorCatodoVal = colorCatodo(r.materiales.catodo);

    for (let i = 0; i < nVisual; i++) {
      const anodoMesh = makeShapedLayer(config.forma, W * 0.92, layerH, depth * 0.92, colorAnodoVal, { info: infoAnodo, roughness: 0.7, metalness: 0.1 });
      anodoMesh.position.y = y + layerH / 2; modelGroup.add(anodoMesh); addEdges(anodoMesh);
      y += layerH;

      const colAMesh = makeShapedLayer(config.forma, W * 0.92, layerH * 0.28, depth * 0.92, COLOR.cobre, { info: infoColA, roughness: 0.35, metalness: 0.85 });
      colAMesh.position.y = y + (layerH * 0.28) / 2; modelGroup.add(colAMesh);
      y += layerH * 0.28;

      const gapY0 = y;
      const sepMesh = makeShapedLayer(config.forma, W * 0.94, gapH, depth * 0.94, r.esSolido ? COLOR.electrolitoSolido : COLOR.separador,
        { info: r.esSolido ? infoSep : infoElectrolito, transparent: true, opacity: r.esSolido ? 0.55 : 0.38, roughness: 0.2, metalness: 0.05 });
      sepMesh.position.y = y + gapH / 2; modelGroup.add(sepMesh);
      ionGaps.push({ yCenter: sepMesh.position.y, halfW: W * 0.4, halfD: depth * 0.4 });
      y += gapH;

      const colCMesh = makeShapedLayer(config.forma, W * 0.92, layerH * 0.28, depth * 0.92, COLOR.aluminio, { info: infoColC, roughness: 0.35, metalness: 0.85 });
      colCMesh.position.y = y + (layerH * 0.28) / 2; modelGroup.add(colCMesh);
      y += layerH * 0.28;

      const catodoMesh = makeShapedLayer(config.forma, W * 0.92, layerH, depth * 0.92, colorCatodoVal, { info: infoCatodo, roughness: 0.6, metalness: 0.15 });
      catodoMesh.position.y = y + layerH / 2; modelGroup.add(catodoMesh); addEdges(catodoMesh);
      y += layerH;
    }

    /* Tabs de conexión (colectores salientes) — su tamaño escala con el ancho
       del modelo (clamp para que no se vean minúsculas ni gigantes en tamaños extremos) */
    const escalaTab = clamp(W / 3.2, 0.4, 4.5);
    tabAnodo = makeBox(0.5 * escalaTab, 0.09 * Math.max(escalaTab, 0.7), 0.32 * escalaTab, COLOR.cobre, { info: infoColA, metalness: 0.9, roughness: 0.25 });
    tabAnodo.position.set(-W / 2 - 0.22 * escalaTab, totalStackH * 0.3, -depth / 2 + 0.4 * escalaTab);
    modelGroup.add(tabAnodo);

    tabCatodo = makeBox(0.5 * escalaTab, 0.09 * Math.max(escalaTab, 0.7), 0.32 * escalaTab, COLOR.aluminio, { info: infoColC, metalness: 0.9, roughness: 0.25 });
    tabCatodo.position.set(W / 2 + 0.22 * escalaTab, totalStackH * 0.3, -depth / 2 + 0.4 * escalaTab);
    modelGroup.add(tabCatodo);

    /* Carcasa envolvente — su apariencia (color, brillo metálico) sale de las
       propiedades reales del material elegido, no de una lista fija por id, y su
       silueta sigue la forma real elegida (prismática, L, escalonada o curva). */
    const casingH = totalStackH * 1.22;
    const apCarcasa = aparienciaCarcasa(r.materiales.carcasa);
    const carcasaMesh = makeShapedLayer(config.forma, W * 1.08, casingH, depth * 1.1, apCarcasa.color,
      { info: infoCarcasa, transparent: true, opacity: xrayOn ? 0.12 : 0.9, roughness: apCarcasa.roughness, metalness: apCarcasa.metalness });
    carcasaMesh.name = 'carcasa';
    if (!r.materiales.carcasa.metalico) {
      const labelTex = buildLabelTexture(r.materiales.carcasa.nombre);
      if (labelTex) { carcasaMesh.material.map = labelTex; carcasaMesh.material.color.set(0xffffff); carcasaMesh.material.needsUpdate = true; }
    }
    modelGroup.add(carcasaMesh);
    addEdges(carcasaMesh, 0x000000);

    /* Curva del circuito externo (para el flujo de electrones) */
    const p0 = new THREE.Vector3(tabAnodo.position.x, tabAnodo.position.y, tabAnodo.position.z);
    const p2 = new THREE.Vector3(tabCatodo.position.x, tabCatodo.position.y, tabCatodo.position.z);
    const pMid = new THREE.Vector3(0, casingH * 2.2, depth / 2 - 0.4);
    electronCurve = new THREE.QuadraticBezierCurve3(p0, pMid, p2);


    const tubeGeo = new THREE.TubeGeometry(electronCurve, 24, 0.02, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({ color: COLOR.cobre, metalness: 0.7, roughness: 0.3 });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    modelGroup.add(tube);

    /* Partículas de electrones (circuito externo) */
    const nElectrones = 8;
    for (let i = 0; i < nElectrones; i++) {
      const geo = new THREE.SphereGeometry(0.035, 10, 10);
      const mat = new THREE.MeshStandardMaterial({ color: COLOR.electron, emissive: COLOR.electron, emissiveIntensity: 0.7 });
      const sphere = new THREE.Mesh(geo, mat);
      sphere.userData.t = i / nElectrones;
      modelGroup.add(sphere);
      electronParticles.push(sphere);
    }

    /* Partículas de iones (a través del electrolito/separador) */
    ionGaps.forEach((gap, gi) => {
      const nIones = 5;
      for (let i = 0; i < nIones; i++) {
        const geo = new THREE.SphereGeometry(0.025, 8, 8);
        const mat = new THREE.MeshStandardMaterial({ color: COLOR.ion, emissive: COLOR.ion, emissiveIntensity: 0.8 });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.userData.t = Math.random();
        sphere.userData.gap = gap;
        sphere.userData.lane = (Math.random() - 0.5) * gap.halfD * 1.4;
        modelGroup.add(sphere);
        ionParticles.push(sphere);
      }
    });

    fitCameraToModel(carcasaMesh, tabAnodo, tabCatodo);
  }

  function fitCameraToModel(carcasaMesh, tabAnodo, tabCatodo) {
    const box = new THREE.Box3().setFromObject(carcasaMesh);
    box.expandByObject(tabAnodo);
    box.expandByObject(tabCatodo);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.4);
    const dist = maxDim * 2.3 + 1.4;

    const currentTarget = controls.target.clone();
    let dir = camera.position.clone().sub(currentTarget);
    if (dir.lengthSq() < 0.0001) dir.set(0.62, 0.47, 0.72);
    dir.normalize();

    camera.position.copy(center.clone().add(dir.multiplyScalar(dist)));
    controls.target.copy(center);
    controls.minDistance = dist * 0.32;
    controls.maxDistance = dist * 3.4;
    camera.near = Math.max(0.01, maxDim * 0.02);
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    controls.update();
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function setXray(on) {
    xrayOn = on;
    const carcasa = modelGroup.getObjectByName('carcasa');
    if (carcasa) carcasa.material.opacity = on ? 0.12 : 0.9;
  }

  function setFlowMode(mode) { flowMode = mode; } // 'carga' | 'descarga'
  function setFlowSpeed(v) { flowSpeed = v; }
  function setAutoRotate(on) {
    controls.autoRotate = on;
    controls.autoRotateSpeed = 2.2;
  }

  function onClick(event) {
    if (!onInfoClick) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouseVec.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVec.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseVec, camera);
    const hits = raycaster.intersectObjects(modelGroup.children, false);
    for (const hit of hits) {
      if (hit.object.userData && hit.object.userData.info) {
        onInfoClick(hit.object.userData.info);
        return;
      }
    }
  }

  function animate() {
    animId = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const dir = flowMode === 'carga' ? -1 : 1;

    electronParticles.forEach((p, i) => {
      p.userData.t += dt * 0.18 * flowSpeed * dir;
      let t = p.userData.t % 1; if (t < 0) t += 1;
      const pos = electronCurve.getPoint(t);
      p.position.copy(pos);
    });

    ionParticles.forEach(p => {
      p.userData.t += dt * 0.35 * flowSpeed * (-dir);
      let t = p.userData.t % 1; if (t < 0) t += 1;
      const gap = p.userData.gap;
      p.position.set(p.userData.lane * 0 + (t - 0.5) * gap.halfW * 1.7, gap.yCenter, p.userData.lane);
    });

    controls.update();
    renderer.render(scene, camera);
  }

  function screenshot() {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  }

  return { init, rebuild, resize, setXray, setFlowMode, setFlowSpeed, setAutoRotate, screenshot };
})();
