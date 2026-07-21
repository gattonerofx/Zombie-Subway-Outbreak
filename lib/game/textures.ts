"use client";

import * as THREE from "three";

/** Procedural canvas-based textures for the subway level. */

function makeCanvas(size = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  return [c, ctx];
}

function toTexture(canvas: HTMLCanvasElement, repeat: [number, number] = [1, 1]): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  return tex;
}

/** Clone a base texture and set repeat to tile it across a surface of given dimensions. */
export function tileTexture(base: THREE.Texture, widthM: number, heightM: number, tileSizeM: number): THREE.Texture {
  const tex = base.clone();
  tex.needsUpdate = true;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(Math.max(1, Math.round(widthM / tileSizeM)), Math.max(1, Math.round(heightM / tileSizeM)));
  tex.anisotropy = 4;
  return tex;
}

// Dark gray terrazzo/concrete floor with grout lines and grime
export function floorTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512);
  // base
  ctx.fillStyle = "#3a3a3e";
  ctx.fillRect(0, 0, 512, 512);
  // tile grid 64px
  const tile = 64;
  for (let y = 0; y < 512; y += tile) {
    for (let x = 0; x < 512; x += tile) {
      const shade = 50 + Math.floor(Math.random() * 24);
      ctx.fillStyle = `rgb(${shade},${shade},${shade + 4})`;
      ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
    }
  }
  // grout
  ctx.strokeStyle = "#1c1c1f";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += tile) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  // grime speckles
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 2.5;
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // dark stains
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 20 + Math.random() * 50;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(20,12,8,0.4)");
    g.addColorStop(1, "rgba(20,12,8,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(c, [12, 4]);
}

// Blue-white ceramic wall tiles (lower wall)
export function tileWallTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512);
  ctx.fillStyle = "#2a3548";
  ctx.fillRect(0, 0, 512, 512);
  const tw = 64;
  const th = 64;
  for (let y = 0; y < 512; y += th) {
    for (let x = 0; x < 512; x += tw) {
      const off = (y / th) % 2 === 0 ? 0 : tw / 2;
      const px = x + off;
      // tile face
      const g = ctx.createLinearGradient(px, y, px, y + th);
      g.addColorStop(0, "#9fb4cc");
      g.addColorStop(0.5, "#7e94b0");
      g.addColorStop(1, "#6b8099");
      ctx.fillStyle = g;
      ctx.fillRect(px + 2, y + 2, tw - 4, th - 4);
      // highlight
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(px + 3, y + 3, tw - 6, 4);
      // grime
      if (Math.random() < 0.3) {
        ctx.fillStyle = `rgba(40,30,20,${Math.random() * 0.25})`;
        ctx.fillRect(px + 2, y + 2, tw - 4, th - 4);
      }
    }
  }
  // grout
  ctx.strokeStyle = "#20283a";
  ctx.lineWidth = 3;
  for (let y = 0; y <= 512; y += th) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += th) {
    const off = (y / th) % 2 === 0 ? 0 : tw / 2;
    for (let x = 0; x <= 512; x += tw) {
      ctx.beginPath();
      ctx.moveTo(x + off, y);
      ctx.lineTo(x + off, y + th);
      ctx.stroke();
    }
  }
  // blood splatter
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 8 + Math.random() * 22;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(90,8,8,0.7)");
    g.addColorStop(1, "rgba(90,8,8,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(c, [8, 2]);
}

// Concrete upper wall
export function concreteTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512);
  ctx.fillStyle = "#6a6a6e";
  ctx.fillRect(0, 0, 512, 512);
  // noise
  const img = ctx.getImageData(0, 0, 512, 512);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 36;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
  // cracks
  ctx.strokeStyle = "rgba(30,30,30,0.5)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    ctx.moveTo(x, y);
    for (let s = 0; s < 8; s++) {
      x += (Math.random() - 0.5) * 80;
      y += (Math.random() - 0.5) * 80;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // water stains
  for (let i = 0; i < 6; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 30 + Math.random() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(60,40,20,0.25)");
    g.addColorStop(1, "rgba(60,40,20,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(c, [4, 1]);
}

// Ceiling concrete
export function ceilingTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256);
  ctx.fillStyle = "#4a4a4e";
  ctx.fillRect(0, 0, 256, 256);
  const img = ctx.getImageData(0, 0, 256, 256);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  // panel lines
  ctx.strokeStyle = "rgba(20,20,22,0.6)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
  return toTexture(c, [12, 4]);
}

