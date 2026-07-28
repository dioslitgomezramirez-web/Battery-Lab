/* ============================================================
   BATTERY LAB — Base de datos de materiales e ingeniería
   Todos los valores son aproximaciones de ingeniería basadas en
   literatura pública de electroquímica, usadas para alimentar un
   modelo de simulación paramétrico. No sustituyen datos de
   laboratorio certificados.
   ============================================================ */

const MATERIALS = {

  anodo: {
    grafito: {
      id: 'grafito', nombre: 'Grafito (natural/artificial)',
      formula: 'LiC6', capacidadEspecifica: 360, densidad: 2.24,
      voltajeVsLi: 0.10, costoKg: 12, estabilidadTermica: 7,
      factorCiclos: 1.0, expansion: 8, conductividad: 7,
      tipo: 'comercial',
      descripcion: 'El ánodo estándar de la industria desde los años 90. Intercala iones de litio entre capas de carbono con muy baja expansión volumétrica. Barato, maduro y predecible, pero limita la densidad energética frente a alternativas más nuevas.'
    },
    silicio_carbono: {
      id: 'silicio_carbono', nombre: 'Silicio-Carbono (Si/C, ~5-12% Si)',
      formula: 'Si_xC_(1-x)', capacidadEspecifica: 550, densidad: 2.02,
      voltajeVsLi: 0.20, costoKg: 35, estabilidadTermica: 6,
      factorCiclos: 0.85, expansion: 45, conductividad: 6,
      tipo: 'comercial',
      descripcion: 'Un compuesto de grafito con partículas de silicio nanoestructurado. Es la tecnología detrás de los teléfonos con mayor autonomía de 2024-2026 (Xiaomi, HONOR, OPPO, vivo, OnePlus): permite más capacidad en el mismo volumen. El silicio se expande al cargarse, lo que exige ingeniería de electrodo cuidadosa.'
    },
    silicio_puro: {
      id: 'silicio_puro', nombre: 'Silicio de alto contenido (experimental)',
      formula: 'Si', capacidadEspecifica: 1600, densidad: 1.9,
      voltajeVsLi: 0.30, costoKg: 60, estabilidadTermica: 4,
      factorCiclos: 0.5, expansion: 280, conductividad: 4,
      tipo: 'experimental',
      descripcion: 'Ánodo casi puro de silicio. Capacidad teórica de hasta 4200 mAh/g, pero la expansión volumétrica (~300%) agrieta el electrodo y degrada la vida útil rápidamente sin matrices de contención avanzadas. Uso limitado a prototipos de investigación.'
    },
    litio_metalico: {
      id: 'litio_metalico', nombre: 'Litio metálico',
      formula: 'Li', capacidadEspecifica: 3860, densidad: 0.534,
      voltajeVsLi: 0.0, costoKg: 70, estabilidadTermica: 3,
      factorCiclos: 0.6, expansion: 15, conductividad: 9,
      tipo: 'experimental',
      descripcion: 'El ánodo con mayor densidad energética posible, extremadamente ligero. Con electrolito líquido forma dendritas que pueden perforar el separador y provocar cortocircuitos internos; su uso seguro depende de un electrolito sólido que bloquee el crecimiento dendrítico.'
    },
    carbono_duro: {
      id: 'carbono_duro', nombre: 'Carbono duro (hard carbon)',
      formula: 'C (desordenado)', capacidadEspecifica: 300, densidad: 1.5,
      voltajeVsLi: 0.10, costoKg: 15, estabilidadTermica: 8,
      factorCiclos: 1.15, expansion: 6, conductividad: 6,
      tipo: 'comercial',
      descripcion: 'El ánodo estándar para celdas de sodio-ion. Su estructura desordenada aloja iones de sodio, más grandes que el litio. Barato, abundante y con excelente estabilidad térmica, a costa de menor densidad energética.'
    },
    lto: {
      id: 'lto', nombre: 'Titanato de litio (LTO)',
      formula: 'Li4Ti5O12', capacidadEspecifica: 175, densidad: 3.5,
      voltajeVsLi: 1.55, costoKg: 40, estabilidadTermica: 10,
      factorCiclos: 3.0, expansion: 1, conductividad: 5,
      tipo: 'especializado',
      descripcion: 'Ánodo "cero deformación": prácticamente no se expande ni contrae al ciclar, lo que le da una vida útil enorme (+20 000 ciclos) y seguridad excepcional. Su alto voltaje frente al litio reduce el voltaje de celda, penalizando la densidad energética. Habitual en autobuses eléctricos, no en teléfonos.'
    }
  },

  catodo: {
    lco: {
      id: 'lco', nombre: 'Óxido de litio y cobalto (LCO)',
      formula: 'LiCoO2', capacidadEspecifica: 150, densidad: 5.05,
      voltajeVsLi: 3.90, costoKg: 45, estabilidadTermica: 4,
      factorCiclos: 0.8, contenidoCobalto: 'alto', conductividad: 6,
      tipo: 'comercial',
      descripcion: 'El cátodo clásico de los smartphones desde su popularización por Sony en 1991. Alta densidad energética volumétrica, pero es el menos estable térmicamente a alto voltaje de carga y depende intensivamente del cobalto.'
    },
    nmc622: {
      id: 'nmc622', nombre: 'NMC 622 (Ni-Mn-Co)',
      formula: 'LiNi0.6Mn0.2Co0.2O2', capacidadEspecifica: 170, densidad: 4.7,
      voltajeVsLi: 3.80, costoKg: 32, estabilidadTermica: 6,
      factorCiclos: 1.0, contenidoCobalto: 'medio', conductividad: 6,
      tipo: 'comercial',
      descripcion: 'Cátodo equilibrado entre energía, seguridad, coste y vida útil. Es el punto de referencia intermedio de la industria y una elección segura por defecto.'
    },
    nmc811: {
      id: 'nmc811', nombre: 'NMC 811 (alto níquel)',
      formula: 'LiNi0.8Mn0.1Co0.1O2', capacidadEspecifica: 200, densidad: 4.6,
      voltajeVsLi: 3.85, costoKg: 30, estabilidadTermica: 5,
      factorCiclos: 0.9, contenidoCobalto: 'bajo', conductividad: 6,
      tipo: 'comercial',
      descripcion: 'Mayor proporción de níquel para capacidad superior y menor dependencia del cobalto. A cambio, la superficie rica en níquel es más reactiva y algo menos estable térmicamente.'
    },
    lfp: {
      id: 'lfp', nombre: 'Litio-hierro-fosfato (LFP)',
      formula: 'LiFePO4', capacidadEspecifica: 160, densidad: 3.6,
      voltajeVsLi: 3.40, costoKg: 18, estabilidadTermica: 9,
      factorCiclos: 2.5, contenidoCobalto: 'ninguno', conductividad: 4,
      tipo: 'comercial',
      descripcion: 'Estructura de olivino excepcionalmente estable: no libera oxígeno con facilidad ni sufre fuga térmica con la misma agresividad que los óxidos de níquel/cobalto. Sin cobalto, barato y de larga vida, pero con menor voltaje y densidad energética.'
    },
    nca: {
      id: 'nca', nombre: 'NCA (Ni-Co-Al)',
      formula: 'LiNiCoAlO2', capacidadEspecifica: 195, densidad: 4.75,
      voltajeVsLi: 3.85, costoKg: 34, estabilidadTermica: 5,
      factorCiclos: 0.9, contenidoCobalto: 'medio', conductividad: 6,
      tipo: 'comercial',
      descripcion: 'Cátodo de muy alta densidad energética, popularizado en vehículos eléctricos premium. El aluminio estabiliza la estructura cristalina, pero conserva una estabilidad térmica moderada-baja.'
    },
    sodio_np: {
      id: 'sodio_np', nombre: 'Óxido de sodio en capas (Na-ion)',
      formula: 'NaxMO2 / NaFePO4', capacidadEspecifica: 120, densidad: 3.2,
      voltajeVsLi: 3.2, costoKg: 16, estabilidadTermica: 9,
      factorCiclos: 1.3, contenidoCobalto: 'ninguno', conductividad: 5,
      tipo: 'comercial',
      descripcion: 'Cátodo de sodio-ion basado en elementos abundantes (hierro, manganeso) sin litio ni cobalto. Menor densidad energética, pero excelente estabilidad térmica, bajo coste y buen comportamiento en frío.'
    },
    azufre: {
      id: 'azufre', nombre: 'Azufre (Li-S)',
      formula: 'S8', capacidadEspecifica: 900, densidad: 2.0,
      voltajeVsLi: 2.15, costoKg: 8, estabilidadTermica: 6,
      factorCiclos: 0.45, contenidoCobalto: 'ninguno', conductividad: 2,
      tipo: 'experimental',
      descripcion: 'Capacidad específica teórica enorme (1675 mAh/g) a un coste de material mínimo. En la práctica sufre el "efecto shuttle" de polisulfuros disueltos, que degrada la capacidad ciclo a ciclo. Voltaje de celda más bajo. Tecnología de siguiente generación en investigación activa.'
    }
  },

  electrolito: {
    liquido: {
      id: 'liquido', nombre: 'Líquido orgánico (LiPF6 en EC/DMC)',
      conductividadIonica: 10, inflamabilidad: 8, densidad: 1.2,
      costoL: 8, estabilidadTermica: 4, ventanaTemp: [-20, 60],
      tipo: 'comercial',
      descripcion: 'El electrolito estándar: sales de litio disueltas en carbonatos orgánicos. Excelente conductividad iónica y carga rápida, pero es inflamable y el principal responsable de la fuga térmica en fallos de batería.'
    },
    gel_polimero: {
      id: 'gel_polimero', nombre: 'Gel polimérico (Li-Po)',
      conductividadIonica: 7, inflamabilidad: 6, densidad: 1.3,
      costoL: 12, estabilidadTermica: 5, ventanaTemp: [-10, 60],
      tipo: 'comercial',
      descripcion: 'Electrolito líquido inmovilizado en una matriz de polímero (PVDF-HFP). Permite carcasas flexibles tipo bolsa y es ligeramente más contenido que el líquido puro en caso de fuga, aunque sigue siendo inflamable.'
    },
    solido_ceramico: {
      id: 'solido_ceramico', nombre: 'Sólido cerámico (óxido, tipo LLZO)',
      conductividadIonica: 4, inflamabilidad: 0, densidad: 4.5,
      costoL: 80, estabilidadTermica: 10, ventanaTemp: [-20, 100],
      tipo: 'experimental',
      descripcion: 'Cerámica de granate (Li7La3Zr2O12) no inflamable que permite usar ánodos de litio metálico con seguridad. Rígida y frágil, con conductividad iónica menor a temperatura ambiente, lo que limita la velocidad de carga.'
    },
    solido_sulfurado: {
      id: 'solido_sulfurado', nombre: 'Sólido sulfurado',
      conductividadIonica: 9, inflamabilidad: 2, densidad: 2.3,
      costoL: 90, estabilidadTermica: 8, ventanaTemp: [-20, 80],
      tipo: 'experimental',
      descripcion: 'La familia de electrolitos sólidos con mayor conductividad iónica, cercana a la de un líquido. Sensible a la humedad durante la fabricación (riesgo de liberar H2S). Foco de investigación de Toyota y Samsung SDI para estado sólido de próxima generación.'
    },
    solido_polimerico: {
      id: 'solido_polimerico', nombre: 'Sólido polimérico (PEO)',
      conductividadIonica: 3, inflamabilidad: 1, densidad: 1.3,
      costoL: 40, estabilidadTermica: 9, ventanaTemp: [40, 80],
      tipo: 'experimental',
      descripcion: 'La ruta de estado sólido más económica de fabricar y más flexible mecánicamente, pero necesita típicamente más de 60°C para alcanzar buena conductividad iónica — poco práctico en un teléfono sin gestión térmica activa.'
    }
  },

  separador: {
    pe: {
      id: 'pe', nombre: 'Polietileno (PE)',
      espesorUm: 16, temperaturaFusion: 130, resistenciaPerforacion: 5,
      costoM2: 3, estabilidadTermica: 5,
      descripcion: 'Membrana microporosa estándar. Se funde y "cierra" sus poros alrededor de 130°C, cortando el flujo de iones como fusible de seguridad — pero si la temperatura sigue subiendo puede colapsar mecánicamente.'
    },
    pp: {
      id: 'pp', nombre: 'Polipropileno (PP)',
      espesorUm: 20, temperaturaFusion: 165, resistenciaPerforacion: 6,
      costoM2: 3.5, estabilidadTermica: 6,
      descripcion: 'Punto de fusión más alto que el PE; frecuentemente combinado en estructuras trilaminadas PP/PE/PP para sumar el fusible térmico del PE con la resistencia mecánica del PP.'
    },
    ceramico: {
      id: 'ceramico', nombre: 'Recubierto cerámico (Al2O3)',
      espesorUm: 18, temperaturaFusion: 200, resistenciaPerforacion: 8,
      costoM2: 6, estabilidadTermica: 8,
      descripcion: 'Separador de polímero con un recubrimiento cerámico de alúmina que resiste mayor temperatura y perforación por dendritas, reduciendo el riesgo de cortocircuito interno.'
    },
    aramida: {
      id: 'aramida', nombre: 'No tejido de aramida',
      espesorUm: 22, temperaturaFusion: 400, resistenciaPerforacion: 9,
      costoM2: 9, estabilidadTermica: 9,
      descripcion: 'Fibra de alta temperatura (familia del Kevlar) que no se funde en condiciones normales de fallo. Máxima seguridad mecánica y térmica entre los separadores de polímero, a mayor coste.'
    },
    ninguno_solido: {
      id: 'ninguno_solido', nombre: 'Ninguno (integrado en electrolito sólido)',
      espesorUm: 0, temperaturaFusion: 999, resistenciaPerforacion: 10,
      costoM2: 0, estabilidadTermica: 10,
      descripcion: 'En diseños de estado sólido, el propio electrolito sólido actúa como separador físico entre electrodos, eliminando la necesidad de una membrana independiente.'
    }
  },

  colector: {
    cobre: {
      id: 'cobre', nombre: 'Cobre (lado ánodo)',
      densidad: 8.96, costoKg: 9, conductividadElectrica: 9.5,
      espesorUm: 8,
      descripcion: 'Colector estándar del ánodo. El aluminio se aleiría con el litio a bajo potencial, por lo que el cobre es obligatorio en ese lado de la celda.'
    },
    aluminio: {
      id: 'aluminio', nombre: 'Aluminio (lado cátodo)',
      densidad: 2.7, costoKg: 2.5, conductividadElectrica: 6.1,
      espesorUm: 12,
      descripcion: 'Colector estándar del cátodo: ligero, barato y estable al potencial alto del cátodo.'
    },
    niquel: {
      id: 'niquel', nombre: 'Níquel',
      densidad: 8.9, costoKg: 14, conductividadElectrica: 5.9,
      espesorUm: 10,
      descripcion: 'Mejor resistencia a la corrosión a alto voltaje que el aluminio; usado en algunos diseños de estado sólido o sodio-ion especializados.'
    },
    cobre_ultrafino: {
      id: 'cobre_ultrafino', nombre: 'Cobre de malla ultrafina',
      densidad: 6.1, costoKg: 16, conductividadElectrica: 9.0,
      espesorUm: 5,
      descripcion: 'Lámina de cobre perforada y adelgazada para reducir peso muerto sin sacrificar demasiada conductividad. Opción experimental orientada a optimizar peso final.'
    }
  },

  carcasa: {
    bolsa_aluminio: {
      id: 'bolsa_aluminio', nombre: 'Bolsa de aluminio laminado (pouch)',
      densidad: 1.8, costoUnidad: 4, proteccion: 5, flexibilidad: 9, metalico: false,
      descripcion: 'Lámina de aluminio laminada entre capas de polímero. Es la carcasa de prácticamente todos los smartphones actuales: ligera y adaptable a formas delgadas, con protección mecánica moderada. Acabado mate, no metálico brillante, por su cara externa de polímero.'
    },
    lata_aluminio: {
      id: 'lata_aluminio', nombre: 'Lata de aluminio (rígida)',
      densidad: 2.7, costoUnidad: 6, proteccion: 8, flexibilidad: 2, metalico: true,
      descripcion: 'Carcasa metálica rígida cilíndrica o prismática. Mejor contención mecánica y de presión interna, a costa de peso y de la delgadez extrema que exige el diseño de un teléfono.'
    },
    lata_acero: {
      id: 'lata_acero', nombre: 'Lata de acero',
      densidad: 7.8, costoUnidad: 5, proteccion: 10, flexibilidad: 1, metalico: true,
      descripcion: 'Máxima resistencia mecánica y a la presión interna, propia de celdas industriales robustas. Su peso la hace poco práctica en teléfonos, salvo diseños ultra-resistentes especializados.'
    },
    polimero_rigido: {
      id: 'polimero_rigido', nombre: 'Polímero rígido compuesto',
      densidad: 1.4, costoUnidad: 3, proteccion: 6, flexibilidad: 3, metalico: false,
      descripcion: 'Compuesto plástico rígido ligero, explorado en algunos prototipos de celdas de estado sólido que no requieren el mismo sellado hermético que un electrolito líquido.'
    },
    titanio: {
      id: 'titanio', nombre: 'Titanio',
      densidad: 4.43, costoUnidad: 11, proteccion: 9, flexibilidad: 2, metalico: true,
      descripcion: 'Carcasa metálica de grado aeroespacial, usada en los marcos de los smartphones más premium. Relación resistencia/peso excelente y muy buena resistencia a la corrosión, con un coste de mecanizado notablemente mayor que el aluminio.'
    },
    magnesio: {
      id: 'magnesio', nombre: 'Aleación de magnesio',
      densidad: 1.8, costoUnidad: 7, proteccion: 7, flexibilidad: 2, metalico: true,
      descripcion: 'Aleación metálica más ligera que el aluminio con buena disipación térmica, usada en algunos chasis de gama alta y equipos donde el peso es crítico. Algo más sensible a la corrosión que el aluminio o el titanio si no lleva recubrimiento.'
    }
  }
};

