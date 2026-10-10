import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// AURA 001 — BatarangSpinSpotlight: the APPROVED PRODUCTION startup bat.
//
// Promoted from technician experiment to production default after visual
// approval — see conversation history for the approval and the pivot/
// lighting fixes that preceded it. StartupState.js mounts this by default
// (technicianBatOverride === null); a technician can still switch to the
// original Minded bat (BatReveal.js, kept fully intact as an explicit
// fallback option) or one of the static TestBatarang orientation
// references via TechnicianOverview.js, session-only, never touching this
// default.
//
// Separate file, not a mode flag inside BatReveal.js: BatReveal's whole
// contract is "object and camera never move, lit once and held" (see its
// own file header) — this is the opposite (continuous rotation, real cast
// shadows), and keeping it physically separate means there is no code path
// by which switching between them could corrupt either one. Mounted in the
// exact same slot BatReveal used to occupy by default (same width/height/
// position, so it stays centred on AURA's own vertical axis) — nothing
// else about STARTUP changed to accommodate it; wordmark/byline/subtitle
// timing is untouched and identical to before.
//
// Fixed orthographic camera (never moves) framed on TestBatarang_C's real
// bounding box, same "contain" fit as BatReveal. The model itself rotates
// continuously around the screen-vertical axis (world Z, since the camera
// looks down world Y with up=(0,0,1) — same convention as BatReveal) at a
// slow, constant rate: a true turntable, not an in-plane spin, so the
// thin/bevelled edge actually swings through profile as it turns. Starts
// at rotation 0 -- TestBatarang_C's own exported orientation, unchanged —
// and increases monotonically, wrapping every 2*PI; no easing, no
// reversal, no bounce.
//
// PIVOT: rotation is around the model's bottom-centre pointed tip, not its
// bounding-box center. Found by inspecting the actual loaded geometry at
// runtime (lowest-Z vertex — confirmed by direct GLB buffer inspection to
// be a single true point near X=0, not a flat edge: see
// scratchpad analysis, vertex (~0, 0, -16.25) out of a Z range of
// [-16.25, 16.25]), never a hardcoded guess. Implemented as a pivot Group
// positioned at that point's world location, with the model re-parented
// and offset so the tip sits at the group's own local origin — rotating
// the GROUP's Z axis therefore rotates the model around that fixed point,
// instead of three.js's default "rotate around local origin" (which was
// the bounding-box center, and why the object used to drift/swing oddly).
//
// NOT a clipping risk, verified rather than assumed: a rotation strictly
// around Z leaves every point's Z coordinate invariant (true of any
// Z-axis rotation matrix, regardless of where the pivot sits along that
// axis) — so the object's world-Z (screen-vertical) extent is EXACTLY the
// same at every rotation angle as it is at rest, pivot or no pivot. Its
// apparent X (horizontal) extent only ever shrinks from its rest-state
// maximum as points rotate toward the Y/depth axis, never grows beyond it.
// Since the camera frustum below is already fit to contain the object's
// rest-state bounding box, both axes stay within frame for the entire
// cycle no matter which point is the pivot. (An earlier version of this
// comment warned of a sweep-radius overflow computed as raw 3D distance
// from the pivot — that metric doesn't apply to a pure Z-axis rotation and
// was wrong; confirmed by direct pixel measurement across a full rotation,
// zero frames touched any frustum edge.)
//
// Lighting: three-point, same conceptual language as BatReveal's KEY/FILL/
// RIM rig, adapted for real shadow mapping instead of normal-map shading
// (TestBatarang has actual 3D bevel geometry — a real 5mm extrusion, not a
// baked relief texture — so genuine self-shadowing is what reveals its
// edges/thickness as it turns). SPOT is the one true light source doing
// the work (focused cone, casts real shadows); FILL and RIM are low dim
// THREE.DirectionalLights (same world-fixed convention as BatReveal's FILL/
// RIM) that exist purely so unlit surfaces and the silhouette edge stay
// legible, not to add a second visible "glow". All three are positioned
// ONCE, in world space, relative to the model's center — none of them are
// parented to the model or the pivot group, so nothing about the lighting
// rotates with the object; only the geometry turns through it, exactly
// like a stationary gallery spotlight over a rotating turntable. A single
// very low ambient keeps the background/material dark without flattening
// the shadows SPOT creates. No particles, no neon, no glow, no bounce,
// nothing beyond these three lights and the rotation.

