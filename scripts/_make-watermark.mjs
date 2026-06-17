import sharp from "sharp";

const SRC = "assets/logo.png";
const meta = await sharp(SRC).metadata();
console.log("logo.png:", meta.width, "x", meta.height, "channels:", meta.channels);

// The caduceus symbol sits in the left part of the logo; crop generously then
// trim the surrounding transparency to the symbol's true bounding box.
const cropW = Math.round(meta.width * 0.30);
const region = sharp(SRC)
  .extract({ left: 0, top: 0, width: cropW, height: meta.height })
  .trim();

// Debug: colored crop on green, to verify we grabbed the symbol (not text).
await region
  .clone()
  .flatten({ background: "#0C5128" })
  .png()
  .toFile("scripts/_shots/_wm-crop-check.png");

// White silhouette: rebuild as solid white using the original alpha as the mask.
const a = region.clone().ensureAlpha().extractChannel("alpha").raw();
const { data, info } = await a.toBuffer({ resolveWithObject: true });
const white = await sharp({
  create: { width: info.width, height: info.height, channels: 3, background: { r: 255, g: 255, b: 255 } },
})
  .joinChannel(data, { raw: { width: info.width, height: info.height, channels: 1 } })
  .png()
  .toBuffer();
await sharp(white).toFile("public/logo-symbol-white.png");
await sharp(white).flatten({ background: "#0C5128" }).png().toFile("scripts/_shots/_wm-white-check.png");
const out = await sharp("public/logo-symbol-white.png").metadata();
console.log("watermark:", out.width, "x", out.height, "-> public/logo-symbol-white.png");
