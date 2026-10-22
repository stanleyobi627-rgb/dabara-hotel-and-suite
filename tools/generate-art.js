/**
 * Generates the original SVG artwork used across the Dabara Hotel and Suites site.
 * Run with:  node tools/generate-art.js
 *
 * Everything is drawn with plain shapes — no external assets, no stock images.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "images");
mkdirSync(outDir, { recursive: true });

/* ------------------------------------------------------------------ */
/* brand recolouring                                                    */
/* ------------------------------------------------------------------ */

/* The illustrations were drawn in a forest-green palette. The site is now
   deep navy and gold, so every green is rotated into the navy band.
   Only the hue moves — saturation, lightness, every shape and every
   path stays exactly as it was, and the gold, terracotta and wood
   tones are left untouched. */
const GREEN_HUE = [85, 180];
const NAVY_HUE = [200, 222];

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return [h, s, l];
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToHex(h, s, l) {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) =>
    Math.round(hueToRgb(p, q, t) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(h / 360 + 1 / 3)}${channel(h / 360)}${channel(h / 360 - 1 / 3)}`;
}

function recolor(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const value = parseInt(match[1], 16);
  let [h, s, l] = rgbToHsl((value >> 16) & 255, (value >> 8) & 255, value & 255);
  if (s < 0.05) return hex; // true greys stay grey
  if (h >= GREEN_HUE[0] && h <= GREEN_HUE[1]) {
    const span = GREEN_HUE[1] - GREEN_HUE[0];
    h = NAVY_HUE[0] + ((h - GREEN_HUE[0]) * (NAVY_HUE[1] - NAVY_HUE[0])) / span;
  }
  return hslToHex(h, s, l);
}

const write = (name, svg) => {
  const recoloured = svg.replace(/#[0-9a-fA-F]{6}\b/g, recolor);
  writeFileSync(join(outDir, name), `${recoloured.trim()}\n`, "utf8");
};

/* ------------------------------------------------------------------ */
/* shared pieces                                                       */
/* ------------------------------------------------------------------ */

function defs(p) {
  return `
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.wallTop}"/>
      <stop offset="1" stop-color="${p.wallBottom}"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.floorTop}"/>
      <stop offset="1" stop-color="${p.floorBottom}"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.skyTop}"/>
      <stop offset="1" stop-color="${p.skyBottom}"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.glow}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.05"/>
    </linearGradient>
  </defs>`;
}

function windowArt(x, y, w, h, p) {
  const bars = [];
  const cols = 2;
  const rows = 2;
  for (let i = 1; i < cols; i += 1) {
    bars.push(`<rect x="${x + (w / cols) * i - 3}" y="${y}" width="6" height="${h}" fill="${p.frame}"/>`);
  }
  for (let i = 1; i < rows; i += 1) {
    bars.push(`<rect x="${x}" y="${y + (h / rows) * i - 3}" width="${w}" height="6" fill="${p.frame}"/>`);
  }
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sky)"/>
      <circle cx="${x + w * 0.72}" cy="${y + h * 0.28}" r="${w * 0.07}" fill="${p.sun}" opacity="0.85"/>
      <path d="M${x} ${y + h} L${x + w * 0.3} ${y + h * 0.55} L${x + w * 0.55} ${y + h} Z" fill="${p.hill}" opacity="0.6"/>
      <path d="M${x + w * 0.45} ${y + h} L${x + w * 0.78} ${y + h * 0.42} L${x + w} ${y + h} Z" fill="${p.hill}" opacity="0.45"/>
      ${bars.join("")}
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${p.frame}" stroke-width="10"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#glass)"/>
      <rect x="${x - 14}" y="${y + h}" width="${w + 28}" height="14" rx="4" fill="${p.frame}"/>
    </g>`;
}

