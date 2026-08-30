import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const LIB = path.join(process.cwd(), "public", "images", "library");
const MAX_WIDTH = 2400;
const WEBP_QUALITY = 82;

const RENAME = {
  "menstral Health.jpg": "menstrual-health.webp",
  "dignity_kit_new_logo (1).png": "dignity-kit.webp",
  "Mentorship.JPG": "mentorship.webp",
  "indipendece.jpg": "independence.webp",
  "pad-distribution1.jpg": "pad-distribution1.webp",
  "pad-distribution2.jpg": "pad-distribution2.webp",
  "school-going.jpg": "school-going.webp",
  "community.jpg": "community.webp",
  "threading.jpg": "threading.webp",
  "skill.jpg": "skill.webp",
  "product.jpg": "product.webp",
  "income.jpg": "income.webp",
};

async function optimizeFile(file) {
  const input = path.join(LIB, file);
  const outputName = RENAME[file] ?? `${path.parse(file).name}.webp`;
  const output = path.join(LIB, outputName);

  let pipeline = sharp(input).rotate();
  const meta = await pipeline.metadata();
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(output);
  const { size: outSize } = await import("node:fs/promises").then((fs) => fs.stat(output));
  const { size: inSize } = await import("node:fs/promises").then((fs) => fs.stat(input));
  return { file, outputName, inSize, outSize };
}

await mkdir(LIB, { recursive: true });
const files = (await readdir(LIB)).filter((f) => /\.(jpe?g|png)$/i.test(f));
const results = [];

for (const file of files) {
  results.push(await optimizeFile(file));
}

for (const row of results) {
  const saved = (((row.inSize - row.outSize) / row.inSize) * 100).toFixed(0);
  console.log(`${row.file} -> ${row.outputName} (${saved}% smaller)`);
}