// Yellow tactile paving strip
export function tactileTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256);
  ctx.fillStyle = "#b8902a";
  ctx.fillRect(0, 0, 256, 256);
  // dots
  const spacing = 32;
  for (let y = spacing / 2; y < 256; y += spacing) {
    for (let x = spacing / 2; x < 256; x += spacing) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, 12);
      g.addColorStop(0, "#e0b540");
      g.addColorStop(1, "#8a6a1a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return toTexture(c, [1, 40]);
}

// BrainEats zombie poster
export function posterTexture(variant: "red" | "blue" | "ramen" = "red"): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 768);
  if (variant === "red") {
    const g = ctx.createLinearGradient(0, 0, 0, 768);
    g.addColorStop(0, "#c01818");
    g.addColorStop(1, "#7a0d0d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 768);
  } else if (variant === "blue") {
    const g = ctx.createLinearGradient(0, 0, 0, 768);
    g.addColorStop(0, "#1a4a8a");
    g.addColorStop(1, "#0d2848");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 768);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, 768);
    g.addColorStop(0, "#3a2410");
    g.addColorStop(1, "#1a0f06");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 768);
  }
  // border
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 488, 744);

  // zombie chef head
  const cx = 256;
  const cy = 300;
  // chef hat
  ctx.fillStyle = "#f0f0f0";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 150, 90, 50, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 90, cy - 130, 180, 30);
  // head (green)
  ctx.fillStyle = "#6a8a3a";
  ctx.beginPath();
  ctx.arc(cx, cy - 60, 110, 0, Math.PI * 2);
  ctx.fill();
  // eyes (glowing red)
  ctx.fillStyle = "#ff3030";
  ctx.beginPath();
  ctx.arc(cx - 40, cy - 70, 16, 0, Math.PI * 2);
  ctx.arc(cx + 40, cy - 70, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx - 40, cy - 70, 6, 0, Math.PI * 2);
  ctx.arc(cx + 40, cy - 70, 6, 0, Math.PI * 2);
  ctx.fill();
  // mouth with teeth
  ctx.fillStyle = "#3a0d0d";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 10, 55, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#eee";
  for (let i = -4; i <= 4; i++) {
    ctx.fillRect(cx + i * 12 - 4, cy - 30, 8, 14);
  }
  // body / chef coat
  ctx.fillStyle = "#e8e8e8";
  ctx.beginPath();
  ctx.moveTo(cx - 120, cy + 50);
  ctx.lineTo(cx + 120, cy + 50);
  ctx.lineTo(cx + 140, 768);
  ctx.lineTo(cx - 140, 768);
  ctx.closePath();
  ctx.fill();
  // bowl of brains
  ctx.fillStyle = "#8a5a2a";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 110, 80, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8a8c8";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 100, 70, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  // brain folds
  ctx.strokeStyle = "#a07090";
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(cx - 30 + i * 14, cy + 95, 8, 0, Math.PI);
    ctx.stroke();
  }

  // title text
  ctx.fillStyle = "#fff";
  ctx.font = "bold 64px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BrainEats", cx, 640);
  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = "#ffe070";
  ctx.fillText("ブレインイーツ", cx, 695);
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("新鮮な脳を自宅にお届け!", cx, 735);

  // blood drips
  ctx.fillStyle = "rgba(120,5,5,0.7)";
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * 512;
    const h = 30 + Math.random() * 90;
    ctx.fillRect(x, 0, 4 + Math.random() * 6, h);
  }
  // torn edge
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  for (let i = 0; i < 512; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 768);
    ctx.lineTo(i + 12, 768 + Math.random() * 30 - 15);
    ctx.lineTo(i + 24, 768);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// Vending machine front texture
