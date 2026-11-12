const fs = require("fs");

const cols = 44;
const rows = 28;
const size = 9.6;
const frames = 50;
const frameWidth = 260;
const chars = ".,-~:;=!*#$@";

const thick = 0.25;
const tilt = -0.3;
const cam = 4;
const zoom = 38;
const light = [-0.28, -0.19, -0.94];

function getPoints() {
  const logo = fs.readFileSync("src/logo.txt", "utf8").replaceAll("\r", "").trim().split("\n");
  const h = logo.length;
  const w = logo[0].length;
  const s = 2 / w;
  const pts = [];

  function on(r, c) {
    return r >= 0 && r < h && logo[r][c] == "#";
  }

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!on(r, c)) continue;

      const x = c * s - 1;
      const y = (h / 2 - r) * s;

      for (let i = 0.5; i < 3; i++) {
        const a = (i * s) / 3;

        for (let j = 0.5; j < 3; j++) {
          const b = (j * s) / 3;
          pts.push([x + a, y - b, -thick, 0, 0, -1]);
          pts.push([x + a, y - b, thick, 0, 0, 1]);
        }

        for (let z = -thick; z <= thick; z += 0.03) {
          if (!on(r, c + 1)) pts.push([x + s, y - a, z, 1, 0, 0]);
          if (!on(r, c - 1)) pts.push([x, y - a, z, -1, 0, 0]);
          if (!on(r - 1, c)) pts.push([x + a, y, z, 0, 1, 0]);
          if (!on(r + 1, c)) pts.push([x + a, y - s, z, 0, -1, 0]);
        }
      }
    }
  }

  return pts;
}

function rotate(x, y, z, angle) {
  const x2 = x * Math.cos(angle) + z * Math.sin(angle);
  const z2 = z * Math.cos(angle) - x * Math.sin(angle);
  const y3 = y * Math.cos(tilt) - z2 * Math.sin(tilt);
  const z3 = y * Math.sin(tilt) + z2 * Math.cos(tilt);
  return [x2, y3, z3];
}

function draw(pts, angle) {
  const grid = new Array(cols * rows).fill(" ");
  const nearest = new Array(cols * rows).fill(0);

  for (const p of pts) {
    const [x, y, z] = rotate(p[0], p[1], p[2], angle);
    const [nx, ny, nz] = rotate(p[3], p[4], p[5], angle);

    if (nx * x + ny * y + nz * (z + cam) >= 0) continue;

    const near = 1 / (z + cam);
    const col = Math.round(cols / 2 + (zoom * x * near) / 0.6);
    const row = Math.round(rows / 2 - 2 - zoom * y * near);
    if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

    const i = row * cols + col;
    if (near <= nearest[i]) continue;
    nearest[i] = near;

    const lit = (nx * light[0] + ny * light[1] + nz * light[2] + 1) / 2;
    grid[i] = chars[Math.min(chars.length - 1, Math.floor(lit * chars.length))];
  }

  const lines = [];
  for (let r = 0; r < rows; r++) {
    lines.push(grid.slice(r * cols, (r + 1) * cols).join(""));
  }
  return lines;
}

function tone(ch) {
  const i = chars.indexOf(ch);
  if (i < 4) return "soft";
  if (i < 8) return "mid";
  return "ink";
}

function drawLine(line, x, y) {
  const indent = line.length - line.trimStart().length;
  const text = line.trim();

  let out = '<tspan x="' + (x + indent * size * 0.6).toFixed(1) + '" y="' + y.toFixed(1) + '">';
  let cls = tone(text[0]);
  let run = "";

  for (const ch of text) {
    if (ch != " " && tone(ch) != cls) {
      out += '<tspan class="' + cls + '">' + run + "</tspan>";
      cls = tone(ch);
      run = "";
    }
    run += ch;
  }

  return out + '<tspan class="' + cls + '">' + run + "</tspan></tspan>";
}

function logo(x, y) {
  const pts = getPoints();
  let svg = "";

  for (let f = 0; f < frames; f++) {
    const t = (f / frames) * Math.PI * 2;
    const lines = draw(pts, t - 0.7 * Math.sin(t));

    svg += '<text font-size="' + size + '" xml:space="preserve">';
    for (let r = 0; r < rows; r++) {
      if (lines[r].trim() != "") {
        svg += drawLine(lines[r], x + f * frameWidth, y + (r + 1) * size);
      }
    }
    svg += "</text>\n";
  }

  return svg;
}

module.exports = { logo };