function plant(x, y, scale = 1, p) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M0 0 C -26 -40 -30 -74 -6 -104 C 4 -74 8 -36 0 0 Z" fill="${p.leaf}"/>
      <path d="M0 0 C 26 -44 34 -76 10 -110 C 0 -76 -8 -38 0 0 Z" fill="${p.leaf2}"/>
      <path d="M0 0 C -10 -46 -4 -84 0 -120 C 6 -84 12 -46 0 0 Z" fill="${p.leaf3}"/>
      <path d="M-24 0 h48 l-6 40 h-36 Z" fill="${p.pot}"/>
      <rect x="-26" y="-6" width="52" height="10" rx="4" fill="${p.potDark}"/>
    </g>`;
}

function bedArt(x, y, w, h, p, opts = {}) {
  const pillows = opts.pillows ?? 2;
  const pillowEls = [];
  for (let i = 0; i < pillows; i += 1) {
    const px = x + 26 + i * (w / pillows) * 0.92;
    pillowEls.push(
      `<rect x="${px}" y="${y - 44}" width="${w / pillows - 34}" height="40" rx="16" fill="${p.linen}"/>`,
    );
  }
  return `
    <g>
      <rect x="${x - 10}" y="${y - 110}" width="${w + 20}" height="120" rx="10" fill="${p.headboard}"/>
      <rect x="${x}" y="${y - 34}" width="${w}" height="${h}" rx="10" fill="${p.linen}"/>
      <rect x="${x - 6}" y="${y + h * 0.34}" width="${w + 12}" height="${h * 0.66 + 6}" rx="8" fill="${p.blanket}"/>
      <rect x="${x - 6}" y="${y + h * 0.34}" width="${w + 12}" height="16" rx="6" fill="${p.blanket2}"/>
      ${pillowEls.join("")}
      <rect x="${x + 6}" y="${y + h}" width="12" height="26" rx="5" fill="${p.wood}"/>
      <rect x="${x + w - 18}" y="${y + h}" width="12" height="26" rx="5" fill="${p.wood}"/>
    </g>`;
}

function rug(cx, cy, rx, p) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.22}" fill="${p.rug}" opacity="0.65"/>`;
}

