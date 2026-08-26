import { cleanDisplayList, cleanDisplayText } from "../lib/services/text.js";
import { spanishTranslationsByOrder } from "./experience-translations-es.js";
import {
  COLON_CATEGORY,
  COLON_DESTINATION,
  authoredExperiences,
  clientContentByOrder,
  colonOrders,
  imageOrderByOrder,
  priceOverridesByOrder,
  removedOrders,
} from "./experience-client-overrides.js";

const textFiles = import.meta.glob("../../assets/mono_experience_by_cuanto/**/*.txt", {
  query: "?raw",
  import: "default",
  eager: true,
});

const mediaFiles = import.meta.glob("../../assets/mono_experience_by_cuanto_optimized/**/*.jpg", {
  query: "?url",
  import: "default",
  eager: true,
});

const photoFiles = import.meta.glob("../../assets/photos/*.{jpg,jpeg,png,JPG,JPEG,PNG}", {
  query: "?url",
  import: "default",
  eager: true,
});

const COVER_FOLDER_PREFIX = "FOTOS PARA PORTADA";
const ROOT_MARKERS = ["/mono_experience_by_cuanto_optimized/", "/mono_experience_by_cuanto/"];

const destinationMeta = {
  "Panama City": {
    slug: "panama-city",
    region: "Provincia de Panama",
    summary: "Beach, water, cultura, planes sociales, noche, selva y montana cerca de la capital.",
  },
  Shuttles: {
    slug: "shuttles",
    region: "Rutas compartidas",
    summary: "Traslados y rutas compartidas entre hostels, playas, montanas e islas.",
  },
  "Boquete / Provincia de Chiriqui": {
    slug: "boquete-provincia-de-chiriqui",
    region: "Provincia de Chiriqui",
    summary: "Senderos, volcan, cascadas, bosque nuboso y experiencias de montana.",
  },
  "Playa Venao & Los Santos": {
    slug: "playa-venao-los-santos",
    region: "Provincia de Los Santos",
    summary: "Surf, ballenas, Isla Iguana y salidas de playa en el Pacifico.",
  },
  "Kuna Yala / San Blas": {
    slug: "kuna-yala-san-blas",
    region: "Comarca Kuna Yala",
    summary: "Escapes de dia y overnight en el archipielago de Kuna Yala.",
  },
};

const categoryMeta = {
  "Beach & Water Experiences": "beach-water-experiences",
  "Cultural Experiences": "cultural-experiences",
  "Extreme Experiences": "extreme-experiences",
  "Free Experiences & Socials": "free-experiences-socials",
  Nightlife: "nightlife",
  "Jungle & Mountain Experiences": "jungle-mountain-experiences",
  "Colón & Sister Moon Experiences": "colon-sister-moon-experiences",
  "Boquete & Chiriqui Province": "boquete-chiriqui-province",
  "Playa Venao & Los Santos Province": "playa-venao-los-santos-province",
  "Kuna Yala / San Blas": "kuna-yala-san-blas",
  "Shuttles & Logistics": "shuttles-logistics",
  "Shuttle Tours": "shuttle-tours",
};

// Provincia mostrada en el selector de categorias, para que se distinga de
// un vistazo a que zona pertenece cada categoria (p.ej. Colon vs Panama City).
// Se indexa por la misma clave "destination" que usa catalogGroupsByDestination,
// que para los grupos "flat" es el nombre de la categoria (no hay destino real).
const destinationProvinceLabel = {
  "Panama City": "Panamá",
  Shuttles: "Rutas compartidas",
  "Boquete / Provincia de Chiriqui": "Chiriquí",
  "Playa Venao & Los Santos": "Los Santos",
  "Kuna Yala / San Blas": "Kuna Yala",
  "Beach & Water Experiences": "Panamá",
  [COLON_DESTINATION]: "Colón",
};

/**
 * Provincias que el panel de admin puede asignar a una experiencia (Fase 1
 * de "todo editable desde el panel", 2026-08-24). El vocabulario en si
 * (cuales provincias/categorias existen) sigue siendo de codigo -- lo que se
 * vuelve editable es CUAL de estas le corresponde a cada experiencia.
 * Los codigos coinciden con el check constraint de experiences.province
 * (migracion 023) y con la lista de provincias exclusivas para reservas.
 */
export const provinceOptions = [
  { value: "panama_city", label: "Panamá (From Panama City)" },
  { value: "colon", label: "Colón" },
  { value: "chiriqui", label: "Chiriquí (Boquete)" },
  { value: "los_santos", label: "Los Santos (Playa Venao)" },
  { value: "kuna_yala", label: "Kuna Yala" },
  { value: "shuttles", label: "Shuttles" },
];

export const provinceCodeToDestination = {
  panama_city: "Panama City",
  colon: COLON_DESTINATION,
  chiriqui: "Boquete / Provincia de Chiriqui",
  los_santos: "Playa Venao & Los Santos",
  kuna_yala: "Kuna Yala / San Blas",
  shuttles: "Shuttles",
};

