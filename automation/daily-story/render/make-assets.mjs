// Payoff Daily Story Engine — asset builder.
// Usage: node make-assets.mjs <day-folder> [--graphics-only | --reel-only]
//   <day-folder> = automation/daily-story/days/YYYY-MM-DD-slug  (must contain story.json)
// 1. Renders every entry in story.graphics (Cover / Card stills) → blog/uploads/<name>.webp
// 2. Copies day-local reel images/music into render/public/days/<id>/
// 3. Renders story.video → <day-folder>/reel.mp4 (+ reel-cover.jpg)
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import sharp from "sharp";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");
const args = process.argv.slice(2);
const dayDir = path.resolve(args.find((a) => !a.startsWith("--")) || "");
const only = args.find((a) => a.startsWith("--"));
if (!fs.existsSync(path.join(dayDir, "story.json"))) {
  console.error("Usage: node make-assets.mjs <day-folder with story.json>");
  process.exit(1);
}
const story = JSON.parse(fs.readFileSync(path.join(dayDir, "story.json"), "utf8"));
const id = path.basename(dayDir);

// Local Chrome: env override, else the cloud workspace's Playwright Chromium, else Remotion downloads its own.
const browserExecutable =
  process.env.REMOTION_CHROME ||
  (fs.existsSync("/opt/pw-browsers")
    ? fs.readdirSync("/opt/pw-browsers").filter((d) => d.startsWith("chromium-"))
        .map((d) => `/opt/pw-browsers/${d}/chrome-linux64/chrome`).find((p) => fs.existsSync(p))
    : undefined);

// Stage day-local media into public/ so Remotion can serve it.
const pubDay = path.join(here, "public", "days", id);
fs.mkdirSync(pubDay, { recursive: true });
const stage = (rel) => {
  if (!rel || !rel.startsWith("day/")) return rel; // already a public/ path
  const src = path.join(dayDir, rel.slice(4));
  if (!fs.existsSync(src)) throw new Error(`Missing day file: ${src}`);
  fs.copyFileSync(src, path.join(pubDay, path.basename(src)));
  return `days/${id}/${path.basename(src)}`;
};
const video = story.video ? { ...story.video, beats: story.video.beats.map((b) => ({ ...b, image: stage(b.image) })) } : null;
if (video?.music) video.music = stage(video.music);
if (video?.voiceover) video.voiceover = stage(video.voiceover);

console.log("Bundling…");
const serveUrl = await bundle({ entryPoint: path.join(here, "src/index.ts"), publicDir: path.join(here, "public") });

// ---------- 1. Blog graphics ----------
if (only !== "--reel-only") {
  const uploads = path.join(repo, "blog", "uploads");
  for (const g of story.graphics || []) {
    const inputProps = { spec: g.spec };
    const composition = await selectComposition({ serveUrl, id: g.composition || "Card", inputProps, browserExecutable });
    const tmp = path.join(os.tmpdir(), `${g.name}.png`);
    await renderStill({ composition, serveUrl, output: tmp, inputProps, browserExecutable, imageFormat: "png" });
    const out = path.join(uploads, `${g.name}.webp`);
    await sharp(tmp).webp({ quality: 84 }).toFile(out);
    console.log("graphic:", path.relative(repo, out));
  }
}

// ---------- 2. Reel ----------
if (only !== "--graphics-only" && video) {
  const composition = await selectComposition({ serveUrl, id: "DailyStory", inputProps: video, browserExecutable });
  const out = path.join(dayDir, "reel.mp4");
  await renderStill({ composition, serveUrl, output: path.join(dayDir, "reel-cover.jpg"), frame: 60, inputProps: video, browserExecutable, imageFormat: "jpeg", jpegQuality: 90 });
  await renderMedia({
    composition, serveUrl, codec: "h264", outputLocation: out, inputProps: video, browserExecutable,
    crf: 20, x264Preset: "veryfast", audioBitrate: "192k",
    concurrency: process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : null,
  });
  console.log("reel:", path.relative(repo, out), `(${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);
}