function artFrame(x, y, p) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="118" height="86" rx="6" fill="${p.frame}"/>
      <rect x="${x + 9}" y="${y + 9}" width="100" height="68" rx="3" fill="${p.art}"/>
      <circle cx="${x + 40}" cy="${y + 36}" r="12" fill="${p.art2}"/>
      <path d="M${x + 9} ${y + 77} L${x + 44} ${y + 40} L${x + 74} ${y + 77} Z" fill="${p.art3}"/>
    </g>`;
}

function lamp(x, y, p) {
  return `
    <g>
      <rect x="${x - 4}" y="${y}" width="8" height="56" rx="4" fill="${p.wood}"/>
      <ellipse cx="${x}" cy="${y + 58}" rx="18" ry="6" fill="${p.wood}"/>
      <path d="M${x - 26} ${y - 6} L${x + 26} ${y - 6} L${x + 16} ${y - 44} L${x - 16} ${y - 44} Z" fill="${p.lamp}"/>
      <ellipse cx="${x}" cy="${y - 48}" rx="17" ry="5" fill="${p.lampDark}"/>
      <path d="M${x - 30} ${y - 40} L${x + 30} ${y - 40} L${x + 96} ${y + 120} L${x - 96} ${y + 120} Z" fill="url(#glow)"/>
    </g>`;
}

/* ------------------------------------------------------------------ */
/* palettes                                                            */
/* ------------------------------------------------------------------ */

const PALETTES = {
  standard: {
    wallTop: "#f3ead9",
    wallBottom: "#e6d9c2",
    floorTop: "#c9a97f",
    floorBottom: "#a8865f",
    frame: "#3c2f24",
    skyTop: "#bcdcf0",
    skyBottom: "#eaf3f7",
    sun: "#f6d98a",
    hill: "#7d9a72",
    linen: "#fbf7ef",
    blanket: "#2e5a3e",
    blanket2: "#1f3d2b",
    headboard: "#6b4f36",
    wood: "#8a6a48",
    rug: "#c9a227",
    pot: "#b9714a",
    potDark: "#8f5333",
    leaf: "#2f6b45",
    leaf2: "#3c7d53",
    leaf3: "#25583a",
    lamp: "#e6c978",
    lampDark: "#c9a227",
    art: "#f6efe1",
    art2: "#c9a227",
    art3: "#2e5a3e",
    glow: "#ffd98a",
  },
  twin: {
    wallTop: "#eef1ee",
    wallBottom: "#dde3de",
    floorTop: "#b9a68d",
    floorBottom: "#99866e",
    frame: "#2f3a35",
    skyTop: "#cfe4f2",
    skyBottom: "#eff6f9",
    sun: "#f2d694",
    hill: "#6f8f74",
    linen: "#f7faf8",
    blanket: "#4a6b7c",
    blanket2: "#3a5563",
    headboard: "#4d5b54",
    wood: "#7d6a53",
    rug: "#8fa7b3",
    pot: "#9aa79f",
    potDark: "#77857d",
    leaf: "#2c6045",
    leaf2: "#397a54",
    leaf3: "#234f3a",
    lamp: "#dfe6e2",
    lampDark: "#b7c4bd",
    art: "#f4f7f5",
    art2: "#4a6b7c",
    art3: "#3c7350",
    glow: "#d8e6df",
  },
  deluxe: {
    wallTop: "#f7efe0",
    wallBottom: "#e9dcc6",
    floorTop: "#b98f5f",
    floorBottom: "#96693e",
    frame: "#33261d",
    skyTop: "#f0c98f",
    skyBottom: "#fae4bd",
    sun: "#f0a94c",
    hill: "#7a6a4e",
    linen: "#fffdf8",
    blanket: "#7d2f2a",
    blanket2: "#61221f",
    headboard: "#4a3527",
    wood: "#7a5738",
    rug: "#c9a227",
    pot: "#a9603c",
    potDark: "#82462a",
    leaf: "#275c3c",
    leaf2: "#33724c",
    leaf3: "#1d4b32",
    lamp: "#f0cf7f",
    lampDark: "#c9a227",
    art: "#fbf3e4",
    art2: "#c9a227",
    art3: "#7d2f2a",
    glow: "#ffd489",
  },
  garden: {
    wallTop: "#eef4ea",
    wallBottom: "#dfe9d9",
    floorTop: "#c2a882",
    floorBottom: "#a2875f",
    frame: "#33402f",
    skyTop: "#bfe0c6",
    skyBottom: "#e9f5e6",
    sun: "#f5e08d",
    hill: "#3f7a4e",
    linen: "#fdfbf5",
    blanket: "#8fae72",
    blanket2: "#6f9153",
    headboard: "#5d6b4b",
    wood: "#8a6f4c",
    rug: "#9db87e",
    pot: "#b9704a",
    potDark: "#915234",
    leaf: "#2c6b3f",
    leaf2: "#3a8250",
    leaf3: "#215734",
    lamp: "#e9e0b6",
    lampDark: "#c6bb87",
    art: "#f3f8ee",
    art2: "#c9a227",
    art3: "#3f7a4e",
    glow: "#e7f3c9",
  },
  executive: {
    wallTop: "#f1ebe3",
    wallBottom: "#ded4c6",
    floorTop: "#9c6f4c",
    floorBottom: "#7a5133",
    frame: "#2a2118",
    skyTop: "#8fb6d8",
    skyBottom: "#dbe9f4",
    sun: "#f4d07a",
    hill: "#4c5a6b",
    linen: "#fffdf9",
    blanket: "#2b3a55",
    blanket2: "#1e2a3d",
    headboard: "#2f2a26",
    wood: "#5f432c",
    rug: "#8e6a3a",
    pot: "#8f6a4c",
    potDark: "#6d4f37",
    leaf: "#22553a",
    leaf2: "#2e6b48",
    leaf3: "#1a4530",
    lamp: "#e2c276",
    lampDark: "#b08f2c",
    art: "#f6f1e9",
    art2: "#c9a227",
    art3: "#2b3a55",
    glow: "#f6d79a",
  },
  family: {
    wallTop: "#fbf1e0",
    wallBottom: "#efdfc6",
    floorTop: "#c99b6a",
    floorBottom: "#a87a4d",
    frame: "#3a2c20",
    skyTop: "#cfe3ef",
    skyBottom: "#f0f6f9",
    sun: "#f5d98d",
    hill: "#6f8d68",
    linen: "#fffaf1",
    blanket: "#c96a4a",
    blanket2: "#a85337",
    headboard: "#6b4b31",
    wood: "#8a6641",
    rug: "#d9b26a",
    pot: "#a9603c",
    potDark: "#82462a",
    leaf: "#27603f",
    leaf2: "#34754f",
    leaf3: "#1e4c35",
    lamp: "#f2d494",
    lampDark: "#c9a227",
    art: "#fdf4e6",
    art2: "#c96a4a",
    art3: "#2e5a3e",
    glow: "#ffdda0",
  },
  presidential: {
    wallTop: "#f4eee2",
    wallBottom: "#e2d7c2",
    floorTop: "#7f5a3a",
    floorBottom: "#5f3f26",
    frame: "#241a12",
    skyTop: "#7ea6c9",
    skyBottom: "#e6eef6",
    sun: "#f0cd78",
    hill: "#3d4c60",
    linen: "#fffdf8",
    blanket: "#6b2f4a",
    blanket2: "#4f2036",
    headboard: "#241f1c",
    wood: "#4c3320",
    rug: "#7d2f4a",
    pot: "#8a6349",
    potDark: "#6a4a35",
    leaf: "#1f5238",
    leaf2: "#2b6745",
    leaf3: "#183f2c",
    lamp: "#e5c477",
    lampDark: "#b18f2f",
    art: "#f8f2e6",
    art2: "#c9a227",
    art3: "#6b2f4a",
    glow: "#f7d99c",
  },
};

/* ------------------------------------------------------------------ */
/* room scenes                                                         */
/* ------------------------------------------------------------------ */

function roomScene(palette, opts = {}) {
  const p = PALETTES[palette];
  const bedCount = opts.beds ?? 1;
  const hasSofa = opts.sofa ?? false;
  const hasTub = opts.tub ?? false;
  const hasBalcony = opts.balcony ?? false;
  const hasDesk = opts.desk ?? false;

  const beds = [];
  if (bedCount === 1) {
    beds.push(bedArt(300, 350, 340, 120, p, { pillows: 2 }));
  } else {
    beds.push(bedArt(258, 350, 200, 110, p, { pillows: 1 }));
    beds.push(bedArt(486, 350, 200, 110, p, { pillows: 1 }));
  }

  const right = hasSofa
    ? `
      <g>
        <rect x="596" y="316" width="170" height="76" rx="16" fill="${p.blanket2}"/>
        <rect x="596" y="352" width="170" height="26" rx="10" fill="${p.blanket}"/>
        <rect x="590" y="332" width="16" height="62" rx="8" fill="${p.headboard}"/>
        <rect x="756" y="332" width="16" height="62" rx="8" fill="${p.headboard}"/>
        <rect x="618" y="300" width="52" height="34" rx="8" fill="${p.linen}"/>
      </g>`
    : "";

  const left = hasDesk
    ? `
      <g>
        <rect x="70" y="330" width="160" height="12" rx="6" fill="${p.wood}"/>
        <rect x="86" y="342" width="10" height="52" fill="${p.wood}"/>
        <rect x="204" y="342" width="10" height="52" fill="${p.wood}"/>
        <rect x="118" y="286" width="66" height="44" rx="5" fill="${p.frame}"/>
        <rect x="124" y="292" width="54" height="32" rx="3" fill="${p.skyTop}"/>
        <rect x="100" y="300" width="12" height="6" rx="3" fill="${p.rug}"/>
      </g>`
    : "";

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img">
  ${defs(p)}
  <rect width="800" height="600" fill="url(#wall)"/>
  <rect y="420" width="800" height="180" fill="url(#floor)"/>
  <rect y="414" width="800" height="10" fill="${p.headboard}" opacity="0.35"/>
  <g opacity="0.16" stroke="${p.headboard}" stroke-width="2">
    <path d="M0 470 H800 M0 520 H800 M0 570 H800"/>
    <path d="M90 420 L40 600 M300 420 L275 600 M520 420 L545 600 M720 420 L770 600"/>
  </g>
  ${hasBalcony ? windowArt(60, 96, 210, 200, p) : windowArt(66, 92, 196, 194, p)}
  ${artFrame(600, 110, p)}
  ${rug(430, 470, 260, p)}
  ${left}
  ${beds.join("")}
  ${right}
  ${lamp(250, 296, p)}
  <g>
    <rect x="210" y="386" width="62" height="10" rx="5" fill="${p.wood}"/>
    <rect x="216" y="396" width="8" height="24" fill="${p.wood}"/>
    <rect x="258" y="396" width="8" height="24" fill="${p.wood}"/>
  </g>
  ${plant(724, 470, 0.95, p)}
  ${
    hasTub
      ? `<g>
          <path d="M556 300 q120 -22 156 26 l-10 96 q-72 30 -140 12 Z" fill="${p.linen}"/>
          <path d="M566 306 q104 -18 138 22 l-8 78 q-62 26 -122 10 Z" fill="#cfe4ef"/>
          <ellipse cx="640" cy="330" rx="48" ry="16" fill="#e6f2f8"/>
        </g>`
      : ""
  }
  <rect x="0" y="0" width="800" height="600" fill="none"/>
</svg>`;
}

