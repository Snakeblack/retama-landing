// The 3D tier of ADR 0004, built inside scene-worker.ts on an OffscreenCanvas, off the main thread. Everything in it
// is a glyph of the site's own code (DESIGN.md Motion and 3D): the glyphs fly in and assemble the words of the title
// over the HTML words, then rain from "Software" and grow the retama, written along its stems and roots. Once the
// retama has grown, the title's glyphs give way to the HTML letters from the left (the page sweeps the letters in at the same
// pace) and come back while the pointer is on the title. Once grown, the wind sways the stems; around the pointer the
// gusts grow, and the glyphs stir and wake, shuffling their characters; the sap runs up in orange pulses that bloom.
// One instanced mesh draws them all; every movement is computed on the GPU, on WebGPU or WebGL2 alike.
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import {
  clamp,
  cos,
  exp,
  Fn,
  float,
  floor,
  fract,
  hash,
  If,
  instancedBufferAttribute,
  luminance,
  mix,
  mod,
  mx_noise_float,
  normalize,
  pass,
  positionGeometry,
  pow,
  screenCoordinate,
  select,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  varying,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DataTexture,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshBasicNodeMaterial,
  type Node,
  PerspectiveCamera,
  PlaneGeometry,
  RedFormat,
  RenderPipeline,
  RepeatWrapping,
  Scene,
  Vector3,
  WebGPURenderer,
} from "three/webgpu";
import {
  FLIGHT,
  GLYPH_KIND,
  type Glyph,
  plantGlyphs,
  plantPlacement,
  RAIN_END,
  RAIN_SPAN,
  RAIN_START,
  wordGlyphs,
} from "../lib/glyph-scene";
import { grainTile } from "../lib/grain";
import { retamaPlant, stormForce } from "../lib/retama-scene";
import { HERO, retamaShape } from "../lib/retama-shape";
import source from "../lib/retama-shape.ts?raw";
import type { Tier } from "../lib/scene-tier";

// The glyph atlas: the distinct characters of the source, in cells of this many pixels, this many to a row.
const CELL = 64;
const COLUMNS = 16;
const FONTS = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
// Sap pulses: how fast they climb, how far apart they run and how long their tail is, in poster units.
const SAP_SPEED = 260;
const SAP_SPACING = 520;
const SAP_TAIL = 120;
// Wind: the reach of the stem tips and the scale of the gusts, in pixels; around the pointer the gusts grow this many
// times wider, and within its radius the glyphs stir this far aside, rise this far towards the viewer and wake: they
// shuffle their characters and brighten.
const WIND = 22;
const GUST = 0.003;
const STORM = 2.5;
const STORM_RADIUS = 160;
const STIR = 8;
const RISE = 40;
const WAKE = 0.5;
// How bright the hot glyphs and the sap are: above 1 they bloom.
const HOT = 2.6;
// The title's glyphs give way to its letters once the rain has grown the retama, and the sweep that hands one over to
// the other lasts this long (t-open, as the page's transition of the letters).
const SETTLE = RAIN_END;
const SWEEP = 1.1;
// Within this many pixels of the crown the glyphs thin out.
const CROWN = 140;
// A narrow lens, so depth reads without bending the drawing.
const FOV = 20;

export interface Colors {
  ground: string;
  ink: string;
  muted: string;
  primary: string;
}
export interface Stage {
  width: number;
  height: number;
}
/** The samples of an HTML word, in pixels from the chapter's top left, how far apart they were taken and its colour. */
export interface Word {
  samples: [x: number, y: number][];
  step: number;
  accent: boolean;
}
export interface GlyphScene {
  /** Advances the animation by dt seconds and draws a frame. */
  frame(dt: number): void;
  /** Sizes the canvas and lays the words and the plant out for a chapter of this size; the rain falls from the first. */
  layout(stage: Stage, words: Word[]): void;
  /** How far the chapter has scrolled under its pinned stage, in pixels: the camera goes down as far. */
  scroll(top: number): void;
  /** The pointer over the stage, in CSS pixels from its top left; undefined when it leaves. */
  point(at?: [x: number, y: number]): void;
  /** Whether the pointer is on the title, which shows its glyphs again. */
  code(on: boolean): void;
  dispose(): void;
}

