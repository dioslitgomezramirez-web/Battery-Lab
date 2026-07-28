/* ============================================================
   BATTERY LAB — Controlador principal de la aplicación
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_PROJECTS = 'batterylab_projects_v1';
  const STORAGE_THEME = 'batterylab_theme';

  function defaultConfig() {
    return {
      tipo: 'lipo',
      anodo: 'grafito', catodo: 'nmc622', electrolito: 'gel_polimero', separador: 'ceramico',
      colectorA: 'cobre', colectorC: 'aluminio', carcasa: 'bolsa_aluminio',
      forma: 'prismatica',
      largoMm: 90, anchoMm: 60, espesorMm: 4.3,
      numCeldas: 1, numCapas: 18,
      nRatio: 1.1,
      metodoFabricacion: 'apilado',
      presionKpa: 250,
      tempOperMin: 0, tempOperMax: 45,
      velocidadCargaC: 1.5, velocidadDescargaC: 1.2,
      perfilUso: 'medio', cicloDoD: 100, chip: 'snapdragon_7', dispositivo: 'telefono',
      modoObjetivo: false, capacidadObjetivoMah: 4500,
      modoAutonomia: false, autonomiaObjetivoH: 8,
      materialesPersonalizados: { anodo: {}, catodo: {}, electrolito: {}, separador: {}, colector: {}, carcasa: {} }
    };
  }

  let config = defaultConfig();
  let results = null;
  let projectName = 'Diseño sin título';

  const $ = (id) => document.getElementById(id);
  const fmt = (n, d = 1) => Number(n).toFixed(d);
  const fmtInt = (n) => Math.round(n).toLocaleString('es-ES');
  function fmtHorasMin(h) {
    const totalMin = Math.round(h * 60);
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    if (hh <= 0) return `${mm} min`;
    if (mm === 0) return `${hh} h`;
    return `${hh} h ${mm} min`;
  }
  function autonomiaPorPerfil(r) {
    return Object.entries(PERFILES_USO).map(([key, p]) => ({
      key, nombre: p.nombre,
      horas: (r.energiaWh * (r.eficienciaDescarga / 100)) / p.consumoW
    }));
  }

  /* ============================================================
     POBLADO DE SELECTS
     ============================================================ */
  function opt(value, label) { const o = document.createElement('option'); o.value = value; o.textContent = label; return o; }

  function fillMaterialSelect(selectEl, categoria) {
    selectEl.innerHTML = '';
    Object.values(MATERIALS[categoria]).forEach(m => {
      selectEl.appendChild(opt(m.id, m.nombre));
    });
    Object.values(config.materialesPersonalizados[categoria] || {}).forEach(m => {
      selectEl.appendChild(opt(m.id, m.nombre + ' (personalizado)'));
    });
  }

  function populateStaticSelects() {
    const selTipo = $('selTipoBateria');
    selTipo.innerHTML = '';
    Object.values(BATTERY_TYPES).forEach(t => selTipo.appendChild(opt(t.id, t.nombre)));

    const selForma = $('selForma'); selForma.innerHTML = '';
    Object.entries(FORMAS).forEach(([k, v]) => selForma.appendChild(opt(k, v.nombre)));

    const selPerfil = $('selPerfilUso'); selPerfil.innerHTML = '';
    Object.entries(PERFILES_USO).forEach(([k, v]) => selPerfil.appendChild(opt(k, v.nombre)));

    const selChip = $('selChip'); selChip.innerHTML = '';
    Object.entries(CHIPSETS).forEach(([k, v]) => selChip.appendChild(opt(k, v.nombre + ' — ' + v.gama)));

    fillPhoneTargetSelect();

    const selMetodo = $('selMetodo'); selMetodo.innerHTML = '';
    Object.entries(METODOS_FABRICACION).forEach(([k, v]) => selMetodo.appendChild(opt(k, v.nombre)));

    fillMaterialSelect($('selAnodo'), 'anodo');
    fillMaterialSelect($('selCatodo'), 'catodo');
    fillMaterialSelect($('selElectrolito'), 'electrolito');
    fillMaterialSelect($('selSeparador'), 'separador');
    fillMaterialSelect($('selColectorA'), 'colector');
    fillMaterialSelect($('selColectorC'), 'colector');
    fillMaterialSelect($('selCarcasa'), 'carcasa');
  }

  function fillPhoneTargetSelect() {
    const disp = DISPOSITIVOS[config.dispositivo] || DISPOSITIVOS.telefono;
    const selPhoneTarget = $('selPhoneTarget'); selPhoneTarget.innerHTML = '';
    Object.entries(disp.tamanos).forEach(([k, v]) => selPhoneTarget.appendChild(opt(k, v.nombre)));
  }

  function syncUIFromConfig() {
    $('selTipoBateria').value = config.tipo;
    $('selAnodo').value = config.anodo;
    $('selCatodo').value = config.catodo;
    $('selElectrolito').value = config.electrolito;
    $('selSeparador').value = config.separador;
    $('selColectorA').value = config.colectorA;
    $('selColectorC').value = config.colectorC;
    $('selCarcasa').value = config.carcasa;
    $('selForma').value = config.forma;
    $('selPerfilUso').value = config.perfilUso;
    $('selChip').value = config.chip;
    $('selMetodo').value = config.metodoFabricacion;

    $('selDispositivo').value = config.dispositivo;
    const modoActual = config.modoAutonomia ? 'autonomia' : (config.modoObjetivo ? 'capacidad' : 'libre');
    document.querySelectorAll('#pillModo .pill').forEach(p => p.classList.toggle('active', p.dataset.modo === modoActual));
    $('fieldCapacidadObjetivo').hidden = modoActual !== 'capacidad';
    $('fieldAutonomiaObjetivo').hidden = modoActual !== 'autonomia';
    const espesorBloqueado = modoActual !== 'libre';
    $('fieldEspesor').style.opacity = espesorBloqueado ? 0.45 : 1;
    $('rngEspesor').disabled = espesorBloqueado;
    $('rngCapacidadObjetivo').value = config.capacidadObjetivoMah;
    $('rngAutonomiaObjetivo').value = config.autonomiaObjetivoH;

    $('rngLargo').value = config.largoMm;
    $('rngAncho').value = config.anchoMm;
    $('rngEspesor').value = config.espesorMm;
    $('rngNumCeldas').value = config.numCeldas;
    $('rngNumCapas').value = config.numCapas;
    $('rngNRatio').value = config.nRatio;
    $('rngVelCarga').value = config.velocidadCargaC;
    $('rngVelDescarga').value = config.velocidadDescargaC;
    $('rngDoD').value = config.cicloDoD;
    $('rngPresion').value = config.presionKpa;
    $('rngTempMin').value = config.tempOperMin;
    $('rngTempMax').value = config.tempOperMax;

    updateSliderLabels();
    $('descTipoBateria').textContent = BATTERY_TYPES[config.tipo].descripcion;
    $('descChip').textContent = CHIPSETS[config.chip].descripcion;
  }

  function updateSliderLabels() {
    $('valCapacidadObjetivo').textContent = fmtInt(config.capacidadObjetivoMah) + ' mAh';
    $('valAutonomiaObjetivo').textContent = fmt(config.autonomiaObjetivoH, 1) + ' h';
    $('valLargo').textContent = fmt(config.largoMm, 0) + ' mm';
    $('valAncho').textContent = fmt(config.anchoMm, 0) + ' mm';
    $('valEspesor').textContent = fmt(config.espesorMm, 2) + ' mm';
    $('valNumCeldas').textContent = config.numCeldas;
    $('valNumCapas').textContent = config.numCapas;
    $('valNRatio').textContent = fmt(config.nRatio, 2);
    $('valVelCarga').textContent = fmt(config.velocidadCargaC, 1) + 'C';
    $('valVelDescarga').textContent = fmt(config.velocidadDescargaC, 1) + 'C';
    $('valDoD').textContent = fmt(config.cicloDoD, 0) + '%';
    $('valPresion').textContent = fmtInt(config.presionKpa) + ' kPa';
    $('valTempMin').textContent = fmt(config.tempOperMin, 0) + '°C';
    $('valTempMax').textContent = fmt(config.tempOperMax, 0) + '°C';
    const anodoM = Sim.getMaterial('anodo', config.anodo, config);
    const catodoM = Sim.getMaterial('catodo', config.catodo, config);
    $('tagAnodo').innerHTML = anodoM ? `<span class="material-tag ${anodoM.tipo || 'comercial'}">${anodoM.tipo || 'comercial'}</span>` : '';
    $('tagCatodo').innerHTML = catodoM ? `<span class="material-tag ${catodoM.tipo || 'comercial'}">${catodoM.tipo || 'comercial'}</span>` : '';
  }

  /* ============================================================
     LECTURA DE CONFIG DESDE LA UI
     ============================================================ */
  function readUIIntoConfig() {
    config.tipo = $('selTipoBateria').value;
    config.anodo = $('selAnodo').value;
    config.catodo = $('selCatodo').value;
    config.electrolito = $('selElectrolito').value;
    config.separador = $('selSeparador').value;
    config.colectorA = $('selColectorA').value;
    config.colectorC = $('selColectorC').value;
    config.carcasa = $('selCarcasa').value;
    config.forma = $('selForma').value;
    config.perfilUso = $('selPerfilUso').value;
    config.chip = $('selChip').value;
    config.dispositivo = $('selDispositivo').value;
    config.metodoFabricacion = $('selMetodo').value;

    config.capacidadObjetivoMah = parseFloat($('rngCapacidadObjetivo').value);
    config.autonomiaObjetivoH = parseFloat($('rngAutonomiaObjetivo').value);

    config.largoMm = parseFloat($('rngLargo').value);
    config.anchoMm = parseFloat($('rngAncho').value);
    if (!config.modoObjetivo && !config.modoAutonomia) config.espesorMm = parseFloat($('rngEspesor').value);
    config.numCeldas = parseInt($('rngNumCeldas').value, 10);
    config.numCapas = parseInt($('rngNumCapas').value, 10);
    config.nRatio = parseFloat($('rngNRatio').value);
    config.velocidadCargaC = parseFloat($('rngVelCarga').value);
    config.velocidadDescargaC = parseFloat($('rngVelDescarga').value);
    config.cicloDoD = parseFloat($('rngDoD').value);
    config.presionKpa = parseFloat($('rngPresion').value);
    config.tempOperMin = parseFloat($('rngTempMin').value);
    config.tempOperMax = parseFloat($('rngTempMax').value);
  }

  function resolverEspesorObjetivo(cfg) {
    const probe = Object.assign({}, cfg, { espesorMm: 10 });
    const rProbe = Sim.calcular(probe);
    if (!rProbe.capacidadTotalMah || rProbe.capacidadTotalMah <= 0) return cfg.espesorMm || 5;
    let espesorMm = (cfg.capacidadObjetivoMah / rProbe.capacidadTotalMah) * 10;
    return Math.max(1.5, Math.min(14, espesorMm));
  }

  /* Calcula los mAh necesarios para lograr una autonomía objetivo (horas), dado el
     perfil de uso, chip y dispositivo elegidos. Hace un segundo pase usando la
     eficiencia real que resulta del diseño (resistencia interna, electrolito, etc.)
     para que el resultado sea preciso y no una simple regla de tres teórica. */
  function resolverCapacidadParaAutonomia(cfg, horasObjetivo) {
    const anodo = Sim.getMaterial('anodo', cfg.anodo, cfg);
    const catodo = Sim.getMaterial('catodo', cfg.catodo, cfg);
    const voltaje = Math.max(0.5, catodo.voltajeVsLi - anodo.voltajeVsLi);
    const perfil = PERFILES_USO[cfg.perfilUso] || PERFILES_USO.medio;
    const dispositivo = DISPOSITIVOS[cfg.dispositivo] || DISPOSITIVOS.telefono;
    const chip = CHIPSETS[cfg.chip] || CHIPSETS.snapdragon_7;
    const consumoW = perfil.consumoW * dispositivo.consumoFactorDispositivo * chip.consumoFactor;

    let eficiencia = 0.90;
    let mah = (horasObjetivo * consumoW * 1000) / (voltaje * eficiencia);

    // Segundo pase: con esa mAh estimada, calculamos el diseño real y leemos su
    // eficiencia y riesgo térmico verdaderos para refinar el resultado.
    const probe = Object.assign({}, cfg, { capacidadObjetivoMah: mah });
    probe.espesorMm = resolverEspesorObjetivo(probe);
    const rProbe = Sim.calcular(probe);
    eficiencia = rProbe.eficienciaDescarga / 100;
    mah = (horasObjetivo * consumoW * 1000) / (voltaje * eficiencia);
    return Math.max(300, Math.round(mah));
  }

  /* ============================================================
     RECÁLCULO Y RENDER
     ============================================================ */
  function renderTelefonoInfo(r) {
    $('telefonoNecesario').innerHTML =
      `<svg width="13" height="13" style="vertical-align:-2px;margin-right:4px"><use href="#icon-target"/></svg>` +
      `Para que esta celda quepa, el/la ${r.dispositivo.nombre.toLowerCase()} necesitaría medir aproximadamente ` +
      `<b class="mono">${fmt(r.telLargoMm, 0)} × ${fmt(r.telAnchoMm, 0)} × ${fmt(r.telEspesorMm, 1)} mm</b> ` +
      `— pantalla estimada de <b class="mono">${fmt(r.diagonalPulgadas, 2)}"</b>.`;
  }

  function clampNum(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function optimizarParaTelefono() {
    const disp = DISPOSITIVOS[config.dispositivo] || DISPOSITIVOS.telefono;
    const target = disp.tamanos[$('selPhoneTarget').value];
    if (!target) return;
    config.largoMm = clampNum(target.largoMm * disp.factorLargo, 50, 400);
    config.anchoMm = clampNum(target.anchoMm * disp.factorAncho, 30, 280);
    if (!config.modoObjetivo && !config.modoAutonomia) {
      config.espesorMm = clampNum(target.espesorMm - disp.overheadEspesorMm, 2, 12);
    }
    syncUIFromConfig();
    recalcular();
  }

  function recalcular() {
    if (config.modoAutonomia) {
      try {
        config.capacidadObjetivoMah = resolverCapacidadParaAutonomia(config, config.autonomiaObjetivoH);
        $('valCapacidadObjetivo').textContent = fmtInt(config.capacidadObjetivoMah) + ' mAh (calculado)';
      } catch (e) { console.error('Error calculando capacidad para autonomía objetivo:', e); }
    }
    if (config.modoObjetivo || config.modoAutonomia) {
      try {
        config.espesorMm = resolverEspesorObjetivo(config);
        $('valEspesor').textContent = fmt(config.espesorMm, 2) + ' mm (calculado)';
      } catch (e) { console.error('Error calculando espesor objetivo:', e); }
    }

    try {
      results = Sim.calcular(config);
    } catch (e) {
      console.error('Error crítico en el motor de simulación (Sim.calcular):', e);
      results = null;
    }
    if (!results) return; // sin resultados no hay nada que pintar; el resto de la UI conserva su último estado válido

    let alerts = [];
    try { alerts = Sim.advertencias(config, results); } catch (e) { console.error('Error calculando advertencias:', e); }

    const pasos = [
      ['ticker', () => renderTicker(results)],
      ['teléfono necesario', () => renderTelefonoInfo(results)],
      ['panel de control', () => renderDashboard(results)],
      ['autonomía por perfil', () => renderAutonomyBreakdown(results)],
      ['medidores', () => renderGauges(results)],
      ['advertencias', () => renderAlerts(alerts)],
      ['gráficas', () => renderCharts(results)],
      ['comparador', () => renderComparator(results)],
      ['visor 3D', () => Viewer3D.rebuild(config, results)]
    ];
    pasos.forEach(([nombre, fn]) => {
      try { fn(); } catch (e) { console.error('Error renderizando "' + nombre + '":', e); }
    });
  }

  function riskDot(cat) {
    if (cat === 'Muy bajo' || cat === 'Bajo') return 'safe';
    if (cat === 'Moderado') return 'warn';
    return 'danger';
  }

  function renderTicker(r) {
    const dotClass = riskDot(r.categoriaRiesgo);
    $('ticker').innerHTML = `
      <div class="ticker-item"><span class="val copper mono">${fmt(r.voltajeNominal, 2)}</span><span class="lbl">V nominal</span></div>
      <div class="ticker-item"><span class="val mono">${fmtInt(r.capacidadTotalMah)}</span><span class="lbl">mAh</span></div>
      <div class="ticker-item"><span class="val ion mono">${fmt(r.energiaWh, 1)}</span><span class="lbl">Wh</span></div>
      <div class="ticker-item"><span class="val mono">${fmt(r.temperaturaOperacionC, 0)}°C</span><span class="lbl">en uso</span></div>
      <div class="ticker-item"><span class="dot ${dotClass}"></span><span class="val mono" style="font-size:12px">${r.categoriaRiesgo}</span><span class="lbl">seguridad</span></div>
    `;
  }

  function metricCard(icon, cls, label, value, unit, sub) {
    return `<div class="metric-card ${cls || ''}">
      <div class="metric-icon"><svg><use href="#${icon}"/></svg></div>
      <div class="metric-label">${label}</div>
      <div class="metric-value">${value}<span class="unit">${unit || ''}</span></div>
      ${sub ? `<div class="metric-sub">${sub}</div>` : ''}
    </div>`;
  }

  function renderDashboard(r) {
    $('dashGrid').innerHTML = [
      metricCard('icon-battery', '', 'Capacidad final', fmtInt(r.capacidadTotalMah), 'mAh', 'Limitada por ' + r.limitante),
      metricCard('icon-zap', 'copper', 'Voltaje nominal', fmt(r.voltajeNominal, 2), 'V'),
      metricCard('icon-cpu', '', 'Energía', fmt(r.energiaWh, 2), 'Wh'),
      metricCard('icon-layers', 'ion', 'Densidad energética', fmtInt(r.densidadEnergeticaWhL), 'Wh/L', fmtInt(r.densidadEnergeticaWhKg) + ' Wh/kg'),
      metricCard('icon-gauge', '', 'Densidad de potencia', fmtInt(r.densidadPotenciaWKg), 'W/kg'),
      metricCard('icon-package', '', 'Peso total', fmt(r.masaTotalG, 1), 'g'),
      metricCard('icon-box', '', 'Volumen ocupado', fmt(r.geometria.volumenTotalCm3, 2), 'cm³', r.caberEnTelefono ? 'Cabe en un smartphone típico' : 'Excede el hueco típico (~' + r.volumenTipicoTelefono + ' cm³)'),
      metricCard('icon-target', 'ion', 'Teléfono necesario', fmt(r.telLargoMm, 0) + '×' + fmt(r.telAnchoMm, 0), 'mm', fmt(r.diagonalPulgadas, 1) + '" de pantalla · ' + fmt(r.telEspesorMm, 1) + ' mm de grosor'),
      metricCard('icon-battery', 'safe', 'Autonomía estimada', fmtHorasMin(r.autonomiaH), '', 'Uso ' + r.perfil.nombre.split('(')[0].trim().toLowerCase()),
      metricCard('icon-zap', 'copper', 'Tiempo de carga', fmt(r.tiempoCargaH, 1), 'h', fmt(config.velocidadCargaC, 1) + 'C'),
      metricCard('icon-wind', '', 'Resistencia interna', fmt(r.resistenciaInternaMOhm, 0), 'mΩ'),
      metricCard('icon-thermo', r.riesgoSobrecalentamiento === 'alto' ? 'danger' : (r.riesgoSobrecalentamiento === 'medio' ? 'warn' : 'safe'), 'Temperatura en uso', fmt(r.temperaturaOperacionC, 1), '°C', 'Riesgo de sobrecalentamiento: ' + r.riesgoSobrecalentamiento),
      metricCard('icon-dollar', '', 'Coste de fabricación', '$' + fmt(r.costoFabricacionUSD, 2), '', 'por celda'),
      metricCard('icon-atom', '', 'Corriente máx. descarga', fmt(r.corrienteMaxDescargaA, 2), 'A'),
      metricCard('icon-leaf', r.categoriaImpacto === 'Alto' ? 'warn' : 'safe', 'Impacto ambiental', r.categoriaImpacto, '', 'score ' + fmtInt(r.impacto) + '/100')
    ].join('');
  }

  function gaugeCircle(percent, colorVar, id) {
    const r36 = 36, c = 2 * Math.PI * r36;
    const offset = c - (Math.max(0, Math.min(100, percent)) / 100) * c;
    return `<svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r="${r36}" fill="none" stroke="var(--border)" stroke-width="8"/>
      <circle cx="44" cy="44" r="${r36}" fill="none" stroke="${colorVar}" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
    </svg>`;
  }

  function gaugeCard(label, percent, valueText, statusText, statusClass, colorVar) {
    return `<div class="gauge-card">
      <div class="gauge-ring">${gaugeCircle(percent, colorVar)}<div class="gauge-val">${valueText}</div></div>
      <div class="gauge-label">${label}</div>
      <div class="gauge-status" style="color:${statusClass}">${statusText}</div>
    </div>`;
  }

  function renderGauges(r) {
    const safeColor = getComputedStyle(document.body).getPropertyValue('--safe').trim() || '#4CAF7D';
    const warnColor = getComputedStyle(document.body).getPropertyValue('--warn').trim() || '#E8A83D';
    const dangerColor = getComputedStyle(document.body).getPropertyValue('--danger').trim() || '#E5534B';
    const ionColor = getComputedStyle(document.body).getPropertyValue('--ion').trim() || '#4DD4E8';
    const copperColor = getComputedStyle(document.body).getPropertyValue('--copper').trim() || '#C77B45';

    const segColor = (pct) => pct > 66 ? safeColor : (pct > 35 ? warnColor : dangerColor);

    const vidaPct = Math.min(100, (r.ciclosVida / 1500) * 100);
    $('gaugeGrid').innerHTML = [
      gaugeCard('Nivel de seguridad', r.nivelSeguridad, Math.round(r.nivelSeguridad), r.categoriaRiesgo, segColor(r.nivelSeguridad), segColor(r.nivelSeguridad)),
      gaugeCard('Vida útil', vidaPct, r.ciclosVida, r.ciclosVida + ' ciclos', segColor(vidaPct), segColor(vidaPct)),
      gaugeCard('Rendimiento', r.rendimiento, Math.round(r.rendimiento), Math.round(r.rendimiento) + '/100', copperColor, copperColor),
      gaugeCard('Eficiencia', r.eficienciaDescarga, fmt(r.eficienciaDescarga, 0) + '%', 'ida y vuelta', ionColor, ionColor),
      gaugeCard('Sostenibilidad', 100 - r.impacto, Math.round(100 - r.impacto), r.categoriaImpacto + ' impacto', segColor(100 - r.impacto), segColor(100 - r.impacto))
    ].join('');
  }

  function renderAutonomyBreakdown(r) {
    const perfiles = autonomiaPorPerfil(r);
    $('autonomyBreakdown').innerHTML = perfiles.map(p => `
      <div class="gauge-card">
        <div class="metric-icon" style="margin-bottom:8px"><svg width="20" height="20"><use href="#icon-battery"/></svg></div>
        <div class="mono" style="font-size:19px;font-weight:700;${p.nombre === r.perfil.nombre ? 'color:var(--copper-bright)' : ''}">${fmtHorasMin(p.horas)}</div>
        <div class="gauge-label" style="margin-top:6px">${p.nombre}</div>
      </div>
    `).join('');
  }

  function renderAlerts(alerts) {
    const iconFor = { error: 'icon-alert-circ', advertencia: 'icon-alert-tri', info: 'icon-info' };
    if (alerts.length === 0) {
      $('alertList').innerHTML = `<div class="alert-item info"><svg><use href="#icon-info"/></svg>No se detectan advertencias de diseño relevantes con la configuración actual.</div>`;
      return;
    }
    $('alertList').innerHTML = alerts.map(a => `<div class="alert-item ${a.nivel}"><svg><use href="#${iconFor[a.nivel]}"/></svg><span>${a.texto}</span></div>`).join('');
  }

  /* ============================================================
     GRÁFICAS SVG
     ============================================================ */
  function svgPath(points) {
    return points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  }

  function lineChartSVG(dataPoints, opts) {
    const W = 300, H = 150, PAD = 26;
    const xs = dataPoints.map(p => p[0]), ys = dataPoints.map(p => p[1]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = opts.yMin !== undefined ? opts.yMin : Math.min(...ys);
    const yMax = opts.yMax !== undefined ? opts.yMax : Math.max(...ys);
    const sx = v => PAD + ((v - xMin) / (xMax - xMin || 1)) * (W - PAD * 2);
    const sy = v => (H - PAD) - ((v - yMin) / (yMax - yMin || 1)) * (H - PAD * 2 - 10);
    const pts = dataPoints.map(p => [sx(p[0]), sy(p[1])]);
    const areaPts = [[pts[0][0], H - PAD], ...pts, [pts[pts.length - 1][0], H - PAD]];
    return `<svg viewBox="0 0 ${W} ${H}">
      <line x1="${PAD}" y1="${H - PAD}" x2="${W - 8}" y2="${H - PAD}" stroke="var(--border)" stroke-width="1"/>
      <line x1="${PAD}" y1="10" x2="${PAD}" y2="${H - PAD}" stroke="var(--border)" stroke-width="1"/>
      <path d="${svgPath(areaPts)} Z" fill="${opts.color}" opacity="0.12"/>
      <path d="${svgPath(pts)}" fill="none" stroke="${opts.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${PAD}" y="10" fill="var(--text-tertiary)" font-size="9" font-family="var(--font-mono)">${opts.yLabel || ''}</text>
      <text x="${W - 8}" y="${H - 6}" fill="var(--text-tertiary)" font-size="9" text-anchor="end" font-family="var(--font-mono)">${opts.xLabel || ''}</text>
    </svg>`;
  }

  function barChartSVG(items, color) {
    const W = 300, H = 150, PAD = 8, gap = 8;
    const max = Math.max(...items.map(i => i.value), 0.0001);
    const bw = (W - PAD * 2 - gap * (items.length - 1)) / items.length;
    let bars = '';
    items.forEach((it, i) => {
      const h = (it.value / max) * (H - 34);
      const x = PAD + i * (bw + gap);
      const y = H - 24 - h;
      bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${color}" opacity="${0.55 + 0.45 * (it.value / max)}"/>`;
      bars += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 10}" fill="var(--text-tertiary)" font-size="8" text-anchor="middle" font-family="var(--font-mono)">${it.label}</text>`;
      bars += `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" fill="var(--text-secondary)" font-size="8.5" text-anchor="middle" font-family="var(--font-mono)">$${it.value.toFixed(2)}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}">${bars}</svg>`;
  }

  function chartCard(title, note, svg) {
    return `<div class="chart-card"><h4>${title}</h4><div class="chart-note">${note}</div>${svg}</div>`;
  }

  function renderCharts(r) {
    const copperColor = getComputedStyle(document.body).getPropertyValue('--copper-bright').trim() || '#E3985E';
    const ionColor = getComputedStyle(document.body).getPropertyValue('--ion').trim() || '#4DD4E8';
    const safeColor = getComputedStyle(document.body).getPropertyValue('--safe').trim() || '#4CAF7D';

    const cargaPts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const soc = t < 0.7 ? (t / 0.7) * 80 : 80 + 20 * (1 - Math.exp(-(t - 0.7) / 0.15));
      cargaPts.push([t * r.tiempoCargaH, Math.min(100, soc)]);
    }
    const chCarga = lineChartSVG(cargaPts, { color: copperColor, yLabel: 'SOC %', xLabel: 'horas', yMin: 0, yMax: 100 });

    const descPts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      let v = r.voltajeNominal * (1.09 - 0.09 * t);
      if (t > 0.85) v -= r.voltajeNominal * (t - 0.85) * 1.8;
      descPts.push([t * 100, v]);
    }
    const chDescarga = lineChartSVG(descPts, { color: ionColor, yLabel: 'V', xLabel: '% descargado', yMin: r.voltajeNominal * 0.55, yMax: r.voltajeNominal * 1.12 });

    const degPts = [];
    const k = r.ciclosVida / Math.log(100 / 80);
    for (let i = 0; i <= 20; i++) {
      const n = i / 20 * r.ciclosVida * 1.3;
      degPts.push([n, 100 * Math.exp(-n / k)]);
    }
    const chDeg = lineChartSVG(degPts, { color: safeColor, yLabel: 'Capacidad %', xLabel: 'ciclos', yMin: 50, yMax: 100 });

    const costItems = [
      { label: 'Ánodo', value: r.costoAnodo }, { label: 'Cátodo', value: r.costoCatodo },
      { label: 'Colect.', value: r.costoColectores }, { label: 'Separ.', value: r.costoSeparador },
      { label: 'Electr.', value: r.costoElectrolito }, { label: 'Carcasa', value: r.costoCarcasa }
    ];
    const chCosto = barChartSVG(costItems, copperColor);

    $('chartsWrap').innerHTML =
      chartCard('Curva de carga', 'Estado de carga (SOC) estimado durante la carga CC-CV', chCarga) +
      chartCard('Curva de descarga', 'Voltaje de celda frente al porcentaje descargado, a la velocidad de descarga configurada', chDescarga) +
      chartCard('Degradación por ciclos', 'Capacidad relativa estimada hasta el fin de vida convencional (80%)', chDeg) +
      chartCard('Desglose de coste', 'Coste de material estimado por componente ($ / celda)', chCosto);
  }

  /* ============================================================
     COMPARADOR
     ============================================================ */
  function metricLabelUnit(key) {
    return { densidadEnergeticaWhL: ['Densidad energética', 'Wh/L'], mah: ['Capacidad', 'mAh'], autonomiaH: ['Autonomía', 'h'], cargaW: ['Carga', 'W'], pesoCeldaG: ['Peso', 'g'] }[key];
  }
  function designMetricValue(key, r) {
    if (key === 'mah') return r.capacidadTotalMah;
    if (key === 'densidadEnergeticaWhL') return r.densidadEnergeticaWhL;
    if (key === 'autonomiaH') return r.autonomiaH;
    if (key === 'cargaW') return r.corrienteMaxCargaA * r.voltajeNominal;
    if (key === 'pesoCeldaG') return r.masaTotalG;
  }

  function renderYourDesignSummary(r) {
    $('yourDesignSummary').innerHTML = `
      <div style="font-size:13px;font-weight:600;margin-bottom:4px">${r.tipoBat.nombre}</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px">${r.materiales.anodo.nombre} · ${r.materiales.catodo.nombre}</div>
      <div class="mono" style="font-size:12px;color:var(--copper-bright)">${fmtInt(r.capacidadTotalMah)} mAh · ${fmtInt(r.densidadEnergeticaWhL)} Wh/L · ${fmtHorasMin(r.autonomiaH)}</div>
    `;
  }

  function renderComparator(r) {
    renderYourDesignSummary(r);
    const key = $('selCompareMetric').value;
    const [label, unit] = metricLabelUnit(key);
    const designVal = designMetricValue(key, r);
    const all = PHONE_DATABASE.map(p => ({ marca: p.marca, modelo: p.modelo, quimica: p.quimica, val: p[key], esConcepto: p.esConcepto }));
    all.push({ marca: 'Tu diseño', modelo: r.tipoBat.nombre, quimica: r.materiales.catodo.nombre, val: designVal, mine: true });
    const max = Math.max(...all.map(a => a.val));
    all.sort((a, b) => b.val - a.val);
    $('phoneList').innerHTML = all.map(a => `
      <div class="phone-card" style="${a.mine ? 'border-color:var(--copper-dim);background:rgba(199,123,69,0.08)' : ''}">
        <div class="pc-top"><span class="pc-name">${a.mine ? '★ ' : ''}${a.modelo}</span><span class="pc-brand">${a.marca}${a.esConcepto ? ' · concepto' : ''}</span></div>
        <div class="bar-row">
          <span class="bar-label">${label}</span>
          <div class="bar-track"><div class="bar-fill ${a.mine ? 'mine' : ''}" style="width:${(a.val / max * 100).toFixed(1)}%"></div></div>
          <span class="bar-val mono">${unit === 'mAh' || unit === 'g' ? fmtInt(a.val) : fmt(a.val, unit === 'h' ? 1 : 0)} ${unit}</span>
        </div>
      </div>
    `).join('');
  }

  /* ============================================================
     ASISTENTE / CHAT
     ============================================================ */
  const CHIPS = [
    '¿Es seguro este diseño?', '¿Cómo reduzco el coste?', '¿Cómo gano autonomía sin subir mAh?',
    'Compárame con móviles reales', 'Sugiere mejoras', 'Explica el electrolito elegido'
  ];

  function addChatMessage(role, text) {
    const log = $('chatLog');
    const div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    if (role === 'bot') {
      div.innerHTML = `<div class="bot-label"><svg><use href="#icon-atom"/></svg>Asistente Battery Lab</div>${escapeHTML(text)}`;
    } else {
      div.textContent = text;
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
  function escapeHTML(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  function renderChips() {
    $('chatChips').innerHTML = CHIPS.map(c => `<button class="chip">${c}</button>`).join('');
    $('chatChips').querySelectorAll('.chip').forEach(btn => {
      btn.addEventListener('click', () => sendChat(btn.textContent));
    });
  }

  function sendChat(text) {
    if (!text || !text.trim()) return;
    addChatMessage('user', text);
    $('chatInput').value = '';
    setTimeout(() => {
      const respuesta = Assistant.responder(text, config, results);
      addChatMessage('bot', respuesta);
    }, 260);
  }

  /* ============================================================
     MATERIAL — INFO Y PERSONALIZADOS
     ============================================================ */
  const PROP_LABELS = {
    capacidadEspecifica: 'Capacidad específica', densidad: 'Densidad', voltajeVsLi: 'Voltaje vs Li/Li⁺',
    costoKg: 'Coste', estabilidadTermica: 'Estabilidad térmica (1-10)', factorCiclos: 'Factor de ciclos',
    expansion: 'Expansión volumétrica', conductividad: 'Conductividad (1-10)', contenidoCobalto: 'Contenido de cobalto',
    conductividadIonica: 'Conductividad iónica (1-10)', inflamabilidad: 'Inflamabilidad (0-10)', costoL: 'Coste',
    espesorUm: 'Espesor', temperaturaFusion: 'Temp. de fusión', resistenciaPerforacion: 'Resist. a perforación (1-10)',
    costoM2: 'Coste', conductividadElectrica: 'Conductividad eléctrica (1-10)', costoUnidad: 'Coste',
    proteccion: 'Protección mecánica (1-10)', flexibilidad: 'Flexibilidad (1-10)'
  };
  const PROP_UNITS = {
    capacidadEspecifica: ' mAh/g', densidad: ' g/cm³', voltajeVsLi: ' V', costoKg: ' $/kg',
    expansion: ' %', costoL: ' $/L', espesorUm: ' µm', temperaturaFusion: ' °C', costoM2: ' $/m²', costoUnidad: ' $'
  };

  function openMaterialInfo(categoria, id) {
    const m = Sim.getMaterial(categoria, id, config);
    $('miTitle').textContent = m.nombre;
    $('miDesc').textContent = m.descripcion || '';
    $('miTag').textContent = m.tipo || 'comercial';
    $('miTag').className = 'material-tag ' + (m.tipo || 'comercial');
    const propsHtml = Object.entries(m).filter(([k]) => PROP_LABELS[k]).map(([k, v]) => `
      <div><div style="color:var(--text-tertiary);font-size:10px">${PROP_LABELS[k]}</div><div class="mono" style="font-weight:600">${v}${PROP_UNITS[k] || ''}</div></div>
    `).join('');
    $('miProps').innerHTML = propsHtml;
    $('materialInfoModal').hidden = false;
  }

  const CUSTOM_FIELD_SCHEMA = {
    anodo: [
      ['capacidadEspecifica', 'Capacidad específica (mAh/g)', 50, 4200, 400],
      ['densidad', 'Densidad (g/cm³)', 0.3, 9, 2.2],
      ['voltajeVsLi', 'Voltaje vs Li/Li⁺ (V)', 0, 2, 0.15],
      ['costoKg', 'Coste ($/kg)', 1, 200, 20],
      ['estabilidadTermica', 'Estabilidad térmica (1-10)', 1, 10, 6],
      ['factorCiclos', 'Factor de ciclos (1.0 = estándar)', 0.2, 3, 1],
      ['expansion', 'Expansión volumétrica (%)', 0, 300, 10],
      ['conductividad', 'Conductividad (1-10)', 1, 10, 6]
    ],
    catodo: [
      ['capacidadEspecifica', 'Capacidad específica (mAh/g)', 50, 1700, 170],
      ['densidad', 'Densidad (g/cm³)', 1, 6, 4.5],
      ['voltajeVsLi', 'Voltaje vs Li/Li⁺ (V)', 2, 4.3, 3.8],
      ['costoKg', 'Coste ($/kg)', 5, 200, 30],
      ['estabilidadTermica', 'Estabilidad térmica (1-10)', 1, 10, 6],
      ['factorCiclos', 'Factor de ciclos (1.0 = estándar)', 0.2, 3, 1],
      ['conductividad', 'Conductividad (1-10)', 1, 10, 6]
    ],
    electrolito: [
      ['conductividadIonica', 'Conductividad iónica (1-10)', 1, 10, 7],
      ['inflamabilidad', 'Inflamabilidad (0-10)', 0, 10, 5],
      ['densidad', 'Densidad (g/cm³)', 0.8, 5, 1.2],
      ['costoL', 'Coste ($/L)', 3, 150, 15],
      ['estabilidadTermica', 'Estabilidad térmica (1-10)', 1, 10, 6]
    ],
    separador: [
      ['espesorUm', 'Espesor (µm)', 0, 40, 18],
      ['temperaturaFusion', 'Temperatura de fusión (°C)', 100, 999, 160],
      ['resistenciaPerforacion', 'Resist. a perforación (1-10)', 1, 10, 6],
      ['costoM2', 'Coste ($/m²)', 0, 20, 4],
      ['estabilidadTermica', 'Estabilidad térmica (1-10)', 1, 10, 6]
    ],
    colector: [
      ['densidad', 'Densidad (g/cm³)', 1, 10, 5],
      ['costoKg', 'Coste ($/kg)', 1, 50, 10],
      ['conductividadElectrica', 'Conductividad eléctrica (1-10)', 1, 10, 7],
      ['espesorUm', 'Espesor (µm)', 3, 20, 10]
    ],
    carcasa: [
      ['densidad', 'Densidad (g/cm³)', 0.8, 8, 2],
      ['costoUnidad', 'Coste ($/unidad)', 1, 20, 4],
      ['proteccion', 'Protección mecánica (1-10)', 1, 10, 6],
      ['flexibilidad', 'Flexibilidad (1-10)', 1, 10, 5]
    ]
  };

  let customModalCategoria = null;

  function openCustomMaterialModal(categoria) {
    customModalCategoria = categoria;
    $('cmTitle').textContent = 'Crear material personalizado — ' + categoria;
    $('cmNombre').value = '';
    $('cmDesc').value = '';
    const container = $('cmFields');
    container.innerHTML = '';
    CUSTOM_FIELD_SCHEMA[categoria].forEach(([key, label, min, max, def]) => {
      const div = document.createElement('div');
      div.className = 'field';
      div.innerHTML = `<label>${label}</label><input type="number" data-key="${key}" min="${min}" max="${max}" step="${(max - min) / 100 || 0.1}" value="${def}">`;
      container.appendChild(div);
    });
    if (categoria === 'catodo') {
      const div = document.createElement('div');
      div.className = 'field';
      div.innerHTML = `<label>Contenido de cobalto</label><select data-key="contenidoCobalto">
        <option value="ninguno">Ninguno</option><option value="bajo">Bajo</option><option value="medio" selected>Medio</option><option value="alto">Alto</option></select>`;
      container.appendChild(div);
    }
    if (categoria === 'carcasa') {
      const div = document.createElement('div');
      div.className = 'field';
      div.innerHTML = `<label>Acabado</label><select data-key="metalico">
        <option value="true">Metálico (aluminio, titanio, acero…)</option><option value="false" selected>No metálico (polímero, pouch…)</option></select>`;
      container.appendChild(div);
      const help = document.createElement('div');
      help.className = 'helptext';
      help.textContent = 'Esto controla cómo se ve la carcasa en el visor 3D: brillo metálico o acabado mate.';
      container.appendChild(help);
    }
    $('customMaterialModal').hidden = false;
  }

  function saveCustomMaterial() {
    const categoria = customModalCategoria;
    const nombre = $('cmNombre').value.trim() || 'Material personalizado';
    const id = 'custom_' + categoria + '_' + Date.now();
    const mat = { id, nombre, tipo: 'personalizado', descripcion: $('cmDesc').value.trim() || 'Material definido por el usuario.' };
    $('cmFields').querySelectorAll('[data-key]').forEach(el => {
      if (el.dataset.key === 'metalico') mat.metalico = el.value === 'true';
      else mat[el.dataset.key] = el.tagName === 'SELECT' ? el.value : parseFloat(el.value);
    });
    if (!config.materialesPersonalizados[categoria]) config.materialesPersonalizados[categoria] = {};
    config.materialesPersonalizados[categoria][id] = mat;

    const selMap = { anodo: 'selAnodo', catodo: 'selCatodo', electrolito: 'selElectrolito', separador: 'selSeparador', carcasa: 'selCarcasa' };
    if (selMap[categoria]) {
      fillMaterialSelect($(selMap[categoria]), categoria);
      $(selMap[categoria]).value = id;
      config[categoria] = id;
    } else if (categoria === 'colector') {
      fillMaterialSelect($('selColectorA'), 'colector');
      fillMaterialSelect($('selColectorC'), 'colector');
    }
    $('customMaterialModal').hidden = true;
    recalcular();
  }

  /* ============================================================
     EXPORTACIÓN
     ============================================================ */
  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function exportJSON() {
    const data = { proyecto: projectName, fecha: new Date().toISOString(), config, resumen: results ? Assistant.resumenDiseno(config, results) : '' };
    downloadBlob(JSON.stringify(data, null, 2), (projectName || 'battery-lab') + '.json', 'application/json');
  }

  function exportPDF() {
    if (!window.jspdf) { alert('No se pudo cargar el generador de PDF.'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const r = results;
    let y = 18;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('BATTERY LAB — Hoja técnica de diseño', 14, y); y += 6;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(projectName + '  ·  ' + new Date().toLocaleDateString('es-ES'), 14, y); y += 10;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Química y materiales', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const rows1 = [
      ['Tipo de batería', r.tipoBat.nombre],
      ['Ánodo', r.materiales.anodo.nombre], ['Cátodo', r.materiales.catodo.nombre],
      ['Electrolito', r.materiales.electrolito.nombre], ['Separador', r.materiales.separador.nombre],
      ['Colector ánodo', r.materiales.colectorA.nombre], ['Colector cátodo', r.materiales.colectorC.nombre],
      ['Carcasa', r.materiales.carcasa.nombre]
    ];
    rows1.forEach(([k, v]) => { doc.text(k + ':', 16, y); doc.text(String(v), 70, y); y += 5.5; });

    y += 4; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Resultados de la simulación', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const rows2 = [
      ['Capacidad', fmtInt(r.capacidadTotalMah) + ' mAh'], ['Voltaje nominal', fmt(r.voltajeNominal, 2) + ' V'],
      ['Energía', fmt(r.energiaWh, 2) + ' Wh'], ['Densidad energética', fmtInt(r.densidadEnergeticaWhL) + ' Wh/L · ' + fmtInt(r.densidadEnergeticaWhKg) + ' Wh/kg'],
      ['Peso total', fmt(r.masaTotalG, 1) + ' g'], ['Volumen', fmt(r.geometria.volumenTotalCm3, 2) + ' cm³'],
      ['Autonomía estimada', fmtHorasMin(r.autonomiaH) + ' (uso ' + r.perfil.nombre.split('(')[0].trim().toLowerCase() + ')'], ['Tiempo de carga', fmt(r.tiempoCargaH, 1) + ' h'],
      ['Resistencia interna', fmt(r.resistenciaInternaMOhm, 0) + ' mΩ'], ['Temperatura en uso', fmt(r.temperaturaOperacionC, 1) + ' °C'],
      ['Ciclos de vida', r.ciclosVida + ' ciclos'], ['Nivel de seguridad', r.categoriaRiesgo + ' (' + Math.round(r.nivelSeguridad) + '/100)'],
      ['Coste de fabricación', '$' + fmt(r.costoFabricacionUSD, 2)], ['Impacto ambiental', r.categoriaImpacto]
    ];
    rows2.forEach(([k, v]) => {
      if (y > 275) { doc.addPage(); y = 18; }
      doc.text(k + ':', 16, y); doc.text(String(v), 70, y); y += 5.5;
    });

    const alerts = Sim.advertencias(config, r);
    if (alerts.length) {
      y += 4; if (y > 265) { doc.addPage(); y = 18; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Advertencias de diseño', 14, y); y += 6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      alerts.forEach(a => {
        const lines = doc.splitTextToSize('• [' + a.nivel.toUpperCase() + '] ' + a.texto, 180);
        if (y + lines.length * 5 > 280) { doc.addPage(); y = 18; }
        doc.text(lines, 16, y); y += lines.length * 5 + 2;
      });
    }
    doc.save((projectName || 'battery-lab') + '.pdf');
  }

  function exportPNG() {
    const dataUrl = Viewer3D.screenshot();
    const a = document.createElement('a');
    a.href = dataUrl; a.download = (projectName || 'battery-lab') + '-3d.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  function shareLink() {
    const packed = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
    const url = location.origin + location.pathname + '#proj=' + packed;
    navigator.clipboard && navigator.clipboard.writeText(url).then(() => {
      alert('Enlace copiado al portapapeles. Cualquiera que lo abra verá este mismo diseño.');
    }).catch(() => { prompt('Copia este enlace:', url); });
    if (!navigator.clipboard) prompt('Copia este enlace:', url);
  }

  function loadFromHash() {
    const h = location.hash;
    if (h.startsWith('#proj=')) {
      try {
        const packed = h.slice(6);
        const obj = JSON.parse(decodeURIComponent(escape(atob(packed))));
        config = Object.assign(defaultConfig(), obj);
        return true;
      } catch (e) { console.warn('No se pudo leer el proyecto compartido', e); }
    }
    return false;
  }

  /* Envoltorio seguro: en archivos abiertos con file:// o en modo privado,
     localStorage puede lanzar SecurityError. Sin esto, un solo acceso fallido
     detenía init() por completo y dejaba toda la app en blanco. */
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  /* ============================================================
     PROYECTOS (localStorage)
     ============================================================ */
  function getProjects() {
    try { return JSON.parse(safeGet(STORAGE_PROJECTS) || '{}'); } catch (e) { return {}; }
  }
  function saveProjects(p) {
    if (!safeSet(STORAGE_PROJECTS, JSON.stringify(p))) {
      console.warn('No se pudo guardar el proyecto: almacenamiento local no disponible en este contexto (¿archivo abierto con file:// o modo privado?).');
    }
  }

  function saveCurrentAsVersion() {
    const nombre = prompt('Nombre para esta versión del proyecto:', projectName);
    if (!nombre) return;
    projectName = nombre;
    const projects = getProjects();
    projects[nombre] = { config, fecha: new Date().toISOString() };
    saveProjects(projects);
    renderProjectList();
  }

  function renderProjectList() {
    const projects = getProjects();
    const keys = Object.keys(projects);
    if (keys.length === 0) { $('projectList').innerHTML = `<div class="helptext">Todavía no has guardado ninguna versión.</div>`; return; }
    $('projectList').innerHTML = keys.map(name => `
      <div class="project-card">
        <div><div class="pj-name">${name}</div><div class="pj-meta">${new Date(projects[name].fecha).toLocaleString('es-ES')}</div></div>
        <div class="project-actions">
          <button class="icon-btn" data-load="${name}" title="Cargar"><svg><use href="#icon-folder"/></svg></button>
          <button class="icon-btn" data-del="${name}" title="Eliminar"><svg><use href="#icon-trash"/></svg></button>
        </div>
      </div>
    `).join('');
    $('projectList').querySelectorAll('[data-load]').forEach(b => b.addEventListener('click', () => {
      const projects = getProjects(); const p = projects[b.dataset.load];
      if (p) { config = Object.assign(defaultConfig(), p.config); projectName = b.dataset.load; syncAll(); }
    }));
    $('projectList').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      const projects = getProjects(); delete projects[b.dataset.del]; saveProjects(projects); renderProjectList();
    }));
  }

  function quickAutosave() {
    const projects = getProjects();
    projects['(autoguardado)'] = { config, fecha: new Date().toISOString() };
    saveProjects(projects);
    renderProjectList();
  }

  /* ============================================================
     TEMA
     ============================================================ */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $('btnTheme').innerHTML = `<svg><use href="#${theme === 'dark' ? 'icon-moon' : 'icon-sun'}"/></svg>`;
    safeSet(STORAGE_THEME, theme);
  }

  /* ============================================================
     NAVEGACIÓN (tabs, secciones colapsables, móvil)
     ============================================================ */
  function setupCollapsibles() {
    document.querySelectorAll('.cfg-header').forEach(h => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('open'));
    });
  }

  function setupStageTabs() {
    document.querySelectorAll('.stage-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.stage-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.stage-view').forEach(v => v.classList.remove('active'));
        btn.classList.add('active');
        const view = { '3d': 'view3d', dashboard: 'viewDashboard', charts: 'viewCharts' }[btn.dataset.stage];
        $(view).classList.add('active');
        if (btn.dataset.stage === '3d') setTimeout(() => Viewer3D.resize(), 20);
      });
    });
  }

  function setupRightTabs() {
    document.querySelectorAll('.right-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.right-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.right-view').forEach(v => v.classList.remove('active'));
        btn.classList.add('active');
        const view = { ia: 'viewAssistant', comparador: 'viewComparator', proyecto: 'viewProject' }[btn.dataset.rtab];
        $(view).classList.add('active');
      });
    });
  }

  function activateRightTab(name) {
    document.querySelector(`.right-tab[data-rtab="${name}"]`).click();
  }
  function activateStageTab(name) {
    document.querySelector(`.stage-tab[data-stage="${name}"]`).click();
  }

  function setupMobileTabs() {
    document.querySelectorAll('.mobile-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mobile-tabs button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const m = btn.dataset.mtab;

        $('panelLeft').classList.remove('mobile-visible');
        $('panelRight').classList.remove('mobile-visible');
        $('stageCentral').classList.remove('mobile-visible');

        if (m === 'diseno') {
          $('panelLeft').classList.add('mobile-visible');
        } else if (m === '3d' || m === 'dashboard' || m === 'charts') {
          $('stageCentral').classList.add('mobile-visible');
          activateStageTab(m);
        } else if (m === 'ia' || m === 'comparador') {
          $('panelRight').classList.add('mobile-visible');
          activateRightTab(m);
        }
        if (m === '3d' || m === 'dashboard' || m === 'charts') setTimeout(() => Viewer3D.resize(), 260);
      });
    });
  }

  /* ============================================================
     WIRING PRINCIPAL
     ============================================================ */
  function syncAll() {
    syncUIFromConfig();
    recalcular();
  }

  function setupEvents() {
    $('selTipoBateria').addEventListener('change', (e) => {
      const preset = BATTERY_TYPES[e.target.value];
      Object.assign(config, {
        tipo: preset.id, anodo: preset.anodo, catodo: preset.catodo, electrolito: preset.electrolito,
        separador: preset.separador, colectorA: preset.colector_a, colectorC: preset.colector_c, carcasa: preset.carcasa
      });
      syncAll();
    });

    ['selAnodo', 'selCatodo', 'selElectrolito', 'selSeparador', 'selColectorA', 'selColectorC', 'selCarcasa',
      'selForma', 'selPerfilUso', 'selMetodo', 'selChip'].forEach(id => {
      $(id).addEventListener('change', () => { readUIIntoConfig(); recalcular(); });
    });

    ['rngLargo', 'rngAncho', 'rngEspesor', 'rngNumCeldas', 'rngNumCapas', 'rngNRatio', 'rngVelCarga', 'rngVelDescarga',
      'rngDoD', 'rngPresion', 'rngTempMin', 'rngTempMax', 'rngCapacidadObjetivo', 'rngAutonomiaObjetivo'].forEach(id => {
      $(id).addEventListener('input', () => { readUIIntoConfig(); updateSliderLabels(); recalcular(); });
    });

    document.querySelectorAll('#pillModo .pill').forEach(p => {
      p.addEventListener('click', () => {
        const modo = p.dataset.modo;
        config.modoObjetivo = modo === 'capacidad';
        config.modoAutonomia = modo === 'autonomia';
        document.querySelectorAll('#pillModo .pill').forEach(x => x.classList.toggle('active', x === p));
        $('fieldCapacidadObjetivo').hidden = modo !== 'capacidad';
        $('fieldAutonomiaObjetivo').hidden = modo !== 'autonomia';
        const bloqueado = modo !== 'libre';
        $('fieldEspesor').style.opacity = bloqueado ? 0.45 : 1;
        $('rngEspesor').disabled = bloqueado;
        recalcular();
      });
    });

    $('selDispositivo').addEventListener('change', () => {
      config.dispositivo = $('selDispositivo').value;
      const disp = DISPOSITIVOS[config.dispositivo];
      config.numCeldas = disp.numCeldasSugerido;
      fillPhoneTargetSelect();
      syncUIFromConfig();
      recalcular();
    });

    document.querySelectorAll('[data-info]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.info;
        const idField = btn.dataset.infoId;
        let id;
        if (cat === 'colector') id = idField === 'anodo' ? config.colectorA : config.colectorC;
        else id = config[cat];
        openMaterialInfo(cat, id);
      });
    });
    document.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => openCustomMaterialModal(btn.dataset.add));
    });
    $('miClose').addEventListener('click', () => $('materialInfoModal').hidden = true);
    $('cmClose').addEventListener('click', () => $('customMaterialModal').hidden = true);
    $('cmCancel').addEventListener('click', () => $('customMaterialModal').hidden = true);
    $('cmSave').addEventListener('click', saveCustomMaterial);

    $('btnToggleRight').addEventListener('click', () => {
      const willOpen = !$('panelRight').classList.contains('open');
      $('panelRight').classList.toggle('open', willOpen);
      $('panelLeft').classList.remove('open');
      $('panelBackdrop').classList.toggle('show', willOpen);
    });
    $('panelBackdrop').addEventListener('click', () => {
      $('panelRight').classList.remove('open');
      $('panelLeft').classList.remove('open');
      $('panelBackdrop').classList.remove('show');
      document.querySelectorAll('.mobile-tabs button').forEach(b => b.classList.remove('active'));
    });

    $('btnOptimizarTelefono').addEventListener('click', optimizarParaTelefono);

    setupCollapsibles();
    setupStageTabs();
    setupRightTabs();
    setupMobileTabs();

    $('btnXray').addEventListener('click', () => {
      const on = !$('btnXray').classList.contains('active');
      $('btnXray').classList.toggle('active', on);
      Viewer3D.setXray(on);
    });
    let autoRot = false;
    $('btnAutoRotate').addEventListener('click', () => {
      autoRot = !autoRot;
      $('btnAutoRotate').classList.toggle('active', autoRot);
      Viewer3D.setAutoRotate(autoRot);
    });
    $('btnCapture3D').addEventListener('click', exportPNG);
    $('btnFlowDescarga').addEventListener('click', () => {
      $('btnFlowDescarga').classList.add('active'); $('btnFlowCarga').classList.remove('active');
      Viewer3D.setFlowMode('descarga');
    });
    $('btnFlowCarga').addEventListener('click', () => {
      $('btnFlowCarga').classList.add('active'); $('btnFlowDescarga').classList.remove('active');
      Viewer3D.setFlowMode('carga');
    });
    $('closeComponentInfo').addEventListener('click', () => $('componentInfo').hidden = true);

    $('chatSend').addEventListener('click', () => sendChat($('chatInput').value));
    $('chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat($('chatInput').value); });

    $('selCompareMetric').addEventListener('change', () => renderComparator(results));

    $('btnTheme').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });

    $('btnExportMenu').addEventListener('click', (e) => { e.stopPropagation(); $('exportMenu').hidden = !$('exportMenu').hidden; });
    document.addEventListener('click', () => { $('exportMenu').hidden = true; });
    $('expPdf').addEventListener('click', exportPDF);
    $('expJson').addEventListener('click', exportJSON);
    $('expPng').addEventListener('click', exportPNG);
    $('expShare').addEventListener('click', shareLink);
    $('btnExportPdf2').addEventListener('click', exportPDF);
    $('btnExportJson2').addEventListener('click', exportJSON);
    $('btnExportPng2').addEventListener('click', exportPNG);
    $('btnImportJson').addEventListener('click', () => $('fileImport').click());
    $('fileImport').addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          config = Object.assign(defaultConfig(), data.config || data);
          projectName = data.proyecto || 'Proyecto importado';
          syncAll();
        } catch (err) { alert('El archivo no es un proyecto válido de Battery Lab.'); }
      };
      reader.readAsText(file);
    });

    $('btnSave').addEventListener('click', quickAutosave);
    $('btnNewProjectVersion').addEventListener('click', saveCurrentAsVersion);

    window.addEventListener('hashchange', () => { if (loadFromHash()) syncAll(); });
  }

  /* ============================================================
     INICIALIZACIÓN
     ============================================================ */
  function init() {
    const savedTheme = safeGet(STORAGE_THEME) || 'dark';
    applyTheme(savedTheme);

    const sharedLoaded = loadFromHash();
    if (!sharedLoaded) {
      const projects = getProjects();
      if (projects['(autoguardado)']) config = Object.assign(defaultConfig(), projects['(autoguardado)'].config);
    }

    populateStaticSelects();
    syncUIFromConfig();

    try {
      Viewer3D.init($('viewerContainer'), {
        onInfoClick: (info) => {
          $('ciTag').textContent = info.tipo;
          $('ciTitle').textContent = info.titulo;
          $('ciText').textContent = info.texto;
          $('componentInfo').hidden = false;
        }
      });
    } catch (e) {
      console.error('No se pudo inicializar el visor 3D (¿el navegador no soporta WebGL?). El resto de la app sigue funcionando.', e);
      $('viewerContainer').innerHTML = '<div style="padding:20px;color:var(--text-secondary);font-size:12.5px">El visor 3D no se pudo iniciar en este navegador. El resto de la aplicación funciona con normalidad.</div>';
    }

    setupEvents();
    renderChips();
    addChatMessage('bot', 'Hola, soy el asistente técnico de Battery Lab. Puedo explicarte cualquier material, detectar errores de diseño, comparar tu celda con móviles reales y sugerirte mejoras de seguridad, coste o autonomía. Empieza preguntando o prueba una de las sugerencias.');
    renderProjectList();

    recalcular();
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      init();
    } catch (e) {
      console.error('Error crítico al iniciar Battery Lab:', e);
    }
  });
})();
