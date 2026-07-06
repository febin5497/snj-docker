import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import api from "../../api/api";
import "./PlanViewer3D.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const BUILDING_PRESETS = [
  {
    name: "Office Tower",
    floors: 12, width: 20, depth: 15, floorHeight: 3.5,
    color: "#4a90d9", roofType: "flat", windowsPerFloor: 6,
  },
  {
    name: "Residential Complex",
    floors: 6, width: 30, depth: 12, floorHeight: 3,
    color: "#7eb8da", roofType: "sloped", windowsPerFloor: 8,
  },
  {
    name: "Commercial Plaza",
    floors: 3, width: 40, depth: 25, floorHeight: 4,
    color: "#5a9e6f", roofType: "flat", windowsPerFloor: 10,
  },
  {
    name: "Warehouse Facility",
    floors: 1, width: 50, depth: 30, floorHeight: 6,
    color: "#b87333", roofType: "sawtooth", windowsPerFloor: 4,
  },
];

function terrainNoise(x, z) {
  return (
    Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5 +
    Math.sin(x * 0.05 + 1.3) * Math.cos(z * 0.07 + 2.1) * 0.3 +
    Math.sin(x * 0.02 + 0.7) * Math.cos(z * 0.03 + 1.5) * 0.2
  );
}

// ── Component Library ──────────────────────────────────────────────────────
let _compIdCounter = 0;
function nextCompId() { return `comp-${Date.now()}-${++_compIdCounter}`; }

const COMPONENT_CATALOG = [
  { type: "room",        label: "Room",          icon: "🏠", desc: "3×3m enclosed room" },
  { type: "balcony",     label: "Balcony",       icon: "🌤", desc: "2×1.5m platform w/ railing" },
  { type: "staircase",   label: "Staircase",     icon: "🔄", desc: "Spiral staircase" },
  { type: "elevator",    label: "Elevator",      icon: "⬆", desc: "Elevator shaft" },
  { type: "canopy",      label: "Canopy",        icon: "☂", desc: "Overhang with columns" },
  { type: "parking",     label: "Parking",       icon: "🅿", desc: "2-level parking garage" },
  { type: "pool",        label: "Pool",          icon: "🏊", desc: "Swimming pool" },
  { type: "garden",      label: "Garden",        icon: "🌳", desc: "Garden patch w/ trees" },
  { type: "tank",        label: "Water Tank",    icon: "🛢", desc: "Water tank on stand" },
  { type: "generator",   label: "Generator",     icon: "⚡", desc: "Generator room" },
];

function createComponentMesh(type) {
  const g = new THREE.Group();
  g.userData.isPlacedComponent = true;
  g.userData.componentType = type;

  const wallMat = (c = 0xbbbbbb) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.7, metalness: 0.1 });
  const glassMat = () => new THREE.MeshPhysicalMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4, roughness: 0.1, metalness: 0.3 });
  const metalMat = (c = 0x666666) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.4, metalness: 0.6 });
  const waterMat = () => new THREE.MeshPhysicalMaterial({ color: 0x2288dd, transparent: true, opacity: 0.7, roughness: 0.05, metalness: 0.1 });
  const grassMat = () => new THREE.MeshPhysicalMaterial({ color: 0x3a7d44, roughness: 0.95, metalness: 0 });
  const concreteMat = (c = 0x999999) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.85, metalness: 0.05 });

  switch (type) {
    case "room": {
      const W = 3, D = 3, H = 2.8, T = 0.12;
      // floor
      const fl = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, D), concreteMat(0x888888));
      fl.position.y = 0.05; fl.castShadow = true; fl.receiveShadow = true; g.add(fl);
      // ceiling
      const ceil = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, D), concreteMat(0xaaaaaa));
      ceil.position.y = H; ceil.castShadow = true; g.add(ceil);
      // walls (4 sides, front has opening gap)
      const wallDefs = [
        { w: W, h: H, d: T, x: 0, z: D / 2, name: "front" },
        { w: W, h: H, d: T, x: 0, z: -D / 2, name: "back" },
        { w: T, h: H, d: D, x: -W / 2, z: 0, name: "left" },
        { w: T, h: H, d: D, x: W / 2, z: 0, name: "right" },
      ];
      wallDefs.forEach(({ w, h, d, x, z, name }) => {
        if (name === "front") {
          // split into two halves with doorway gap
          const halfW = (W - 1) / 2;
          [-1, 1].forEach((side) => {
            const wm = new THREE.Mesh(new THREE.BoxGeometry(halfW, H, T), wallMat());
            wm.position.set(side * (halfW / 2 + 0.5), H / 2, z);
            wm.castShadow = true; g.add(wm);
          });
          // door header
          const hdr = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, T), wallMat());
          hdr.position.set(0, H - 0.2, z); hdr.castShadow = true; g.add(hdr);
        } else {
          const wm = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat());
          wm.position.set(x, h / 2, z); wm.castShadow = true; g.add(wm);
        }
      });
      // window on back wall
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 0.05), glassMat());
      win.position.set(0, H / 2 + 0.3, -D / 2); g.add(win);
      break;
    }
    case "balcony": {
      const W = 2, D = 1.5, H = 1.1;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, D), concreteMat(0x999999));
      deck.position.y = 0.06; deck.castShadow = true; deck.receiveShadow = true; g.add(deck);
      const railMat = metalMat(0x888888);
      // 4 corner posts
      [[-W/2, D/2], [W/2, D/2], [-W/2, -D/2], [W/2, -D/2]].forEach(([x, z]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, H), railMat);
        post.position.set(x, H / 2 + 0.12, z); g.add(post);
      });
      // top rails (3 sides, open back)
      [{ s: [W, 0.04, 0.04], p: [0, H + 0.12, D/2] },
       { s: [0.04, 0.04, D], p: [-W/2, H + 0.12, 0] },
       { s: [0.04, 0.04, D], p: [W/2, H + 0.12, 0] }].forEach(({ s, p }) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(...s), railMat);
        bar.position.set(...p); g.add(bar);
      });
      // glass panel
      const panel = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, H - 0.1, 0.02), glassMat());
      panel.position.set(0, H / 2 + 0.12, D / 2); g.add(panel);
      break;
    }
    case "staircase": {
      const R = 0.8, steps = 14, H = 3;
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const step = new THREE.Mesh(new THREE.BoxGeometry(R * 2, 0.12, 0.35), concreteMat(0xaaaaaa));
        step.position.set(Math.cos(angle) * R * 0.6, (i / steps) * H, Math.sin(angle) * R * 0.6);
        step.rotation.y = -angle;
        step.castShadow = true; g.add(step);
      }
      // central pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, H + 0.5), metalMat(0x555555));
      pole.position.y = H / 2; g.add(pole);
      // handrail (spiral of small spheres)
      for (let i = 0; i <= steps * 2; i++) {
        const a = (i / (steps * 2)) * Math.PI * 2;
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), metalMat());
        bead.position.set(Math.cos(a) * R, (i / (steps * 2)) * H + 1.1, Math.sin(a) * R);
        g.add(bead);
      }
      break;
    }
    case "elevator": {
      const S = 2, H = 3.2;
      // shaft walls (4 sides, open front)
      const sides = [
        { w: S, d: 0.1, x: 0, z: -S/2 },
        { w: 0.1, d: S, x: -S/2, z: 0 },
        { w: 0.1, d: S, x: S/2, z: 0 },
      ];
      sides.forEach(({ w, d, x, z }) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wallMat(0x777777));
        wall.position.set(x, H / 2, z); wall.castShadow = true; g.add(wall);
      });
      // corner posts
      [[-S/2, -S/2], [S/2, -S/2], [-S/2, S/2], [S/2, S/2]].forEach(([x, z]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, H + 0.2), metalMat(0x444444));
        post.position.set(x, H / 2, z); g.add(post);
      });
      // doors (front, sliding)
      [-0.55, 0.55].forEach((x) => {
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, H - 0.3, 0.06), metalMat(0x888888));
        door.position.set(x, H / 2, S / 2); g.add(door);
      });
      // car inside
      const car = new THREE.Mesh(new THREE.BoxGeometry(S - 0.4, H - 0.6, S - 0.4), wallMat(0xdddddd));
      car.position.y = H / 2; car.material.transparent = true; car.material.opacity = 0.3; g.add(car);
      break;
    }
    case "canopy": {
      const W = 4, D = 2, T = 0.1, colH = 2.8;
      const roof = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), concreteMat(0xbbbbbb));
      roof.position.y = colH + T / 2; roof.castShadow = true; g.add(roof);
      // 2 columns
      [-W/2 + 0.3, W/2 - 0.3].forEach((x) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, colH), metalMat(0x666666));
        col.position.set(x, colH / 2, D / 2 - 0.3); col.castShadow = true; g.add(col);
      });
      break;
    }
    case "parking": {
      const W = 6, D = 4, LvH = 3, Lv = 2;
      for (let lv = 0; lv < Lv; lv++) {
        const baseY = lv * LvH;
        // slab
        const slab = new THREE.Mesh(new THREE.BoxGeometry(W, 0.2, D), concreteMat(0x888888));
        slab.position.y = baseY; slab.castShadow = true; slab.receiveShadow = true; g.add(slab);
        // columns at corners + mid
        [[-W/2, -D/2], [W/2, -D/2], [-W/2, D/2], [W/2, D/2], [0, -D/2], [0, D/2]].forEach(([x, z]) => {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, LvH - 0.2), concreteMat(0x999999));
          col.position.set(x, baseY + LvH / 2, z); col.castShadow = true; g.add(col);
        });
        // ramp between levels
        if (lv < Lv - 1) {
          const ramp = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, D * 0.7), concreteMat(0x777777));
          ramp.position.set(W / 2 - 1.5, baseY + LvH / 2, 0);
          ramp.rotation.z = Math.atan2(LvH, D * 0.7) * 0.5;
          g.add(ramp);
        }
      }
      // top slab
      const topSlab = new THREE.Mesh(new THREE.BoxGeometry(W, 0.15, D), concreteMat(0xaaaaaa));
      topSlab.position.y = Lv * LvH; topSlab.castShadow = true; g.add(topSlab);
      break;
    }
    case "pool": {
      const W = 5, D = 3, depth = 1.2, wall = 0.2;
      // outer shell
      const outer = new THREE.Mesh(new THREE.BoxGeometry(W + wall*2, depth + wall, D + wall*2), concreteMat(0xddddcc));
      outer.position.y = (depth + wall) / 2 - wall; outer.castShadow = true; g.add(outer);
      // water surface
      const water = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, D), waterMat());
      water.position.y = 0; g.add(water);
      // tile border
      const border = new THREE.Mesh(new THREE.BoxGeometry(W + wall * 4, 0.08, D + wall * 4), concreteMat(0xeeeebb));
      border.position.y = 0.04; border.receiveShadow = true; g.add(border);
      // ladder
      const lm = metalMat(0xcccccc);
      [-0.3, 0.3].forEach((x) => {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5), lm);
        rail.position.set(x, 0.75, D / 2 + 0.15); g.add(rail);
      });
      [0.3, 0.8].forEach((y) => {
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6), lm);
        rung.rotation.z = Math.PI / 2; rung.position.set(0, y, D / 2 + 0.15); g.add(rung);
      });
      break;
    }
    case "garden": {
      const S = 4;
      const ground = new THREE.Mesh(new THREE.BoxGeometry(S, 0.15, S), grassMat());
      ground.position.y = 0.075; ground.receiveShadow = true; g.add(ground);
      // simple trees
      [[-1, -0.5], [1.2, 0.8], [-0.3, 1.3]].forEach(([x, z]) => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.2), wallMat(0x8B4513));
        trunk.position.set(x, 0.75, z); trunk.castShadow = true; g.add(trunk);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), grassMat());
        crown.material = new THREE.MeshPhysicalMaterial({ color: 0x228B22, roughness: 0.9 });
        crown.position.set(x, 1.7, z); crown.castShadow = true; g.add(crown);
      });
      // flowers
      for (let i = 0; i < 8; i++) {
        const fx = (Math.random() - 0.5) * 3;
        const fz = (Math.random() - 0.5) * 3;
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6),
          new THREE.MeshPhysicalMaterial({ color: [0xff6b6b, 0xffd93d, 0xff8fab, 0xc084fc][i % 4], roughness: 0.6 }));
        flower.position.set(fx, 0.25, fz); g.add(flower);
      }
      break;
    }
    case "tank": {
      const r = 0.75, h = 2;
      // legs
      [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5), metalMat(0x555555));
        leg.position.set(x, 0.75, z); g.add(leg);
      });
      // cross braces
      const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5), metalMat());
      brace.rotation.z = Math.PI / 2; brace.position.y = 0.5; g.add(brace);
      // tank body
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), metalMat(0x88aacc));
      tank.position.y = 1.5 + h / 2; tank.castShadow = true; g.add(tank);
      // lid
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.05, r + 0.05, 0.08, 16), metalMat(0x777777));
      lid.position.y = 1.5 + h + 0.04; g.add(lid);
      break;
    }
    case "generator": {
      const W = 2, D = 2, H = 2.5;
      // walls
      const sides2 = [
        { w: W, d: 0.1, x: 0, z: -D/2 },
        { w: W, d: 0.1, x: 0, z: D/2 },
        { w: 0.1, d: D, x: -W/2, z: 0 },
        { w: 0.1, d: D, x: W/2, z: 0 },
      ];
      sides2.forEach(({ w, d, x, z }, idx) => {
        const wm = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wallMat(0x666666));
        wm.position.set(x, H / 2, z); wm.castShadow = true; g.add(wm);
        // ventilation grilles on front and back
        if (idx < 2) {
          for (let i = 0; i < 5; i++) {
            const slat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.02), metalMat(0x444444));
            slat.position.set(0, H * 0.4 + i * 0.12, z > 0 ? z + 0.06 : z - 0.06);
            slat.rotation.x = 0.3;
            g.add(slat);
          }
        }
      });
      // generator unit inside
      const gen = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.5), metalMat(0x448844));
      gen.position.set(0, 0.6, 0); g.add(gen);
      // exhaust pipe
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5), metalMat(0x333333));
      exhaust.position.set(0.6, H + 0.5, -D/2 + 0.3); g.add(exhaust);
      break;
    }
  }
  return g;
}

function createBuildingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 128; i += 16) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function createBuilding(preset, maxFloorsOverride) {
  const group = new THREE.Group();
  const { floors, width, depth, floorHeight, color, roofType, windowsPerFloor } = preset;
  const visibleFloors = maxFloorsOverride != null ? Math.min(maxFloorsOverride, floors) : floors;
  const totalHeight = visibleFloors * floorHeight;
  const baseColor = new THREE.Color(color);
  const darkColor = baseColor.clone().multiplyScalar(0.7);
  const lightColor = baseColor.clone().multiplyScalar(1.2);
  const wallTexture = createBuildingTexture();

  const foundationGeo = new THREE.BoxGeometry(width + 1, 0.5, depth + 1);
  const foundationMat = new THREE.MeshPhysicalMaterial({
    color: 0x555555, roughness: 0.9, metalness: 0.1,
  });
  const foundation = new THREE.Mesh(foundationGeo, foundationMat);
  foundation.position.y = -0.25;
  foundation.userData.isFoundation = true;
  group.add(foundation);

  const floorGroups = [];

  for (let f = 0; f < visibleFloors; f++) {
    const floorGroup = new THREE.Group();
    floorGroup.name = `floor-${f}`;
    const floorY = f * floorHeight + floorHeight / 2;

    const slabGeo = new THREE.BoxGeometry(width + 0.2, 0.15, depth + 0.2);
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: 0x888888, roughness: 0.8, metalness: 0.2,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = floorY - floorHeight / 2;
    slab.userData.isSlab = true;
    floorGroup.add(slab);

    const wallMat = new THREE.MeshPhysicalMaterial({
      color: baseColor, roughness: 0.6, metalness: 0.1, map: wallTexture,
    });
    const wallHeight = floorHeight - 0.3;
    const wallGeo = new THREE.BoxGeometry(width, wallHeight, 0.2);

    const frontWall = new THREE.Mesh(wallGeo, wallMat);
    frontWall.position.set(0, floorY, depth / 2);
    floorGroup.add(frontWall);

    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, floorY, -depth / 2);
    floorGroup.add(backWall);

    const sideWallGeo = new THREE.BoxGeometry(0.2, wallHeight, depth);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-width / 2, floorY, 0);
    floorGroup.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(width / 2, floorY, 0);
    floorGroup.add(rightWall);

    const windowMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff, metalness: 0.3, roughness: 0.1,
      transparent: true, opacity: 0.6, envMapIntensity: 1,
    });
    const windowFrameMat = new THREE.MeshPhysicalMaterial({
      color: 0x444444, roughness: 0.7, metalness: 0.3,
    });

    const winSpacing = width / (windowsPerFloor + 1);
    for (let w = 0; w < windowsPerFloor; w++) {
      const wx = -width / 2 + winSpacing * (w + 1);
      const wy = floorY;
      const winGeo = new THREE.BoxGeometry(0.8, 1.2, 0.05);
      const win = new THREE.Mesh(winGeo, windowMat);
      win.position.set(wx, wy, depth / 2 + 0.11);
      win.userData.isWindow = true;
      floorGroup.add(win);
      const frameMat = windowFrameMat;
      const frameHGeo = new THREE.BoxGeometry(0.9, 0.08, 0.08);
      const frameVGeo = new THREE.BoxGeometry(0.08, 1.3, 0.08);
      [-depth / 2 - 0.11, depth / 2 + 0.11].forEach((z) => {
        const frameTop = new THREE.Mesh(frameHGeo, frameMat);
        frameTop.position.set(wx, wy + 0.65, z);
        frameTop.userData.isFrame = true;
        floorGroup.add(frameTop);
        const frameBot = new THREE.Mesh(frameHGeo, frameMat);
        frameBot.position.set(wx, wy - 0.65, z);
        frameBot.userData.isFrame = true;
        floorGroup.add(frameBot);
        const frameL = new THREE.Mesh(frameVGeo, frameMat);
        frameL.position.set(wx - 0.45, wy, z);
        frameL.userData.isFrame = true;
        floorGroup.add(frameL);
        const frameR = new THREE.Mesh(frameVGeo, frameMat);
        frameR.position.set(wx + 0.45, wy, z);
        frameR.userData.isFrame = true;
        floorGroup.add(frameR);
      });
    }

    group.add(floorGroup);
    floorGroups.push(floorGroup);
  }

  const roofMat = new THREE.MeshPhysicalMaterial({
    color: darkColor, roughness: 0.8, metalness: 0.1,
  });

  if (roofType === "flat") {
    const roofGeo = new THREE.BoxGeometry(width + 0.5, 0.3, depth + 0.5);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = totalHeight + 0.15;
    group.add(roof);

    const parapetMat = new THREE.MeshPhysicalMaterial({
      color: 0xcccccc, roughness: 0.6,
    });
    const parapetGeo = new THREE.BoxGeometry(width + 1, 0.4, 0.15);
    [-depth / 2 - 0.2, depth / 2 + 0.2].forEach((z) => {
      const p = new THREE.Mesh(parapetGeo, parapetMat);
      p.position.set(0, totalHeight + 0.5, z);
      group.add(p);
    });
    const parapetSideGeo = new THREE.BoxGeometry(0.15, 0.4, depth + 1);
    [-width / 2 - 0.2, width / 2 + 0.2].forEach((x) => {
      const p = new THREE.Mesh(parapetSideGeo, parapetMat);
      p.position.set(x, totalHeight + 0.5, 0);
      group.add(p);
    });
  } else if (roofType === "sloped") {
    const roofShape = new THREE.Shape();
    const rw = width / 2 + 1;
    const rd = depth / 2 + 0.5;
    const rh = floorHeight * 0.6;
    roofShape.moveTo(-rw, -rd); roofShape.lineTo(rw, -rd);
    roofShape.lineTo(rw + 1, 0); roofShape.lineTo(rw, rd);
    roofShape.lineTo(-rw, rd); roofShape.lineTo(-rw - 1, 0);
    roofShape.closePath();
    const extrudeSettings = { steps: 1, depth: 0.15, bevelEnabled: false };
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, totalHeight, 0);
    group.add(roofMesh);
  }

  const groundGeo = new THREE.BoxGeometry(width + 4, 0.2, depth + 4);
  const groundMat = new THREE.MeshPhysicalMaterial({
    color: 0x556b2f, roughness: 1, metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.5;
  group.add(ground);

  group.userData.floorGroups = floorGroups;
  return group;
}

function disposeMesh(obj) {
  obj.traverse((child) => {
    if (child.isMesh) {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material?.dispose();
      }
    }
  });
}