/** The atlas of every character of the source, drawn once in light ink, and the cell of each character in order. */
function atlas() {
  const flow = source.replace(/\s+/g, " ").trim();
  const characters = [...new Set(flow)];
  const rows = Math.ceil(characters.length / COLUMNS);
  const canvas = new OffscreenCanvas(COLUMNS * CELL, rows * CELL);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no 2d context");
  context.font = `500 ${CELL * 0.8}px ${FONTS}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#fff";
  const cells = new Map<string, number>();
  characters.forEach((character, index) => {
    cells.set(character, index);
    context.fillText(character, (index % COLUMNS) * CELL + CELL / 2, Math.floor(index / COLUMNS) * CELL + CELL / 2);
  });
  const map = new CanvasTexture(canvas);
  map.minFilter = LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  const sequence = (index: number) => cells.get(flow[index % flow.length] ?? " ") ?? 0;
  return { map, rows, count: characters.length, sequence };
}

// DESIGN.md Elevation & Depth, the grain: the scene paints its own ground, so it carries the page's grain itself, on
// the GPU, never on the load: it fades in over `fade` seconds once the retama has grown, and until then the shader
// skips it, so assembling the title costs nothing more. The same split as the page's: the ground's grain on the
// graphite, a light layer of it, a third of the strength, over the glyphs. Both are multiplied, so the grain only
// darkens, and still on the screen. The noise is one small tile computed once (src/lib/grain.ts), about two CSS pixels
// a grain like the page's SVGs, so each pixel only reads it.
// The tile's value noise spreads wider than the SVG's turbulence and centres lower, so `spread` and `centre` match it to
// the page's grain (measured on screenshots of both grounds: the same mean and deviation of the ink).
const GRAIN = {
  size: 256,
  frequency: 0.55,
  spread: 0.26,
  centre: 0.565,
  ground: { slope: 0.5, intercept: 0.694 },
  layer: 0.1,
  fade: 0.8,
};

function grained(lit: Node<"vec4">, groundCss: string, scale: number, amount: Node<"float">) {
  const { r, g, b } = new Color(groundCss);
  const ground = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const tile = new DataTexture(grainTile(GRAIN.size, GRAIN.frequency), GRAIN.size, GRAIN.size, RedFormat);
  tile.wrapS = RepeatWrapping;
  tile.wrapT = RepeatWrapping;
  tile.magFilter = LinearFilter;
  tile.minFilter = LinearFilter;
  tile.needsUpdate = true;
  return Fn(() => {
    const out = vec4(lit).toVar();
    If(amount.greaterThan(0), () => {
      const noise = texture(tile, screenCoordinate.xy.div(scale * GRAIN.size))
        .r.sub(0.5)
        .mul(GRAIN.spread)
        .add(GRAIN.centre);
      const groundGrain = clamp(noise.mul(GRAIN.ground.slope).add(GRAIN.ground.intercept), 0, 1);
      const layerGrain = float(1).sub(float(GRAIN.layer).mul(float(1).sub(clamp(noise.mul(2).sub(0.5), 0, 1))));
      // A pixel is ground until a glyph lights it; the ground's grain gives way as it does.
      const onGround = float(1).sub(smoothstep(ground * 1.5, ground * 6, luminance(out.rgb)));
      // The page multiplies in sRGB; the pipeline works in linear light.
      const factor = pow(mix(layerGrain, groundGrain.mul(layerGrain), onGround), 2.2);
      out.rgb.assign(out.rgb.mul(mix(float(1), factor, amount)));
    });
    return out;
  })();
}

export async function createScene(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  tier: Exclude<Tier, "poster">,
  colors: Colors,
  pixelRatio: number,
  onLost: () => void,
  onSettled: () => void,
): Promise<GlyphScene> {
  // No multisampling: every glyph is a quad whose edge is transparent, smoothed by the atlas's mipmaps, so it would
  // only cost the scene's pass its samples.
  const renderer = new WebGPURenderer({ canvas, antialias: false, forceWebGL: tier === "webgl2" });
  renderer.onDeviceLost = onLost;
  await renderer.init();
  renderer.setPixelRatio(Math.min(pixelRatio, 2));

  const glyphs = atlas();
  const plant = retamaPlant(retamaShape(HERO.seed, HERO.frame, HERO.stems, HERO.roots), HERO.seed);
  const scene = new Scene();
  scene.background = new Color(colors.ground);
  const camera = new PerspectiveCamera(FOV, 1, 1, 20000);
  const pipeline = new RenderPipeline(renderer);
  const drawn = pass(scene, camera).getTextureNode();
  // Only what is brighter than the ink blooms: the glyphs in flight and the sap. The glow is soft, so it is worked out
  // at a quarter of the canvas's size, which nearly halves the scene's cost on the GPU and looks the same.
  const glow = bloom(drawn, 0.9, 0.4, 0.9);
  glow.setResolutionScale(0.25);
  const lit = drawn.add(glow);
  const grain = uniform(0);
  pipeline.outputNode = grained(lit, colors.ground, Math.min(pixelRatio, 2), grain);

  const clock = uniform(0);
  const sap = uniform(0);
  const pointer = uniform(new Vector3());
  const storm = uniform(0);
  // Every stem and root leaves the crown, so the glyphs crowd there: they thin out near it.
  const crown = uniform(new Vector3());
  // How much of the title is glyphs, from 1 (all) to 0 (all letters), swept from the left, and where the title spans.
  const reveal = uniform(1);
  const title = uniform(new Vector3(0, 1, 0));
  const rgb = (css: string) => {
    const { r, g, b } = new Color(css);
    return vec3(r, g, b);
  };
  const ink = rgb(colors.ink);
  const muted = rgb(colors.muted);
  const primary = rgb(colors.primary);

  let mesh: InstancedMesh | undefined;
  let stage: Stage = { width: 1, height: 1 };
  let top = 0;
  let force = 0;
  let blowing = false;
  let at: [number, number] | undefined;
  let elapsed = 0;
  let settled = false;
  let coded = false;

  /** One mesh for every group of glyphs, each group drawn at its own size in pixels. */
  function build(groups: { glyphs: Glyph[]; size: number }[]) {
    const list = groups.flatMap(({ glyphs: group, size }) => group.map((glyph) => ({ glyph, size })));
    const origin = new Float32Array(list.length * 3);
    const target = new Float32Array(list.length * 3);
    const meta = new Float32Array(list.length * 4);
    const plantData = new Float32Array(list.length * 4);
    list.forEach(({ glyph, size }, index) => {
      origin.set(glyph.origin, index * 3);
      target.set(glyph.target, index * 3);
      meta.set([glyph.cell, glyph.angle, glyph.delay, glyph.kind], index * 4);
      plantData.set([glyph.flow, glyph.sway, glyph.seed, size], index * 4);
    });
    const from = instancedBufferAttribute<"vec3">(new InstancedBufferAttribute(origin, 3));
    const to = instancedBufferAttribute<"vec3">(new InstancedBufferAttribute(target, 3));
    const info = instancedBufferAttribute<"vec4">(new InstancedBufferAttribute(meta, 4));
    const life = instancedBufferAttribute<"vec4">(new InstancedBufferAttribute(plantData, 4));

    const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending });
    const kind = info.w;
    const word = kind.lessThan(0.5).or(kind.greaterThan(3.5));
    const seed = life.z;
    const progress = clamp(clock.sub(info.z).div(select(word, float(FLIGHT.word), float(FLIGHT.plant))), 0, 1);
    // Ease in and out for the word, which assembles; ease in for the rain, which falls.
    const eased = select(word, progress.mul(progress).mul(float(3).sub(progress.mul(2))), progress.mul(progress));
    const flying = eased.mul(float(1).sub(eased)).mul(4);
    const landed = progress.greaterThanEqual(1);
    // How close the pointer is to where the glyph rests, from 0 to 1, while it blows.
    const away = to.xy.sub(pointer.xy);
    const near = exp(
      away
        .dot(away)
        .div(STORM_RADIUS * STORM_RADIUS)
        .negate(),
    ).mul(storm);

    const place = Fn(() => {
      const rest = to.toVar();
      const travel = mix(from, to, eased);
      const swirl = vec3(
        mx_noise_float(vec3(seed.mul(53), clock.mul(0.7), 0)),
        mx_noise_float(vec3(seed.mul(53).add(7), clock.mul(0.7), 3)),
        mx_noise_float(vec3(seed.mul(53).add(13), clock.mul(0.7), 5)),
      ).mul(flying.mul(180));
      // The pointer's wind: gusts grow wider around it, and the glyphs within its reach stir and rise a little.
      const gust = vec3(
        mx_noise_float(vec3(rest.x.mul(GUST), rest.y.mul(GUST), clock.mul(0.35))),
        mx_noise_float(vec3(rest.y.mul(GUST), rest.x.mul(GUST), clock.mul(0.35).add(31))).mul(0.3),
        mx_noise_float(vec3(rest.y.mul(GUST), rest.x.mul(GUST), clock.mul(0.35).add(17))),
      ).mul(life.y.mul(WIND).mul(near.mul(STORM).add(1)));
      const stir = vec3(normalize(away.add(vec2(0.001, 0))).mul(STIR), seed.mul(RISE)).mul(near);
      // Each glyph turns with its stroke and swells a little while it flies.
      const scale = life.w.mul(flying.mul(0.5).add(1));
      const corner = positionGeometry.xy.mul(scale);
      const turn = vec2(
        corner.x.mul(cos(info.y)).sub(corner.y.mul(sin(info.y))),
        corner.x.mul(sin(info.y)).add(corner.y.mul(cos(info.y))),
      );
      return travel
        .add(swirl)
        .add(gust.mul(select(landed, float(1), float(0))))
        .add(stir)
        .add(vec3(turn, 0));
    });
    material.positionNode = place();

    // While it flies a glyph cycles through characters; at rest it shows its own, and now and then one flickers.
    const shuffled = floor(hash(seed.mul(1000).add(floor(clock.mul(22)))).mul(glyphs.count));
    const flicker = hash(seed.mul(733).add(floor(clock.mul(2.5)))).greaterThan(0.994);
    const awake = near.greaterThan(0.3);
    const cell = varying(select(landed.and(flicker.not()).and(awake.not()), info.x, shuffled));
    const heat = varying(flying);
    const wake = varying(near.mul(WAKE).add(1));
    const appear = varying(
      smoothstep(0, 0.12, clock.sub(info.z)).mul(select(word, float(1), smoothstep(0, 0.2, progress))),
    );
    // The title's glyphs show only where its letters are not: the hand-over edge moves with `reveal`.
    const edge = float(1).sub(reveal).mul(1.25);
    const shown = smoothstep(edge.sub(0.25), edge, to.x.sub(title.x).div(title.y));
    const depth = varying(
      clamp(to.z.div(1200).add(1), 0.35, 1).mul(
        select(word, shown, smoothstep(0, CROWN, to.xy.sub(crown.xy).length()).mul(0.85).add(0.15)),
      ),
    );
    const flow = varying(life.x);
    const sort = varying(kind);

    material.colorNode = Fn(() => {
      const base = select(
        sort.lessThan(0.5),
        ink,
        select(
          sort.lessThan(1.5),
          ink.mul(0.85),
          select(sort.lessThan(2.5), muted, select(sort.lessThan(3.5), primary.mul(1.4), primary)),
        ),
      );
      const phase = fract(flow.sub(clock.mul(SAP_SPEED)).div(SAP_SPACING));
      const lit = smoothstep(1 - SAP_TAIL / SAP_SPACING, 1, phase)
        .mul(sap)
        .mul(select(sort.lessThan(0.5).or(sort.greaterThan(3.5)), float(0), float(1)));
      const pulse = select(sort.greaterThan(2.5), ink.mul(HOT), primary.mul(HOT));
      return mix(mix(base.mul(wake), primary.mul(HOT), heat), pulse, lit);
    })();
    material.opacityNode = Fn(() => {
      const column = mod(cell, COLUMNS);
      const row = floor(cell.div(COLUMNS));
      const spot = vec2(column.add(uv().x), float(glyphs.rows).sub(row).sub(1).add(uv().y)).div(
        vec2(COLUMNS, glyphs.rows),
      );
      return texture(glyphs.map, spot).a.mul(appear).mul(depth);
    })();

    const next = new InstancedMesh(new PlaneGeometry(1, 1), material, list.length);
    // The glyphs move far from where the mesh starts, and they are always in view.
    next.frustumCulled = false;
    return next;
  }

  function aim() {
    const distance = stage.height / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
    const drift = Math.sin(elapsed * 0.13) * 24 + (at ? (at[0] / stage.width - 0.5) * -40 : 0);
    const centre = { x: stage.width / 2, y: -(top + stage.height / 2) };
    camera.position.set(centre.x + drift, centre.y, distance);
    camera.lookAt(centre.x, centre.y, 0);
  }

  return {
    frame(dt) {
      elapsed += dt;
      clock.value = elapsed;
      sap.value = Math.min(1, Math.max(0, (elapsed - (RAIN_START + RAIN_SPAN + 0.6)) / 1.5));
      force = stormForce(force, blowing, dt);
      storm.value = force;
      if (!settled && elapsed >= SETTLE) {
        settled = true;
        onSettled();
      }
      if (settled) grain.value = Math.min(1, grain.value + dt / GRAIN.fade);
      const target = coded || !settled ? 1 : 0;
      reveal.value += Math.sign(target - reveal.value) * Math.min(Math.abs(target - reveal.value), dt / SWEEP);
      aim();
      pipeline.render();
    },
    layout(next, words) {
      stage = next;
      renderer.setSize(stage.width, stage.height, false);
      camera.aspect = stage.width / stage.height;
      camera.updateProjectionMatrix();
      const placement = plantPlacement(stage);
      crown.value.set(placement.x, -placement.ground, 0);
      const spacing = Math.min(10, Math.max(5, placement.scale * 11));
      const rain = words[0]?.samples ?? [];
      const xs = words.flatMap(({ samples }) => samples.map(([x]) => x));
      const left = Math.min(...xs);
      title.value.set(left, Math.max(1, Math.max(...xs) - left), 0);
      const groups = [
        ...words.map(({ samples, step, accent }, index) => ({
          glyphs: wordGlyphs(samples, glyphs.sequence, HERO.seed + index, accent ? GLYPH_KIND.accent : GLYPH_KIND.word),
          size: step * 2.2,
        })),
        { glyphs: plantGlyphs(plant, placement, spacing, rain, glyphs.sequence, HERO.seed), size: spacing * 1.35 },
      ];
      if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as MeshBasicNodeMaterial).dispose();
      }
      mesh = build(groups);
      scene.add(mesh);
      aim();
    },
    scroll(next) {
      top = next;
      if (at) pointer.value.set(at[0], -(top + at[1]), 0);
    },
    point(next) {
      at = next;
      blowing = next !== undefined;
      if (next) pointer.value.set(next[0], -(top + next[1]), 0);
    },
    code(on) {
      coded = on;
    },
    dispose() {
      mesh?.geometry.dispose();
      (mesh?.material as MeshBasicNodeMaterial | undefined)?.dispose();
      glyphs.map.dispose();
      pipeline.dispose();
      renderer.dispose();
    },
  };
}
