// Change request del cliente "From Panama City" (Notion, 2026-08-07 +
// aclaraciones 2026-08-09). El copy que dio el cliente es VERBATIM y no se
// debe reformular.
//
// El cliente escribio cada bloque en Markdown con un parrafo gancho mas
// bullets etiquetados (Duration / Not Included / Included / Recommended to
// Bring) y un itinerario numerado. El sitio no renderiza Markdown: la pagina
// de detalle de experiencia ya tiene bloques dedicados para exactamente esos
// campos (fullDescription / duration / notIncluded / included / requirements
// / itinerary), asi que cada etiqueta se mapea al campo al que ya pertenece
// en vez de volcar Markdown crudo en la descripcion. Las etiquetas que no
// tienen campo propio (When, Pickup Time, desglose de precio, "Good to
// Know") se agregan a fullDescription como parrafos simples.
//
// Key: numero de orden de la carpeta, igual que spanishTitlesByOrder y el id
// "e-XXX".

/** Ordenes eliminados por completo del catalogo (el cliente quito el producto). */
export const removedOrders = new Set([]);
// El 24 (Bar Hopping) estaba antes aca porque no tenia detalles aprobados. El
// cliente lo desbloqueo el 2026-08-18 ("crea una experiencia que se llame 'bar
// hoping'", "usa ai pa crear una descripcion - bar hopping en Casco Antiguo"),
// asi que ahora vive en authoredExperiences mas abajo con copy escrito por IA.
// El 25 (Primitive Spearfishing: Catch Your Dinner) tambien estaba aca
// ("el cliente la elimino", migracion 014) pero el owner pidio traerla de
// vuelta el 2026-08-25, ahora bajo Colon & Sister Moon (ver colonOrders).

/**
 * Ordenes que son productos de Colon y no deben aparecer bajo "From Panama
 * City". Conservan sus registros y rutas de detalle; solo se les quita esa
 * etiqueta de destino. Registrados como su propia categoria plana ("Colón
 * & Sister Moon Experiences", reorg de categorias 2026-08-10) en categoryMeta
 * y catalogGroupsByDestination, asi que aparecen como provincia/categoria
 * independiente en el filtro del catalogo en vez de bajo Panama City.
 */
export const COLON_DESTINATION = "Colón";
export const COLON_CATEGORY = "Colón & Sister Moon Experiences";
// 25 (Primitive Spearfishing) restaurada aqui 2026-08-25 a pedido del owner
// ("necesitamos de vuelta la experiencia de pesca... en las experiencias de
// colon y sister moon") -- coincide con su categoria original en Cuanto
// ("📍Colón & Sister Moon Experiences", ver el .txt fuente de la carpeta 25).
export const colonOrders = new Set([10, 19, 25, 29, 35, 37]);

/** Precio temporal puesto por el cliente; lo va a revisar despues. */
export const priceOverridesByOrder = {
  36: 80, // Surf Day Experience: The City Escape
};

/**
 * Overrides de orden de galeria, aplicados despues del orden natural por
 * defecto. Los valores se comparan contra el nombre de archivo de la imagen.
 */
export const imageOrderByOrder = {
  // Canyon Thrills: las fotos de la cascada van primero, la foto de la roca
  // del canon va al final. Solo reordena - no se agrega, quita ni reemplaza
  // ninguna imagen.
  8: ["754a9aa1", "c65f2915", "DSC00023", "IMG_8817", "5f971ee8"],
  // Caribbean Island Day Escape: el cliente eligio la foto del Sister Moon
  // Hotel como portada (2026-08-10). Todo lo demas conserva su orden relativo.
  9: ["3-sister-moon-hotel"],
};

/**
 * Client-supplied replacement content, VERBATIM.
 * Any field present here wins over the parsed source .txt content.
 */