/* Tipos de batería: presets de materiales recomendados y límites prácticos */
const BATTERY_TYPES = {
  li_ion: {
    id: 'li_ion', nombre: 'Li-ion (cilíndrico/prismático clásico)',
    anodo: 'grafito', catodo: 'nmc622', electrolito: 'liquido',
    separador: 'pp', colector_a: 'cobre', colector_c: 'aluminio',
    carcasa: 'lata_aluminio', cRateCargaMax: 1.5, cRateDescargaMax: 3,
    descripcion: 'La química de referencia desde los 90: grafito + óxido metálico + electrolito líquido. Madura, predecible y con la mayor infraestructura de fabricación del mundo.'
  },
  lipo: {
    id: 'lipo', nombre: 'Li-Po (polímero de litio, formato bolsa)',
    anodo: 'grafito', catodo: 'nmc622', electrolito: 'gel_polimero',
    separador: 'ceramico', colector_a: 'cobre', colector_c: 'aluminio',
    carcasa: 'bolsa_aluminio', cRateCargaMax: 2, cRateDescargaMax: 4,
    descripcion: 'La misma química Li-ion, empaquetada como celda de bolsa flexible con electrolito en gel. Es literalmente lo que lleva dentro casi cualquier smartphone actual.'
  },
  silicio_carbono: {
    id: 'silicio_carbono', nombre: 'Silicio-Carbono (Si/C de alta densidad)',
    anodo: 'silicio_carbono', catodo: 'nmc811', electrolito: 'gel_polimero',
    separador: 'ceramico', colector_a: 'cobre', colector_c: 'aluminio',
    carcasa: 'bolsa_aluminio', cRateCargaMax: 3, cRateDescargaMax: 4,
    descripcion: 'La tendencia dominante de 2025-2026 en gama alta china: reemplaza parte del grafito por silicio para meter más capacidad en la misma bolsa, ganando autonomía sin engordar el teléfono.'
  },
  sodio_ion: {
    id: 'sodio_ion', nombre: 'Sodio-ion (Na-ion)',
    anodo: 'carbono_duro', catodo: 'sodio_np', electrolito: 'liquido',
    separador: 'pe', colector_a: 'aluminio', colector_c: 'aluminio',
    carcasa: 'bolsa_aluminio', cRateCargaMax: 2, cRateDescargaMax: 3,
    descripcion: 'Sin litio ni cobalto: materiales abundantes y baratos, buen comportamiento en frío y alta seguridad, a cambio de menor densidad energética. En 2026 aún es una tecnología emergente para telefonía.'
  },
  estado_solido: {
    id: 'estado_solido', nombre: 'Estado sólido',
    anodo: 'litio_metalico', catodo: 'nmc811', electrolito: 'solido_sulfurado',
    separador: 'ninguno_solido', colector_a: 'cobre', colector_c: 'aluminio',
    carcasa: 'polimero_rigido', cRateCargaMax: 1, cRateDescargaMax: 2,
    descripcion: 'Sustituye el electrolito líquido inflamable por uno sólido, permitiendo ánodos de litio metálico de altísima densidad con mucha mayor seguridad. En 2026 sigue siendo costosa y difícil de fabricar a escala.'
  },
  litio_azufre: {
    id: 'litio_azufre', nombre: 'Litio-azufre (Li-S)',
    anodo: 'litio_metalico', catodo: 'azufre', electrolito: 'gel_polimero',
    separador: 'aramida', colector_a: 'cobre', colector_c: 'aluminio',
    carcasa: 'bolsa_aluminio', cRateCargaMax: 0.7, cRateDescargaMax: 1.5,
    descripcion: 'Materiales baratos y ligerísimos con enorme densidad energética teórica, pero ciclo de vida corto por el efecto shuttle de polisulfuros. Tecnología de próxima generación en investigación activa.'
  },
  personalizada: {
    id: 'personalizada', nombre: 'Personalizada / experimental',
    anodo: 'grafito', catodo: 'nmc622', electrolito: 'liquido',
    separador: 'pp', colector_a: 'cobre', colector_c: 'aluminio',
    carcasa: 'bolsa_aluminio', cRateCargaMax: 2, cRateDescargaMax: 3,
    descripcion: 'Elige libremente cualquier combinación de materiales, incluidos los que definas tú mismo, sin las restricciones de un preset comercial.'
  }
};

