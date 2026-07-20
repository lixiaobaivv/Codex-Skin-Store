export type ImagePalette = { accent: string; ink: string; surface: string };

type Rgb = { r: number; g: number; b: number };

const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, value));
const hex = ({ r, g, b }: Rgb) => `#${[r, g, b].map((value) => Math.round(clamp(value)).toString(16).padStart(2, "0")).join("")}`;
const mix = (color: Rgb, target: Rgb, amount: number): Rgb => ({
  r: color.r * (1 - amount) + target.r * amount,
  g: color.g * (1 - amount) + target.g * amount,
  b: color.b * (1 - amount) + target.b * amount,
});

function rgbToHsl({ r, g, b }: Rgb) {
  const channels = [r, g, b].map((value) => value / 255);
  const max = Math.max(...channels), min = Math.min(...channels);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: lightness };
  const delta = max - min;
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hue = max === channels[0]
    ? ((channels[1] - channels[2]) / delta) % 6
    : max === channels[1]
      ? (channels[2] - channels[0]) / delta + 2
      : (channels[0] - channels[1]) / delta + 4;
  return { h: (hue * 60 + 360) % 360, s: saturation, l: lightness };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs(section % 2 - 1));
  const [r, g, b] = section < 1 ? [chroma, x, 0] : section < 2 ? [x, chroma, 0] : section < 3 ? [0, chroma, x] : section < 4 ? [0, x, chroma] : section < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const offset = l - chroma / 2;
  return { r: (r + offset) * 255, g: (g + offset) * 255, b: (b + offset) * 255 };
}

export function paletteFromPixels(data: Uint8ClampedArray, variant: "light" | "dark"): ImagePalette {
  const buckets = new Map<string, { color: Rgb; count: number; score: number }>();
  let total = { r: 0, g: 0, b: 0 }, count = 0;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 160) continue;
    const color = { r: data[index], g: data[index + 1], b: data[index + 2] };
    const max = Math.max(color.r, color.g, color.b), min = Math.min(color.r, color.g, color.b);
    const luma = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
    if (luma < 12 || luma > 246) continue;
    total = { r: total.r + color.r, g: total.g + color.g, b: total.b + color.b }; count += 1;
    const key = `${color.r >> 5}-${color.g >> 5}-${color.b >> 5}`;
    const saturation = (max - min) / Math.max(max, 1);
    const bucket = buckets.get(key) ?? { color: { r: 0, g: 0, b: 0 }, count: 0, score: 0 };
    bucket.color = { r: bucket.color.r + color.r, g: bucket.color.g + color.g, b: bucket.color.b + color.b };
    bucket.count += 1;
    bucket.score += 0.35 + saturation * 1.65;
    buckets.set(key, bucket);
  }
  const fallback: Rgb = variant === "dark" ? { r: 38, g: 42, b: 52 } : { r: 228, g: 230, b: 236 };
  const average = count ? { r: total.r / count, g: total.g / count, b: total.b / count } : fallback;
  const winner = [...buckets.values()].sort((left, right) => right.score - left.score)[0];
  const dominant = winner ? { r: winner.color.r / winner.count, g: winner.color.g / winner.count, b: winner.color.b / winner.count } : average;
  const hsl = rgbToHsl(dominant);
  const accent = hslToRgb(hsl.h, clamp(hsl.s, 0.48, 0.82), clamp(hsl.l, variant === "dark" ? 0.48 : 0.38, variant === "dark" ? 0.68 : 0.60));
  const surface = mix(average, variant === "dark" ? { r: 8, g: 10, b: 14 } : { r: 255, g: 255, b: 255 }, variant === "dark" ? 0.72 : 0.84);
  return { accent: hex(accent), surface: hex(surface), ink: variant === "dark" ? "#f4f6fb" : "#181a20" };
}

export async function extractImagePalette(file: File, variant: "light" | "dark") {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 64 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("浏览器不支持图片取色");
    context.drawImage(bitmap, 0, 0, width, height);
    return paletteFromPixels(context.getImageData(0, 0, width, height).data, variant);
  } finally {
    bitmap.close();
  }
}
