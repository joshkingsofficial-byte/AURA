import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STARTUP_BAT_REVEAL_MS } from './constants';

// AURA 001 — BatReveal (the Minded bat, Phase 5.5 cold-start prefix).
//
// No longer the production startup default (see BatarangSpinSpotlight.js,
// which is) — this file now renders whenever a technician explicitly picks
// the Minded bat as the fallback, or one of the static TestBatarang
// orientation references, in TechnicianOverview.js. Its own behaviour is
// otherwise completely unchanged from when it WAS the default: still never
// moves, still the same reveal lifecycle, still usable for any GLB passed
// via `modelUrl`.
//
// The physical bat is a real scanned object (see MASTER_WORK_FILE.md /
// assets/minded-bat/) — a thin silver relief, not a sculptural 3D logo.
// Revised direction: the bat should feel EMBEDDED in AURA's own black
// surface, like an embossed/carved relief caught by grazing museum
// lighting — not a lit-up object floating in space. The object and camera
// never move at all, for the entire mount lifetime — no orbit, no spin,
// no scale/position tween, no float-toward-viewer, no morph. Geometry,
// camera framing and on-screen size are untouched by this file.
//
// Three-point "museum spotlight" rig, not a single light: a single grazing
// source left the whole silhouette readable only in the narrow band it
// happened to catch, with the rest blending into the background — fine
// for texture, not enough for instant recognition of the full outline. KEY
// is the animated one (the only thing that ever moves: its azimuth sweeps
// a narrow grazing arc while intensity ramps, once, over
// STARTUP_BAT_REVEAL_MS) and still does most of the relief-revealing work.
// FILL is fixed, low, on the opposite side, just enough to keep the far
// wing from vanishing into pure black so the full span reads. RIM is
// fixed, steeper (more overhead), and exists specifically to catch the
// outer wing-tip and head/body contour edges — what makes the outline
// legible as "a bat" rather than "a textured smear" — without raising
// overall surface brightness, since it's a narrow edge-catch, not a fill.
// All three ramp up together during 'revealing' and hold at rest during
// 'lit'; only KEY's azimuth itself moves.
//
// Isolated deliberately: this is the only component in aura001/ using
// WebGL (three.js) rather than SVG/CSS — everything else in this project
// is hand-drawn geometry or DOM. Keeping all three.js specifics inside
// this one file means the rest of StartupState.js stays in the same
// plain-React style as the rest of aura001/*; it just hands this
// component a `phase` string and lets it manage its own render loop.
//
// phase: 'dark' (mounted, all three lights pinned near-zero) ->
// 'revealing' (KEY's azimuth sweeps a narrow arc while all three
// intensities ramp, once, over STARTUP_BAT_REVEAL_MS) -> 'lit' (resting
// state: dim, settled, no further animation — stays through the rest of
// STARTUP, including while the wordmark/byline/subtitle appear) ->
// 'fading' (no WebGL-level change; StartupState crossfades this
// component's own opacity via CSS, same final fade-out as everything
// else in STARTUP).

const MODEL_URL = '/aura001-dev/Minded_Bat_AURA_001.glb'; // production default — see `modelUrl` prop below
const MIN_LIGHT = 0.01; // "almost invisible," not literally zero — avoids a hard pop when the reveal begins; shared floor for all three lights
const DARKEN_FACTOR = 0.58; // runtime-only base-colour multiply so the bat stays dark/embedded rather than bright silver — see loader.load below

// KEY — the primary grazing light; the only one whose angle ever moves.
const KEY_REST_LIGHT = 1.15; // trimmed down from an earlier single-light pass (1.4) now that FILL/RIM share the recognition work, so overall surface stays darker
const KEY_ELEVATION = 0.16; // low ratio of vertical-to-horizontal offset -- true raking light, not an overhead key
const KEY_AZIMUTH_START = -Math.PI / 5; // -36deg
const KEY_AZIMUTH_REST = Math.PI / 10; // 18deg -- where the sweep settles and stays for 'lit'
const KEY_COLOR = 0xfff4e0;

// FILL — fixed, opposite side from KEY's resting azimuth, low and cool so
// it reads as ambient shadow-fill rather than a second visible light
// source; keeps the far wing perceivable instead of crushed to black.
const FILL_REST_LIGHT = 0.3;
const FILL_ELEVATION = 0.16;
const FILL_AZIMUTH = KEY_AZIMUTH_REST + Math.PI;
const FILL_COLOR = 0xaecbff;

