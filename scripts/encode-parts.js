const hre = require("hardhat");
const png = require("png-js");

// parts are 1 indexed lmfao
const TOTAL_BODIES = 6;
const TOTAL_EYES = 6;
const TOTAL_HEADS = 5;
const TOTAL_HEADGEARS = 5;
const TOTAL_MOUTHS = 5;

// transparent: 0 (both 0 & 1 are not included in the actual palette arrays, so access needs to subtract 2)
const BASE_PALETTE_TO_COLOR_INDEX = {
  '#000000': 1, // outline
  '#b5eaea': 2, // background (shouldn't apply here)
  '#edf6e5': 3, // skin
  '#f38ba0': 4, // highlight
};

function decodePixels(path) {
  return new Promise(resolve => {
    png.decode(path, resolve);
  });
}

function componentToHex(c) {
  let hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

async function encodeImage(path) {
  const pixels = await decodePixels(path);

  const rleEncodedData = [];
  let runLength = 0;
  let currentColorIndex = 0;
  for (let i = 0; i < pixels.length; i = i + 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    let colorIndex = 0;
    if (a == 255) {
      colorIndex = BASE_PALETTE_TO_COLOR_INDEX[rgbToHex(r, g, b)];
    }

    if (colorIndex != currentColorIndex || runLength == 255) {
      rleEncodedData.push(runLength);
      rleEncodedData.push(currentColorIndex);
      runLength = 0;
      currentColorIndex = colorIndex;
    }
    runLength++;
  }

  return hre.ethers.utils.hexlify(rleEncodedData);
} 

async function main() {
  const bodies = [];
  for (let i = 1; i <= TOTAL_BODIES; i++) {
    bodies.push(await encodeImage(`art/parts/body-${i}.png`));
  }

  const eyes = [];
  for (let i = 1; i <= TOTAL_EYES; i++) {
    eyes.push(await encodeImage(`art/parts/eyes-${i}.png`));
  }

  const heads = [];
  for (let i = 1; i <= TOTAL_HEADS; i++) {
    heads.push(await encodeImage(`art/parts/head-${i}.png`));
  }

  const headgears = [];
  for (let i = 1; i <= TOTAL_HEADGEARS; i++) {
    headgears.push(await encodeImage(`art/parts/headgear-${i}.png`));
  }

  const mouths = [];
  for (let i = 1; i <= TOTAL_MOUTHS; i++) {
    mouths.push(await encodeImage(`art/parts/mouth-${i}.png`));
  }

  console.log({bodies, eyes, heads, headgears, mouths});
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
