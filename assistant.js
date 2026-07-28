/* ============================================================
   BATTERY LAB — Asistente de IA especializado en baterías
   Sistema experto basado en reglas que corre 100% en el
   navegador (sin conexión ni API externa), para que la app
   funcione de forma autónoma en cualquier hosting estático.
   ============================================================ */

const Assistant = (() => {

  function fmt(n, d = 1) { return Number(n).toFixed(d); }
  function fmtHorasMin(h) {
    const totalMin = Math.round(h * 60);
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    if (hh <= 0) return `${mm} min`;
    if (mm === 0) return `${hh} h`;
    return `${hh} h ${mm} min`;
  }

  function consejoEficiencia(config, r) {
    const partes = [];
    partes.push(`Tu diseño actual convierte el ${fmt(r.eficienciaDescarga, 0)}% de la energía en uso real (resistencia interna de ${fmt(r.resistenciaInternaMOhm, 0)} mΩ).`);
    if (r.eficienciaDescarga < 92) {
      partes.push(`Puedes subir la eficiencia sin tocar los mAh: más capas (${config.numCapas} ahora → prueba +6-8) reparten la corriente y bajan la resistencia interna, y un electrolito con mayor conductividad iónica también ayuda.`);
    } else {
      partes.push('La eficiencia ya está cerca del máximo práctico; ahí ya no hay mucho más margen sin cambiar de química.');
    }
    if (r.voltajeNominal < 3.8) {
      partes.push(`El voltaje nominal (${fmt(r.voltajeNominal, 2)} V) es mejorable: la energía (Wh) es mAh×V, así que un cátodo de mayor voltaje (NMC811 o NCA, ~3.85 V) te da más autonomía real con la MISMA capacidad en mAh.`);
    }
    if (r.riesgoSobrecalentamiento !== 'bajo') {
      partes.push('Además, bajar un poco la velocidad de descarga configurada reduce el calor generado (I²R), lo que a la vez mejora la eficiencia y evita perder capacidad utilizable por protección térmica.');
    }
    return partes.join(' ');
  }

  function recomendaciones(config, r) {
    const recs = [];

    if (r.categoriaRiesgo === 'Alto' || r.categoriaRiesgo === 'Crítico') {
      recs.push({
        area: 'Seguridad',
        texto: `El riesgo térmico es ${r.categoriaRiesgo.toLowerCase()}. Sugerencia: cambia el cátodo a LFP (mucha más estabilidad térmica) o el electrolito a una variante sólida, y usa un separador cerámico o de aramida.`
      });
    }
    if (r.costoFabricacionUSD > 7) {
      recs.push({
        area: 'Coste',
        texto: `El coste estimado (~$${fmt(r.costoFabricacionUSD, 2)}) es elevado. El cátodo y el electrolito suelen dominar el coste: prueba LFP o NMC622 en vez de NCA/LCO, y electrolito líquido en vez de sólido si la seguridad ya es adecuada.`
      });
    }
    if (r.autonomiaH < 18) {
      recs.push({
        area: 'Autonomía',
        texto: `La autonomía estimada (${fmtHorasMin(r.autonomiaH)} en uso medio) es baja. Puedes ganar autonomía aumentando el volumen de la celda, usando un ánodo de silicio-carbono, o subiendo la relación N/P para aprovechar mejor el cátodo.`
      });
    }
    if (r.densidadEnergeticaWhL < 550) {
      recs.push({
        area: 'Densidad energética',
        texto: `${fmt(r.densidadEnergeticaWhL, 0)} Wh/L queda por debajo del estándar 2026 (~700-810 Wh/L). Un ánodo de silicio-carbono junto a un cátodo NMC811 o NCA, con separador fino cerámico, es la combinación que usan los buques insignia actuales.`
      });
    }
    if (r.ciclosVida < 500) {
      recs.push({
        area: 'Vida útil',
        texto: `${r.ciclosVida} ciclos es corto para un smartphone (500-1500 es lo habitual). El LFP o reducir la profundidad de descarga (DoD) configurada alargan notablemente la vida útil.`
      });
    }
    if (r.categoriaImpacto === 'Alto') {
      recs.push({
        area: 'Sostenibilidad',
        texto: 'El diseño depende mucho del cobalto. Un cátodo NMC811 (menos cobalto), LFP o de sodio-ion reduce el impacto minero y el coste geopolítico del suministro.'
      });
    }
    if (config.velocidadCargaC > r.tipoBat.cRateCargaMax) {
      recs.push({
        area: 'Carga rápida',
        texto: `Estás pidiendo ${fmt(config.velocidadCargaC)}C de carga, por encima de lo típico para esta química (${r.tipoBat.cRateCargaMax}C). Los teléfonos con carga >90 W casi siempre usan ánodo de silicio-carbono, que tolera mejor la carga rápida.`
      });
    }
    recs.push({ area: 'Eficiencia (sin subir mAh)', texto: consejoEficiencia(config, r) });
    if (recs.length === 0) {
      recs.push({
        area: 'General',
        texto: 'El diseño está razonablemente equilibrado entre energía, seguridad y coste. Puedes seguir afinando parámetros individuales para acercarte a un objetivo concreto (más autonomía, menor coste, mayor seguridad...).'
      });
    }
    return recs;
  }

  function promedioComerciales() {
    const n = PHONE_DATABASE.length;
    const sum = PHONE_DATABASE.reduce((a, p) => ({
      mah: a.mah + p.mah, dens: a.dens + p.densidadEnergeticaWhL,
      carga: a.carga + p.cargaW, auto: a.auto + p.autonomiaH
    }), { mah: 0, dens: 0, carga: 0, auto: 0 });
    return { mah: sum.mah / n, dens: sum.dens / n, carga: sum.carga / n, auto: sum.auto / n };
  }

  function compararConComerciales(r) {
    const avg = promedioComerciales();
    const diffDens = ((r.densidadEnergeticaWhL - avg.dens) / avg.dens) * 100;
    const diffAuto = ((r.autonomiaH - avg.auto) / avg.auto) * 100;
    const mejor = PHONE_DATABASE.reduce((a, b) => b.densidadEnergeticaWhL > a.densidadEnergeticaWhL ? b : a);
    let texto = `Frente al promedio de los smartphones de referencia incluidos en el comparador (${fmt(avg.mah, 0)} mAh, ${fmt(avg.dens, 0)} Wh/L, ${fmt(avg.auto, 0)} h de autonomía típica):\n\n`;
    texto += `• Densidad energética: tu diseño está ${diffDens >= 0 ? 'un ' + fmt(Math.abs(diffDens), 0) + '% por encima' : 'un ' + fmt(Math.abs(diffDens), 0) + '% por debajo'} del promedio del mercado.\n`;
    texto += `• Autonomía estimada: ${diffAuto >= 0 ? fmt(Math.abs(diffAuto), 0) + '% más' : fmt(Math.abs(diffAuto), 0) + '% menos'} que el promedio, en un perfil de uso equivalente.\n`;
    texto += `• La referencia con mayor densidad energética del comparador es ${mejor.marca} ${mejor.modelo} (${mejor.densidadEnergeticaWhL} Wh/L, ${mejor.quimica}).`;
    return texto;
  }

  function explicarMaterial(categoria, id, config) {
    const m = Sim.getMaterial(categoria, id, config);
    if (!m) return 'No encuentro ese material en la base de datos.';
    return m.descripcion || `${m.nombre}: material personalizado sin descripción detallada.`;
  }

  function resumenDiseno(config, r) {
    return `Diseño actual: ${r.tipoBat.nombre} — ${r.materiales.anodo.nombre} / ${r.materiales.catodo.nombre} / ${r.materiales.electrolito.nombre}.\n` +
      `${fmt(r.capacidadTotalMah, 0)} mAh · ${fmt(r.voltajeNominal, 2)} V · ${fmt(r.energiaWh, 2)} Wh · ${fmt(r.densidadEnergeticaWhL, 0)} Wh/L · ${fmt(r.masaTotalG, 1)} g.\n` +
      `Seguridad: ${r.categoriaRiesgo} · Vida útil: ${r.ciclosVida} ciclos · Coste estimado: $${fmt(r.costoFabricacionUSD, 2)}.`;
  }

  function responder(pregunta, config, r) {
    const q = (pregunta || '').toLowerCase();

    const materialKeys = [
      ['grafito', 'anodo', 'grafito'], ['silicio-carbono', 'anodo', 'silicio_carbono'], ['silicio carbono', 'anodo', 'silicio_carbono'],
      ['silicio', 'anodo', 'silicio_puro'], ['litio metálico', 'anodo', 'litio_metalico'], ['litio metalico', 'anodo', 'litio_metalico'],
      ['carbono duro', 'anodo', 'carbono_duro'], ['lto', 'anodo', 'lto'], ['titanato', 'anodo', 'lto'],
      ['lco', 'catodo', 'lco'], ['cobalto', 'catodo', 'lco'], ['nmc622', 'catodo', 'nmc622'], ['nmc811', 'catodo', 'nmc811'],
      ['lfp', 'catodo', 'lfp'], ['fosfato', 'catodo', 'lfp'], ['nca', 'catodo', 'nca'], ['sodio', 'catodo', 'sodio_np'],
      ['azufre', 'catodo', 'azufre'],
      ['electrolito líquido', 'electrolito', 'liquido'], ['electrolito liquido', 'electrolito', 'liquido'],
      ['gel', 'electrolito', 'gel_polimero'], ['cerámico', 'electrolito', 'solido_ceramico'], ['ceramico', 'electrolito', 'solido_ceramico'],
      ['sulfurado', 'electrolito', 'solido_sulfurado'], ['polimérico', 'electrolito', 'solido_polimerico']
    ];
    for (const [kw, cat, id] of materialKeys) {
      if (q.includes(kw)) return explicarMaterial(cat, id, config);
    }

    if (/(sin (subir|aumentar).*(capacidad|mah)|eficient|sin engordar|sin agrandar)/.test(q)) {
      return consejoEficiencia(config, r);
    }
    if (/(coste|costo|precio|barat|caro)/.test(q)) {
      const recs = recomendaciones(config, r).filter(x => x.area === 'Coste' || x.area === 'General');
      return `Coste de fabricación estimado: $${fmt(r.costoFabricacionUSD, 2)} por celda.\n\n` +
        (recs.length ? recs.map(x => x.texto).join('\n\n') : 'Los costes están en un rango razonable para esta configuración.');
    }
    if (/(segur|peligr|explo|riesgo|incendi|fuga térmica|fuga termica)/.test(q)) {
      return `Nivel de seguridad estimado: ${r.categoriaRiesgo} (score de riesgo ${fmt(r.riesgoScore, 0)}/100).\n` +
        `Riesgo de sobrecalentamiento: ${r.riesgoSobrecalentamiento}. Temperatura estimada en uso: ${fmt(r.temperaturaOperacionC, 1)}°C.\n\n` +
        recomendaciones(config, r).filter(x => x.area === 'Seguridad').map(x => x.texto).join('\n') || 'No se detectan problemas de seguridad relevantes con esta combinación de materiales.';
    }
    if (/(autonom|dura|aguanta|carga rápida|carga rapida|tiempo de carga)/.test(q)) {
      return `Autonomía estimada (uso medio): ${fmtHorasMin(r.autonomiaH)}. Tiempo de carga estimado: ${fmt(r.tiempoCargaH, 1)} h.\n\n` +
        recomendaciones(config, r).filter(x => x.area === 'Autonomía' || x.area === 'Carga rápida').map(x => x.texto).join('\n');
    }
    if (/(compar|samsung|iphone|apple|xiaomi|oppo|vivo|honor|motorola|asus|sony|huawei|lynor|mercado|otros móviles|otros moviles)/.test(q)) {
      return compararConComerciales(r);
    }
    if (/(mejor|optimiza|óptim|recomienda|sugerenc|mejora)/.test(q)) {
      return recomendaciones(config, r).map(x => `[${x.area}] ${x.texto}`).join('\n\n');
    }
    if (/(ambiental|sosteni|ecológ|ecologic|cobalto|reciclaj)/.test(q)) {
      return `Impacto ambiental estimado: ${r.categoriaImpacto} (score ${fmt(r.impacto, 0)}/100).\n\n` +
        recomendaciones(config, r).filter(x => x.area === 'Sostenibilidad').map(x => x.texto).join('\n');
    }
    if (/(resum|estado|cómo va|como va)/.test(q)) {
      return resumenDiseno(config, r);
    }

    return `${resumenDiseno(config, r)}\n\nPuedo explicarte cualquier material, sugerir mejoras de seguridad, coste o autonomía, o compararte con móviles comerciales. Prueba con "¿cómo reduzco el coste?" o "explica el electrolito".`;
  }

  return { recomendaciones, compararConComerciales, explicarMaterial, resumenDiseno, responder, promedioComerciales };
})();