function bathroomScene(palette) {
  const p = PALETTES[palette];
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img">
  ${defs(p)}
  <rect width="800" height="600" fill="url(#wall)"/>
  <rect y="440" width="800" height="160" fill="url(#floor)"/>
  <g opacity="0.25" stroke="${p.frame}" stroke-width="2">
    <path d="M0 200 H800 M0 320 H800 M200 0 V440 M400 0 V440 M600 0 V440"/>
  </g>
  <rect x="70" y="70" width="230" height="300" rx="12" fill="${p.frame}"/>
  <rect x="84" y="84" width="202" height="272" rx="8" fill="${p.skyTop}" opacity="0.5"/>
  <ellipse cx="150" cy="190" rx="34" ry="50" fill="${p.linen}" opacity="0.8"/>
  <ellipse cx="215" cy="240" rx="46" ry="34" fill="${p.linen}" opacity="0.6"/>
  <g>
    <rect x="360" y="330" width="240" height="110" rx="10" fill="${p.linen}"/>
    <rect x="360" y="330" width="240" height="24" rx="10" fill="#dfe9ee"/>
    <rect x="392" y="300" width="40" height="34" rx="14" fill="${p.linen}"/>
    <rect x="524" y="300" width="40" height="34" rx="14" fill="${p.linen}"/>
    <path d="M476 268 q10 0 10 12 v20 h-20 v-20 q0 -12 10 -12 Z" fill="${p.frame}"/>
    <path d="M486 300 q-8 26 -24 34" stroke="${p.frame}" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>
  <g>
    <rect x="648" y="120" width="16" height="70" rx="8" fill="${p.frame}"/>
    <path d="M656 120 q34 10 26 46" stroke="${p.frame}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <circle cx="656" cy="120" r="16" fill="${p.frame}"/>
  </g>
  ${plant(700, 470, 0.8, p)}
  <rect x="0" y="0" width="800" height="600" fill="none"/>
</svg>`;
}

function workspaceScene(palette) {
  const p = PALETTES[palette];
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img">
  ${defs(p)}
  <rect width="800" height="600" fill="url(#wall)"/>
  <rect y="430" width="800" height="170" fill="url(#floor)"/>
  ${windowArt(500, 90, 230, 200, p)}
  <g>
    <rect x="120" y="300" width="330" height="16" rx="8" fill="${p.wood}"/>
    <rect x="140" y="316" width="14" height="104" fill="${p.wood}"/>
    <rect x="416" y="316" width="14" height="104" fill="${p.wood}"/>
    <rect x="196" y="228" width="150" height="72" rx="6" fill="${p.frame}"/>
    <rect x="204" y="236" width="134" height="56" rx="3" fill="${p.skyBottom}"/>
    <rect x="214" y="246" width="70" height="8" rx="4" fill="${p.blanket}"/>
    <rect x="214" y="262" width="104" height="8" rx="4" fill="${p.rug}"/>
    <rect x="176" y="286" width="48" height="14" rx="4" fill="${p.frame}"/>
  </g>
  <g>
    <rect x="480" y="286" width="90" height="14" rx="7" fill="${p.linen}"/>
    <path d="M492 300 q18 30 36 0 Z" fill="${p.blanket}"/>
    <path d="M506 268 q-4 -22 8 -30" stroke="${p.linen}" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
  ${artFrame(90, 96, p)}
  ${plant(720, 470, 0.9, p)}
  <rect x="0" y="0" width="800" height="600" fill="none"/>
</svg>`;
}

