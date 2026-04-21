const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule.imagesToIco || pngToIcoModule;

const projectRoot = path.resolve(__dirname, '..');
const sourcePng = path.join(projectRoot, 'png photos', 'FAST LOGO 777.png');
const buildDir = path.join(projectRoot, 'build');
const outputIco = path.join(buildDir, 'app-icon.ico');
const tempDir = path.join(buildDir, '.icon-work');
const iconSizes = [16, 24, 32, 48, 64, 128, 256];

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function buildSizedPng(size) {
  const outputPath = path.join(tempDir, `icon-${size}.png`);
  await sharp(sourcePng)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(outputPath);
  return outputPath;
}

async function main() {
  await ensureDir(buildDir);
  await ensureDir(tempDir);

  const pngPaths = [];
  for (const size of iconSizes) {
    pngPaths.push(await buildSizedPng(size));
  }

  const icoBuffer = await pngToIco(pngPaths);
  await fs.promises.writeFile(outputIco, icoBuffer);

  await fs.promises.rm(tempDir, { recursive: true, force: true });
  process.stdout.write(`Generated ${path.relative(projectRoot, outputIco)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
  process.exitCode = 1;
});