import { useEffect, useRef } from "react";

/**
 * Capa ambiental fija detras del contenido.
 *
 * Izquierda: frondas de palma (la mitad selva/montana del catalogo).
 * Derecha: carta nautica - isla con curvas de nivel, oleaje, rosa de los
 * vientos, la ruta punteada y una palma inclinada sobre el cayo (la mitad
 * islas/agua del catalogo).
 *
 * Todo es dibujo vectorial generado por formula: no hay imagenes, ni patrones
 * repetidos, ni dos frondas iguales. Reacciona al puntero y al scroll por
 * parallax escribiendo variables CSS en el contenedor (una sola escritura por
 * frame, sin re-render de React).
 *
 * Es decorativa: aria-hidden, pointer-events none, y se oculta por CSS en
 * viewports estrechos donde no hay margen lateral libre.
 *
 * El viewBox es alto (260x1800) a proposito: con preserveAspectRatio "slice"
 * la escala la manda el ancho en cualquier viewport normal, asi que el dibujo
 * conserva su tamano y la altura solo decide cuanto se ve.
 */
export function AmbientScenery() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let scrollY = window.scrollY;

    const apply = () => {
      frame = 0;
      root.style.setProperty("--ms-mx", pointerX.toFixed(4));
      root.style.setProperty("--ms-my", pointerY.toFixed(4));
      root.style.setProperty("--ms-sy", String(Math.round(scrollY)));
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    const onPointerMove = (event) => {
      pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      pointerY = (event.clientY / window.innerHeight) * 2 - 1;
      schedule();
    };

    const onScroll = () => {
      scrollY = window.scrollY;
      schedule();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="ms-scenery" ref={rootRef} aria-hidden="true">
      <div className="ms-scenery-side ms-scenery-left">
        <PalmCanopy />
      </div>
      <div className="ms-scenery-side ms-scenery-right">
        <SeaChart />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Geometria de la fronda
 * ---------------------------------------------------------------------- */

// Punto y tangente de la nervadura central: bezier cuadratica de (0,0) a
// (length, drop) con el control levantado por `curve`.
function ribAt(t, length, curve, drop) {
  const mt = 1 - t;
  const cx = length * 0.52;
  const cy = -curve;
  const x = 2 * mt * t * cx + t * t * length;
  const y = 2 * mt * t * cy + t * t * drop;
  const dx = 2 * mt * cx + 2 * t * (length - cx);
  const dy = 2 * mt * cy + 2 * t * (drop - cy);
  const len = Math.hypot(dx, dy) || 1;
  return { x, y, tx: dx / len, ty: dy / len };
}

/**
 * `d` de una fronda de coco: nervadura + foliolos largos y finos a ambos
 * lados. Cada foliolo nace de la nervadura, barre hacia la punta y se afina;
 * el largo se modula con un seno para que la fronda adelgace en base y
 * extremo, que es lo que separa una palma de un helecho.
 */
function frondPath({ length, curve, drop, leafLength, count, seed }) {
  const parts = [];
  const rand = mulberry(seed);

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < count; i += 1) {
      const t = 0.05 + (i / (count - 1)) * 0.93;
      const jitter = 0.84 + rand() * 0.32;
      const taper = Math.sin(Math.PI * Math.pow(t, 0.62));
      const leaf = leafLength * taper * jitter;
      if (leaf < 3) continue;

      const base = ribAt(t, length, curve, drop);
      const nx = -base.ty * side;
      const ny = base.tx * side;

      // El foliolo apunta hacia afuera pero peinado hacia la punta: sin ese
      // barrido la fronda parece una hoja compuesta, no una palma.
      const sweep = leaf * (0.72 + t * 0.5);
      const tipX = base.x + nx * leaf + base.tx * sweep;
      const tipY = base.y + ny * leaf + base.ty * sweep;

      const width = Math.max(0.9, leaf * 0.062);
      const backX = base.x + base.tx * width * 2.2;
      const backY = base.y + base.ty * width * 2.2;

      // Panza del foliolo: la cara de fuera abre mas que la de dentro, asi la
      // astilla queda curvada como una hoja real y no como un triangulo.
      const c1x = base.x + nx * leaf * 0.72 + base.tx * sweep * 0.16;
      const c1y = base.y + ny * leaf * 0.72 + base.ty * sweep * 0.16;
      const c2x = backX + nx * leaf * 0.4 + base.tx * sweep * 0.66;
      const c2y = backY + ny * leaf * 0.4 + base.ty * sweep * 0.66;

      parts.push(
        `M${r(base.x)} ${r(base.y)}Q${r(c1x)} ${r(c1y)} ${r(tipX)} ${r(tipY)}Q${r(c2x)} ${r(c2y)} ${r(backX)} ${r(backY)}Z`,
      );
    }
  }

  const tip = ribAt(1, length, curve, drop);
  parts.push(
    `M0 0Q${r(length * 0.52)} ${r(-curve)} ${r(tip.x)} ${r(tip.y)}Q${r(length * 0.52)} ${r(-curve + 3.2)} 0 3Z`,
  );

  return parts.join("");
}