const MODEL_URL = '/aura001-dev/TestBatarang_C_FaceRotated.glb';
const DARKEN_FACTOR = 0.6; // same spirit as BatReveal — dark/material, not bright
const ROTATION_PERIOD_MS = 14000; // "slowly" — one full 360 deg turn every 14s, then it just keeps going
const AMBIENT_INTENSITY = 0.05;
const SPOT_INTENSITY = 2.2;
const SPOT_COLOR = 0xfff4e0; // same warm tone as BatReveal's KEY light — consistent "museum spotlight" language
const SPOT_ELEVATION = 0.55; // higher than BatReveal's ultra-low grazing ratio -- needs enough angle for a real cast shadow to read, while still reading as a raking/theatrical spot, not an overhead flood
const SPOT_AZIMUTH = Math.PI / 6;
const SPOT_ANGLE = Math.PI / 7; // focused cone, not a flood
const SPOT_PENUMBRA = 0.45; // soft theatrical edge

// FILL — low, opposite side from SPOT, same cool tone BatReveal's FILL
// uses. Only job: keep the side turned away from SPOT from going to pure
// black. Deliberately dim relative to SPOT so SPOT stays the dominant,
// "deliberate pool of light" — this is detail-preservation, not a second
// key light.
const FILL_INTENSITY = 0.35;
const FILL_COLOR = 0xaecbff;
const FILL_ELEVATION = 0.3;
const FILL_AZIMUTH = SPOT_AZIMUTH + Math.PI;

// RIM — restrained edge-catch, same warm tone BatReveal's RIM uses, steeper
// elevation so it skims the silhouette's outer edge rather than flooding
// the face. Exists specifically for the near-edge-on/rear-facing part of
// the turn, where SPOT alone would let the silhouette go flat/dark.
const RIM_INTENSITY = 0.5;
const RIM_COLOR = 0xffe9c4;
const RIM_ELEVATION = 0.75;
const RIM_AZIMUTH = SPOT_AZIMUTH - Math.PI / 2.1;

const LIGHT_RADIUS_FACTOR = 4;