export default function PlanViewer3D() {
  const [searchParams] = useSearchParams();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const buildingRef = useRef(null);
  const importedModelRef = useRef(null);
  const animFrameRef = useRef(null);
  const measurementCanvasRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const dirLightRef = useRef(null);
  const hemiLightRef = useRef(null);
  const ambientLightRef = useRef(null);

  const [currentPreset, setCurrentPreset] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState("perspective");
  const [showInfo, setShowInfo] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [darkBg, setDarkBg] = useState(true);
  const [visibleFloors, setVisibleFloors] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [mode, setMode] = useState("preset");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [explodedView, setExplodedView] = useState(false);
  const [explosionDistance, setExplosionDistance] = useState(3);
  const [sectionCut, setSectionCut] = useState(false);
  const [sectionPosition, setSectionPosition] = useState(0.5);
  const [floorVisibility, setFloorVisibility] = useState([]);
  const [showDimensions, setShowDimensions] = useState(false);
  const [buildingColor, setBuildingColor] = useState("#4a90d9");
  const [dayNightMode, setDayNightMode] = useState(false);
  const dayNightAngleRef = useRef(0);

  // Construction Timeline
  const [constructionPlaying, setConstructionPlaying] = useState(false);
  const [constructionProgress, setConstructionProgress] = useState(0);
  const [constructionSpeed, setConstructionSpeed] = useState(1);
  const constructionTimerRef = useRef(null);

  // Material Quantity Takeoff
  const [showTakeoff, setShowTakeoff] = useState(false);
  const [concreteRate, setConcreteRate] = useState(150);
  const [steelRate, setSteelRate] = useState(120);
  const [glassRate, setGlassRate] = useState(80);
  const [brickRate, setBrickRate] = useState(2);
  const [paintRate, setPaintRate] = useState(15);

  // Camera Fly-through
  const [flythroughMode, setFlythroughMode] = useState(null);
  const [flythroughPlaying, setFlythroughPlaying] = useState(false);
  const [flythroughSpeed, setFlythroughSpeed] = useState(1);
  const flythroughTimerRef = useRef(null);

  // Sun Study
  const [sunStudyMode, setSunStudyMode] = useState(false);
  const [sunTime, setSunTime] = useState(0.5);
  const [sunStudyPlaying, setSunStudyPlaying] = useState(false);
  const sunStudyTimerRef = useRef(null);

  // Measurement History
  const [showMeasurementHistory, setShowMeasurementHistory] = useState(false);

  // Terrain
  const [showTerrain, setShowTerrain] = useState(false);
  const [terrainSize, setTerrainSize] = useState(80);
  const [terrainHeight, setTerrainHeight] = useState(5);
  const terrainRef = useRef(null);

  // Component Editor
  const [editorMode, setEditorMode] = useState(null); // null | "place" | "select" | "remove"
  const [placingType, setPlacingType] = useState(null);
  const [placedComponents, setPlacedComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [placeRotation, setPlaceRotation] = useState(0);
  const previewRef = useRef(null);
  const ghostRef = useRef(null);
  const selectionBoxRef = useRef(null);

  const preset = BUILDING_PRESETS[currentPreset];

  const takeoff = useMemo(() => {
    const { floors, width, depth, floorHeight, windowsPerFloor } = preset;
    const wallHeight = floorHeight - 0.3;
    const perimeter = 2 * (width + depth);
    const totalHeight = floors * floorHeight;
    const slabThickness = 0.15;
    const slabVolume = width * depth * slabThickness * (floors + 1);
    const foundationVolume = (width + 1) * (depth + 1) * 0.5;
    const concreteVolume = slabVolume + foundationVolume;
    const steelWeight = concreteVolume * 120;
    const windowArea = windowsPerFloor * 0.8 * 1.2 * floors * 2;
    const wallArea = perimeter * wallHeight * floors;
    const brickCount = Math.round(wallArea / 0.02);
    const paintArea = perimeter * totalHeight;
    return { concreteVolume, steelWeight, windowArea, brickCount, paintArea };
  }, [preset]);

  const takeoffCost = useMemo(() => ({
    concrete: takeoff.concreteVolume * concreteRate,
    steel: takeoff.steelWeight * steelRate,
    glass: takeoff.windowArea * glassRate,
    brick: takeoff.brickCount * brickRate,
    paint: takeoff.paintArea * paintRate,
    total:
      takeoff.concreteVolume * concreteRate +
      takeoff.steelWeight * steelRate +
      takeoff.windowArea * glassRate +
      takeoff.brickCount * brickRate +
      takeoff.paintArea * paintRate,
  }), [takeoff, concreteRate, steelRate, glassRate, brickRate, paintRate]);

  // Preserve default camera position
  const defaultCamPos = new THREE.Vector3(35, 25, 35);
  const defaultTarget = new THREE.Vector3(0, 5, 0);

  // Load projects list
  useEffect(() => {
    api.get("/api/projects/")
      .then((res) => {
        const data = res.data?.data || res.data?.projects || [];
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  // Auto-select project from URL query param
  useEffect(() => {
    const projectId = searchParams.get("projectId");
    if (projectId) {
      setSelectedProjectId(Number(projectId));
      setMode("project");
    }
  }, [searchParams]);

  // Init scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2332);
    sceneRef.current = scene;

    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.copy(defaultCamPos);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.localClippingEnabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.copy(defaultTarget);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362d25, 0.8);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(20, 30, 20);
    dirLightRef.current = dirLight;
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    const d = 40;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 60;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.5);
    fillLight.position.set(-15, 10, -15);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, -10, 20);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(80, 40, 0x4a90d9, 0x2a3a5a);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    const building = createBuilding(BUILDING_PRESETS[0]);
    building.name = "building";
    scene.add(building);
    buildingRef.current = building;

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild procedural building
  const buildPresetBuilding = useCallback((presetIndex, maxFloors) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const oldBuilding = scene.getObjectByName("building");
    if (oldBuilding) {
      scene.remove(oldBuilding);
      disposeMesh(oldBuilding);
    }

    const p = BUILDING_PRESETS[presetIndex];
    if (!p) return;
    const building = createBuilding(p, maxFloors);
    building.name = "building";
    scene.add(building);
    buildingRef.current = building;
    importedModelRef.current = null;

    setWireframe(false);
  }, []);

  // Load a project's 3D model
  const loadProjectModel = useCallback((projectId) => {
    const scene = sceneRef.current;
    if (!scene) return;

    setLoadError(null);
    setLoading(true);

    const loadFromProject = (filename) => {
      const modelUrl = `${API_URL}/uploads/projects/${projectId}/${filename}`;

    const oldBuilding = scene.getObjectByName("building");
    if (oldBuilding) {
      scene.remove(oldBuilding);
      disposeMesh(oldBuilding);
      buildingRef.current = null;
    }
    if (importedModelRef.current) {
      scene.remove(importedModelRef.current);
      disposeMesh(importedModelRef.current);
      importedModelRef.current = null;
    }

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 40) {
            const s = 40 / maxDim;
            model.scale.set(s, s, s);
          }
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          scene.add(model);
          importedModelRef.current = model;
          buildingRef.current = null;
          setLoading(false);
        },
        undefined,
        (err) => {
          setLoading(false);
          setLoadError("Failed to load model: " + (err?.message || "Unknown error"));
        }
      );
    };

    const project = projects.find((p) => p.id === projectId);
    if (project?.three_d_plan) {
      loadFromProject(project.three_d_plan);
    } else {
      // Not found in list, fetch project directly
      api.get("/api/projects/" + projectId)
        .then((res) => {
          const p = res.data?.data || res.data;
          if (p?.three_d_plan) {
            loadFromProject(p.three_d_plan);
          } else {
            setLoading(false);
            setLoadError("No 3D model uploaded for this project");
          }
        })
        .catch(() => {
          setLoading(false);
          setLoadError("Project not found");
        });
    }
  }, [projects]);

  // Effect for mode/preset/project changes
  useEffect(() => {
    if (mode === "preset") {
      buildPresetBuilding(currentPreset, visibleFloors);
    } else if (mode === "project" && selectedProjectId) {
      loadProjectModel(selectedProjectId);
    }
  }, [mode, currentPreset, selectedProjectId, visibleFloors, buildPresetBuilding, loadProjectModel]);

  // Auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // View mode
  useEffect(() => {
    if (!controlsRef.current || !sceneRef.current) return;
    const camera = controlsRef.current.object;
    if (viewMode === "top") {
      camera.position.set(0, 50, 0.01);
      controlsRef.current.maxPolarAngle = 0.1;
    } else if (viewMode === "front") {
      camera.position.set(0, 10, 40);
      controlsRef.current.maxPolarAngle = Math.PI / 2.1;
    } else if (viewMode === "side") {
      camera.position.set(45, 10, 0);
      controlsRef.current.maxPolarAngle = Math.PI / 2.1;
    } else {
      camera.position.copy(defaultCamPos);
      controlsRef.current.maxPolarAngle = Math.PI / 2.1;
    }
    controlsRef.current.target.copy(defaultTarget);
    controlsRef.current.update();
  }, [viewMode]);

  // Wireframe toggle
  useEffect(() => {
    const target = importedModelRef.current || buildingRef.current;
    if (!target) return;
    target.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => { m.wireframe = wireframe; });
        } else {
          child.material.wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  // Background toggle
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(darkBg ? 0x1a2332 : 0xe8eef5);
    }
  }, [darkBg]);

  // Fullscreen change handler
  useEffect(() => {
    function handler() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Initialize floor visibility when preset changes
  useEffect(() => {
    if (mode === "preset") {
      const total = preset.floors;
      setFloorVisibility((prev) => {
        if (prev.length === total) return prev;
        return Array(total).fill(true);
      });
    }
  }, [mode, preset.floors]);

  // Exploded View effect
  useEffect(() => {
    const building = buildingRef.current;
    if (!building) return;
    const floorGroups = building.userData.floorGroups;
    if (!floorGroups) return;
    floorGroups.forEach((fg, i) => {
      const targetY = explodedView ? i * explosionDistance : 0;
      fg.position.y = targetY;
    });
  }, [explodedView, explosionDistance]);

  // Re-apply exploded view when building changes
  useEffect(() => {
    if (!explodedView) return;
    const timer = setTimeout(() => {
      const building = buildingRef.current;
      if (!building) return;
      const floorGroups = building.userData.floorGroups;
      if (!floorGroups) return;
      floorGroups.forEach((fg, i) => { fg.position.y = i * explosionDistance; });
    }, 50);
    return () => clearTimeout(timer);
  }, [currentPreset, visibleFloors, mode, selectedProjectId]);

  // Section Cut effect
  useEffect(() => {
    const building = buildingRef.current || importedModelRef.current;
    if (!building) return;
    const clipY = sectionPosition * ((visibleFloors ?? preset.floors) * preset.floorHeight);
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), clipY);
    building.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          m.clippingPlanes = sectionCut ? [plane] : [];
          m.clipShadows = true;
          m.needsUpdate = true;
        });
      }
    });
  }, [sectionCut, sectionPosition, visibleFloors, preset]);

  // Floor Visibility effect
  useEffect(() => {
    const building = buildingRef.current;
    if (!building) return;
    const floorGroups = building.userData.floorGroups;
    if (!floorGroups) return;
    floorGroups.forEach((fg, i) => {
      if (floorVisibility[i] !== undefined) {
        fg.visible = floorVisibility[i];
      }
    });
  }, [floorVisibility]);

  // Building Color effect
  useEffect(() => {
    const building = buildingRef.current;
    if (!building) return;
    const col = new THREE.Color(buildingColor);
    building.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          if (m.color && !child.userData?.isWindow && !child.userData?.isFrame && !child.userData?.isSlab && !child.userData?.isFoundation) {
            m.color.copy(col);
            m.needsUpdate = true;
          }
        });
      }
    });
  }, [buildingColor]);

  // Day/Night Cycle effect
  useEffect(() => {
    if (!dirLightRef.current || !hemiLightRef.current || !ambientLightRef.current) return;
    let frame;
    function animateDayNight() {
      dayNightAngleRef.current += 0.005;
      const angle = dayNightAngleRef.current;
      const radius = 30;
      const height = 30;
      dirLightRef.current.position.set(
        Math.cos(angle) * radius,
        height * Math.abs(Math.sin(angle)),
        Math.sin(angle) * radius
      );
      const warmth = Math.max(0, Math.sin(angle));
      dirLightRef.current.color.setHSL(0.08, warmth * 0.3, 0.8 + warmth * 0.2);
      dirLightRef.current.intensity = 1 + warmth * 2;
      hemiLightRef.current.intensity = 0.3 + warmth * 0.7;
      ambientLightRef.current.intensity = 0.3 + warmth * 0.4;
      if (sceneRef.current) {
        const skyHue = 0.58 + warmth * 0.05;
        const skyLight = 0.15 + warmth * 0.6;
        sceneRef.current.background = new THREE.Color().setHSL(skyHue, 0.4, skyLight);
      }
      frame = requestAnimationFrame(animateDayNight);
    }
    if (dayNightMode) {
      animateDayNight();
    } else {
      if (dirLightRef.current) {
        dirLightRef.current.position.set(20, 30, 20);
        dirLightRef.current.color.set(0xffffff);
        dirLightRef.current.intensity = 2;
      }
      if (hemiLightRef.current) hemiLightRef.current.intensity = 0.8;
      if (ambientLightRef.current) ambientLightRef.current.intensity = 0.6;
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(darkBg ? 0x1a2332 : 0xe8eef5);
      }
    }
    return () => { if (frame) cancelAnimationFrame(frame); };
  }, [dayNightMode, darkBg]);

  // Measurement click handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !measurementMode) return;

    function handleClick(e) {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycasterRef.current.setFromCamera(mouse, cameraRef.current);
      const target = buildingRef.current || importedModelRef.current;
      if (!target) return;
      const intersects = raycasterRef.current.intersectObject(target, true);
      if (intersects.length > 0) {
        const point = intersects[0].point.clone();
        setMeasurements((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.length === 2) {
            return [...prev, [point]];
          } else {
            return [...prev.slice(0, -1), [...last, point]];
          }
        });
      }
    }
    container.addEventListener("dblclick", handleClick);
    return () => container.removeEventListener("dblclick", handleClick);
  }, [measurementMode]);

  // Draw measurements on canvas overlay
  useEffect(() => {
    const canvas = measurementCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    measurements.forEach((pts) => {
      if (pts.length < 1) return;
      const screenPts = pts.map((p) => {
        const v = p.clone().project(cameraRef.current);
        return {
          x: (v.x * 0.5 + 0.5) * canvas.width,
          y: (-v.y * 0.5 + 0.5) * canvas.height,
        };
      });
      ctx.strokeStyle = "#ff6b35";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      if (screenPts.length === 2) {
        ctx.beginPath();
        ctx.moveTo(screenPts[0].x, screenPts[0].y);
        ctx.lineTo(screenPts[1].x, screenPts[1].y);
        ctx.stroke();
        ctx.setLineDash([]);
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        const dz = pts[1].z - pts[0].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2);
        const mx = (screenPts[0].x + screenPts[1].x) / 2;
        const my = (screenPts[0].y + screenPts[1].y) / 2;
        ctx.fillStyle = "rgba(26, 35, 50, 0.85)";
        const text = `${dist}m`;
        const tw = ctx.measureText(text).width;
        ctx.fillRect(mx - tw / 2 - 6, my - 12, tw + 12, 22);
        ctx.strokeStyle = "rgba(255, 107, 53, 0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - tw / 2 - 6, my - 12, tw + 12, 22);
        ctx.fillStyle = "#ff6b35";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, mx, my);
      }
      screenPts.forEach((sp) => {
        ctx.setLineDash([]);
        ctx.fillStyle = "#ff6b35";
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });
  }, [measurements]);

  // Construction Timeline effect
  useEffect(() => {
    if (!constructionPlaying) {
      if (constructionTimerRef.current) cancelAnimationFrame(constructionTimerRef.current);
      return;
    }
    let lastTime = performance.now();
    function tick(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setConstructionProgress((prev) => {
        const next = prev + dt * constructionSpeed * 0.05;
        return next >= 1 ? 1 : next;
      });
      constructionTimerRef.current = requestAnimationFrame(tick);
    }
    constructionTimerRef.current = requestAnimationFrame(tick);
    return () => { if (constructionTimerRef.current) cancelAnimationFrame(constructionTimerRef.current); };
  }, [constructionPlaying, constructionSpeed]);

  // Apply construction timeline to floor visibility/opacity
  useEffect(() => {
    const building = buildingRef.current;
    if (!building) return;
    const floorGroups = building.userData.floorGroups;
    if (!floorGroups) return;
    const totalFloors = floorGroups.length;
    const activeFloors = constructionProgress * totalFloors;
    floorGroups.forEach((fg, i) => {
      if (activeFloors >= i + 1) {
        fg.visible = true;
        fg.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = 1;
            child.material.needsUpdate = true;
          }
        });
      } else if (activeFloors > i) {
        fg.visible = true;
        const floorProgress = activeFloors - i;
        fg.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = floorProgress;
            child.material.needsUpdate = true;
          }
        });
      } else {
        fg.visible = false;
      }
    });
  }, [constructionProgress]);

  // Sun Study effect
  useEffect(() => {
    if (!sunStudyMode) return;
    let frame;
    function animateSun() {
      setSunTime((prev) => {
        const next = prev + 0.002;
        return next > 1 ? 0 : next;
      });
      frame = requestAnimationFrame(animateSun);
    }
    if (sunStudyPlaying) {
      frame = requestAnimationFrame(animateSun);
    }
    return () => { if (frame) cancelAnimationFrame(frame); };
  }, [sunStudyMode, sunStudyPlaying]);

  // Apply sun position
  useEffect(() => {
    if (!sunStudyMode || !dirLightRef.current) return;
    const angle = sunTime * Math.PI;
    const radius = 40;
    const height = Math.sin(angle) * 35;
    dirLightRef.current.position.set(
      Math.cos(angle) * radius,
      Math.max(2, height),
      Math.sin(angle * 0.3) * 20
    );
    dirLightRef.current.castShadow = true;
  }, [sunStudyMode, sunTime]);

  // Fly-through effect
  useEffect(() => {
    if (!flythroughMode || !flythroughPlaying) {
      if (flythroughTimerRef.current) cancelAnimationFrame(flythroughTimerRef.current);
      return;
    }
    let progress = 0;
    let lastTime = performance.now();
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    function tick(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      progress += dt * flythroughSpeed * 0.15;
      if (progress > 1) progress = 0;

      const t = progress;
      let pos, target;

      if (flythroughMode === "orbit") {
        const a = t * Math.PI * 2;
        pos = new THREE.Vector3(Math.cos(a) * 35, 20, Math.sin(a) * 35);
        target = new THREE.Vector3(0, 5, 0);
      } else if (flythroughMode === "walkin") {
        const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        pos = new THREE.Vector3(60 - e * 55, 25 - e * 20, 60 - e * 55);
        target = new THREE.Vector3(0, 3, 0);
      } else if (flythroughMode === "flyover") {
        pos = new THREE.Vector3(
          -40 + t * 80,
          30 + Math.sin(t * Math.PI) * 15,
          -20 + Math.sin(t * Math.PI * 2) * 10
        );
        target = new THREE.Vector3(0, 5, 0);
      } else if (flythroughMode === "interior") {
        const fh = preset.floorHeight;
        const fi = Math.floor(t * (visibleFloors ?? preset.floors));
        const lt = (t * (visibleFloors ?? preset.floors)) - fi;
        pos = new THREE.Vector3(-preset.width / 2 + lt * preset.width, fi * fh + fh / 2, 0);
        target = new THREE.Vector3(-preset.width / 2 + (lt + 0.3) * preset.width, fi * fh + fh / 2, 0);
      }

      camera.position.copy(pos);
      controls.target.copy(target);
      controls.update();
      flythroughTimerRef.current = requestAnimationFrame(tick);
    }
    flythroughTimerRef.current = requestAnimationFrame(tick);
    return () => { if (flythroughTimerRef.current) cancelAnimationFrame(flythroughTimerRef.current); };
  }, [flythroughMode, flythroughPlaying, flythroughSpeed, preset, visibleFloors]);

  // Terrain effect
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (terrainRef.current) {
      scene.remove(terrainRef.current);
      disposeMesh(terrainRef.current);
      terrainRef.current = null;
    }

    if (!showTerrain) return;

    const segments = 64;
    const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const h = terrainNoise(x, z) * terrainHeight;
      const dist = Math.sqrt(x * x + z * z);
      const buildingRadius = Math.max(preset.width, preset.depth) * 0.7;
      const fade = Math.min(1, Math.max(0, (dist - buildingRadius) / 10));
      posAttr.setY(i, h * fade - 0.4);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x4a7c3f, roughness: 0.95, metalness: 0, flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    scene.add(mesh);
    terrainRef.current = mesh;

    return () => {
      if (terrainRef.current) {
        scene.remove(terrainRef.current);
        disposeMesh(terrainRef.current);
        terrainRef.current = null;
      }
    };
  }, [showTerrain, terrainSize, terrainHeight, preset]);

  // ── Component Editor: ghost preview for placement ────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    // cleanup old ghost
    if (ghostRef.current) {
      scene.remove(ghostRef.current);
      disposeMesh(ghostRef.current);
      ghostRef.current = null;
    }
    if (editorMode !== "place" || !placingType) return;

    const ghost = createComponentMesh(placingType);
    ghost.traverse((c) => {
      if (c.isMesh) {
        c.material = c.material.clone();
        c.material.transparent = true;
        c.material.opacity = 0.45;
        c.material.depthWrite = false;
      }
    });
    ghost.position.set(0, 0, 0);
    ghost.visible = false;
    scene.add(ghost);
    ghostRef.current = ghost;

    return () => {
      if (ghostRef.current) {
        scene.remove(ghostRef.current);
        disposeMesh(ghostRef.current);
        ghostRef.current = null;
      }
    };
  }, [editorMode, placingType]);

  // ── Component Editor: placement rotation ─────────────────────────────────
  useEffect(() => {
    if (ghostRef.current) ghostRef.current.rotation.y = placeRotation;
  }, [placeRotation]);

  // ── Component Editor: selection highlight ────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (selectionBoxRef.current) {
      scene.remove(selectionBoxRef.current);
      selectionBoxRef.current = null;
    }
    if (!selectedComponentId || editorMode !== "select") return;
    const comp = placedComponents.find((c) => c.id === selectedComponentId);
    if (!comp?.mesh) return;
    const box = new THREE.Box3().setFromObject(comp.mesh);
    const helper = new THREE.Box3Helper(box, 0x00ff88);
    scene.add(helper);
    selectionBoxRef.current = helper;
    return () => {
      if (selectionBoxRef.current) {
        scene.remove(selectionBoxRef.current);
        selectionBoxRef.current = null;
      }
    };
  }, [selectedComponentId, editorMode, placedComponents]);

  // ── Component Editor: cleanup all placed on unmount or mode switch ──────
  useEffect(() => {
    return () => {
      // cleanup placed components on unmount
      const scene = sceneRef.current;
      if (!scene) return;
      placedComponents.forEach((c) => {
        if (c.mesh) { scene.remove(c.mesh); disposeMesh(c.mesh); }
      });
    };
  }, []); // eslint-disable-line

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      el?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const takeScreenshot = () => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!renderer || !camera || !scene) return;

    const originalBg = scene.background.clone();
    scene.background = new THREE.Color(0xffffff);
    renderer.render(scene, camera);
    const link = document.createElement("a");
    link.download = "building-viewer-screenshot.png";
    link.href = renderer.domElement.toDataURL("image/png");
    link.click();
    scene.background = originalBg;
    renderer.render(scene, camera);
  };

  const resetView = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.copy(defaultCamPos);
    controls.target.copy(defaultTarget);
    controls.update();
    setViewMode("perspective");
  };

  const clearMeasurements = () => {
    setMeasurements([]);
  };

  const deleteMeasurement = (index) => {
    setMeasurements((prev) => prev.filter((_, i) => i !== index));
  };

  const getMeasurementDistance = (pts) => {
    if (pts.length < 2) return 0;
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    const dz = pts[1].z - pts[0].z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  // ── Component Editor: handlers ────────────────────────────────────────────
  const startPlacement = (type) => {
    setEditorMode("place");
    setPlacingType(type);
    setSelectedComponentId(null);
    setPlaceRotation(0);
    setMeasurementMode(false);
  };

  const startSelectMode = () => {
    setEditorMode("select");
    setPlacingType(null);
    setSelectedComponentId(null);
    setMeasurementMode(false);
  };

  const startRemoveMode = () => {
    setEditorMode("remove");
    setPlacingType(null);
    setSelectedComponentId(null);
    setMeasurementMode(false);
  };

  const cancelEditor = () => {
    setEditorMode(null);
    setPlacingType(null);
    setSelectedComponentId(null);
    setPlaceRotation(0);
  };

  const placeComponent = useCallback((position) => {
    if (!placingType) return;
    const mesh = createComponentMesh(placingType);
    mesh.position.set(
      Math.round(position.x / 0.5) * 0.5,
      0,
      Math.round(position.z / 0.5) * 0.5
    );
    mesh.rotation.y = placeRotation;
    sceneRef.current?.add(mesh);
    const id = nextCompId();
    const label = COMPONENT_CATALOG.find((c) => c.type === placingType)?.label || placingType;
    setPlacedComponents((prev) => [...prev, { id, type: placingType, label, mesh, position: mesh.position.clone(), rotation: placeRotation }]);
  }, [placingType, placeRotation]);

  const removeComponent = useCallback((id) => {
    setPlacedComponents((prev) => {
      const comp = prev.find((c) => c.id === id);
      if (comp?.mesh) {
        // fade out animation
        const mesh = comp.mesh;
        const start = performance.now();
        function fadeOut(now) {
          const t = Math.min((now - start) / 400, 1);
          mesh.traverse((c) => { if (c.isMesh && c.material) { c.material.opacity = 1 - t; c.material.transparent = true; } });
          if (t < 1) requestAnimationFrame(fadeOut);
          else { sceneRef.current?.remove(mesh); disposeMesh(mesh); }
        }
        requestAnimationFrame(fadeOut);
      }
      return prev.filter((c) => c.id !== id);
    });
    if (selectedComponentId === id) setSelectedComponentId(null);
  }, [selectedComponentId]);

  const clearAllComponents = () => {
    placedComponents.forEach((c) => {
      if (c.mesh) { sceneRef.current?.remove(c.mesh); disposeMesh(c.mesh); }
    });
    setPlacedComponents([]);
    setSelectedComponentId(null);
  };

  // ── Canvas click handler for placement / selection / removal ──────────────
  const handleCanvasClick = useCallback((e) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    if (editorMode === "place" && placingType) {
      // raycast against ground plane y=0
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, pt);
      if (pt) placeComponent(pt);
      return;
    }

    if (editorMode === "select" || editorMode === "remove") {
      // raycast against placed components
      const targets = placedComponents.map((c) => c.mesh).filter(Boolean);
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length > 0) {
        // find which component group was hit
        let obj = hits[0].object;
        while (obj && !obj.userData?.isPlacedComponent) obj = obj.parent;
        if (obj?.userData?.isPlacedComponent) {
          const comp = placedComponents.find((c) => c.mesh === obj);
          if (comp) {
            if (editorMode === "remove") {
              if (window.confirm(`Remove ${comp.label}?`)) removeComponent(comp.id);
            } else {
              setSelectedComponentId(comp.id);
            }
          }
        }
      }
    }
  }, [editorMode, placingType, placedComponents, placeComponent, removeComponent]);

  // attach canvas click listener
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const el = renderer.domElement;
    el.addEventListener("click", handleCanvasClick);
    return () => el.removeEventListener("click", handleCanvasClick);
  }, [handleCanvasClick]);

  // ── Mouse move for ghost preview ──────────────────────────────────────────
  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;
    function onMove(e) {
      if (!ghostRef.current || editorMode !== "place") return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const pt = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, pt);
      if (pt) {
        ghostRef.current.visible = true;
        ghostRef.current.position.set(
          Math.round(pt.x / 0.5) * 0.5,
          0,
          Math.round(pt.z / 0.5) * 0.5
        );
      }
    }
    renderer.domElement.addEventListener("mousemove", onMove);
    return () => renderer.domElement.removeEventListener("mousemove", onMove);
  }, [editorMode]);

  // ── Keyboard: Escape to cancel, Delete to remove selected, R to rotate ──
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") cancelEditor();
      if (e.key === "r" || e.key === "R") {
        if (editorMode === "place") setPlaceRotation((r) => r + Math.PI / 2);
        if (editorMode === "select" && selectedComponentId) {
          const comp = placedComponents.find((c) => c.id === selectedComponentId);
          if (comp?.mesh) {
            comp.mesh.rotation.y += Math.PI / 2;
            comp.rotation = comp.mesh.rotation.y;
            setPlacedComponents((p) => [...p]);
          }
        }
      }
      if ((e.key === "Delete" || e.key === "Backspace") && editorMode === "select" && selectedComponentId) {
        removeComponent(selectedComponentId);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorMode, selectedComponentId, placedComponents, removeComponent]);

  const formatTime = (t) => {
    const totalMinutes = Math.round(t * 720);
    const hours = 6 + Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const constructionDate = useMemo(() => {
    const days = Math.floor(constructionProgress * 365);
    const d = new Date(2025, 0, 6);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }, [constructionProgress]);

  const exportGLB = async () => {
    const target = buildingRef.current;
    if (!target) return;
    const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
    const exporter = new GLTFExporter();
    exporter.parse(
      target,
      (result) => {
        const blob = new Blob([result], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "building.glb";
        link.click();
        URL.revokeObjectURL(url);
      },
      (error) => {
        console.error("GLB export error:", error);
      },
      { binary: true }
    );
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    setMode("project");
    setProjectDropdownOpen(false);
    setProjectSearch("");
  };

  const filteredProjects = projects.filter((p) => {
    const name = (p.name || "").toLowerCase();
    const loc = (p.location || "").toLowerCase();
    const q = projectSearch.toLowerCase();
    return name.includes(q) || loc.includes(q);
  });

  return (
    <div className="plan-viewer-page">
      <div className="viewer-container" ref={containerRef}>
        <canvas
          ref={measurementCanvasRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}
        />
      </div>

      {/* Top Toolbar */}
      <div className="viewer-toolbar">
        <div className="toolbar-left">
          <h2 className="viewer-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {mode === "preset" ? preset.name : "Project 3D Model"}
          </h2>
        </div>
        <div className="toolbar-right">
          <button className="viewer-btn" onClick={resetView} title="Reset View">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
          <button className={`viewer-btn ${autoRotate ? "active" : ""}`} onClick={() => setAutoRotate(!autoRotate)} title="Auto Rotate">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
          <button className={`viewer-btn ${wireframe ? "active" : ""}`} onClick={() => setWireframe(!wireframe)} title="Toggle Wireframe">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
          </button>
          <button className={`viewer-btn ${!darkBg ? "active" : ""}`} onClick={() => setDarkBg(!darkBg)} title="Toggle Background">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {darkBg ? (
                <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
              ) : (
                <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>
              )}
            </svg>
          </button>
          <button className="viewer-btn" onClick={takeScreenshot} title="Screenshot">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          <button className={`viewer-btn ${showInfo ? "active" : ""}`} onClick={() => setShowInfo(!showInfo)} title="Toggle Info">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>
          <button className={`viewer-btn ${isFullscreen ? "active" : ""}`} onClick={toggleFullscreen} title="Fullscreen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isFullscreen ? (
                <><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></>
              ) : (
                <><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="view-controls">
        <button className={`view-btn ${viewMode === "perspective" ? "active" : ""}`} onClick={() => setViewMode("perspective")} title="Perspective">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M3 14h7v7H3z"/><path d="M14 14h7v7h-7z"/>
          </svg>
        </button>
        <button className={`view-btn ${viewMode === "top" ? "active" : ""}`} onClick={() => setViewMode("top")} title="Top">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/>
          </svg>
        </button>
        <button className={`view-btn ${viewMode === "front" ? "active" : ""}`} onClick={() => setViewMode("front")} title="Front">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
          </svg>
        </button>
        <button className={`view-btn ${viewMode === "side" ? "active" : ""}`} onClick={() => setViewMode("side")} title="Side">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>
      </div>

      {/* Advanced Tools Toolbar */}
      <div className="advanced-toolbar">
        <button className={`viewer-btn ${measurementMode ? "active" : ""}`} onClick={() => { setMeasurementMode(!measurementMode); if (measurementMode) clearMeasurements(); }} title="Measurement Tool (double-click two points)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 22L22 2M15 2h7v7M9 22H2v-7"/>
          </svg>
        </button>
        <button className={`viewer-btn ${explodedView ? "active" : ""}`} onClick={() => setExplodedView(!explodedView)} title="Exploded View">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button className={`viewer-btn ${sectionCut ? "active" : ""}`} onClick={() => setSectionCut(!sectionCut)} title="Section Cut">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.59" y2="13.51"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.59" y1="10.49" x2="14.47" y2="14.48"/>
          </svg>
        </button>
        <button className={`viewer-btn ${showDimensions ? "active" : ""}`} onClick={() => setShowDimensions(!showDimensions)} title="Show Dimensions">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 3H3v18h18V3zM9 3v18M15 3v18M3 9h18M3 15h18"/>
          </svg>
        </button>
        <button className={`viewer-btn ${dayNightMode ? "active" : ""}`} onClick={() => setDayNightMode(!dayNightMode)} title="Day/Night Cycle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {dayNightMode ? (
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            ) : (
              <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
            )}
          </svg>
        </button>
        <button className="viewer-btn" onClick={exportGLB} title="Export GLB">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button className={`viewer-btn ${showMeasurementHistory ? "active" : ""}`} onClick={() => setShowMeasurementHistory(!showMeasurementHistory)} title="Measurement History">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </button>
        <button className={`viewer-btn ${showTakeoff ? "active" : ""}`} onClick={() => setShowTakeoff(!showTakeoff)} title="Material Takeoff">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </button>
        <button className={`viewer-btn ${sunStudyMode ? "active" : ""}`} onClick={() => { setSunStudyMode(!sunStudyMode); if (!sunStudyMode) setSunStudyPlaying(true); else setSunStudyPlaying(false); }} title="Sun Study">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
        <button className={`viewer-btn ${flythroughMode ? "active" : ""}`} onClick={() => { if (flythroughMode) { setFlythroughMode(null); setFlythroughPlaying(false); } else { setFlythroughMode("orbit"); setFlythroughPlaying(true); } }} title="Camera Fly-through">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </button>
        <button className={`viewer-btn ${constructionPlaying ? "active" : ""}`} onClick={() => { if (!constructionPlaying && constructionProgress >= 1) setConstructionProgress(0); setConstructionPlaying(!constructionPlaying); }} title="Construction Timeline">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </button>
        <button className={`viewer-btn ${showTerrain ? "active" : ""}`} onClick={() => setShowTerrain(!showTerrain)} title="Toggle Terrain">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 20L8 10l4 4 4-6 6 10H2z"/>
          </svg>
        </button>
        {/* Component Editor Buttons */}
        <div className="toolbar-divider" />
        <button className={`viewer-btn ${editorMode === "place" ? "active" : ""}`} onClick={() => { if (editorMode === "place") cancelEditor(); else startPlacement("room"); }} title="Add Component">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </button>
        <button className={`viewer-btn ${editorMode === "select" ? "active" : ""}`} onClick={() => { if (editorMode === "select") cancelEditor(); else startSelectMode(); }} title="Select Component">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          </svg>
        </button>
        <button className={`viewer-btn ${editorMode === "remove" ? "active" : ""}`} onClick={() => { if (editorMode === "remove") cancelEditor(); else startRemoveMode(); }} title="Remove Component">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
          </svg>
        </button>
      </div>

      {/* Bottom Tools Bar */}
      <div className="bottom-tools">
        {/* Mode Toggle + Presets */}
        <div className="bottom-tools-group">
          <button
            className={`mode-toggle-btn ${mode === "preset" ? "active" : ""}`}
            onClick={() => setMode("preset")}
          >
            Procedural
          </button>
          <button
            className={`mode-toggle-btn ${mode === "project" ? "active" : ""}`}
            onClick={() => {
              setMode("project");
              if (selectedProjectId) loadProjectModel(selectedProjectId);
            }}
          >
            Project Model
          </button>
        </div>

        {mode === "preset" ? (
          <>
            {/* Preset Pills */}
            <div className="preset-pills">
              {BUILDING_PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  className={`preset-pill ${i === currentPreset ? "active" : ""}`}
                  onClick={() => { setCurrentPreset(i); setMode("preset"); }}
                >
                  <span className="preset-dot" style={{ background: p.color }} />
                  <span>{p.name}</span>
                  <span className="preset-floors">{p.floors} fl</span>
                </button>
              ))}
            </div>
            {/* Floor slider for presets */}
            <div className="tool-group">
              <label className="tool-label">Floors: {visibleFloors ?? preset.floors}/{preset.floors}</label>
              <input
                type="range"
                min={1}
                max={preset.floors}
                value={visibleFloors ?? preset.floors}
                onChange={(e) => setVisibleFloors(Number(e.target.value))}
                className="floor-slider"
              />
              {visibleFloors != null && visibleFloors < preset.floors && (
                <button className="tool-reset-btn" onClick={() => setVisibleFloors(null)} title="Show all floors">Reset</button>
              )}
            </div>
            {explodedView && (
              <div className="tool-group">
                <label className="tool-label">Explosion: {explosionDistance.toFixed(1)}m</label>
                <input
                  type="range" min={0} max={10} step={0.1}
                  value={explosionDistance}
                  onChange={(e) => setExplosionDistance(Number(e.target.value))}
                  className="floor-slider"
                />
              </div>
            )}
            {sectionCut && (
              <div className="tool-group">
                <label className="tool-label">Cut: {(sectionPosition * 100).toFixed(0)}%</label>
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={sectionPosition}
                  onChange={(e) => setSectionPosition(Number(e.target.value))}
                  className="floor-slider"
                />
              </div>
            )}
          </>
        ) : (
          /* Project Selector */
          <div className="project-selector-group">
            <div className="project-selector-wrapper">
              <input
                type="text"
                placeholder="Search projects..."
                value={projectSearch}
                onChange={(e) => { setProjectSearch(e.target.value); setProjectDropdownOpen(true); }}
                onFocus={() => setProjectDropdownOpen(true)}
                className="project-search-input"
              />
              <svg className="project-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {projectDropdownOpen && (
                <div className="project-dropdown">
                  {filteredProjects.length === 0 ? (
                    <div className="project-dropdown-empty">No projects found</div>
                  ) : (
                    filteredProjects.map((p) => (
                      <button
                        key={p.id}
                        className={`project-dropdown-item ${p.id === selectedProjectId ? "active" : ""}`}
                        onClick={() => handleProjectSelect(p.id)}
                      >
                        <span className="project-item-name">{p.name}</span>
                        <span className="project-item-meta">
                          {p.three_d_plan ? "3D ✓" : "No model"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {loading && <span className="model-loading">Loading model...</span>}
            {loadError && <span className="model-error">{loadError}</span>}
            {selectedProjectId && mode === "project" && !loading && !loadError && (
              <span className="model-loaded">
                Loaded: {projects.find((p) => p.id === selectedProjectId)?.name || `Project #${selectedProjectId}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info Panel */}
      {showInfo && mode === "preset" && (
        <div className="info-panel">
          <h3 className="info-title">Building Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Name</span>
              <span className="info-value">{preset.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Floors</span>
              <span className="info-value">{preset.floors}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Width</span>
              <span className="info-value">{preset.width}m</span>
            </div>
            <div className="info-item">
              <span className="info-label">Depth</span>
              <span className="info-value">{preset.depth}m</span>
            </div>
            <div className="info-item">
              <span className="info-label">Height</span>
              <span className="info-value">{(visibleFloors ?? preset.floors) * preset.floorHeight}m</span>
            </div>
            <div className="info-item">
              <span className="info-label">Floor Ht</span>
              <span className="info-value">{preset.floorHeight}m</span>
            </div>
            <div className="info-item">
              <span className="info-label">Windows/F</span>
              <span className="info-value">{preset.windowsPerFloor}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Roof</span>
              <span className="info-value">{preset.roofType}</span>
            </div>
          </div>
          <div className="info-section">
            <h4 className="info-section-title">Floor Visibility</h4>
            <div className="floor-vis-grid">
              {Array.from({ length: preset.floors }, (_, i) => (
                <label key={i} className="floor-vis-item">
                  <input
                    type="checkbox"
                    checked={floorVisibility[i] ?? true}
                    onChange={(e) => {
                      const next = [...floorVisibility];
                      while (next.length <= i) next.push(true);
                      next[i] = e.target.checked;
                      setFloorVisibility(next);
                    }}
                  />
                  <span>F{i + 1}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="info-section">
            <h4 className="info-section-title">Building Color</h4>
            <div className="color-picker-row">
              <input
                type="color"
                value={buildingColor}
                onChange={(e) => setBuildingColor(e.target.value)}
                className="building-color-input"
              />
              <span className="color-hex">{buildingColor}</span>
            </div>
          </div>
          {showDimensions && (
            <div className="info-section">
              <h4 className="info-section-title">Dimensions</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Width</span>
                  <span className="info-value">{preset.width}m</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Depth</span>
                  <span className="info-value">{preset.depth}m</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Height</span>
                  <span className="info-value">{(visibleFloors ?? preset.floors) * preset.floorHeight}m</span>
                </div>
              </div>
            </div>
          )}
          <p className="info-hint">Drag to orbit · Scroll to zoom</p>
        </div>
      )}

      {showInfo && mode === "project" && selectedProjectId && (
        <div className="info-panel">
          <h3 className="info-title">Project Model</h3>
          {(() => {
            const p = projects.find((proj) => proj.id === selectedProjectId);
            return p ? (
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name</span>
                  <span className="info-value">{p.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">{p.location || "-"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value">{p.status || "-"}</span>
                </div>
              </div>
            ) : (
              <p className="info-hint">Select a project to view its 3D model</p>
            );
          })()}
          <p className="info-hint">Drag to orbit · Scroll to zoom</p>
        </div>
      )}

      {/* Construction Timeline Panel */}
      {(constructionPlaying || constructionProgress > 0) && (
        <div className="construction-panel">
          <h3 className="panel-title">Construction Timeline</h3>
          <div className="construction-date">{constructionDate}</div>
          <div className="construction-progress-bar">
            <div className="construction-progress-fill" style={{ width: `${constructionProgress * 100}%` }} />
          </div>
          <div className="construction-controls">
            <button className="construction-btn" onClick={() => { setConstructionProgress(0); setConstructionPlaying(false); }} title="Reset">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="6" width="12" height="12"/>
              </svg>
            </button>
            <button className="construction-btn play-btn" onClick={() => { if (!constructionPlaying && constructionProgress >= 1) setConstructionProgress(0); setConstructionPlaying(!constructionPlaying); }}>
              {constructionPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              )}
            </button>
          </div>
          <div className="construction-speed">
            <span className="tool-label">Speed:</span>
            {[1, 2, 4].map((s) => (
              <button key={s} className={`speed-btn ${constructionSpeed === s ? "active" : ""}`} onClick={() => setConstructionSpeed(s)}>
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sun Study Panel */}
      {sunStudyMode && (
        <div className="sun-study-panel">
          <h3 className="panel-title">Sun Study</h3>
          <div className="sun-time-display">{formatTime(sunTime)}</div>
          <div className="sun-controls">
            <button className="construction-btn play-btn" onClick={() => setSunStudyPlaying(!sunStudyPlaying)}>
              {sunStudyPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              )}
            </button>
          </div>
          <div className="tool-group">
            <label className="tool-label">Time:</label>
            <input
              type="range" min={0} max={1} step={0.005}
              value={sunTime}
              onChange={(e) => setSunTime(Number(e.target.value))}
              className="floor-slider"
            />
          </div>
        </div>
      )}

      {/* Fly-through Panel */}
      {flythroughMode && (
        <div className="flythrough-panel">
          <h3 className="panel-title">Camera Fly-through</h3>
          <div className="flythrough-modes">
            {[
              { id: "orbit", label: "Orbit" },
              { id: "walkin", label: "Walk-in" },
              { id: "flyover", label: "Flyover" },
              { id: "interior", label: "Interior" },
            ].map((m) => (
              <button key={m.id} className={`flythrough-mode-btn ${flythroughMode === m.id ? "active" : ""}`} onClick={() => { setFlythroughMode(m.id); setFlythroughPlaying(true); }}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="flythrough-controls">
            <button className="construction-btn play-btn" onClick={() => setFlythroughPlaying(!flythroughPlaying)}>
              {flythroughPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              )}
            </button>
            <button className="construction-btn" onClick={() => { setFlythroughMode(null); setFlythroughPlaying(false); }} title="Stop">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="6" width="12" height="12"/>
              </svg>
            </button>
          </div>
          <div className="tool-group">
            <label className="tool-label">Speed:</label>
            <input
              type="range" min={0.2} max={3} step={0.1}
              value={flythroughSpeed}
              onChange={(e) => setFlythroughSpeed(Number(e.target.value))}
              className="floor-slider"
            />
            <span className="tool-label">{flythroughSpeed.toFixed(1)}x</span>
          </div>
        </div>
      )}

      {/* Material Takeoff Panel */}
      {showTakeoff && mode === "preset" && (
        <div className="takeoff-panel">
          <h3 className="panel-title">Material Quantity Takeoff</h3>
          <div className="takeoff-grid">
            <div className="takeoff-row">
              <span className="takeoff-label">Concrete</span>
              <span className="takeoff-value">{takeoff.concreteVolume.toFixed(1)} m³</span>
              <span className="takeoff-cost">${takeoffCost.concrete.toLocaleString()}</span>
            </div>
            <div className="takeoff-row">
              <span className="takeoff-label">Steel</span>
              <span className="takeoff-value">{takeoff.steelWeight.toFixed(0)} kg</span>
              <span className="takeoff-cost">${takeoffCost.steel.toLocaleString()}</span>
            </div>
            <div className="takeoff-row">
              <span className="takeoff-label">Glass</span>
              <span className="takeoff-value">{takeoff.windowArea.toFixed(1)} m²</span>
              <span className="takeoff-cost">${takeoffCost.glass.toLocaleString()}</span>
            </div>
            <div className="takeoff-row">
              <span className="takeoff-label">Bricks</span>
              <span className="takeoff-value">{takeoff.brickCount.toLocaleString()}</span>
              <span className="takeoff-cost">${takeoffCost.brick.toLocaleString()}</span>
            </div>
            <div className="takeoff-row">
              <span className="takeoff-label">Paint</span>
              <span className="takeoff-value">{takeoff.paintArea.toFixed(1)} m²</span>
              <span className="takeoff-cost">${takeoffCost.paint.toLocaleString()}</span>
            </div>
            <div className="takeoff-total">
              <span>Total Estimate</span>
              <span className="takeoff-cost">${takeoffCost.total.toLocaleString()}</span>
            </div>
          </div>
          <div className="takeoff-rates">
            <h4 className="info-section-title">Unit Rates</h4>
            <div className="rate-row">
              <label className="rate-label">Concrete ($/m³)</label>
              <input type="number" value={concreteRate} onChange={(e) => setConcreteRate(Number(e.target.value))} className="rate-input" />
            </div>
            <div className="rate-row">
              <label className="rate-label">Steel ($/kg)</label>
              <input type="number" value={steelRate} onChange={(e) => setSteelRate(Number(e.target.value))} className="rate-input" />
            </div>
            <div className="rate-row">
              <label className="rate-label">Glass ($/m²)</label>
              <input type="number" value={glassRate} onChange={(e) => setGlassRate(Number(e.target.value))} className="rate-input" />
            </div>
            <div className="rate-row">
              <label className="rate-label">Brick ($/ea)</label>
              <input type="number" value={brickRate} onChange={(e) => setBrickRate(Number(e.target.value))} className="rate-input" />
            </div>
            <div className="rate-row">
              <label className="rate-label">Paint ($/m²)</label>
              <input type="number" value={paintRate} onChange={(e) => setPaintRate(Number(e.target.value))} className="rate-input" />
            </div>
          </div>
        </div>
      )}

      {/* Measurement History Panel */}
      {showMeasurementHistory && (
        <div className="measurement-history-panel">
          <div className="measurement-history-header">
            <h3 className="panel-title" style={{ margin: 0 }}>Measurements ({measurements.filter((m) => m.length === 2).length})</h3>
            {measurements.length > 0 && (
              <button className="tool-reset-btn" onClick={clearMeasurements}>Clear All</button>
            )}
          </div>
          <div className="measurement-history-list">
            {measurements.filter((m) => m.length === 2).length === 0 ? (
              <div className="measurement-history-empty">No measurements yet. Use the measurement tool and double-click two points.</div>
            ) : (
              measurements.map((pts, idx) => {
                if (pts.length < 2) return null;
                const dist = getMeasurementDistance(pts);
                return (
                  <div key={idx} className="measurement-history-item">
                    <div className="measurement-item-info">
                      <span className="measurement-item-idx">#{idx + 1}</span>
                      <span className="measurement-item-dist">{dist.toFixed(2)}m</span>
                    </div>
                    <div className="measurement-item-coords">
                      A: ({pts[0].x.toFixed(1)}, {pts[0].y.toFixed(1)}, {pts[0].z.toFixed(1)})
                    </div>
                    <div className="measurement-item-coords">
                      B: ({pts[1].x.toFixed(1)}, {pts[1].y.toFixed(1)}, {pts[1].z.toFixed(1)})
                    </div>
                    <button className="measurement-delete-btn" onClick={() => deleteMeasurement(idx)} title="Delete">&#10005;</button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Terrain Controls */}
      {showTerrain && (
        <div className="terrain-panel">
          <h3 className="panel-title">Terrain</h3>
          <div className="tool-group">
            <label className="tool-label">Size: {terrainSize}m</label>
            <input
              type="range" min={40} max={200} step={10}
              value={terrainSize}
              onChange={(e) => setTerrainSize(Number(e.target.value))}
              className="floor-slider"
            />
          </div>
          <div className="tool-group">
            <label className="tool-label">Height: {terrainHeight.toFixed(1)}m</label>
            <input
              type="range" min={0} max={15} step={0.5}
              value={terrainHeight}
              onChange={(e) => setTerrainHeight(Number(e.target.value))}
              className="floor-slider"
            />
          </div>
        </div>
      )}

      {/* Component Palette (when in place mode) */}
      {editorMode === "place" && (
        <div className="component-palette">
          <div className="component-palette-header">
            <h3 className="panel-title">Add Component</h3>
            <button className="tool-reset-btn" onClick={cancelEditor}>Cancel</button>
          </div>
          <div className="component-grid">
            {COMPONENT_CATALOG.map((cat) => (
              <button
                key={cat.type}
                className={`component-card ${placingType === cat.type ? "active" : ""}`}
                onClick={() => setPlacingType(cat.type)}
                title={cat.desc}
              >
                <span className="component-icon">{cat.icon}</span>
                <span className="component-label">{cat.label}</span>
                <span className="component-desc">{cat.desc}</span>
              </button>
            ))}
          </div>
          {placingType && (
            <div className="place-instructions">
              <span>Click on ground to place</span>
              <span>Scroll to rotate • Esc to cancel</span>
            </div>
          )}
        </div>
      )}

      {/* Component List (always visible when editor active) */}
      {editorMode && placedComponents.length > 0 && (
        <div className="component-list-panel">
          <div className="component-list-header">
            <h3 className="panel-title">Components ({placedComponents.length})</h3>
            <button className="tool-reset-btn" onClick={clearAllComponents}>Clear All</button>
          </div>
          <div className="component-list-scroll">
            {placedComponents.map((comp) => (
              <div
                key={comp.id}
                className={`component-list-item ${selectedComponentId === comp.id ? "selected" : ""}`}
                onClick={() => {
                  if (editorMode === "select") setSelectedComponentId(comp.id);
                  if (editorMode === "remove") {
                    if (window.confirm(`Remove ${comp.label}?`)) removeComponent(comp.id);
                  }
                }}
              >
                <span className="comp-list-icon">{COMPONENT_CATALOG.find((c) => c.type === comp.type)?.icon}</span>
                <div className="comp-list-info">
                  <span className="comp-list-name">{comp.label}</span>
                  <span className="comp-list-pos">({comp.position.x.toFixed(1)}, {comp.position.z.toFixed(1)})</span>
                </div>
                <button className="comp-list-delete" onClick={(e) => { e.stopPropagation(); removeComponent(comp.id); }} title="Remove">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Mode Indicator */}
      {editorMode && (
        <div className="editor-mode-badge">
          {editorMode === "place" && `Placing: ${COMPONENT_CATALOG.find((c) => c.type === placingType)?.label || "..."}`}
          {editorMode === "select" && (selectedComponentId ? `Selected: ${placedComponents.find((c) => c.id === selectedComponentId)?.label} — Press R to rotate, Del to remove` : "Click a component to select")}
          {editorMode === "remove" && "Click a component to remove it"}
        </div>
      )}
    </div>
  );
}