const catalogGroupsByDestination = [
  {
    destination: "Panama City",
    categories: [
      ["Cultural Experiences", [7, 16, 22, 38, 40]],
      // Extreme Park (10) y Longest Zip-Line (19) son productos de Colon:
      // vivian tambien aca por un pedido anterior del cliente, pero el
      // 2026-08-23 pidio que Colon & Sister Moon quede totalmente separado de
      // From Panama City, asi que salen de esta lista y se quedan solo en
      // Colon & Sister Moon Experiences (colonOrders).
      ["Extreme Experiences", [23, 32]],
      ["Free Experiences & Socials", [11, 12, 33, 41, 46]],
      ["Nightlife", [24]],
      ["Jungle & Mountain Experiences", [8, 13, 43]],
    ],
  },
  // Categorias independientes, fuera del agrupador "From Panama City", tal como
  // estan en Cuanto (capturas del cliente, 2026-08-10). `flat: true` hace que
  // se rendericen como una entrada suelta del desplegable en vez de como un
  // encabezado de destino con una sola categoria adentro.
  {
    destination: "Beach & Water Experiences",
    flat: true,
    categories: [["Beach & Water Experiences", [9, 17, 26, 27, 34, 36]]],
  },
  // Colon SI tiene encabezado propio (no `flat`), igual que Boquete/Los
  // Santos/Kuna Yala: es su propia provincia, no una categoria suelta de
  // Panama City (pedido del cliente, 2026-08-23 -- antes se veia mezclada
  // con la lista de Panama City porque no tenia encabezado que la separara).
  {
    destination: COLON_DESTINATION,
    // e-009 Caribbean Island Day Escape vive solo en Beach & Water / From
    // Panama City (pedido del cliente, 2026-08-23): no debe listarse tambien
    // aca, asi que Colon & Sister Moon se queda con sus 5 propias.
    categories: [[COLON_CATEGORY, [...colonOrders]]],
  },
  {
    destination: "Shuttles",
    categories: [
      ["Shuttles & Logistics", [2, 3, 4, 5, 6, 20, 21, 28]],
      ["Shuttle Tours", [30, 31]],
    ],
  },
  {
    destination: "Boquete / Provincia de Chiriqui",
    categories: [["Boquete & Chiriqui Province", [1, 15, 18, 39, 42, 44]]],
  },
  {
    destination: "Playa Venao & Los Santos",
    categories: [["Playa Venao & Los Santos Province", [14, 45]]],
  },
  {
    // Kuna Yala es un filtro especifico de destino, no una segunda copia de la
    // categoria generica Beach & Water. Debe devolver solo sus propias actividades.
    destination: "Kuna Yala / San Blas",
    categories: [["Kuna Yala / San Blas", [26, 27]]],
  },
];

const primaryCatalogByOrder = {
  1: ["Boquete / Provincia de Chiriqui", "Boquete & Chiriqui Province"],
  2: ["Shuttles", "Shuttles & Logistics"],
  3: ["Shuttles", "Shuttles & Logistics"],
  4: ["Shuttles", "Shuttles & Logistics"],
  5: ["Shuttles", "Shuttles & Logistics"],
  6: ["Shuttles", "Shuttles & Logistics"],
  7: ["Panama City", "Cultural Experiences"],
  8: ["Panama City", "Jungle & Mountain Experiences"],
  9: ["Panama City", "Beach & Water Experiences"],
  10: [COLON_DESTINATION, COLON_CATEGORY],
  11: ["Panama City", "Free Experiences & Socials"],
  12: ["Panama City", "Free Experiences & Socials"],
  13: ["Panama City", "Jungle & Mountain Experiences"],
  14: ["Playa Venao & Los Santos", "Playa Venao & Los Santos Province"],
  15: ["Boquete / Provincia de Chiriqui", "Boquete & Chiriqui Province"],
  16: ["Panama City", "Cultural Experiences"],
  17: ["Panama City", "Beach & Water Experiences"],
  18: ["Boquete / Provincia de Chiriqui", "Boquete & Chiriqui Province"],
  19: [COLON_DESTINATION, COLON_CATEGORY],
  20: ["Shuttles", "Shuttles & Logistics"],
  21: ["Shuttles", "Shuttles & Logistics"],
  22: ["Panama City", "Cultural Experiences"],
  23: ["Panama City", "Extreme Experiences"],
  24: ["Panama City", "Nightlife"],
  26: ["Kuna Yala / San Blas", "Kuna Yala / San Blas"],
  27: ["Kuna Yala / San Blas", "Kuna Yala / San Blas"],
  28: ["Shuttles", "Shuttles & Logistics"],
  29: [COLON_DESTINATION, COLON_CATEGORY],
  30: ["Shuttles", "Shuttle Tours"],
  31: ["Shuttles", "Shuttle Tours"],
  32: ["Panama City", "Extreme Experiences"],
  33: ["Panama City", "Free Experiences & Socials"],
  34: ["Panama City", "Beach & Water Experiences"],
  35: [COLON_DESTINATION, COLON_CATEGORY],
  36: ["Panama City", "Beach & Water Experiences"],
  37: [COLON_DESTINATION, COLON_CATEGORY],
  38: ["Panama City", "Cultural Experiences"],
  39: ["Boquete / Provincia de Chiriqui", "Boquete & Chiriqui Province"],
  40: ["Panama City", "Cultural Experiences"],
  41: ["Panama City", "Free Experiences & Socials"],
  42: ["Boquete / Provincia de Chiriqui", "Boquete & Chiriqui Province"],
  43: ["Panama City", "Jungle & Mountain Experiences"],
  44: ["Boquete / Provincia de Chiriqui", "Boquete & Chiriqui Province"],
  45: ["Playa Venao & Los Santos", "Playa Venao & Los Santos Province"],
  46: ["Panama City", "Free Experiences & Socials"],
};

