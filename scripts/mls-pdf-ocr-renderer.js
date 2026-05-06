const fs = require('fs');
const canvasLib = require('@napi-rs/canvas');

global.DOMMatrix = canvasLib.DOMMatrix;
global.ImageData = canvasLib.ImageData;
global.Path2D = canvasLib.Path2D;

async function main() {
  const pdfPath = String(process.argv[2] || '').trim();
  const pagesArg = String(process.argv[3] || '[]').trim();
  const requestedPages = Array.from(new Set((JSON.parse(pagesArg) || [])
    .map((pageNumber) => Math.max(1, Number(pageNumber) || 0))
    .filter(Boolean)));

  if (!pdfPath || !fs.existsSync(pdfPath)) {
    throw new Error('A valid PDF path is required for OCR rendering.');
  }

  if (requestedPages.length === 0) {
    process.stdout.write(JSON.stringify({ images: [] }));
    return;
  }

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
    useSystemFonts: true
  });

  try {
    const pdfDocument = await loadingTask.promise;
    const targetWidth = 1400;
    const images = [];

    for (const pageNumber of requestedPages) {
      const page = await pdfDocument.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.max(1, targetWidth / Math.max(1, baseViewport.width));
      const viewport = page.getViewport({ scale });
      const canvas = canvasLib.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport }).promise;
      const imageBuffer = canvas.toBuffer('image/png');

      images.push({
        pageNumber,
        mimeType: 'image/png',
        imageBase64: imageBuffer.toString('base64')
      });
    }

    process.stdout.write(JSON.stringify({ images }));
  } finally {
    await loadingTask.destroy().catch(() => {});
  }
}

main().catch((error) => {
  process.stderr.write(String(error && error.stack || error && error.message || error || 'OCR renderer failed.'));
  process.exit(1);
});