// RIM — fixed, steep/near-overhead, warm; a narrow edge-catch along the
// outer wing-tip and head/body contour. This is what turns "a dark
// textured band" into "recognizably a bat" — the silhouette's outline,
// not its surface, is the thing a single grazing light can't reach.
const RIM_REST_LIGHT = 0.55;
const RIM_ELEVATION = 0.68;
const RIM_AZIMUTH = KEY_AZIMUTH_REST - Math.PI / 2.1;
const RIM_COLOR = 0xffe9c4;

const LIGHT_RADIUS_FACTOR = 4; // light distance from model center, relative to the model's own thin-axis extent

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function BatReveal({ phase, width, height, modelUrl: modelUrlProp }) {
  // `modelUrl` exists only so StartupState.js can swap in a technician-only
  // test model (see TestBatarang in StartupState.js / RevealSequence.js) —
  // defaults to the approved production Minded bat, so every existing call
  // site is unaffected. Resolved with `||`, not a default parameter: the
  // override upstream is `null` (RevealSequence.js's useState(null)), and a
  // JS default parameter only applies on `undefined`, not `null` — passing
  // `null` straight to GLTFLoader.load crashed the whole app
  // (`extractUrlBase` reading `.lastIndexOf` on null). Intentionally NOT a
  // dependency of the one-time setup effect below (it stays `[]`,
  // mount-once, same as before); switching models is done by the caller
  // changing this component's `key` so React remounts it fresh, rather than
  // this file growing a "swap the model after mount" code path. Camera
  // framing, lighting rig, and darkening all apply identically regardless
  // of which model loads — nothing here is Minded-bat-specific.
  const modelUrl = modelUrlProp || MODEL_URL;
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const keyLightRef = useRef(null);
  const fillLightRef = useRef(null);
  const rimLightRef = useRef(null);
  const modelCenterRef = useRef(null);
  const lightRadiusRef = useRef(1);
  const rafRef = useRef(null);
  const revealStartRef = useRef(null);

  const positionLight = (light, azimuth, elevation, intensity) => {
    const center = modelCenterRef.current;
    if (!light || !center) return;
    const r = lightRadiusRef.current;
    light.position.set(
      center.x + Math.cos(azimuth) * r,
      center.y + elevation * r,
      center.z + Math.sin(azimuth) * r,
    );
    light.target.position.copy(center);
    light.intensity = intensity;
  };

  // Positions all three lights for a given sweep progress (0..1 raw, KEY's
  // azimuth interpolates with it; FILL/RIM stay at their fixed azimuth and
  // only their intensity ramps). t=1 is the 'lit' resting state.
  const applyRig = (t) => {
    const keyAzimuth = KEY_AZIMUTH_START + (KEY_AZIMUTH_REST - KEY_AZIMUTH_START) * t;
    const keyIntensity = MIN_LIGHT + (KEY_REST_LIGHT - MIN_LIGHT) * t;
    const fillIntensity = MIN_LIGHT + (FILL_REST_LIGHT - MIN_LIGHT) * t;
    const rimIntensity = MIN_LIGHT + (RIM_REST_LIGHT - MIN_LIGHT) * t;
    positionLight(keyLightRef.current, keyAzimuth, KEY_ELEVATION, keyIntensity);
    positionLight(fillLightRef.current, FILL_AZIMUTH, FILL_ELEVATION, fillIntensity);
    positionLight(rimLightRef.current, RIM_AZIMUTH, RIM_ELEVATION, rimIntensity);
  };

  // One-time scene setup. Deliberately independent of `phase` — this
  // effect runs once on mount and tears down on unmount; phase-driven
  // behaviour is handled by the second effect below, so swapping phases
  // never re-creates the renderer/scene/model.
  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return undefined;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mountEl.appendChild(renderer.domElement);

    // Orthographic, not perspective — the approved reference render is a
    // true top/front orthographic view, and only an orthographic camera
    // preserves the bat's actual thin proportions with zero foreshortening,
    // and never "floats it toward the viewer" since there is no perspective
    // depth cue to begin with.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.001, 10);
    cameraRef.current = camera;

    // A very low constant ambient keeps "almost invisible" from reading as
    // a jarring hard pop the instant the directional lights begin — not
    // part of the animated reveal itself, and far too dim to flatten the
    // grazing shadows they create. Trimmed slightly now that FILL also
    // contributes some ambient-like lift, so the surface overall doesn't
    // brighten.
    scene.add(new THREE.AmbientLight(0xffffff, 0.045));

    const keyLight = new THREE.DirectionalLight(KEY_COLOR, MIN_LIGHT);
    scene.add(keyLight);
    scene.add(keyLight.target);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(FILL_COLOR, MIN_LIGHT);
    scene.add(fillLight);
    scene.add(fillLight.target);
    fillLightRef.current = fillLight;

    const rimLight = new THREE.DirectionalLight(RIM_COLOR, MIN_LIGHT);
    scene.add(rimLight);
    scene.add(rimLight.target);
    rimLightRef.current = rimLight;

    let disposed = false;
    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      scene.add(model);

      // Darken the material's base colour (not the GLB file itself — this
      // is a runtime-only three.js material tweak, the asset on disk is
      // untouched) so the bat reads as a dark, embedded relief rather than
      // bright engraved silver, even where the original scan's highlights
      // were strong. Normal/AO maps are left exactly as exported, so the
      // relief detail the grazing light reveals is unaffected — only
      // overall brightness is pulled down.
      model.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((m) => {
            if (m.color) m.color.multiplyScalar(DARKEN_FACTOR);
          });
        }
      });

      // Frame the camera on the model's real bounding box -- same
      // top/front framing approved earlier (camera along the model's own
      // thin axis, 15% margin), computed from the actual loaded geometry
      // rather than a hardcoded guess.
      //
      // "Contain" fit, not a flat aspect-multiply: the previous version
      // took the half-extent of the model's LARGER axis (sizeVec.x, since
      // the bat is much wider than it is deep) and then multiplied it by
      // the container's own aspect ratio again on top of that -- since the
      // container aspect (BAT_ASPECT in StartupState.js) is itself already
      // an estimate of this same sizeVec.x/sizeVec.z ratio, that was a
      // double application of essentially the same factor, inflating the
      // frustum by ~aspect-squared / aspect, i.e. by roughly the aspect
      // ratio itself (~5.6x here) in both directions. Net effect: the bat
      // rendered at only ~15% of its container's width/height, the rest
      // silently empty. Fit each axis independently from the model's own
      // real size instead, then letterbox/pillarbox only for whatever
      // small mismatch remains between the container's aspect and the
      // model's true aspect -- not a repeated multiply by the same ratio.
      const box = new THREE.Box3().setFromObject(model);
      const sizeVec = new THREE.Vector3();
      box.getSize(sizeVec);
      const center = new THREE.Vector3();
      box.getCenter(center);
      modelCenterRef.current = center;
      lightRadiusRef.current = Math.max(sizeVec.x, sizeVec.z) * LIGHT_RADIUS_FACTOR;

      const margin = 1.15;
      const objectHalfW = sizeVec.x * 0.5 * margin;
      const objectHalfH = sizeVec.z * 0.5 * margin;
      const objectAspect = objectHalfW / objectHalfH;
      const containerAspect = width / height;
      let halfW;
      let halfH;
      if (containerAspect >= objectAspect) {
        // Container relatively wider than the model -- fit to height,
        // pillarbox (empty margin) left/right only.
        halfH = objectHalfH;
        halfW = objectHalfH * containerAspect;
      } else {
        // Container relatively taller than the model -- fit to width,
        // letterbox (empty margin) top/bottom only.
        halfW = objectHalfW;
        halfH = objectHalfW / containerAspect;
      }
      camera.left = -halfW;
      camera.right = halfW;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.near = 0.001;
      camera.far = sizeVec.y + lightRadiusRef.current + 10;
      // Camera sits along the model's thin (Y) axis looking down at the
      // X-Z face -- the same face the approved top/front render shows.
      // Fixed for the component's entire lifetime, same as the model.
      camera.position.set(center.x, center.y + Math.max(sizeVec.y * 4, 0.5), center.z);
      camera.up.set(0, 0, 1);
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      applyRig(0);
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((m) => {
            Object.values(m).forEach((v) => { if (v && v.isTexture) v.dispose(); });
            m.dispose();
          });
        }
      });
      if (renderer.domElement.parentNode === mountEl) mountEl.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase-driven light animation. The three lights' angles/intensities are
  // the ONLY things this effect ever touches -- never camera, never model
  // transform.
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera || !modelCenterRef.current || !keyLightRef.current) return undefined;

    cancelAnimationFrame(rafRef.current);

    if (phase === 'dark') {
      applyRig(0);
      renderer.render(scene, camera);
      return undefined;
    }

    if (phase === 'lit') {
      applyRig(1);
      renderer.render(scene, camera);
      return undefined;
    }

    if (phase === 'revealing') {
      revealStartRef.current = performance.now();
      const tick = (now) => {
        const elapsed = now - revealStartRef.current;
        const t = Math.min(elapsed / STARTUP_BAT_REVEAL_MS, 1);
        const eased = easeInOutCubic(t);
        applyRig(eased);
        renderer.render(scene, camera);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }

    // 'fading': no WebGL-level change -- StartupState crossfades this
    // component's wrapping element via CSS opacity instead.
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div
      ref={mountRef}
      style={{ width, height, pointerEvents: 'none' }}
    />
  );
}
