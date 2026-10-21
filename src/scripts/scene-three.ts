// The 3D tier of ADR 0004, built inside scene-worker.ts on an OffscreenCanvas, off the main thread. It draws the poster's
// plant (DESIGN.md Motion and 3D) as thin ribbons and animates three things on the GPU, on WebGPU or WebGL2 alike:
// the plant grows (taproot, roots, then stems), the wind sways the stems (harder around the pointer on desktop) and
// the sap runs up in orange pulses from the deepest roots to the tips.
import {
  attribute,
  color,
  Fn,
  float,
  fract,
  mix,
  mx_noise_float,
  positionLocal,
  smoothstep,
  uniform,
  varying,
  vec3,
} from "three/tsl";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicNodeMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGPURenderer,
} from "three/webgpu";
import { type Plant, type PlantStroke, retamaPlant, stormForce } from "../lib/retama-scene";
import { HERO, retamaShape, type StrokeKind } from "../lib/retama-shape";
import type { Tier } from "../lib/scene-tier";

// The growth lasts this long, in seconds, then the sap fades in over the next one.
const GROW_SECONDS = 4;
// Sap pulses: how fast they climb, how far apart they run and how long their tail is, in poster units.
const SAP_SPEED = 260;
const SAP_SPACING = 520;
const SAP_TAIL = 90;
// Wind: the reach of the stem tips and the scale of the gusts, in poster units.
const WIND = 16;
const GUST = 0.0035;
// Around the pointer the gusts grow this many times wider and a quicker flutter of this reach joins them.
const STORM = 2.5;
const FLUTTER = 9;
const STORM_RADIUS = 260;
// A narrow lens, so depth reads without bending the poster's drawing.
const FOV = 20;

export interface Colors {
  ink: string;
  muted: string;
  primary: string;
}
export interface PlantScene {
  /** Advances the animation by dt seconds and draws a frame. */
  frame(dt: number): void;
  resize(width: number, height: number): void;
  /** The pointer over the tile, in CSS pixels from its top left; undefined when it leaves. */
  point(at?: [x: number, y: number]): void;
  dispose(): void;
}