/* ============================================================
   Comparador — especificaciones de referencia de smartphones
   comerciales. Son valores públicos aproximados recopilados de
   hojas de datos y revisiones técnicas; varían por región,
   operador y año de fabricación, y se incluyen únicamente con
   fines comparativos de ingeniería.
   ============================================================ */
const PHONE_DATABASE = [
  { marca: 'Apple', modelo: 'iPhone 17 Pro Max', mah: 5088, voltaje: 3.87,
    quimica: 'Li-ion (LCO/NMC + grafito)', densidadEnergeticaWhL: 720,
    pesoCeldaG: 73, cargaW: 40, autonomiaH: 30, año: 2025 },
  { marca: 'Samsung', modelo: 'Galaxy S25 Ultra', mah: 5000, voltaje: 3.85,
    quimica: 'Li-ion (NMC + grafito)', densidadEnergeticaWhL: 700,
    pesoCeldaG: 74, cargaW: 45, autonomiaH: 27, año: 2025 },
  { marca: 'Google', modelo: 'Pixel 9 Pro XL', mah: 5060, voltaje: 3.85,
    quimica: 'Li-ion (NMC + grafito)', densidadEnergeticaWhL: 690,
    pesoCeldaG: 76, cargaW: 37, autonomiaH: 26, año: 2024 },
  { marca: 'Xiaomi', modelo: 'Xiaomi 15 Ultra', mah: 5410, voltaje: 3.87,
    quimica: 'Si/C (silicio-carbono)', densidadEnergeticaWhL: 810,
    pesoCeldaG: 65, cargaW: 90, autonomiaH: 29, año: 2025 },
  { marca: 'OPPO', modelo: 'Find X8 Ultra', mah: 6100, voltaje: 3.87,
    quimica: 'Si/C (silicio-carbono)', densidadEnergeticaWhL: 800,
    pesoCeldaG: 73, cargaW: 100, autonomiaH: 31, año: 2025 },
  { marca: 'vivo', modelo: 'X200 Pro', mah: 6000, voltaje: 3.87,
    quimica: 'Si/C (silicio-carbono)', densidadEnergeticaWhL: 800,
    pesoCeldaG: 72, cargaW: 90, autonomiaH: 30, año: 2024 },
  { marca: 'HONOR', modelo: 'Magic7 Pro', mah: 5850, voltaje: 3.87,
    quimica: 'Si/C (silicio-carbono, 3ª gen.)', densidadEnergeticaWhL: 805,
    pesoCeldaG: 70, cargaW: 100, autonomiaH: 30, año: 2024 },
  { marca: 'Motorola', modelo: 'Edge 60 Pro', mah: 5200, voltaje: 3.85,
    quimica: 'Li-ion (NMC + grafito)', densidadEnergeticaWhL: 690,
    pesoCeldaG: 77, cargaW: 68, autonomiaH: 27, año: 2025 },
  { marca: 'ASUS', modelo: 'ROG Phone 9 Pro', mah: 5800, voltaje: 3.87,
    quimica: 'Li-ion (NMC + grafito)', densidadEnergeticaWhL: 700,
    pesoCeldaG: 84, cargaW: 65, autonomiaH: 26, año: 2024 },
  { marca: 'Sony', modelo: 'Xperia 1 VI', mah: 5000, voltaje: 3.85,
    quimica: 'Li-ion (NMC + grafito)', densidadEnergeticaWhL: 680,
    pesoCeldaG: 75, cargaW: 30, autonomiaH: 25, año: 2024 },
  { marca: 'Huawei', modelo: 'Mate 70 Pro', mah: 5500, voltaje: 3.87,
    quimica: 'Si/C (silicio-carbono)', densidadEnergeticaWhL: 790,
    pesoCeldaG: 70, cargaW: 100, autonomiaH: 29, año: 2024 },
  { marca: 'LYNOR', modelo: 'Concepto de referencia', mah: 6200, voltaje: 3.87,
    quimica: 'Si/C (silicio-carbono)', densidadEnergeticaWhL: 810,
    pesoCeldaG: 76, cargaW: 100, autonomiaH: 31, año: 2026,
    esConcepto: true }
];