const spanishTitlesByOrder = {
  1: "Artilleria Hill: el atajo vertical",
  2: "Bocas (Isla Colon) a Boquete",
  3: "Boquete a Bocas (Isla Colon)",
  4: "Boquete a Lost & Found Hostel",
  5: "Boquete a Puerto Viejo, Costa Rica",
  6: "Boquete a Santa Catalina",
  7: "Caminata historica por la Zona del Canal",
  8: "Canones, cascadas escondidas y bienestar en altura",
  9: "Escape de dia a una isla caribena",
  10: "Parque extremo, puentes colgantes y kayaks",
  11: "Walking tour por Casco Viejo",
  12: "Intro femenina a calistenia y encuentro social",
  13: "Caminata al Cerro Chame",
  14: "Isla Iguana y snorkel",
  15: "Caminata India Vieja: el gigante dormido",
  16: "Visita a comunidad indigena",
  17: "Taboga: la isla frente a Panama City",
  18: "Cascadas Jaguata y aguas termales",
  19: "La zip-line individual mas larga de Panama",
  20: "Lost & Found Hostel a Boquete",
  21: "Lost & Found Hostel a Isla Colon, Bocas del Toro",
  22: "Haz tu propio chocolate en Casa Coronel",
  26: "Kuna Yala Castaway: noche y mas alla",
  27: "Kuna Yala en un dia",
  28: "Santa Catalina a Boquete",
  29: "Snorkel en arrecife secreto detras de Isla Grande",
  30: "Shuttle a isla para parejas",
  31: "Shuttle a Santa Catalina",
  32: "Skydive Panama",
  33: "Almuerzo social multi-hostel",
  34: "Stand-up paddle: cuevas escondidas y amanecer frente al skyline",
  35: "Alquiler de tabla de surf",
  36: "Dia de surf: escape desde la ciudad",
  37: "Surf y escape en El Playon",
  38: "Tatuaje neo-tribal panameno",
  39: "Expedicion de las 5 cascadas",
  40: "Primer museo del cacao en Centroamerica",
  41: "Hostel Run Club",
  42: "La leyenda del sendero Pianista",
  43: "Avistamiento de tucanes y montanas frescas cerca de la ciudad",
  44: "Volcan Baru: el punto mas alto de Panama",
  45: "Avistamiento de ballenas e Isla Iguana",
  46: "Yoga y funcionales: esculpe tu cuerpo",
};

const photoByName = Object.fromEntries(
  Object.entries(photoFiles).map(([path, url]) => [path.split("/").pop(), url]),
);

export function img(name) {
  return photoByName[name] || name;
}

const DESTINATION_DISPLAY_OVERRIDES = {
  "Panama City": "From Panama City",
  "Kuna Yala / San Blas": "Kuna Yala",
};

export function destinationDisplayName(destination) {
  return DESTINATION_DISPLAY_OVERRIDES[destination] || destination;
}

function normalizeAssetPath(path) {
  return path.replaceAll("\\", "/");
}

function folderFor(path) {
  const normalized = normalizeAssetPath(path);
  const marker = ROOT_MARKERS.find((item) => normalized.includes(item));
  const afterRoot = marker ? normalized.split(marker)[1] : "";
  return afterRoot.split("/").slice(0, -1).join("/");
}

function fileNameFor(path) {
  return normalizeAssetPath(path).split("/").pop() || "";
}

function isCoverFolder(folder) {
  return folder.toUpperCase().startsWith(COVER_FOLDER_PREFIX);
}

function orderFromFolder(folder) {
  return Number(folder.match(/^(\d+)/)?.[1] || 999);
}

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function catalogGroupsForOrder(order) {
  const groups = [];
  for (const group of catalogGroupsByDestination) {
    for (const [category, orders] of group.categories) {
      if (orders.includes(order)) groups.push({ destination: group.destination, category });
    }
  }
  // El destino/categoria "primario" (primaryCatalogByOrder, tambien usado
  // para el badge de la tarjeta) siempre cuenta como catalogGroup, aunque no
  // este listado aparte en catalogGroupsByDestination -- si no, un click en
  // el encabezado de destino (p.ej. "From Panama City") no encuentra
  // experiencias como Caribbean Island Day Escape, que solo estaba listada
  // bajo la categoria suelta "Beach & Water Experiences" y nunca bajo
  // destination: "Panama City".
  const primary = primaryCatalogByOrder[order];
  if (primary) {
    const [destination, category] = primary;
    if (!groups.some((g) => g.destination === destination && g.category === category)) {
      groups.push({ destination, category });
    }
  }
  return groups;
}

function imagePriority(path) {
  const lower = path.toLowerCase();
  if (lower.includes("captura de pantalla")) return 2;
  if (lower.includes("gemini_generated")) return 3;
  return 1;
}

const mediaByFolder = new Map();
for (const [path, url] of Object.entries(mediaFiles)) {
  const folder = folderFor(path);
  if (!mediaByFolder.has(folder)) mediaByFolder.set(folder, []);
  mediaByFolder.get(folder).push({ path, url });
}

// Orden de galeria pedido por el cliente: fragmentos de nombre de archivo
// listados primero, en el orden dado. Lo que no esta listado conserva su
// posicion relativa al final, asi que esto reordena sin agregar, quitar ni
// reemplazar ninguna imagen.
function imageRank(path, fragments) {
  const name = fileNameFor(path);
  const index = fragments.findIndex((fragment) => name.includes(fragment));
  return index === -1 ? fragments.length : index;
}

for (const [folder, images] of mediaByFolder.entries()) {
  images.sort((a, b) => imagePriority(a.path) - imagePriority(b.path) || naturalSort(a.path, b.path));
  const fragments = imageOrderByOrder[orderFromFolder(folder)];
  if (fragments) {
    images.sort((a, b) => imageRank(a.path, fragments) - imageRank(b.path, fragments));
  }
  mediaByFolder.set(folder, images.map((image) => image.url));
}

const homeCoverFolder = [...mediaByFolder.keys()].find((folder) => isCoverFolder(folder));
export const homeCoverImages = homeCoverFolder ? [...(mediaByFolder.get(homeCoverFolder) || [])] : [];
const shuttleCoverImage = Object.entries(mediaFiles)
  .find(([path]) => path.endsWith("/Gemini_Generated_Image_c2hr7jc2hr7jc2hr.jpg"))?.[1]
  || homeCoverImages[0];

