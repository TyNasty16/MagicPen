// Figure outline shared by the body map and the small thumbnail (approved mockup: docs/mockups/02b-body-map-option-b-v2.html).
import type { Site } from '../db/db';

// Right half of the figure (viewer's right), clockwise from the neck. Arms end in rounded ends at hip height.
const HALF: [number, number][] = [[100,49],[108,50],[110,62],[126,68],[143,72],[154,80],[160,95],[162,116],[164,140],[166,164],[168,186],[169,204],[166,214],[159,217],[152,212],[150,196],[147,172],[144,148],[141,124],[138,106],[136,120],[135,144],[131,166],[130,180],[136,202],[141,222],[142,246],[140,272],[136,298],[135,320],[135,340],[132,360],[128,376],[132,384],[126,390],[111,390],[110,378],[109,358],[108,336],[107,312],[106,286],[104,258],[101,240],[100,238]];

function smoothClosedPath(p: [number, number][]): string {
  const n = p.length;
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < n; i++) {
    const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${c[0]},${c[1]}`;
  }
  return d + 'Z';
}

export const BODY_PATH = smoothClosedPath([...HALF, ...HALF.slice(1, -1).reverse().map(([x, y]) => [200 - x, y] as [number, number])]);

/** Zone ellipse [cx, cy, rx, ry, rotation] in figure coordinates and which figure it sits on. */
export const ZONES: Record<Site, { view: 'front' | 'back'; g: [number, number, number, number, number] }> = {
  // Front view: the person's right is on the viewer's left.
  'abdomen-right': { view: 'front', g: [88, 196, 8.5, 12, 0] },
  'abdomen-left': { view: 'front', g: [112, 196, 8.5, 12, 0] },
  'thigh-right': { view: 'front', g: [76, 268, 11, 22, 3] },
  'thigh-left': { view: 'front', g: [124, 268, 11, 22, -3] },
  // Back view: the person's left is on the viewer's left.
  'arm-left': { view: 'back', g: [48, 130, 7, 17, 5] },
  'arm-right': { view: 'back', g: [152, 130, 7, 17, -5] },
};