/* Perfiles de uso para el cálculo de autonomía */
const PERFILES_USO = {
  ligero: { nombre: 'Uso ligero (llamadas, mensajería)', consumoW: 1.4 },
  medio: { nombre: 'Uso medio (redes sociales, video)', consumoW: 2.6 },
  intenso: { nombre: 'Uso intenso (juegos, cámara, 5G)', consumoW: 4.5 }
};

/* Formas de batería disponibles y su factor de aprovechamiento de volumen */
const FORMAS = {
  prismatica: { nombre: 'Prismática (rectangular)', factorVolumen: 1.0 },
  forma_l: { nombre: 'Forma en L (aprovecha esquinas)', factorVolumen: 0.93 },
  escalonada: { nombre: 'Escalonada (multi-celda)', factorVolumen: 0.90 },
  curva: { nombre: 'Curva (para diseños flexibles)', factorVolumen: 0.85 }
};

const METODOS_FABRICACION = {
  bobinado: { nombre: 'Bobinado (jelly-roll)', costoFactor: 0.9, calidadFactor: 0.95 },
  apilado: { nombre: 'Apilado en Z (stacking)', costoFactor: 1.15, calidadFactor: 1.08 },
  monocelda: { nombre: 'Monocelda laminada', costoFactor: 1.3, calidadFactor: 1.12 }
};