const shuttleImageFilenameByOrder = new Map([
  [4, "Gemini_Generated_Image_ygxh6nygxh6nygxh.jpg"],
  [5, "Gemini_Generated_Image_1xm6n31xm6n31xm6.jpg"],
  [6, "Gemini_Generated_Image_tg7boxtg7boxtg7b.jpg"],
  [20, "Gemini_Generated_Image_8rs3u38rs3u38rs3.jpg"],
]);

const shuttleImageByOrder = new Map(
  [...shuttleImageFilenameByOrder.entries()]
    .map(([order, filename]) => {
      const image = Object.entries(mediaFiles)
        .find(([path]) => orderFromFolder(folderFor(path)) === order && path.endsWith(`/${filename}`))?.[1];
      return [order, image];
    })
    .filter(([, image]) => Boolean(image)),
);

function stripLeadingSymbol(value) {
  return cleanDisplayText(value).replace(/^[^\p{L}\p{N}"'“¿¡]+/u, "").trim();
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['"“”‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function field(text, label) {
  const match = text.match(new RegExp(`^${label}:\\s*(.+)$`, "im"));
  return cleanDisplayText(match?.[1] || "");
}

function priceFrom(text) {
  const raw = field(text, "Precio").replace(/[^0-9.,]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function descriptionFrom(text) {
  const marker = text.search(/Descripcion completa:/i);
  const raw = marker >= 0 ? text.slice(marker).replace(/Descripcion completa:/i, "") : text;
  const withoutSourceFooter = raw.replace(/-{3,}\s*\r?\nFuente:[\s\S]*$/i, "");
  const cleaned = withoutSourceFooter
    .replace(/^\s*-{3,}\s*/m, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => cleanDisplayText(line))
    .join("\n")
    .trim();
  return /^\(sin descripcion en cuanto\)$/i.test(cleaned) ? "" : cleaned;
}

function firstContentLine(text) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => cleanDisplayText(line))
    .find((line) => line && !/^=+$/.test(line) && !/^-+$/.test(line)) || "";
}

function paragraphsFrom(description) {
  return description
    .split(/\n\s*\n/g)
    .map((item) => cleanDisplayText(item))
    .filter(Boolean);
}

function truncateSentence(value, maxLength = 190) {
  const clean = cleanDisplayText(value).replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 80)).trim()}...`;
}

function keywordText(...values) {
  return values.join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function inferCategory(rawCategory, title, description) {
  const text = keywordText(rawCategory, title, description);
  if (/shuttle|logistic|traslado|boquete\s*-|bocas\s*\(|lost & found hostel/.test(text)) return "Shuttles";
  if (/extreme|hanging|zip|skydive|volcano|hike|waterfall|canyon|jungle|mountain|pianist|artilleria|jaguata|toucan/.test(text)) {
    return "Aventura";
  }
  if (/surf|snorkel|island|san blas|spearfish|whale|paddle|kayak|beach|playon|taboga|catalina|reef|caribbean/.test(text)) {
    return "Playa y agua";
  }
  if (/yoga|calisthenics|run club|wellness|functionals|sculpt/.test(text)) return "Bienestar";
  if (/cacao|chocolate|canal|casco|indigenous|tattoo|community|museum|history|cultural/.test(text)) return "Cultura";
  if (/hostel|hangout|lunch|social/.test(text)) return "Social";
  return "Aventura";
}

function inferDestination(title, category, rawCategory, description) {
  const text = keywordText(title, category, rawCategory, description);
  if (category === "Shuttles") return "Rutas y traslados";
  if (/san blas|guna yala/.test(text)) return "San Blas";
  if (/bocas|isla colon|puerto viejo|isla grande|caribbean|reef/.test(text)) return "Caribe";
  if (/boquete|chiriqui|volcano|baru|lost & found|pianist|jaguata|artilleria/.test(text)) return "Boquete y Chiriqui";
  if (/santa catalina|surf|playon|whale|spearfish|iguana|chame|pacific/.test(text)) return "Pacifico";
  if (/indigenous|community|embera/.test(text)) return "Cultura y comunidades";
  if (/canal|casco|panama city|taboga|toucan|calisthenics|yoga|cacao|chocolate|tattoo|stand-up|run club|daily lunch/.test(text)) {
    return "Panama City";
  }
  return "Panama City";
}

function inferDuration(title, category, description) {
  const text = keywordText(title, category, description);
  if (/overnight|beyond|castaway/.test(text)) return 36;
  if (/puerto viejo|bocas|santa catalina|boquete\s*-|shuttle/.test(text)) return 6;
  if (/san blas|day trip|island day|whale|chame|iguana|indigenous/.test(text)) return 10;
  if (/hike|waterfall|canyon|volcano|zip|skydive|surf day|spearfish|kayak|paddle/.test(text)) return 5;
  if (/walking|canal|casco|cacao|chocolate|museum|tattoo/.test(text)) return 3;
  if (/yoga|calisthenics|run club|lunch|rental/.test(text)) return 2;
  return 4;
}

function inferCapacity(category, title) {
  const text = keywordText(category, title);
  if (category === "Shuttles") return { minGuests: 1, maxGuests: 14 };
  if (/san blas|whale|island|snorkel/.test(text)) return { minGuests: 1, maxGuests: 12 };
  if (/yoga|calisthenics|run club|lunch|walking/.test(text)) return { minGuests: 1, maxGuests: 20 };
  return { minGuests: 1, maxGuests: 10 };
}

function meetingPointFor(destination, category) {
  if (destination === "Shuttles" || /shuttle/i.test(category)) return "Punto de salida de la ruta, confirmado por WhatsApp antes del traslado.";
  if (destination === "Panama City") return "Punto de encuentro en Panama City, confirmado por WhatsApp.";
  if (destination === "Boquete / Provincia de Chiriqui") return "Punto de encuentro en Boquete o Chiriqui, confirmado por WhatsApp.";
  if (destination === "Playa Venao & Los Santos") return "Punto de encuentro de playa o pickup acordado por WhatsApp.";
  if (destination === "Kuna Yala / San Blas") return "Pickup o punto de salida confirmado por WhatsApp segun cupo y operador.";
  return "Punto de encuentro confirmado por WhatsApp.";
}

function includedFor(category) {
  const base = ["Coordinacion Mono Solo por WhatsApp", "Experiencia descrita en el detalle original", "Soporte operativo antes de la salida"];
  if (/shuttle/i.test(category)) return ["Traslado compartido segun ruta", ...base];
  if (/beach|water|playa|agua|surf|snorkel/i.test(category)) return ["Actividad acuatica o de playa indicada", ...base];
  if (/extreme|jungle|mountain|boquete|chiriqui|colon/i.test(category)) return ["Ruta o actividad guiada indicada", ...base];
  return base;
}

function requirementsFor(category) {
  const base = ["Confirmar disponibilidad antes de la salida", "Llegar con tiempo al punto acordado", "Llevar documento de identidad"];
  if (/beach|water|playa|agua|surf|snorkel/i.test(category)) return ["Traje de bano, toalla y proteccion solar", ...base];
  if (/extreme|jungle|mountain|boquete|chiriqui|colon/i.test(category)) return ["Zapatos comodos o cerrados y ropa para moverse", "Agua personal", ...base];
  if (/shuttle/i.test(category)) return ["Estar listo en la ventana de salida indicada", "Equipaje manejable para traslado compartido", ...base];
  return base;
}

function highlightsFrom(description) {
  const lines = description
    .split("\n")
    .map((line) => cleanDisplayText(line))
    .filter((line) => line.length > 24 && line.length < 190)
    .filter((line) => !/^[-=]+$/.test(line))
    .filter((line) => !/^Link:|^Precio:|^Moneda:|^Categorias:|^Publicado:/i.test(line));

  const preferred = lines.filter((line) => /:|^\d+\.|The |La |El |We |You |Pick|Departure|Route|Journey|Experience/i.test(line));
  return (preferred.length ? preferred : lines).slice(0, 5);
}

// Los titulos que dio el cliente estan marcados VERBATIM en el change request,
// asi que se usan tal cual en ambos idiomas en vez de retraducirse al espanol.
function spanishTitleFor(order, fallback) {
  return clientContentByOrder[order]?.title
    || spanishTitlesByOrder[order]
    || cleanDisplayText(fallback);
}

const englishTitleOverridesByOrder = {
  13: "Hiking Chame Hill", // client renamed, dropped "& Ocean Lunch" (2026-08-24).
};

function englishTitleFor(order, fallback) {
  return clientContentByOrder[order]?.title || englishTitleOverridesByOrder[order] || fallback;
}

function spanishShortDescription(title, destination, category, duration) {
  if (/shuttle/i.test(category)) {
    return `Ruta compartida ${title.toLowerCase()} con coordinacion local, cupos limitados y salida confirmada antes del viaje.`;
  }
  if (/beach|water|playa|agua|surf|snorkel/i.test(category)) {
    return `${title} combina mar, naturaleza y logistica local para una salida clara desde ${destination}.`;
  }
  if (/extreme|jungle|mountain|boquete|chiriqui|colon/i.test(category)) {
    return `${title} es una experiencia activa en ${destination}, pensada para viajeros que quieren moverse, explorar y reservar con cupo confirmado.`;
  }
  if (/cultural/i.test(category)) {
    return `${title} conecta historia, identidad local y acompanamiento operativo en ${destination}.`;
  }
  if (/free|social/i.test(category)) {
    return `${title} propone una pausa activa y social en ${destination}, con cupos simples de coordinar.`;
  }
  return `${title} es una salida social curada en ${destination}, con duracion aproximada de ${duration} horas y reserva previa.`;
}

function spanishFullDescription({ title, destination, category, duration }) {
  const intro = `${title} es una experiencia de Mono Solo Travel en ${destination}. La salida se maneja con cupos por fecha, punto de encuentro confirmado y acompanamiento operativo antes de la actividad.`;
  const byCategory = {
    Shuttles:
      "Esta ruta esta pensada para resolver el traslado sin vueltas innecesarias: confirmas tu cupo, recibes la informacion de salida y viajas con una coordinacion clara.",
    "Playa y agua":
      "La experiencia prioriza agua, paisaje y tiempo real para disfrutar el destino, manteniendo una logistica simple para llegar, participar y regresar sin friccion.",
    Aventura:
      "Es una salida activa: conviene llegar con ropa comoda, agua personal y disposicion para moverse. La intensidad puede variar segun clima, cupo y operador local.",
    Cultura:
      "El enfoque esta en conocer mejor el territorio, su historia y sus comunidades, con una experiencia guiada o coordinada segun el operador disponible.",
    Bienestar:
      "El plan combina movimiento, energia social y una experiencia accesible para viajeros que quieren sumar una actividad saludable durante su paso por Panama.",
    Social:
      "Es una experiencia pensada para conocer gente, compartir un plan local y entrar en la dinamica social de Mono Solo sin complicarse con la logistica.",
  };
  const normalizedCategory = /shuttle/i.test(category)
    ? "Shuttles"
    : /beach|water|playa|agua|surf|snorkel/i.test(category)
      ? "Playa y agua"
      : /extreme|jungle|mountain|boquete|chiriqui|colon/i.test(category)
        ? "Aventura"
        : /cultural/i.test(category)
          ? "Cultura"
          : /free|social/i.test(category)
            ? "Social"
            : category;
  const details =
    "La reserva no exige pago inmediato. Una vez enviada, Mono Solo valida disponibilidad y comparte los siguientes pasos por el canal de contacto registrado.";
  const timing = `Duracion aproximada: ${duration} ${duration === 1 ? "hora" : "horas"}. Los horarios finales pueden ajustarse segun cupos, clima y condiciones del operador.`;
  return cleanDisplayText([intro, byCategory[normalizedCategory] || byCategory.Social, timing, details].join("\n\n"));
}

function spanishHighlightsFor(category) {
  if (/shuttle/i.test(category)) {
    return [
      "Confirmacion del punto de salida antes del traslado",
      "Ruta compartida con cupos limitados",
      "Coordinacion local para reducir cambios de ultimo minuto",
      "Informacion clara de horario, equipaje y punto de llegada",
    ];
  }
  if (/beach|water|playa|agua|surf|snorkel/i.test(category)) {
    return [
      "Salida enfocada en mar, playa o actividad acuatica",
      "Tiempo para disfrutar el destino y tomar fotos",
      "Recomendaciones previas de ropa, proteccion solar y efectivo",
      "Coordinacion del punto de encuentro segun operador y cupo",
    ];
  }
  if (/extreme|jungle|mountain|boquete|chiriqui|colon/i.test(category)) {
    return [
      "Actividad al aire libre con briefing operativo",
      "Ruta o experiencia guiada segun disponibilidad local",
      "Recomendaciones de seguridad antes de salir",
      "Cupos limitados para mantener una experiencia manejable",
    ];
  }
  if (/cultural/i.test(category)) {
    return [
      "Contexto local e historico durante la experiencia",
      "Encuentro con lugares, relatos o comunidades del destino",
      "Ritmo apto para aprender, caminar y hacer preguntas",
      "Coordinacion previa para confirmar punto y horario",
    ];
  }
  if (/free|social/i.test(category)) {
    return [
      "Actividad fisica o de bienestar en formato accesible",
      "Ambiente social para viajeros",
      "Indicaciones previas sobre ropa y nivel recomendado",
      "Reserva flexible sin pago obligatorio inmediato",
    ];
  }
  return [
    "Plan social curado por Mono Solo",
    "Cupos y punto de encuentro confirmados antes de la salida",
    "Experiencia pensada para conectar con otros viajeros",
    "Seguimiento operativo despues de reservar",
  ];
}

// Equivalentes en ingles del fallback honesto de arriba, usados solo cuando la
// carpeta origen no tiene descripcion original de Cuanto en ningun idioma.
function englishShortDescriptionFallback(title, destination, category, duration) {
  if (/shuttle/i.test(category)) {
    return `Shared shuttle route for ${title.toLowerCase()}, with local coordination, limited seats and a confirmed departure before travel.`;
  }
  if (/beach|water|surf|snorkel/i.test(category)) {
    return `${title} combines the sea, nature and local logistics for a clear departure from ${destination}.`;
  }
  if (/extreme|jungle|mountain|boquete|chiriqui|colon/i.test(category)) {
    return `${title} is an active experience in ${destination}, built for travelers who want to move, explore and book with a confirmed spot.`;
  }
  if (/cultural/i.test(category)) {
    return `${title} connects history, local identity and operational support in ${destination}.`;
  }
  if (/free|social/i.test(category)) {
    return `${title} offers an active, social break in ${destination}, with an easy spot to coordinate.`;
  }
  return `${title} is a curated social outing in ${destination}, roughly ${duration} hours long, booked in advance.`;
}

function englishFullDescriptionFallback({ title, destination, category, duration }) {
  const intro = `${title} is a Mono Solo Travel experience in ${destination}. The departure is managed with per-date seats, a confirmed meeting point and operational support before the activity.`;
  const byCategory = {
    Shuttles:
      "This route is built to handle the transfer without unnecessary detours: you confirm your seat, receive the departure details and travel with clear coordination.",
    "Playa y agua":
      "The experience prioritizes water, scenery and real time to enjoy the destination, keeping simple logistics to arrive, take part and return without friction.",
    Aventura:
      "It is an active outing: bring comfortable clothes, your own water and a willingness to move. Intensity can vary with weather, group size and the local operator.",
    Cultura:
      "The focus is getting to know the area, its history and its communities, through a guided or coordinated experience depending on the operator available.",
    Bienestar:
      "The plan combines movement, social energy and an accessible experience for travelers who want to add a healthy activity during their time in Panama.",
    Social:
      "This experience is built to meet people, share a local plan and step into the Mono Solo social scene without worrying about logistics.",
  };
  const normalizedCategory = /shuttle/i.test(category)
    ? "Shuttles"
    : /beach|water|surf|snorkel/i.test(category)
      ? "Playa y agua"
      : /extreme|jungle|mountain|boquete|chiriqui|colon/i.test(category)
        ? "Aventura"
        : /cultural/i.test(category)
          ? "Cultura"
          : /free|social/i.test(category)
            ? "Social"
            : category;
  const details =
    "Booking does not require immediate payment. Once submitted, Mono Solo confirms availability and shares the next steps through the registered contact channel.";
  const timing = `Approximate duration: ${duration} ${duration === 1 ? "hour" : "hours"}. Final schedules may shift depending on availability, weather and operator conditions.`;
  return cleanDisplayText([intro, byCategory[normalizedCategory] || byCategory.Social, timing, details].join("\n\n"));
}

function englishHighlightsFallback(category) {
  if (/shuttle/i.test(category)) {
    return [
      "Departure point confirmed before the transfer",
      "Shared route with limited seats",
      "Local coordination to reduce last-minute changes",
      "Clear information on schedule, luggage and drop-off point",
    ];
  }
  if (/beach|water|surf|snorkel/i.test(category)) {
    return [
      "Departure focused on the sea, beach or a water activity",
      "Time to enjoy the destination and take photos",
      "Prior recommendations on clothing, sun protection and cash",
      "Meeting point coordinated by operator and availability",
    ];
  }
  if (/extreme|jungle|mountain|boquete|chiriqui|colon/i.test(category)) {
    return [
      "Outdoor activity with an operational briefing",
      "Route or guided experience depending on local availability",
      "Safety recommendations before departure",
      "Limited seats to keep the experience manageable",
    ];
  }
  if (/cultural/i.test(category)) {
    return [
      "Local and historical context during the experience",
      "Encounter with places, stories or communities from the destination",
      "Pace suited for learning, walking and asking questions",
      "Prior coordination to confirm the meeting point and schedule",
    ];
  }
  if (/free|social/i.test(category)) {
    return [
      "Physical or wellness activity in an accessible format",
      "Social atmosphere for travelers",
      "Prior guidance on clothing and recommended level",
      "Flexible booking with no immediate payment required",
    ];
  }
  return [
    "Social plan curated by Mono Solo",
    "Seats and meeting point confirmed before departure",
    "Experience designed to connect with other travelers",
    "Operational follow-up after booking",
  ];
}

function buildExperience(path, text) {
  const folder = folderFor(path);
  const order = orderFromFolder(folder);
  const folderTitle = stripLeadingSymbol(folder.replace(/^\d+\s*-\s*/, ""));
  const originalTitle = cleanDisplayText(stripLeadingSymbol(firstContentLine(text)).replace(/\s+=+$/, "")) || folderTitle;
  const description = descriptionFrom(text);
  const rawCategory = field(text, "Categorias");
  const inferredCategory = inferCategory(rawCategory, originalTitle, description);
  const inferredDestination = inferDestination(originalTitle, inferredCategory, rawCategory, description);
  const catalogGroups = catalogGroupsForOrder(order);
  const primaryCatalog = primaryCatalogByOrder[order] || [inferredDestination, inferredCategory];
  const [destination, category] = primaryCatalog;
  const duration = inferDuration(originalTitle, category, description);
  const capacity = inferCapacity(category, originalTitle);
  const folderImages = mediaByFolder.get(folder) || homeCoverImages;
  const shuttleImage = shuttleImageByOrder.get(order) || shuttleCoverImage;
  const images = destination === "Shuttles" && shuttleImage
    ? [shuttleImage]
    : folderImages;
  const paragraphs = paragraphsFrom(description);
  const cuantoLink = field(text, "Link");
  const slug = slugify(folderTitle || originalTitle);
  const title = spanishTitleFor(order, originalTitle);
  const basePrice = priceFrom(text);
  const realTranslation = spanishTranslationsByOrder[order];
  const shortDescription = realTranslation?.shortDescription
    || spanishShortDescription(title, destination, category, duration);
  const fullDescription = realTranslation?.fullDescription
    || spanishFullDescription({ title, destination, category, duration });
  const itinerary = cleanDisplayList(realTranslation?.itinerary || spanishHighlightsFor(category));
  const englishShortDescription = description
    ? truncateSentence(paragraphs[0] || description)
    : englishShortDescriptionFallback(originalTitle, destination, category, duration);
  const englishFullDescription = description
    || englishFullDescriptionFallback({ title: originalTitle, destination, category, duration });
  const englishItinerary = description
    ? cleanDisplayList(highlightsFrom(description))
    : englishHighlightsFallback(category);

  return {
    id: `e-${String(order).padStart(3, "0")}`,
    legacyId: `e-${String(order).padStart(3, "0")}`,
    slug,
    title,
    originalTitle,
    destination,
    category,
    catalogGroups: catalogGroups.length ? catalogGroups : [{ destination, category }],
    rawCategory,
    shortDescription,
    fullDescription,
    descriptionSections: paragraphsFrom(fullDescription),
    images: images.length ? images : homeCoverImages,
    duration,
    meetingPoint: meetingPointFor(destination, category),
    included: cleanDisplayList(includedFor(category)),
    notIncluded: cleanDisplayList(["Comidas o bebidas no indicadas", "Gastos personales", "Propinas", "Costos adicionales mencionados en la descripcion"]),
    requirements: cleanDisplayList(requirementsFor(category)),
    cancellationPolicy: "Reserva sujeta a cupo y confirmacion operativa. Cambios o cancelaciones se coordinan por WhatsApp segun politica del operador.",
    itinerary,
    basePrice,
    currency: field(text, "Moneda") || "USD",
    rating: null,
    reviewCount: 0,
    status: "active",
    supplierId: null,
    minGuests: capacity.minGuests,
    maxGuests: capacity.maxGuests,
    cuantoLink,
    sourceFolder: folder,
    sourceImageCount: Number(field(text, "Numero de imagenes en Cuanto")) || images.length || 0,
    publishedInCuanto: /^si$/i.test(field(text, "Publicado")),
    translations: {
      es: {
        title,
        shortDescription,
        fullDescription,
        itinerary,
      },
      en: {
        title: englishTitleFor(order, originalTitle),
        shortDescription: englishShortDescription,
        fullDescription: englishFullDescription,
        itinerary: englishItinerary,
      },
    },
  };
}

/**
 * Overlays the client-supplied replacement content onto a parsed experience.
 * The client wrote one English block per experience, marked VERBATIM, so the
 * same copy is used for both languages instead of being re-translated.
 */
function applyClientContent(experience, order) {
  const content = clientContentByOrder[order];
  const price = priceOverridesByOrder[order];
  if (price !== undefined) experience.basePrice = price;
  if (!content) return experience;

  if (content.duration) experience.duration = content.duration;
  if (content.included) experience.included = cleanDisplayList(content.included);
  if (content.notIncluded) experience.notIncluded = cleanDisplayList(content.notIncluded);
  if (content.requirements) experience.requirements = cleanDisplayList(content.requirements);

  const itinerary = content.itinerary ? cleanDisplayList(content.itinerary) : null;
  if (itinerary) experience.itinerary = itinerary;

  if (content.fullDescription) {
    experience.fullDescription = content.fullDescription;
    experience.descriptionSections = paragraphsFrom(content.fullDescription);
    experience.shortDescription = content.shortDescription
      || truncateSentence(paragraphsFrom(content.fullDescription)[0] || content.fullDescription);
  } else if (content.shortDescription) {
    experience.shortDescription = content.shortDescription;
  }

  for (const language of ["es", "en"]) {
    const translation = experience.translations[language];
    if (content.title) translation.title = content.title;
    if (content.fullDescription) {
      translation.fullDescription = experience.fullDescription;
      translation.shortDescription = experience.shortDescription;
    }
    if (itinerary) translation.itinerary = itinerary;
  }

  return experience;
}

/**
 * Builds an experience authored from the client brief, with no Cuanto source.
 *
 * Client-verbatim entries carry a single English block that is reused for both
 * languages. Entries where the client asked for written-from-scratch copy can
 * add a `spanish` block; when present it becomes the ES translation and the
 * record's base fields, matching how parsed experiences are stored.
 */
function buildAuthoredExperience(entry) {
  const { order, destination, category } = entry;
  const catalogGroups = catalogGroupsForOrder(order);
  const fullDescription = cleanDisplayText(entry.fullDescription);
  const shortDescription = cleanDisplayText(entry.shortDescription);
  const itinerary = cleanDisplayList(entry.itinerary);
  const capacity = inferCapacity(category, entry.title);
  const folder = entry.sourceFolder || "";
  const images = mediaByFolder.get(folder) || homeCoverImages;
  const english = {
    title: entry.title,
    shortDescription,
    fullDescription,
    itinerary,
  };
  const translation = entry.spanish
    ? {
      title: entry.spanish.title || entry.title,
      shortDescription: cleanDisplayText(entry.spanish.shortDescription),
      fullDescription: cleanDisplayText(entry.spanish.fullDescription),
      itinerary: cleanDisplayList(entry.spanish.itinerary),
    }
    : english;

  return {
    id: `e-${String(order).padStart(3, "0")}`,
    legacyId: `e-${String(order).padStart(3, "0")}`,
    slug: entry.slug || slugify(entry.title),
    title: translation.title,
    originalTitle: entry.title,
    destination,
    category,
    catalogGroups: catalogGroups.length ? catalogGroups : [{ destination, category }],
    rawCategory: category,
    shortDescription: translation.shortDescription,
    fullDescription: translation.fullDescription,
    descriptionSections: paragraphsFrom(translation.fullDescription),
    images,
    duration: entry.duration,
    meetingPoint: meetingPointFor(destination, category),
    included: cleanDisplayList(entry.included),
    notIncluded: cleanDisplayList(entry.notIncluded),
    requirements: cleanDisplayList(entry.requirements),
    cancellationPolicy: "Reserva sujeta a cupo y confirmacion operativa. Cambios o cancelaciones se coordinan por WhatsApp segun politica del operador.",
    itinerary: translation.itinerary,
    // BLOQUEADO (B3): el cliente todavia no dio un precio, asi que no se
    // presenta nada como si fuera dato comercial final.
    basePrice: 0,
    currency: "USD",
    rating: null,
    reviewCount: 0,
    status: "active",
    supplierId: null,
    minGuests: capacity.minGuests,
    maxGuests: capacity.maxGuests,
    cuantoLink: "",
    sourceFolder: folder,
    sourceImageCount: images.length,
    publishedInCuanto: false,
    translations: { es: { ...translation }, en: { ...english } },
  };
}

export const monoExperiences = Object.entries(textFiles)
  .filter(([path]) => !isCoverFolder(folderFor(path)))
  .filter(([path]) => !removedOrders.has(orderFromFolder(folderFor(path))))
  .map(([path, text]) => {
    const order = orderFromFolder(folderFor(path));
    return applyClientContent(buildExperience(path, text), order);
  })
  .concat(authoredExperiences.map((entry) => buildAuthoredExperience(entry)))
  .sort((a, b) => naturalSort(a.id, b.id));

export const monoCategories = Object.entries(categoryMeta)
  .filter(([name]) => monoExperiences.some((experience) => experience.catalogGroups?.some((group) => group.category === name)))
  .map(([name, slug], index) => ({ id: `cat-${index + 1}`, name, slug }));

export const monoDestinations = Object.entries(destinationMeta)
  .filter(([name]) => monoExperiences.some((experience) => experience.catalogGroups?.some((group) => group.destination === name)))
  .map(([name, meta], index) => {
    const experience = monoExperiences.find((item) => item.catalogGroups?.some((group) => group.destination === name));
    return {
      id: `d-${index + 1}`,
      slug: meta.slug,
      name,
      region: meta.region,
      image: experience?.images?.[0] || homeCoverImages[0],
      summary: meta.summary,
    };
  });

export const monoCatalogGroups = catalogGroupsByDestination.map((group, index) => ({
  id: `group-${index + 1}`,
  destination: group.destination,
  flat: Boolean(group.flat),
  province: destinationProvinceLabel[group.destination] || null,
  categories: group.categories
    .map(([category], categoryIndex) => ({
      id: `${slugify(group.destination)}-${categoryIndex + 1}`,
      name: category,
      slug: categoryMeta[category],
      province: destinationProvinceLabel[group.destination] || null,
      count: monoExperiences.filter((experience) => experience.catalogGroups?.some((item) => item.destination === group.destination && item.category === category)).length,
    })),
}));