function viewScene(palette, kind) {
  const p = PALETTES[palette];
  const pool = kind === "pool";
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" role="img">
  ${defs(p)}
  <rect width="800" height="600" fill="url(#sky)"/>
  <circle cx="640" cy="120" r="46" fill="${p.sun}" opacity="0.9"/>
  ${
    pool
      ? `
  <path d="M0 300 L120 210 L230 300 L360 190 L500 300 L640 220 L800 300 V380 H0 Z" fill="${p.hill}" opacity="0.75"/>
  <rect y="380" width="800" height="220" fill="#2f7f9c"/>
  <g opacity="0.35" stroke="#bfe6f5" stroke-width="5" fill="none" stroke-linecap="round">
    <path d="M60 430 q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0"/>
    <path d="M20 500 q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0"/>
  </g>
  <g fill="${p.linen}" opacity="0.9">
    <rect x="80" y="196" width="150" height="18" rx="9"/>
    <path d="M96 214 l-14 44 h146 l-14 -44 Z" fill="${p.linen}"/>
    <rect x="560" y="196" width="150" height="18" rx="9"/>
    <path d="M576 214 l-14 44 h146 l-14 -44 Z" fill="${p.linen}"/>
  </g>
  <g fill="${p.leaf}" opacity="0.9">
    <path d="M740 300 c-18 -60 -4 -96 4 -120 c14 30 22 70 6 120 Z"/>
    <path d="M740 300 c14 -56 40 -80 56 -96 c-6 36 -22 78 -50 96 Z"/>
  </g>
  <rect y="300" width="800" height="90" fill="${p.linen}" opacity="0.5"/>`
      : `
  <path d="M0 320 L140 200 L260 320 L400 170 L540 320 L680 210 L800 320 V460 H0 Z" fill="${p.hill}" opacity="0.7"/>
  <path d="M0 400 L180 300 L340 400 L520 280 L700 400 L800 350 V600 H0 Z" fill="${p.hill2 || "#5f7f63"}" opacity="0.85"/>
  <g fill="${p.frame}" opacity="0.75">
    <rect x="120" y="330" width="26" height="80"/>
    <rect x="150" y="330" width="26" height="80"/>
    <rect x="180" y="330" width="26" height="80"/>
    <rect x="600" y="340" width="22" height="70"/>
    <rect x="626" y="340" width="22" height="70"/>
  </g>
  <g fill="#f4f0e6" opacity="0.9">
    <rect x="80" y="250" width="120" height="80"/>
    <rect x="86" y="256" width="108" height="68"/>
    <rect x="560" y="260" width="104" height="70"/>
    <rect x="566" y="266" width="92" height="58"/>
  </g>`
  }
  <rect x="0" y="0" width="800" height="600" fill="none"/>
</svg>`;
}

/* ------------------------------------------------------------------ */
/* service art                                                         */
/* ------------------------------------------------------------------ */

function serviceSvg(id) {
  const map = {
    dining: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img">
  <rect width="400" height="400" fill="#1f3d2b"/>
  <circle cx="200" cy="190" r="120" fill="#2e5a3e"/>
  <ellipse cx="200" cy="232" rx="104" ry="54" fill="#f6f1e6"/>
  <ellipse cx="200" cy="232" rx="78" ry="38" fill="#ffffff"/>
  <circle cx="200" cy="230" r="22" fill="#c9a227"/>
  <g fill="#f6f1e6" opacity="0.9">
    <path d="M120 150 q10 -46 34 -70 q6 44 -4 74 Z"/>
    <path d="M280 150 q-10 -46 -34 -70 q-6 44 4 74 Z"/>
  </g>
  <g fill="none" stroke="#c9a227" stroke-width="5" stroke-linecap="round">
    <path d="M150 268 v22 q0 18 18 18 t18 -18 v-22"/>
    <path d="M232 268 v22 q0 18 18 18 t18 -18 v-22"/>
  </g>
  <g fill="#e8dfcb">
    <path d="M60 300 h80 v8 h-80 Z"/>
    <path d="M260 300 h80 v8 h-80 Z"/>
  </g>
</svg>`,
    spa: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img">
  <rect width="400" height="400" fill="#1f3d2b"/>
  <rect x="46" y="238" width="308" height="120" rx="26" fill="#f6f1e6"/>
  <rect x="60" y="252" width="280" height="92" rx="20" fill="#e4d8c3"/>
  <g fill="#8c8c86">
    <ellipse cx="120" cy="264" rx="30" ry="20"/>
    <ellipse cx="168" cy="256" rx="26" ry="17"/>
    <ellipse cx="214" cy="262" rx="28" ry="18"/>
  </g>
  <g fill="#c9a227" opacity="0.95">
    <rect x="258" y="196" width="20" height="46" rx="6"/>
    <rect x="288" y="212" width="16" height="30" rx="5"/>
  </g>
  <g stroke="#c9a227" stroke-width="4" opacity="0.7" stroke-linecap="round">
    <path d="M268 186 q-8 -20 4 -32 M298 202 q-6 -14 4 -24"/>
  </g>
  <g fill="#3c7350">
    <path d="M96 232 c-18 -50 -6 -78 4 -96 c12 24 16 62 4 96 Z"/>
    <path d="M96 232 c14 -46 34 -66 48 -80 c-6 32 -18 68 -42 80 Z"/>
  </g>
</svg>`,
    conference: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img">
  <rect width="400" height="400" fill="#1f3d2b"/>
  <rect x="72" y="64" width="256" height="142" rx="10" fill="#0f2418"/>
  <rect x="84" y="76" width="232" height="118" rx="6" fill="#2e5a3e"/>
  <rect x="104" y="102" width="120" height="10" rx="5" fill="#c9a227"/>
  <rect x="104" y="126" width="180" height="8" rx="4" fill="#e6f0e6" opacity="0.8"/>
  <rect x="104" y="146" width="150" height="8" rx="4" fill="#e6f0e6" opacity="0.6"/>
  <g fill="#c9a227">
    <rect x="60" y="248" width="64" height="52" rx="8"/>
    <rect x="168" y="248" width="64" height="52" rx="8"/>
    <rect x="276" y="248" width="64" height="52" rx="8"/>
  </g>
  <g fill="#f6f1e6" opacity="0.85">
    <rect x="60" y="316" width="64" height="10" rx="5"/>
    <rect x="168" y="316" width="64" height="10" rx="5"/>
    <rect x="276" y="316" width="64" height="10" rx="5"/>
  </g>
</svg>`,
    pool: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img">
  <rect width="400" height="400" fill="#bcdcf0"/>
  <circle cx="312" cy="84" r="36" fill="#f6d98a"/>
  <path d="M0 220 L80 160 L150 220 L240 130 L330 220 L400 180 V400 H0 Z" fill="#7d9a72"/>
  <rect y="250" width="400" height="150" fill="#2f7f9c"/>
  <g stroke="#bfe6f5" stroke-width="5" fill="none" opacity="0.5" stroke-linecap="round">
    <path d="M20 296 q40 -14 80 0 t80 0 t80 0 t80 0"/>
    <path d="M0 336 q40 -14 80 0 t80 0 t80 0 t80 0 t80 0"/>
  </g>
  <g fill="#f6f1e6">
    <rect x="46" y="150" width="110" height="14" rx="7"/>
    <path d="M58 164 l-12 36 h100 l-12 -36 Z"/>
    <rect x="240" y="150" width="110" height="14" rx="7"/>
    <path d="M252 164 l-12 36 h100 l-12 -36 Z"/>
  </g>
  <g fill="#2f6b45">
    <path d="M360 250 c-16 -50 -4 -80 4 -100 c12 26 18 64 6 100 Z"/>
    <path d="M360 250 c12 -46 34 -64 46 -78 c-4 32 -14 64 -40 78 Z"/>
  </g>
</svg>`,
    gym: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img">
  <rect width="400" height="400" fill="#1f3d2b"/>
  <rect x="60" y="52" width="280" height="200" rx="10" fill="#2e5a3e" opacity="0.75"/>
  <g stroke="#c9a227" stroke-width="7" stroke-linecap="round">
    <path d="M100 130 v44 M84 140 v24 M116 140 v24 M300 130 v44 M284 140 v24 M316 140 v24"/>
    <path d="M100 152 h200"/>
  </g>
  <g fill="#e8dfcb">
    <rect x="130" y="288" width="140" height="14" rx="7"/>
    <rect x="150" y="302" width="10" height="34"/>
    <rect x="240" y="302" width="10" height="34"/>
  </g>
  <g fill="#c9a227">
    <circle cx="96" cy="238" r="24"/>
    <circle cx="304" cy="238" r="24"/>
  </g>
  <g fill="#8c8c86">
    <rect x="80" y="228" width="12" height="20" rx="6"/>
    <rect x="308" y="228" width="12" height="20" rx="6"/>
  </g>
</svg>`,
    transfer: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img">
  <rect width="400" height="400" fill="#1f3d2b"/>
  <circle cx="320" cy="80" r="34" fill="#c9a227" opacity="0.9"/>
  <path d="M0 300 h400 v100 H0 Z" fill="#16301f"/>
  <g fill="#f6f1e6">
    <path d="M60 236 h180 l40 46 v34 H60 Z"/>
    <path d="M108 236 h108 l-16 -46 h-92 Z" fill="#c9a227"/>
  </g>
  <g fill="#23262b">
    <circle cx="120" cy="320" r="26"/>
    <circle cx="248" cy="320" r="26"/>
  </g>
  <g fill="#8c8c86">
    <circle cx="120" cy="320" r="10"/>
    <circle cx="248" cy="320" r="10"/>
  </g>
  <g fill="#e8dfcb">
    <rect x="292" y="252" width="64" height="58" rx="8"/>
    <rect x="300" y="244" width="20" height="12" rx="4"/>
    <rect x="332" y="244" width="20" height="12" rx="4"/>
  </g>
  <g stroke="#c9a227" stroke-width="6" fill="none" stroke-linecap="round">
    <path d="M30 120 h70 M30 148 h46"/>
  </g>
</svg>`,
  };
  return map[id] || map.dining;
}

/* ------------------------------------------------------------------ */
/* hero + favicon                                                      */
/* ------------------------------------------------------------------ */

function heroSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 620" width="800" height="620" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2e5a3e"/>
      <stop offset="1" stop-color="#14301f"/>
    </linearGradient>
    <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0c98f"/>
      <stop offset="1" stop-color="#f7e6c4"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe6a8" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#ffe6a8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="620" fill="url(#bg)"/>
  <circle cx="620" cy="120" r="180" fill="url(#sun)"/>

  <g>
    <rect x="96" y="120" width="240" height="300" rx="8" fill="url(#win)"/>
    <rect x="96" y="120" width="240" height="300" rx="8" fill="none" stroke="#c9a227" stroke-width="12"/>
    <path d="M216 120 v300 M96 270 h240" stroke="#c9a227" stroke-width="10"/>
  </g>

  <g opacity="0.9">
    <rect x="430" y="150" width="250" height="200" rx="12" fill="#0f2418" opacity="0.55"/>
    <rect x="452" y="172" width="206" height="156" rx="8" fill="#16301f"/>
    <circle cx="640" cy="250" r="42" fill="#c9a227" opacity="0.85"/>
    <path d="M470 300 q60 -70 120 -30 q40 26 68 -10 v68 H470 Z" fill="#2e5a3e"/>
  </g>

  <g>
    <rect x="80" y="392" width="420" height="46" rx="18" fill="#f6f1e6"/>
    <rect x="80" y="392" width="420" height="46" rx="18" fill="none" stroke="#c9a227" stroke-width="6"/>
    <rect x="110" y="438" width="14" height="46" rx="6" fill="#c9a227"/>
    <rect x="456" y="438" width="14" height="46" rx="6" fill="#c9a227"/>
    <rect x="120" y="356" width="150" height="36" rx="14" fill="#ffffff"/>
    <rect x="300" y="356" width="150" height="36" rx="14" fill="#ffffff"/>
  </g>

  <g>
    <rect x="560" y="330" width="170" height="120" rx="14" fill="#3c7350"/>
    <rect x="560" y="330" width="170" height="44" rx="14" fill="#2e5a3e"/>
    <rect x="586" y="384" width="56" height="44" rx="10" fill="#c9a227"/>
    <rect x="656" y="384" width="56" height="44" rx="10" fill="#c9a227"/>
  </g>

  <g fill="#c9a227">
    <circle cx="120" cy="96" r="7"/>
    <circle cx="150" cy="72" r="4"/>
    <circle cx="92" cy="60" r="5"/>
  </g>

  <g transform="translate(690 470)">
    <path d="M0 0 c-20 -50 -6 -80 4 -100 c12 26 18 64 6 100 Z" fill="#2f6b45"/>
    <path d="M0 0 c12 -46 34 -64 46 -78 c-4 32 -14 64 -40 78 Z" fill="#3c7350"/>
    <path d="M-24 0 h48 l-7 44 h-34 Z" fill="#b9714a"/>
  </g>
</svg>`;
}

function faviconSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#1f3d2b"/>
  <path d="M18 46V18h15a9 9 0 0 1 0 18h-6l10 10" fill="none" stroke="#c9a227" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

/* ------------------------------------------------------------------ */
/* generate                                                            */
/* ------------------------------------------------------------------ */

const ROOM_ART = {
  standard: { file: "room-standard.svg", beds: 1 },
  twin: { file: "room-twin.svg", beds: 2 },
  deluxe: { file: "room-deluxe.svg", beds: 1, tub: true },
  garden: { file: "room-garden.svg", beds: 1, balcony: true },
  executive: { file: "room-executive.svg", beds: 1, sofa: true, tub: true, desk: true },
  family: { file: "room-family.svg", beds: 2, sofa: true, desk: true },
  presidential: { file: "room-presidential.svg", beds: 2, sofa: true, tub: true, desk: true },
};

Object.entries(ROOM_ART).forEach(([key, cfg]) => {
  write(cfg.file, roomScene(key, cfg));
  write(`gallery-${key}-1.svg`, bathroomScene(key));
  write(`gallery-${key}-2.svg`, workspaceScene(key));
  write(`gallery-${key}-3.svg`, viewScene(key, key === "garden" || key === "presidential" ? "pool" : "view"));
});

write("hero.svg", heroSvg());
write("favicon.svg", faviconSvg());
write("service-dining.svg", serviceSvg("dining"));
write("service-spa.svg", serviceSvg("spa"));
write("service-conference.svg", serviceSvg("conference"));
write("service-pool.svg", serviceSvg("pool"));
write("service-gym.svg", serviceSvg("gym"));
write("service-transfer.svg", serviceSvg("transfer"));

console.log("Artwork generated in", outDir);