/* Chips / SoC de referencia — su eficiencia energética modifica el consumo
   estimado del teléfono (a igual uso, un chip más eficiente rinde más horas). */
const CHIPSETS = {
  a18_pro: { nombre: 'Apple A18 Pro (3nm)', consumoFactor: 0.88, gama: 'Gama alta', descripcion: 'Uno de los procesos de fabricación más eficientes del mercado; buen control térmico y bajo consumo en reposo.' },
  dimensity_9400: { nombre: 'MediaTek Dimensity 9400 (3nm)', consumoFactor: 0.92, gama: 'Gama alta', descripcion: 'Chip flagship muy eficiente, competitivo en consumo frente a Snapdragon/Apple.' },
  snapdragon_8_elite: { nombre: 'Snapdragon 8 Elite', consumoFactor: 1.05, gama: 'Gama alta', descripcion: 'Máximo rendimiento de la gama Qualcomm; muy potente en juegos/cámara, con un consumo pico algo mayor.' },
  exynos_2400: { nombre: 'Exynos 2400', consumoFactor: 1.14, gama: 'Gama alta', descripcion: 'Buen rendimiento gráfico, pero históricamente menos eficiente energéticamente que sus equivalentes directos.' },
  snapdragon_7: { nombre: 'Snapdragon 7 Gen 3', consumoFactor: 1.0, gama: 'Gama media', descripcion: 'Punto de referencia intermedio: buen equilibrio rendimiento/consumo para gama media-alta.' },
  helio_g: { nombre: 'MediaTek Helio G99', consumoFactor: 1.12, gama: 'Gama de entrada', descripcion: 'Proceso de fabricación más antiguo; exige más energía por el mismo trabajo, penalizando la autonomía.' }
};