export function vendingTexture(type: "coffee" | "snack" | "drink"): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 768);
  ctx.fillStyle = "#2a2a2e";
  ctx.fillRect(0, 0, 512, 768);
  // glass display area
  const dispY = 60;
  const dispH = 460;
  ctx.fillStyle = "#10141a";
  ctx.fillRect(30, dispY, 452, dispH);
  // shelves
  ctx.fillStyle = "#3a3a40";
  for (let y = dispY + 40; y < dispY + dispH; y += 70) {
    ctx.fillRect(30, y, 452, 6);
  }
  // products
  const cols = 5;
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const px = 50 + col * 86;
      const py = dispY + 10 + r * 70;
      const colors =
        type === "coffee"
          ? ["#1a1a1a", "#5a2a1a", "#8a6a3a", "#2a2a2a"]
          : type === "snack"
            ? ["#c8a040", "#8a3a2a", "#3a8a3a", "#aa3a6a"]
            : ["#aa1010", "#1a4a8a", "#2a8a4a", "#8a8a2a"];
      ctx.fillStyle = colors[(r + col) % colors.length];
      ctx.fillRect(px, py, 60, 50);
      // label
      ctx.fillStyle = "#fff";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(type === "coffee" ? "BOSS" : type === "snack" ? "PCKY" : "COLA", px + 30, py + 30);
    }
  }
  // back-light glow
  const g = ctx.createLinearGradient(0, dispY, 0, dispY + dispH);
  g.addColorStop(0, type === "drink" ? "rgba(40,120,200,0.25)" : type === "coffee" ? "rgba(220,160,40,0.25)" : "rgba(200,200,40,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(30, dispY, 452, dispH);

  // brand header
  ctx.fillStyle = type === "coffee" ? "#1a4a8a" : type === "snack" ? "#aa2020" : "#aa1010";
  ctx.fillRect(0, 0, 512, 50);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 30px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(type === "coffee" ? "GEORGIA" : type === "snack" ? "POCKY" : "COCA-COLA", 256, 34);

  // payment panel
  ctx.fillStyle = "#1a1a1e";
  ctx.fillRect(30, 540, 452, 180);
  ctx.fillStyle = "#3a3a40";
  ctx.fillRect(50, 560, 180, 60);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(260, 560, 200, 140);
  ctx.fillStyle = "#2a4a6a";
  ctx.fillRect(264, 564, 192, 132);
  // coin slot
  ctx.fillStyle = "#000";
  ctx.fillRect(60, 640, 60, 8);
  // buttons
  for (let r = 0; r < 3; r++) {
    for (let cI = 0; cI < 4; cI++) {
      ctx.fillStyle = "#555";
      ctx.fillRect(70 + cI * 38, 660 + r * 18, 30, 14);
    }
  }
  // graffiti
  ctx.strokeStyle = "rgba(200,200,80,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 720);
  ctx.bezierCurveTo(120, 700, 200, 740, 300, 715);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// Wooden bench slat texture
export function woodTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 64);
  ctx.fillStyle = "#5a3a1a";
  ctx.fillRect(0, 0, 256, 64);
  // grain
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(${30 + Math.random() * 30},${20 + Math.random() * 20},${10},${Math.random() * 0.4})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const y = Math.random() * 64;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(80, y + (Math.random() - 0.5) * 6, 160, y + (Math.random() - 0.5) * 6, 256, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }
  // water stain
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "rgba(20,10,4,0.3)");
  g.addColorStop(0.5, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(20,10,4,0.3)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 64);
  return toTexture(c, [3, 1]);
}

// Train track ballast
export function ballastTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256);
  ctx.fillStyle = "#2a2622";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const s = Math.random() * 3 + 1;
    const sh = 30 + Math.random() * 40;
    ctx.fillStyle = `rgb(${sh},${sh - 4},${sh - 8})`;
    ctx.fillRect(x, y, s, s);
  }
  return toTexture(c, [4, 1]);
}