// PRNG determinista: la misma fronda en cada render y en cada visita.
function mulberry(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function r(value) {
  return Math.round(value * 10) / 10;
}

function Frond({ at, rot, scale, sway, spec }) {
  return (
    <g className="ms-frond" data-sway={sway} transform={`translate(${at[0]} ${at[1]}) rotate(${rot}) scale(${scale})`}>
      <g className="ms-sway">
        <path d={frondPath(spec)} />
      </g>
    </g>
  );
}

/* -------------------------------------------------------------------------
 * Lado izquierdo: dosel de palmeras
 * ---------------------------------------------------------------------- */

const canopy = [
  { depth: 3, sway: 0, at: [-30, 92], rot: 24, scale: 1, spec: { length: 250, curve: 80, drop: 34, leafLength: 54, count: 24, seed: 11 } },
  { depth: 2, sway: 1, at: [-42, 250], rot: -8, scale: 0.9, spec: { length: 236, curve: 62, drop: 52, leafLength: 50, count: 23, seed: 23 } },
  { depth: 1, sway: 2, at: [-18, 402], rot: 44, scale: 0.72, spec: { length: 214, curve: 74, drop: 28, leafLength: 46, count: 21, seed: 37 } },
  { depth: 3, sway: 1, at: [-36, 578], rot: -28, scale: 0.94, spec: { length: 242, curve: 60, drop: 58, leafLength: 52, count: 23, seed: 41 } },
  { depth: 2, sway: 0, at: [-24, 742], rot: 16, scale: 0.82, spec: { length: 226, curve: 70, drop: 36, leafLength: 48, count: 22, seed: 59 } },
  { depth: 1, sway: 2, at: [-40, 902], rot: -20, scale: 0.66, spec: { length: 206, curve: 56, drop: 46, leafLength: 44, count: 20, seed: 67 } },
  { depth: 3, sway: 2, at: [-28, 1064], rot: 34, scale: 0.98, spec: { length: 246, curve: 78, drop: 30, leafLength: 53, count: 24, seed: 79 } },
  { depth: 2, sway: 1, at: [-44, 1236], rot: -14, scale: 0.88, spec: { length: 232, curve: 64, drop: 54, leafLength: 49, count: 22, seed: 89 } },
  { depth: 1, sway: 0, at: [-20, 1398], rot: 40, scale: 0.7, spec: { length: 210, curve: 72, drop: 32, leafLength: 45, count: 20, seed: 101 } },
  { depth: 3, sway: 1, at: [-34, 1562], rot: -24, scale: 0.92, spec: { length: 238, curve: 58, drop: 56, leafLength: 51, count: 23, seed: 109 } },
  { depth: 2, sway: 2, at: [-26, 1718], rot: 20, scale: 0.8, spec: { length: 220, curve: 68, drop: 34, leafLength: 47, count: 21, seed: 127 } },
];

function PalmCanopy() {
  return (
    <svg className="ms-scenery-art" viewBox="0 0 260 1800" preserveAspectRatio="xMinYMid slice" focusable="false">
      {[1, 2, 3].map((depth) => (
        <g className="ms-scenery-layer" data-depth={depth} key={depth}>
          {canopy
            .filter((item) => item.depth === depth)
            .map((item) => (
              <Frond key={item.at[1]} {...item} />
            ))}
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------
 * Lado derecho: carta nautica
 * ---------------------------------------------------------------------- */

// Curva cerrada tipo "isla": circunferencia deformada con dos armonicos.
function islandRing({ cx, cy, radius, wobble, phase, steps = 54 }) {
  const points = [];
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const k = 1 + Math.sin(a * 3 + phase) * wobble + Math.sin(a * 5 - phase * 1.7) * wobble * 0.45;
    points.push([cx + Math.cos(a) * radius * k * 1.1, cy + Math.sin(a) * radius * k]);
  }
  return `${points.map(([x, y], i) => `${i ? "L" : "M"}${r(x)} ${r(y)}`).join("")}Z`;
}

// Filas de oleaje: pequenas ondas alineadas, como en una carta de navegacion.
function swellRow({ y, from, to, amplitude, step, phase }) {
  const parts = [];
  for (let x = from; x < to; x += step) {
    const lift = amplitude * (0.6 + Math.sin(x * 0.06 + phase) * 0.4);
    parts.push(`M${r(x)} ${r(y)}q${r(step * 0.25)} ${r(-lift)} ${r(step * 0.5)} 0t${r(step * 0.5)} 0`);
  }
  return parts.join("");
}

// Rosa de los vientos: 16 rumbos, los cardinales mas largos.
function compassRays(cx, cy, radius) {
  const parts = [];
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const inner = radius * (i % 4 === 0 ? 0.32 : 0.78);
    parts.push(
      `M${r(cx + Math.cos(a) * inner)} ${r(cy + Math.sin(a) * inner)}L${r(cx + Math.cos(a) * radius)} ${r(cy + Math.sin(a) * radius)}`,
    );
  }
  return parts.join("");
}

const ISLAND = { cx: 198, cy: 300 };
const CAY = { cx: 176, cy: 1210 };

function SeaChart() {
  return (
    <svg className="ms-scenery-art" viewBox="0 0 260 1800" preserveAspectRatio="xMaxYMid slice" focusable="false">
      {/* Fondo: sondas lejanas y oleaje suave. */}
      <g className="ms-scenery-layer" data-depth="1">
        <path className="ms-chart-line" d={islandRing({ ...ISLAND, radius: 96, wobble: 0.13, phase: 2.7 })} />
        <path className="ms-chart-line" d={islandRing({ ...ISLAND, radius: 124, wobble: 0.14, phase: 3.4 })} />
        <path className="ms-chart-swell" d={swellRow({ y: 486, from: 40, to: 268, amplitude: 5, step: 26, phase: 0.2 })} />
        <path className="ms-chart-swell" d={swellRow({ y: 522, from: 74, to: 268, amplitude: 4, step: 24, phase: 1.4 })} />
        <path className="ms-chart-line" d={islandRing({ ...CAY, radius: 92, wobble: 0.12, phase: 1.1 })} />
        <path className="ms-chart-swell" d={swellRow({ y: 1600, from: 30, to: 268, amplitude: 5, step: 27, phase: 2.1 })} />
        <path className="ms-chart-swell" d={swellRow({ y: 1638, from: 66, to: 268, amplitude: 4, step: 25, phase: 0.6 })} />
      </g>

      {/* Medio: la isla, su costa, la ruta punteada y el cayuco. */}
      <g className="ms-scenery-layer" data-depth="2">
        <path className="ms-chart-line" d={islandRing({ ...ISLAND, radius: 50, wobble: 0.11, phase: 1.1 })} />
        <path className="ms-chart-line" d={islandRing({ ...ISLAND, radius: 70, wobble: 0.12, phase: 2 })} />
        <path className="ms-chart-shore" d={islandRing({ ...ISLAND, radius: 32, wobble: 0.1, phase: 0.4 })} />

        <path className="ms-chart-line" d={islandRing({ ...CAY, radius: 44, wobble: 0.1, phase: 2.4 })} />
        <path className="ms-chart-shore" d={islandRing({ ...CAY, radius: 24, wobble: 0.09, phase: 1.8 })} />

        {/* La ruta: de la isla del norte al cayo del sur. */}
        <path className="ms-chart-route" d="M206 372C236 520 150 640 120 782S150 1040 176 1146" />
      </g>

      {/* Frente: rosa de los vientos y la palma inclinada sobre el cayo. */}
      <g className="ms-scenery-layer" data-depth="3">
        <g className="ms-chart-compass">
          <circle className="ms-chart-line" cx="180" cy="640" r="46" />
          <circle className="ms-chart-line" cx="180" cy="640" r="14" />
          <path className="ms-chart-line" d={compassRays(180, 640, 46)} />
          <path className="ms-chart-shore" d="M180 578 187 634 180 626 173 634Z" />
        </g>

        <g className="ms-chart-palm" transform="translate(214 1256)">
          <path className="ms-chart-trunk" d="M0 0C-8 -40 -6 -78 14 -112" />
          <Frond at={[14, -112]} rot={-62} scale={0.5} sway={0} spec={{ length: 190, curve: 52, drop: 30, leafLength: 40, count: 18, seed: 83 }} />
          <Frond at={[14, -112]} rot={-12} scale={0.46} sway={1} spec={{ length: 182, curve: 44, drop: 38, leafLength: 38, count: 17, seed: 97 }} />
          <Frond at={[14, -112]} rot={36} scale={0.44} sway={2} spec={{ length: 174, curve: 40, drop: 34, leafLength: 37, count: 17, seed: 103 }} />
          <Frond at={[14, -112]} rot={-118} scale={0.42} sway={1} spec={{ length: 166, curve: 46, drop: 28, leafLength: 35, count: 16, seed: 113 }} />
        </g>
      </g>
    </svg>
  );
}