/* Tipos de dispositivo: cada uno con su propio consumo eléctrico típico,
   factores de ajuste celda->chasis, y tamaños de referencia. */
const DISPOSITIVOS = {
  telefono: {
    nombre: 'Teléfono', consumoFactorDispositivo: 1.0,
    factorLargo: 0.62, factorAncho: 0.86, overheadEspesorMm: 2.8,
    numCeldasSugerido: 1, cRateCargaTipico: 2,
    tamanos: {
      '6.1': { nombre: '6.1" (compacto)', largoMm: 147, anchoMm: 71.5, espesorMm: 7.8 },
      '6.3': { nombre: '6.3" (estándar)', largoMm: 152, anchoMm: 72, espesorMm: 7.7 },
      '6.5': { nombre: '6.5" (grande)', largoMm: 160, anchoMm: 74.5, espesorMm: 8.0 },
      '6.7': { nombre: '6.7" (Pro Max / Ultra)', largoMm: 163, anchoMm: 77, espesorMm: 8.2 },
      '6.9': { nombre: '6.9" (phablet)', largoMm: 165, anchoMm: 77.5, espesorMm: 8.4 }
    }
  },
  tablet: {
    nombre: 'Tablet', consumoFactorDispositivo: 1.8,
    factorLargo: 0.44, factorAncho: 0.39, overheadEspesorMm: 2.2,
    numCeldasSugerido: 2, cRateCargaTipico: 1.2,
    tamanos: {
      '8.3': { nombre: '8.3" (mini)', largoMm: 195, anchoMm: 135, espesorMm: 6.3 },
      '11': { nombre: '11" (estándar)', largoMm: 248, anchoMm: 179, espesorMm: 6.4 },
      '12.9': { nombre: '12.9" (pro)', largoMm: 280, anchoMm: 215, espesorMm: 6.4 }
    }
  },
  laptop: {
    nombre: 'Laptop', consumoFactorDispositivo: 5.5,
    factorLargo: 0.32, factorAncho: 0.31, overheadEspesorMm: 1.5,
    numCeldasSugerido: 4, cRateCargaTipico: 0.9,
    tamanos: {
      '13': { nombre: '13" (ultraligera)', largoMm: 300, anchoMm: 212, espesorMm: 5.8 },
      '14': { nombre: '14" (estándar)', largoMm: 313, anchoMm: 222, espesorMm: 6.5 },
      '16': { nombre: '16" (workstation)', largoMm: 355, anchoMm: 248, espesorMm: 7.5 }
    }
  }
};

/* Tamaños de teléfono de referencia (compatibilidad con versiones anteriores) */
const PHONE_SIZES = DISPOSITIVOS.telefono.tamanos;

/* Factores de conversión celda <-> teléfono completo (compatibilidad) */
const TELEFONO_FIT = {
  factorLargo: DISPOSITIVOS.telefono.factorLargo,
  factorAncho: DISPOSITIVOS.telefono.factorAncho,
  overheadEspesorMm: DISPOSITIVOS.telefono.overheadEspesorMm
};