export const clientContentByOrder = {
  // 1.3 Caribbean Island Day Escape - REPLACE DESCRIPTION
  9: {
    fullDescription:
      "Trade the city skyscraper views for Caribbean salt air. We're taking you on an overland journey to Colón for historical pirate territory, specialty coffee, and a day relaxing at our favorite island hideaway.",
    duration: 9, // "Full Day (~8 to 9 Hours)"
    // Incluye/no incluye/requisitos van en espanol (con su traduccion en
    // experience-content.js) siguiendo el mismo patron que el resto del
    // catalogo -- ver nota en applyClientContent().
    notIncluded: [
      "Snacks o bebidas personales fuera del almuerzo",
      "Alcohol",
      "Alquiler opcional de equipo de snorkel (upgrade de $5)",
    ],
    included: [
      "Transporte terrestre y en lancha, ida y vuelta",
      "Parada de historia y café",
      "Acceso completo a las instalaciones de Sister Moon Hotel (piscina de agua salada, espacio de meditación, terrazas frente al mar, duchas y baños privados)",
      "Un almuerzo recién cocinado por un chef local",
    ],
    requirements: [
      "Traje de baño",
      "Toalla",
      "Cambio de ropa seca",
      "Protector solar",
      "Repelente de insectos",
      "Efectivo para bebidas extra o souvenirs",
      "Tu cámara",
    ],
    itinerary: [
      "Early Pickup in Panama City: Jump in the rig for a scenic 1.5-hour drive through tropical landscapes heading north to Colón.",
      "Pirate History & Coffee Stop (Portobelo): Quick pitstop in historic Portobelo—former stronghold for Spanish gold and favorite playground of pirates like Henry Morgan. We'll grab local snacks (empanadas/plantintart) and Panama specialty coffee.",
      "Boat Crossing from La Guaira: A quick 5-minute boat ride across turquoise waters drops us right on Isla Grande.",
      "Sister Moon Basecamp & Island Chill: Settle in at Sister Moon Hotel, our private sanctuary for the day. Dip in the saltwater pool, hit the meditation space, use clean showers, and eat an impeccable lunch cooked by a local chef.",
      "Explore or Unwind: Hike up to the island's historic lighthouse for panoramic views and parrot watching, or just catch a tan by the water.",
      "3:00 PM Boat & Drive Back: We jump back on the boat and head back overland, landing you in Panama City right in time for sunset.",
    ],
    // Traduccion al espanol (2026-08-25, no es del cliente): el bloque de
    // arriba es el ingles VERBATIM del cliente y se queda intacto. Esto
    // arregla que la version en espanol del sitio mostrara la descripcion en
    // ingles sin traducir.
    spanish: {
      fullDescription:
        "Cambia los rascacielos de la ciudad por aire salado del Caribe. Te llevamos en un viaje por tierra hasta Colón, territorio pirata con historia, café de especialidad y un día de relax en nuestro escondite isleño favorito.",
      itinerary: [
        "Recogida temprano en Ciudad de Panamá: sube a la camioneta para un recorrido escénico de 1.5 horas por paisajes tropicales rumbo al norte, hacia Colón.",
        "Historia pirata y parada de café (Portobelo): parada rápida en el histórico Portobelo, antiguo bastión del oro español y patio de juegos favorito de piratas como Henry Morgan. Comemos algo local (empanadas/tarta de plátano) y tomamos café de especialidad panameño.",
        "Cruce en lancha desde La Guaira: un viaje rápido de 5 minutos en lancha por aguas turquesa nos deja directo en Isla Grande.",
        "Base en Sister Moon y relax isleño: te instalas en Sister Moon Hotel, nuestro santuario privado por el día. Métete a la piscina de agua salada, pasa por el espacio de meditación, usa las duchas limpias y disfruta un almuerzo impecable cocinado por un chef local.",
        "Explora o desconecta: sube hasta el faro histórico de la isla para vistas panorámicas y avistamiento de loros, o simplemente broncéate junto al agua.",
        "3:00 PM lancha y regreso: volvemos a subir a la lancha y regresamos por tierra, llegando a Ciudad de Panamá justo a tiempo para el atardecer.",
      ],
    },
  },

  // 4.1 "FREE" Casco Walking Tour - RENAME + REPLACE DESCRIPTION
  11: {
    title: "“FREE” Casco Walking Tour",
    fullDescription: [
      "The most authentic way to experience the heart of Panama—no dry history lectures, no tourist traps. Just high-energy vibes, cobblestone backstreets, hidden spots, and the real stories behind Casco Viejo.",
      "When: Every single day of the week!\nPickup Time: 9:30 AM – 9:45 AM (Directly from your hostel/hotel)",
      "Pricing & Logistics Breakdown\nTo Join ($5.00 Total): $2.00 Reservation Fee + $3.00 Mandatory Transport Pickup.\nOptional Social Lunch Deal ($12.00): Covers your Metro transport, a full traditional meal (Fonda style), and a specialty coffee on Via Argentina.",
      "Why Tip-Based? This keeps our guides sharp, the energy high, and gives you complete freedom to value the experience based on your vibe.",
    ].join("\n\n"),
    duration: 3, // "~3 Hours (Walking Tour + Optional Social Lunch)"
    notIncluded: [
      "Propina del guía (modelo a propina: pagas al final lo que sientas que valió la experiencia)",
    ],
    included: [
      "Recogida directa en tu hostel",
      "Ruta guiada a pie",
      "Miradores con vista al skyline",
    ],
    requirements: [
      "Zapatos cómodos para caminar sobre empedrado",
      "Efectivo para la propina del guía o el almuerzo",
      "Agua",
      "Gorra o lentes de sol",
    ],
    itinerary: [
      "9:30 AM – Direct Pickup: We pick you up right from your accommodation—no need to figure out public transport or maps.",
      "Casco Viejo Exploration: Dive into the backstreets, colonial ruins, iconic plazas, and local contrast of Casco. Get the best skyline photo ops and deep-cut history from our crew.",
      "12:00 PM – Social Daily Lunch Transition (Optional): We keep the crew together and head over to the Via Argentina area for a massive, traditional Panamanian meal.",
    ],
    // Traduccion al espanol (2026-08-25, no es del cliente): el bloque de
    // arriba (fullDescription/itinerary) es el ingles VERBATIM del cliente y
    // se queda intacto como traduccion EN.
    spanish: {
      fullDescription: [
        "La forma más auténtica de vivir el corazón de Panamá: nada de clases de historia aburridas ni trampas para turistas. Solo buena energía, callejones empedrados, rincones escondidos y las historias reales detrás de Casco Viejo.",
        "Cuándo: ¡Todos los días de la semana!\nHora de recogida: 9:30 AM – 9:45 AM (directo desde tu hostel/hotel)",
        "Desglose de precio y logística\nPara unirte ($5.00 en total): $2.00 de reserva + $3.00 de transporte obligatorio de recogida.\nAlmuerzo social opcional ($12.00): incluye tu transporte en Metro, una comida tradicional completa (estilo fonda) y un café de especialidad en Vía Argentina.",
        "¿Por qué basado en propinas? Así mantenemos a nuestros guías motivados, la energía alta, y a ti con total libertad de valorar la experiencia según cómo te sintió.",
      ].join("\n\n"),
      itinerary: [
        "9:30 AM – Recogida directa: te recogemos directo en tu alojamiento, sin que tengas que pensar en transporte público ni mapas.",
        "Exploración de Casco Viejo: métete en los callejones, las ruinas coloniales, las plazas icónicas y el contraste local del Casco. Las mejores fotos del skyline y la historia de verdad, contada por nuestro equipo.",
        "12:00 PM – Almuerzo social (opcional): mantenemos al grupo unido y nos vamos hacia la zona de Vía Argentina para una comida panameña tradicional y abundante.",
      ],
    },
  },

  // 1.7 Kuna Yala / San Blas Overnight & Beyond - RENAME (VERBATIM)
  26: { title: "Kuna Yala / San Blas Overnight & Beyond" },

  // 1.7 Kuna Yala / San Blas Day Trip - RENAME (VERBATIM)
  27: { title: "Kuna Yala / San Blas Day Trip" },

  // 6.1 Toucan Sightseeing - quita el parentesis del titulo
  43: { title: "Toucan Sightseeing & Cold Mountains of the City" },
};

