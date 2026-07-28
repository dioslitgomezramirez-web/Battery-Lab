/* ============================================================
   BATTERY LAB — Motor de simulación
   Modelo de ingeniería paramétrico. Combina geometría, densidad
   y capacidad específica de los materiales elegidos para estimar
   el comportamiento de la celda. Es un modelo educativo/de
   diseño conceptual, no un solver electroquímico de precisión
   de laboratorio.
   ============================================================ */

const Sim = (() => {

  function getMaterial(categoria, id, config) {
    if (config.materialesPersonalizados && config.materialesPersonalizados[categoria] &&
        config.materialesPersonalizados[categoria][id]) {
      return config.materialesPersonalizados[categoria][id];
    }
    return MATERIALS[categoria][id];
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function calcular(config) {
    const anodo = getMaterial('anodo', config.anodo, config);
    const catodo = getMaterial('catodo', config.catodo, config);
    const electrolito = getMaterial('electrolito', config.electrolito, config);
    const separador = getMaterial('separador', config.separador, config);
    const colectorA = getMaterial('colector', config.colectorA, config);
    const colectorC = getMaterial('colector', config.colectorC, config);
    const carcasa = getMaterial('carcasa', config.carcasa, config);
    const tipoBat = BATTERY_TYPES[config.tipo] || BATTERY_TYPES.personalizada;
    const perfil = PERFILES_USO[config.perfilUso] || PERFILES_USO.medio;
    const chip = CHIPSETS[config.chip] || CHIPSETS.snapdragon_7;
    const dispositivo = DISPOSITIVOS[config.dispositivo] || DISPOSITIVOS.telefono;
    const forma = FORMAS[config.forma] || FORMAS.prismatica;
    const metodo = METODOS_FABRICACION[config.metodoFabricacion] || METODOS_FABRICACION.apilado;

    const esSolido = electrolito.conductividadIonica !== undefined && electrolito.inflamabilidad <= 2;

    /* ---------- Geometría y volumen ---------- */
    const largoCm = config.largoMm / 10, anchoCm = config.anchoMm / 10, espesorCm = config.espesorMm / 10;
    const areaCm2 = largoCm * anchoCm;
    const volumenUnaCeldaCm3 = largoCm * anchoCm * espesorCm * forma.factorVolumen;
    const volumenTotalCm3 = volumenUnaCeldaCm3 * config.numCeldas;

    const numCapas = clamp(config.numCapas, 2, 60);

    const fracInactiva = clamp(0.05 + (numCapas - 10) * 0.0025, 0.05, 0.24);
    const fracElectrolito = esSolido ? 0.015 : 0.075;
    const fracCarcasa = clamp(0.015 + carcasa.proteccion * 0.004, 0.015, 0.06);
    const fracActiva = clamp(1 - fracInactiva - fracElectrolito - fracCarcasa, 0.35, 0.95);

    const volumenActivoTotalCm3 = volumenTotalCm3 * fracActiva;
    const volumenElectrolitoTotalCm3 = volumenTotalCm3 * fracElectrolito;
    const volumenCarcasaTotalCm3 = volumenTotalCm3 * fracCarcasa;

    const nRatio = config.nRatio || 1.1;

    // En una celda real, el ingeniero reparte el volumen entre ánodo y cátodo
    // precisamente para lograr la relación N/P deseada (no es un reparto fijo
    // 50/50). Calculamos la fracción de volumen de ánodo que igualaría esa
    // relación, limitada a un rango físicamente fabricable; si la química
    // exige más de lo que ese rango permite, la celda queda realmente
    // limitada por el ánodo y se advierte al usuario.
    const fracAnodoIdeal = (nRatio * catodo.densidad * catodo.capacidadEspecifica) /
      (anodo.densidad * anodo.capacidadEspecifica + nRatio * catodo.densidad * catodo.capacidadEspecifica);
    const fracAnodo = clamp(fracAnodoIdeal, 0.25, 0.75);

    const volAnodoCm3 = volumenActivoTotalCm3 * fracAnodo;
    const volCatodoCm3 = volumenActivoTotalCm3 * (1 - fracAnodo);

    // Un electrodo real no es material activo puro: ~30-40% de su volumen es porosidad
    // (impregnada de electrolito) más aglutinante y aditivo conductor. Este factor de
    // empaquetado calibra el modelo con la densidad energética volumétrica real de
    // celdas comerciales (~650-810 Wh/L en 2026) en vez de la densidad teórica del cristal.
    const EMPAQUETADO = 0.6;
    const masaAnodoG = volAnodoCm3 * anodo.densidad * EMPAQUETADO;
    const masaCatodoG = volCatodoCm3 * catodo.densidad * EMPAQUETADO;

    /* ---------- Capacidad y voltaje ---------- */
    const capacidadAnodoMah = masaAnodoG * anodo.capacidadEspecifica;
    const capacidadCatodoMah = masaCatodoG * catodo.capacidadEspecifica;
    const capacidadRequeridaAnodo = capacidadCatodoMah * nRatio;

    let capacidadTotalMah, limitante;
    if (capacidadAnodoMah >= capacidadRequeridaAnodo * 0.999) {
      capacidadTotalMah = capacidadCatodoMah;
      limitante = 'cátodo (diseño estándar)';
    } else {
      capacidadTotalMah = capacidadAnodoMah / nRatio;
      limitante = 'ánodo (relación N/P insuficiente)';
    }

    const voltajeNominal = Math.max(0.5, catodo.voltajeVsLi - anodo.voltajeVsLi);
    const energiaWh = (capacidadTotalMah / 1000) * voltajeNominal;

    /* ---------- Peso ---------- */
    const masaColectoresG = numCapas * config.numCeldas * areaCm2 *
      ((colectorA.espesorUm * 1e-4 * colectorA.densidad) + (colectorC.espesorUm * 1e-4 * colectorC.densidad));
    const masaSeparadorG = separador.espesorUm > 0
      ? numCapas * config.numCeldas * areaCm2 * (separador.espesorUm * 1e-4) * 1.0
      : 0;
    const masaElectrolitoG = volumenElectrolitoTotalCm3 * electrolito.densidad;
    const masaCarcasaG = volumenCarcasaTotalCm3 * carcasa.densidad;

    const masaTotalG = masaAnodoG + masaCatodoG + masaColectoresG + masaSeparadorG + masaElectrolitoG + masaCarcasaG;

    /* ---------- Densidad energética ---------- */
    const densidadEnergeticaWhKg = energiaWh / (masaTotalG / 1000);
    const densidadEnergeticaWhL = energiaWh / (volumenTotalCm3 / 1000);

    /* ---------- Resistencia interna y potencia ---------- */
    const presionKpa = config.presionKpa !== undefined ? config.presionKpa : 250;
    const factorPresion = 1 - clamp((presionKpa - 100) / 2000, 0, 0.15);
    const resistenciaInternaMOhm = clamp(
      ((55 * (10 / electrolito.conductividadIonica) * (separador.espesorUm > 0 ? separador.espesorUm / 18 : 0.6)) / Math.sqrt(numCapas)) * factorPresion,
      4, 900
    );

    const velocidadCargaC = clamp(config.velocidadCargaC, 0.1, 6);
    const velocidadDescargaC = clamp(config.velocidadDescargaC, 0.1, 8);

    const corrienteMaxCargaA = (capacidadTotalMah / 1000) * velocidadCargaC;
    const corrienteMaxDescargaA = (capacidadTotalMah / 1000) * velocidadDescargaC;
    const densidadPotenciaWKg = (voltajeNominal * corrienteMaxDescargaA) / (masaTotalG / 1000);

    /* ---------- Tiempos de carga / descarga y autonomía ---------- */
    const factorCV = esSolido ? 0.38 : (anodo.id === 'silicio_carbono' ? 0.18 : 0.25);
    const tiempoCargaH = (1 / velocidadCargaC) * (1 + factorCV);
    const tiempoDescargaContinuaH = (capacidadTotalMah / 1000) / corrienteMaxDescargaA;
    const eficienciaDescarga = clamp(97 - resistenciaInternaMOhm / 40 - (10 - electrolito.conductividadIonica) * 0.5, 68, 99);
    const autonomiaH = (energiaWh * (eficienciaDescarga / 100)) / (perfil.consumoW * chip.consumoFactor * dispositivo.consumoFactorDispositivo);

    /* ---------- Ciclos de vida ---------- */
    const pesoCiclosMateriales = (anodo.factorCiclos + catodo.factorCiclos) / 2;
    const dod = clamp(config.cicloDoD || 100, 20, 100);
    const factorDoD = clamp(100 / dod, 0.6, 2.6);
    const tempMax = config.tempOperMax !== undefined ? config.tempOperMax : 45;
    const factorTemp = tempMax <= 35 ? 1.15 : (tempMax <= 45 ? 1.0 : (tempMax <= 55 ? 0.8 : 0.55));
    const factorElectrolitoEstab = 0.7 + electrolito.estabilidadTermica * 0.05;
    const ciclosVida = Math.round(clamp(750 * pesoCiclosMateriales * factorDoD * factorTemp * factorElectrolitoEstab, 100, 20000));

    /* ---------- Térmico y seguridad ---------- */
    const calorGeneradoW = Math.pow(corrienteMaxDescargaA, 2) * (resistenciaInternaMOhm / 1000);
    const factorTermicoCarcasa = {
      bolsa_aluminio: 3.4, lata_aluminio: 2.0, lata_acero: 2.3, polimero_rigido: 4.1
    }[carcasa.id] || 3.2;
    const subidaTempC = calorGeneradoW * factorTermicoCarcasa;
    const temperaturaOperacionC = 25 + subidaTempC;

    let riesgoSobrecalentamiento;
    if (temperaturaOperacionC > tempMax) riesgoSobrecalentamiento = 'alto';
    else if (temperaturaOperacionC > tempMax * 0.85) riesgoSobrecalentamiento = 'medio';
    else riesgoSobrecalentamiento = 'bajo';

    let riesgoScore = 0;
    riesgoScore += electrolito.inflamabilidad * 3;
    riesgoScore += (10 - catodo.estabilidadTermica) * 3;
    riesgoScore += (10 - anodo.estabilidadTermica) * 1.5;
    riesgoScore += (10 - separador.estabilidadTermica) * 1.5;
    if (velocidadCargaC > tipoBat.cRateCargaMax * 1.2) riesgoScore += 18;
    if (temperaturaOperacionC > tempMax) riesgoScore += 16;
    if (anodo.id === 'litio_metalico' && !esSolido) riesgoScore += 22;
    if (presionKpa > carcasa.proteccion * 60) riesgoScore += clamp((presionKpa - carcasa.proteccion * 60) / 25, 0, 20);
    riesgoScore -= carcasa.proteccion * 1.8;
    riesgoScore = clamp(riesgoScore, 2, 100);

    let categoriaRiesgo;
    if (riesgoScore < 20) categoriaRiesgo = 'Muy bajo';
    else if (riesgoScore < 40) categoriaRiesgo = 'Bajo';
    else if (riesgoScore < 60) categoriaRiesgo = 'Moderado';
    else if (riesgoScore < 80) categoriaRiesgo = 'Alto';
    else categoriaRiesgo = 'Crítico';

    const nivelSeguridad = clamp(100 - riesgoScore, 0, 100);

    /* ---------- Coste ---------- */
    const costoAnodo = (masaAnodoG / 1000) * anodo.costoKg;
    const costoCatodo = (masaCatodoG / 1000) * catodo.costoKg;
    const costoColectores = (masaColectoresG / 1000) * ((colectorA.costoKg + colectorC.costoKg) / 2);
    const costoSeparador = separador.costoM2 > 0
      ? (numCapas * config.numCeldas * areaCm2 / 10000) * separador.costoM2
      : 0;
    const costoElectrolito = (masaElectrolitoG / electrolito.densidad / 1000) * electrolito.costoL;
    const costoCarcasa = carcasa.costoUnidad * config.numCeldas;
    const costoBase = costoAnodo + costoCatodo + costoColectores + costoSeparador + costoElectrolito + costoCarcasa;
    const costoFabricacionUSD = costoBase * metodo.costoFactor * 1.15;

    /* ---------- Rendimiento y eficiencia global ---------- */
    const rendimiento = clamp((densidadEnergeticaWhL / 9) + (eficienciaDescarga * 0.3) + (velocidadCargaC * 4), 0, 100);

    /* ---------- Impacto ambiental ---------- */
    let impacto = 28;
    impacto += { alto: 34, medio: 18, bajo: 8, ninguno: 0 }[catodo.contenidoCobalto] || 15;
    if (anodo.id === 'litio_metalico' || anodo.id.indexOf('carbono_duro') === -1 && anodo.id !== 'carbono_duro') impacto += 6;
    if (config.tipo === 'sodio_ion') impacto -= 20;
    if (carcasa.id === 'lata_aluminio' || carcasa.id === 'lata_acero') impacto -= 6; else impacto += 4;
    impacto = clamp(impacto, 5, 95);
    let categoriaImpacto = impacto < 30 ? 'Bajo' : (impacto < 60 ? 'Medio' : 'Alto');

    /* ---------- Espacio ---------- */
    const volumenTipicoTelefono = 22; // cm3 de referencia para un smartphone medio
    const caberEnTelefono = volumenTotalCm3 <= volumenTipicoTelefono * 1.15;

    /* ---------- Ajuste a teléfono: qué tamaño de teléfono necesita esta celda ---------- */
    const telLargoMm = config.largoMm / dispositivo.factorLargo;
    const telAnchoMm = config.anchoMm / dispositivo.factorAncho;
    const telEspesorMm = config.espesorMm + dispositivo.overheadEspesorMm;
    const pantallaAltoMm = Math.max(telLargoMm - 6, 10);
    const pantallaAnchoMm = Math.max(telAnchoMm - 6, 10);
    const diagonalPulgadas = Math.sqrt(pantallaAltoMm ** 2 + pantallaAnchoMm ** 2) / 25.4;

    return {
      materiales: { anodo, catodo, electrolito, separador, colectorA, colectorC, carcasa },
      tipoBat, perfil, chip, dispositivo, esSolido,
      geometria: { areaCm2, volumenTotalCm3, volumenUnaCeldaCm3, numCapas },
      capacidadAnodoMah, capacidadCatodoMah, capacidadTotalMah, limitante, nRatio,
      voltajeNominal, energiaWh,
      masaAnodoG, masaCatodoG, masaColectoresG, masaSeparadorG, masaElectrolitoG, masaCarcasaG, masaTotalG,
      densidadEnergeticaWhKg, densidadEnergeticaWhL,
      resistenciaInternaMOhm, corrienteMaxCargaA, corrienteMaxDescargaA, densidadPotenciaWKg,
      tiempoCargaH, tiempoDescargaContinuaH, autonomiaH, eficienciaDescarga,
      ciclosVida,
      temperaturaOperacionC, riesgoSobrecalentamiento, riesgoScore, categoriaRiesgo, nivelSeguridad,
      costoAnodo, costoCatodo, costoColectores, costoSeparador, costoElectrolito, costoCarcasa, costoFabricacionUSD,
      rendimiento, impacto, categoriaImpacto,
      caberEnTelefono, volumenTipicoTelefono, presionKpa,
      telLargoMm, telAnchoMm, telEspesorMm, diagonalPulgadas
    };
  }

  function advertencias(config, r) {
    const out = [];
    const push = (nivel, texto) => out.push({ nivel, texto });

    if (r.limitante.indexOf('ánodo') === 0 || r.limitante.indexOf('ánodo') > -1) {
      push('advertencia', `La capacidad está limitada por el ánodo: la relación N/P (${r.nRatio.toFixed(2)}) exige más material de ánodo del disponible. Aumenta el volumen de ánodo o reduce la relación N/P.`);
    }
    if (r.materiales.anodo.id === 'litio_metalico' && !r.esSolido) {
      push('error', 'El ánodo de litio metálico con un electrolito líquido o en gel favorece el crecimiento de dendritas que pueden perforar el separador y provocar un cortocircuito interno. Combínalo con un electrolito sólido.');
    }
    if (r.materiales.separador.id === 'ninguno_solido' && !r.esSolido) {
      push('error', 'Elegiste "sin separador", válido solo cuando el electrolito es sólido. Con el electrolito actual necesitas un separador físico entre electrodos.');
    }
    if (config.velocidadCargaC > r.tipoBat.cRateCargaMax * 1.2) {
      push('advertencia', `La velocidad de carga configurada (${config.velocidadCargaC.toFixed(1)}C) supera lo recomendado para esta química (${r.tipoBat.cRateCargaMax}C). Esto acelera la degradación y el riesgo térmico.`);
    }
    if (r.temperaturaOperacionC > (config.tempOperMax || 45)) {
      push('advertencia', `La temperatura estimada en uso (${r.temperaturaOperacionC.toFixed(1)}°C) supera el límite de operación configurado. Revisa la disipación de la carcasa o reduce la velocidad de descarga.`);
    }
    if (r.riesgoScore > 80) {
      push('error', 'El nivel de riesgo térmico/seguridad es crítico con esta combinación de materiales. No se recomienda para un producto de consumo real.');
    } else if (r.riesgoScore > 55) {
      push('advertencia', 'El nivel de riesgo es alto. Considera un cátodo o electrolito más estable térmicamente.');
    }
    if (!r.caberEnTelefono) {
      push('advertencia', `El volumen total (${r.geometria.volumenTotalCm3.toFixed(1)} cm³) es mayor que el hueco típico de batería de un smartphone (~${r.volumenTipicoTelefono} cm³). Reduce dimensiones o número de celdas.`);
    }
    if (r.densidadEnergeticaWhL < 350) {
      push('info', `La densidad energética volumétrica (${r.densidadEnergeticaWhL.toFixed(0)} Wh/L) queda por debajo del estándar de mercado actual (~650-810 Wh/L).`);
    }
    if (r.ciclosVida < 300) {
      push('advertencia', `La vida útil estimada (${r.ciclosVida} ciclos) es baja frente al estándar de un smartphone (500-1500 ciclos).`);
    }
    if (r.presionKpa > r.materiales.carcasa.proteccion * 60) {
      push('advertencia', `La presión interna configurada (${r.presionKpa} kPa) es alta para la protección mecánica de la carcasa elegida. Considera una carcasa más rígida o reducir la presión de diseño.`);
    }
    if (r.materiales.catodo.contenidoCobalto === 'alto') {
      push('info', 'El cátodo elegido tiene un contenido alto de cobalto, con mayor coste e impacto de minería asociado.');
    }
    return out;
  }

  return { calcular, advertencias, getMaterial };
})();