export default function BatarangSpinSpotlight({ width, height }) {
  const mountRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return undefined;

    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // soft, realistic shadow edges, not hard-edged
    mountEl.appendChild(renderer.domElement);

    // Orthographic, fixed for the component's entire lifetime -- "camera
    // stationary" is explicit in the brief; only the model ever rotates.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.001, 10);

    scene.add(new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY));

    // decay=0 deliberately -- three.js's physically-based inverse-square
    // falloff (decay>0) combined with this scene's real-world mm-scale
    // distances (the light sits ~4x the model's own size away) crushed the
    // intensity to near-nothing at the object, same distance-independent
    // behavior BatReveal.js's DirectionalLights already rely on.
    const spot = new THREE.SpotLight(SPOT_COLOR, SPOT_INTENSITY, 0, SPOT_ANGLE, SPOT_PENUMBRA, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0005;
    scene.add(spot);
    scene.add(spot.target);

    // FILL/RIM: plain DirectionalLights, no shadow casting (SPOT alone
    // owns the real cast-shadow read; these two are flat fill/edge light
    // only, same as BatReveal's FILL/RIM). World-fixed, never touched again
    // after positioning below — not attached to the model or pivot group.
    const fill = new THREE.DirectionalLight(FILL_COLOR, FILL_INTENSITY);
    scene.add(fill);
    scene.add(fill.target);

    const rim = new THREE.DirectionalLight(RIM_COLOR, RIM_INTENSITY);
    scene.add(rim);
    scene.add(rim.target);

    let disposed = false;
    let model = null;

    const loader = new GLTFLoader();
    loader.load(MODEL_URL, (gltf) => {
      if (disposed) return;
      model = gltf.scene;

      model.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true; // self-shadowing across the bevel is the whole point here
          if (obj.material) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach((m) => {
              if (m.color) m.color.multiplyScalar(DARKEN_FACTOR);
            });
          }
        }
      });

      // Same "contain" fit as BatReveal.js -- fit each axis independently
      // from the model's own real size, not a flat aspect-multiply. Computed
      // from the model BEFORE any pivot re-parenting below, so camera
      // framing/scale is identical to every other orientation test --
      // deliberately NOT enlarged to accommodate the rotation sweep (see
      // file header "TRADE-OFF").
      const box = new THREE.Box3().setFromObject(model);
      const sizeVec = new THREE.Vector3();
      box.getSize(sizeVec);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Find the actual bottom-centre pointed tip from the real loaded
      // geometry -- the single lowest-Z vertex -- not a guessed/hardcoded
      // coordinate. Confirmed (via direct GLB buffer inspection) to be a
      // true single point near X=0, not a flat edge, before writing this.
      model.updateMatrixWorld(true);
      const pivot = new THREE.Vector3(0, 0, Infinity);
      const v = new THREE.Vector3();
      model.traverse((obj) => {
        if (obj.isMesh && obj.geometry) {
          const posAttr = obj.geometry.attributes.position;
          for (let i = 0; i < posAttr.count; i++) {
            v.fromBufferAttribute(posAttr, i).applyMatrix4(obj.matrixWorld);
            if (v.z < pivot.z) pivot.copy(v);
          }
        }
      });

      // Rotate around that point, not the bounding-box center: a pivot
      // Group sits exactly at the tip's world position, the model is
      // offset the opposite amount as its child so the tip lands at the
      // group's own local origin -- rotating the GROUP's Z axis then
      // rotates the whole model around the fixed tip, instead of three.js's
      // default "rotate around local origin" (the bbox center, which is
      // what caused the drift this is fixing).
      const pivotGroup = new THREE.Group();
      pivotGroup.position.copy(pivot);
      model.position.set(-pivot.x, -pivot.y, -pivot.z);
      pivotGroup.add(model);
      scene.add(pivotGroup);

      const lightRadius = Math.max(sizeVec.x, sizeVec.z) * LIGHT_RADIUS_FACTOR;
      spot.position.set(
        center.x + Math.cos(SPOT_AZIMUTH) * lightRadius,
        center.y + SPOT_ELEVATION * lightRadius,
        center.z + Math.sin(SPOT_AZIMUTH) * lightRadius,
      );
      spot.target.position.copy(center);
      spot.distance = lightRadius * 3;
      spot.shadow.camera.near = 0.001;
      spot.shadow.camera.far = lightRadius * 3;

      fill.position.set(
        center.x + Math.cos(FILL_AZIMUTH) * lightRadius,
        center.y + FILL_ELEVATION * lightRadius,
        center.z + Math.sin(FILL_AZIMUTH) * lightRadius,
      );
      fill.target.position.copy(center);

      rim.position.set(
        center.x + Math.cos(RIM_AZIMUTH) * lightRadius,
        center.y + RIM_ELEVATION * lightRadius,
        center.z + Math.sin(RIM_AZIMUTH) * lightRadius,
      );
      rim.target.position.copy(center);

      const margin = 1.15;
      const objectHalfW = sizeVec.x * 0.5 * margin;
      const objectHalfH = sizeVec.z * 0.5 * margin;
      const objectAspect = objectHalfW / objectHalfH;
      const containerAspect = width / height;
      let halfW;
      let halfH;
      if (containerAspect >= objectAspect) {
        halfH = objectHalfH;
        halfW = objectHalfH * containerAspect;
      } else {
        halfW = objectHalfW;
        halfH = objectHalfW / containerAspect;
      }
      camera.left = -halfW;
      camera.right = halfW;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.near = 0.001;
      camera.far = sizeVec.y + lightRadius + 10;
      camera.position.set(center.x, center.y + Math.max(sizeVec.y * 4, 0.5), center.z);
      camera.up.set(0, 0, 1);
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      // Rotate the PIVOT GROUP, never the model directly -- the group's
      // local origin IS the bottom tip (see above), so this keeps that
      // point fixed on screen for the entire cycle.
      const startTime = performance.now();
      const tick = (now) => {
        if (disposed) return;
        const elapsed = now - startTime;
        const t = (elapsed % ROTATION_PERIOD_MS) / ROTATION_PERIOD_MS;
        pivotGroup.rotation.z = t * Math.PI * 2; // screen-vertical axis (world Z, since camera.up = (0,0,1)) -- a turntable, not an in-plane spin
        renderer.render(scene, camera);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
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

  return (
    <div
      ref={mountRef}
      style={{ width, height, pointerEvents: 'none' }}
    />
  );
}