/**
 * Experiencias que no existian en el export de Cuanto y se redactaron a
 * partir del brief del cliente. Se arman con la misma forma que las
 * parseadas.
 *
 * BLOQUEADO (B3): precio, capacidad, disponibilidad y flujo de reserva
 * todavia faltan para ambas. basePrice se queda en 0 y no se crea fila de
 * disponibilidad, asi que ninguna es reservable hasta que el cliente de el
 * dato comercial.
 */
export const authoredExperiences = [
  {
    order: 23,
    destination: "Panama City",
    category: "Extreme Experiences",
    title: "Shooting Range Experience & Sunset Chill",
    shortDescription:
      "Test your trigger finger right under the shadow of the iconic Bridge of the Americas, then cool down at Veracruz Beach for sunset.",
    fullDescription: [
      "Test your trigger finger right under the shadow of the iconic Bridge of the Americas. After burning through brass at the range, we cool down with a short 20-minute scenic drive to Veracruz Beach to catch the sunset with a cold drink in hand. High-octane precision meets beachside relaxation.",
      "Good to Know: Weekend availability only. Bring your squad—groups unlock discounted rates!",
    ].join("\n\n"),
    duration: 5, // "~4 to 5 Hours"
    // Incluye/no incluye/requisitos en espanol (con su traduccion en
    // experience-content.js), mismo patron que Bar Hopping abajo.
    notIncluded: [
      "Bebidas o comidas personales en la playa",
      "Cartuchos extra fuera del paquete seleccionado",
    ],
    included: [
      "Transporte terrestre ida y vuelta",
      "Entrada al polígono de tiro",
      "Equipo de seguridad (protección auditiva y ocular)",
      "Instructor certificado",
      "Armas de fuego",
      "Blancos de papel",
      "Paquete estándar de munición",
      "Transporte a Playa Veracruz para el atardecer",
    ],
    requirements: [
      "Documento de identidad o pasaporte físico vigente (obligatorio para entrar al polígono)",
      "Zapatos cerrados (obligatorio)",
      "Ropa cómoda",
      "Lentes de sol",
      "Efectivo o tarjeta para bebidas o snacks en la playa",
    ],
    itinerary: [
      "Pickup in Panama City: We pick you up in our rig and cross over the Canal entrance, heading towards the iconic Bridge of the Americas.",
      "Safety Briefing & Shooting Session: Arrive at the range location under the bridge. Get suited up in safety gear, go over the range rules with certified instructors, and lock & load for your target shooting session.",
      "Scenic Coastal Drive to Veracruz: Pack up the gear and take a quick 20-minute coastal drive down to Veracruz Beach.",
      "Veracruz Beach Sunset Chill: Unwind after the range rush, grab a drink or meal by the ocean, and watch the sun dip below the horizon over the Pacific.",
      "Return Transfer: Hop back in the vehicle for a quick drop-off back in Panama City.",
    ],
    // Traduccion al espanol (2026-08-25): esta experiencia no tenia bloque
    // `spanish` -- buildAuthoredExperience() ya lo soporta (ver Bar Hopping
    // mas abajo), solo faltaba escribirlo.
    spanish: {
      shortDescription:
        "Pon a prueba tu puntería a la sombra del icónico Puente de las Américas, y luego relájate en Playa Veracruz para ver el atardecer.",
      fullDescription: [
        "Pon a prueba tu puntería a la sombra del icónico Puente de las Américas. Después de gastar cartuchos en el polígono, bajamos el ritmo con un recorrido escénico de 20 minutos hasta Playa Veracruz para ver el atardecer con una bebida fría en mano. Precisión a toda máquina que termina en relax de playa.",
        "Bueno saber: disponible solo los fines de semana. Trae a tu grupo: en grupo desbloqueas tarifas con descuento.",
      ].join("\n\n"),
      itinerary: [
        "Recogida en Ciudad de Panamá: te recogemos en nuestra camioneta y cruzamos la entrada del Canal, rumbo al icónico Puente de las Américas.",
        "Charla de seguridad y sesión de tiro: llegamos al polígono bajo el puente. Te equipas con el material de seguridad, repasamos las reglas del lugar con instructores certificados, y cargas para tu sesión de tiro al blanco.",
        "Recorrido costero escénico a Veracruz: guardamos el equipo y tomamos un recorrido costero rápido de 20 minutos hasta Playa Veracruz.",
        "Atardecer relax en Playa Veracruz: te desconectas después de la adrenalina del polígono, pides una bebida o algo de comer frente al mar, y ves el sol meterse en el horizonte del Pacífico.",
        "Traslado de regreso: te subes de nuevo al vehículo para el regreso rápido a Ciudad de Panamá.",
      ],
    },
  },
  {
    // 4.1 Bar Hopping - EXPERIENCIA NUEVA (Nightlife).
    // El cliente pidio el producto por nombre y autorizo explicitamente copy
    // escrito por IA ("usa ai pa crear una descripcion - bar hopping en Casco
    // Antiguo"), asi que a diferencia de cualquier otra entrada de este
    // archivo el texto de abajo NO es verbatim del cliente y se puede
    // reformular una vez que lo revise.
    order: 24,
    destination: "Panama City",
    category: "Nightlife",
    slug: "bar-hopping",
    sourceFolder: "24 - Bar Hopping",
    title: "Bar Hopping",
    shortDescription:
      "Casco Antiguo after dark with a crew instead of a map: rooftop skyline views, a hidden speakeasy and the backstreet spots that never make the guidebooks.",
    fullDescription: [
      "Casco Antiguo does not really wake up until the sun goes down. The colonial facades light up, the rooftops fill, and behind unmarked doors there are bars you would walk past a hundred times without noticing. That is exactly where we are going.",
      "This is not a wristband pub crawl with a shot list. It is a small crew, a local host who knows which door to knock on, and a route that starts on a rooftop with the whole Panama City skyline in front of you and drops down into the cobblestone backstreets where the real nightlife lives.",
      "Good to Know: 18+ only and every venue checks ID. The route flexes with the night - if a spot is dead, we move. Weekends hit hardest, but we also run midweek for smaller, calmer crews.",
    ].join("\n\n"),
    duration: 5,
    included: [
      "Anfitrion local y ruta completa por Casco Antiguo",
      "Bebida de bienvenida en la primera parada",
      "Parada en rooftop con vista al skyline",
      "Entrada coordinada en los locales que lo permiten",
      "Coordinacion del grupo por WhatsApp antes de salir",
    ],
    notIncluded: [
      "Bebidas adicionales a la de bienvenida",
      "Comida y snacks de la noche",
      "Cover de los locales que lo cobren",
      "Taxi o transporte de regreso a tu alojamiento",
      "Propinas para los bartenders",
    ],
    requirements: [
      "Documento de identidad o pasaporte fisico (obligatorio, lo piden en cada local)",
      "Ropa smart casual y zapatos cerrados: algunos rooftops tienen codigo de vestimenta",
      "Efectivo y tarjeta para las bebidas",
      "Telefono cargado para fotos y el grupo de WhatsApp",
      "Ser mayor de 18 anos",
    ],
    itinerary: [
      "Meeting Point in Casco Antiguo: We link up on a plaza in the old quarter, do quick intros so nobody is a stranger by the second bar, and set the pace for the night.",
      "Stop 1 - Welcome Drink: We start local. A classic Panamanian cocktail or a cold Balboa to get the crew talking before we move.",
      "Stop 2 - Rooftop & Skyline: Up we go. The full Panama City skyline lit up across the bay with the colonial rooftops underneath. The best photo of your trip happens here.",
      "Stop 3 - The Hidden Door: A speakeasy behind an unmarked entrance. No sign, no queue outside, just the kind of place you only find if someone takes you.",
      "Stop 4 - Backstreet Local Spot: Off the tourist strip and into where locals actually drink. Cheaper rounds, louder music, better stories.",
      "Open Ending: Around midnight the route ends. Stay out with whoever is still standing, or grab a ride back - your host will point you to a safe one.",
    ],
    spanish: {
      title: "Bar Hopping",
      shortDescription:
        "Casco Antiguo de noche con un grupo en vez de un mapa: rooftops con vista al skyline, un speakeasy escondido y los bares de callejon que no salen en ninguna guia.",
      fullDescription: [
        "Casco Antiguo no despierta de verdad hasta que se mete el sol. Las fachadas coloniales se encienden, los rooftops se llenan y detras de puertas sin letrero hay bares por los que pasarias cien veces sin notarlos. Ahi es exactamente donde vamos.",
        "Esto no es un pub crawl de manilla y lista de shots. Es un grupo pequeno, un anfitrion local que sabe en cual puerta tocar, y una ruta que arranca en un rooftop con todo el skyline de Ciudad de Panama enfrente y baja hasta los callejones empedrados donde vive la noche real.",
        "Bueno saber: solo mayores de 18 y en cada local piden documento. La ruta se ajusta a como este la noche: si un lugar esta muerto, nos movemos. Los fines de semana pegan mas fuerte, pero tambien salimos entre semana con grupos mas pequenos y tranquilos.",
      ].join("\n\n"),
      itinerary: [
        "Punto de encuentro en Casco Antiguo: nos reunimos en una plaza del casco, presentaciones rapidas para que nadie sea un desconocido en el segundo bar, y arrancamos.",
        "Parada 1 - Bebida de bienvenida: empezamos local. Un coctel panameno clasico o una Balboa fria para soltar al grupo antes de movernos.",
        "Parada 2 - Rooftop y skyline: subimos. Todo el skyline de Ciudad de Panama encendido al otro lado de la bahia y los techos coloniales abajo. La mejor foto de tu viaje sale aqui.",
        "Parada 3 - La puerta escondida: un speakeasy detras de una entrada sin letrero. Sin fila, sin senalizacion, de esos lugares que solo encuentras si alguien te lleva.",
        "Parada 4 - Bar de callejon: fuera de la zona turistica, donde toman los locales. Rondas mas baratas, musica mas fuerte, mejores historias.",
        "Cierre abierto: cerca de medianoche termina la ruta. Te quedas con quien siga en pie o te regresas, y tu anfitrion te indica un transporte seguro.",
      ],
    },
  },
];