/** Each segment of each stroke as two triangles around its centre line; the vertex shader widens them. */
function ribbon(strokes: PlantStroke[]) {
  const position: number[] = [];
  const across: number[] = [];
  const flow: number[] = [];
  const grow: number[] = [];
  const sway: number[] = [];
  for (const { points } of strokes) {
    for (let at = 1; at < points.length; at++) {
      const a = points[at - 1];
      const b = points[at];
      if (!a || !b) continue;
      const dx = b.position[0] - a.position[0];
      const dy = b.position[1] - a.position[1];
      const length = Math.hypot(dx, dy) || 1;
      const normal = [-dy / length, dx / length];
      for (const [point, side] of [
        [a, -1],
        [a, 1],
        [b, 1],
        [a, -1],
        [b, 1],
        [b, -1],
      ] as const) {
        position.push(...point.position);
        across.push((normal[0] ?? 0) * side, (normal[1] ?? 0) * side);
        flow.push(point.flow);
        grow.push(point.grow);
        sway.push(point.sway);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(position, 3));
  geometry.setAttribute("across", new Float32BufferAttribute(across, 2));
  geometry.setAttribute("flow", new Float32BufferAttribute(flow, 1));
  geometry.setAttribute("grow", new Float32BufferAttribute(grow, 1));
  geometry.setAttribute("sway", new Float32BufferAttribute(sway, 1));
  return geometry;
}

export async function createScene(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  tier: Exclude<Tier, "poster">,
  colors: Colors,
  pixelRatio: number,
  onLost: () => void,
) {
  const renderer = new WebGPURenderer({ canvas, antialias: true, alpha: true, forceWebGL: tier === "webgl2" });
  renderer.onDeviceLost = onLost;
  await renderer.init();
  renderer.setPixelRatio(Math.min(pixelRatio, 2));

  const { frame: box, left, seed } = HERO;
  const plant: Plant = retamaPlant(retamaShape(seed, box), seed);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 1, 10000);

  const clock = uniform(0);
  const grown = uniform(0);
  const sap = uniform(0);
  // Half a CSS pixel in poster units, so a ribbon of width 2 is one pixel wide on the ground plane.
  const pixel = uniform(0.5);
  const pointer = uniform(new Vector3());
  const storm = uniform(0);

  const material = (base: string, pulse: string, width: number) => {
    // Ribbons turn their back to the camera on half their segments, so both faces draw.
    const node = new MeshBasicNodeMaterial({ side: DoubleSide });
    const sway = attribute<"float">("sway");
    node.positionNode = Fn(() => {
      const rest = positionLocal;
      const near = float(1)
        .sub(smoothstep(0, STORM_RADIUS, rest.xy.sub(pointer.xy).length()))
        .mul(storm);
      const gust = vec3(
        mx_noise_float(vec3(rest.x.mul(GUST), rest.y.mul(GUST), clock.mul(0.35))),
        0,
        mx_noise_float(vec3(rest.y.mul(GUST), rest.x.mul(GUST), clock.mul(0.35).add(17))),
      ).mul(sway.mul(WIND).mul(near.mul(STORM).add(1)));
      const flutter = vec3(
        mx_noise_float(vec3(rest.x.mul(GUST * 5), rest.y.mul(GUST * 5), clock.mul(2.4))),
        0,
        mx_noise_float(vec3(rest.y.mul(GUST * 5), rest.x.mul(GUST * 5), clock.mul(2.4).add(29))),
      ).mul(near.mul(sway).mul(FLUTTER));
      const across = attribute<"vec2">("across").mul(pixel.mul(width));
      return rest.add(gust).add(flutter).add(vec3(across, 0));
    })();
    const flow = varying(attribute<"float">("flow"));
    const grow = varying(attribute<"float">("grow"));
    node.colorNode = Fn(() => {
      grow.greaterThan(grown).discard();
      const phase = fract(flow.sub(clock.mul(SAP_SPEED)).div(SAP_SPACING));
      const lit = smoothstep(1 - SAP_TAIL / SAP_SPACING, 1, phase).mul(sap);
      return mix(color(new Color(base)), color(new Color(pulse)), lit);
    })();
    return node;
  };

  const group = (kinds: StrokeKind[]) => plant.strokes.filter((stroke) => kinds.includes(stroke.kind));
  const meshes = [
    new Mesh(ribbon(group(["root"])), material(colors.muted, colors.primary, 1)),
    new Mesh(ribbon(group(["stem"])), material(colors.ink, colors.primary, 1)),
    new Mesh(ribbon(group(["taproot"])), material(colors.primary, colors.ink, 2)),
  ];
  for (const mesh of meshes) {
    // The wind moves vertices outside the geometry's bounds, and the plant is always in view.
    mesh.frustumCulled = false;
    scene.add(mesh);
  }

  // The poster's view: "xMidYMin slice" of its viewBox, rebuilt with a camera looking at the ground plane.
  let view = { scale: 1, left: 0, top: 0 };
  let force = 0;
  let blowing = false;
  let elapsed = 0;

  return {
    frame(dt) {
      elapsed += dt;
      clock.value = elapsed;
      const growth = Math.min(1, elapsed / GROW_SECONDS);
      grown.value = 1 - (1 - growth) ** 3;
      sap.value = Math.min(1, Math.max(0, elapsed - GROW_SECONDS));
      force = stormForce(force, blowing, dt);
      storm.value = force;
      renderer.render(scene, camera);
    },
    resize(width, height) {
      renderer.setSize(width, height, false);
      const scale = Math.max(width / box.width, height / box.height);
      const visible = { width: width / scale, height: height / scale };
      const centre = { x: left + box.width / 2, y: box.ground - visible.height / 2 };
      view = { scale, left: centre.x - visible.width / 2, top: box.ground };
      camera.aspect = width / height;
      camera.position.set(centre.x, centre.y, visible.height / 2 / Math.tan(((FOV / 2) * Math.PI) / 180));
      camera.lookAt(centre.x, centre.y, 0);
      camera.updateProjectionMatrix();
      pixel.value = 0.5 / scale;
    },
    point(at) {
      blowing = at !== undefined;
      if (at) pointer.value.set(view.left + at[0] / view.scale, view.top - at[1] / view.scale, 0);
    },
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      renderer.dispose();
    },
  } satisfies PlantScene;
}
