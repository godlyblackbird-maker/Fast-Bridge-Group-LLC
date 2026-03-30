const { parentPort, workerData } = require('worker_threads');
const { PDFParse } = require('pdf-parse');

const DEFAULT_BATCH_SIZE = Math.max(1, Number(workerData && workerData.defaultBatchSize) || 40);

function normalizePdfExtractText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildFullPdfText(parsedResult) {
  const parsed = parsedResult && typeof parsedResult === 'object' ? parsedResult : {};
  const pageTexts = Array.isArray(parsed.pages)
    ? parsed.pages
        .map((page) => normalizePdfExtractText(page && typeof page === 'object' ? page.text : ''))
        .filter(Boolean)
    : [];
  const mergedPageText = pageTexts.join('\n\n');
  const aggregateText = normalizePdfExtractText(parsed.text);

  if (mergedPageText.length > aggregateText.length) {
    return {
      text: mergedPageText,
      pageTexts,
      parsedPageCount: pageTexts.length
    };
  }

  return {
    text: aggregateText || mergedPageText,
    pageTexts,
    parsedPageCount: pageTexts.length
  };
}

function buildPdfPartialPageList(pageCount) {
  const totalPages = Number(pageCount) || 0;
  if (totalPages <= 0) {
    return undefined;
  }

  return Array.from({ length: totalPages }, (_, index) => index + 1);
}

function getBatchSize(pageCount) {
  const totalPages = Math.max(0, Number(pageCount) || 0);
  if (totalPages >= 300) {
    return 10;
  }
  if (totalPages >= 180) {
    return 12;
  }
  if (totalPages >= 100) {
    return 16;
  }
  if (totalPages >= 60) {
    return 24;
  }
  return DEFAULT_BATCH_SIZE;
}

function splitPdfPagesIntoBatches(pageCount, batchSize) {
  const totalPages = Number(pageCount) || 0;
  const safeBatchSize = Math.max(1, Number(batchSize) || DEFAULT_BATCH_SIZE);
  const batches = [];

  if (totalPages <= 0) {
    return batches;
  }

  for (let startPage = 1; startPage <= totalPages; startPage += safeBatchSize) {
    const endPage = Math.min(totalPages, startPage + safeBatchSize - 1);
    batches.push(Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index));
  }

  return batches;
}

function postProgress(progress) {
  if (!parentPort) {
    return;
  }
  parentPort.postMessage({
    type: 'progress',
    progress: progress && typeof progress === 'object' ? progress : {}
  });
}

function waitForNextTurn() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

async function extractPdfTextByPageBatches(parser, pageCount) {
  const pageBatches = splitPdfPagesIntoBatches(pageCount, getBatchSize(pageCount));

  if (pageBatches.length === 0) {
    const parsed = await parser.getText({ pageJoiner: '\n\n' });
    return buildFullPdfText(parsed);
  }

  const combinedPageTexts = [];
  const combinedTexts = [];

  for (let batchIndex = 0; batchIndex < pageBatches.length; batchIndex += 1) {
    const partialPages = pageBatches[batchIndex];
    const startPage = Number(partialPages[0]) || 0;
    const endPage = Number(partialPages[partialPages.length - 1]) || startPage;
    postProgress({
      phase: 'parsing-pages',
      batchIndex: batchIndex + 1,
      totalBatches: pageBatches.length,
      pageCount,
      startPage,
      endPage,
      message: `Parsing pages ${startPage}-${endPage} of ${pageCount}...`
    });

    const parsed = await parser.getText({
      partial: partialPages,
      pageJoiner: '\n\n'
    });
    const batchResult = buildFullPdfText(parsed);
    if (Array.isArray(batchResult.pageTexts) && batchResult.pageTexts.length > 0) {
      combinedPageTexts.push(...batchResult.pageTexts);
    } else if (batchResult.text) {
      combinedTexts.push(batchResult.text);
    }

    await waitForNextTurn();
  }

  const resolvedPageTexts = combinedPageTexts.map((pageText) => normalizePdfExtractText(pageText)).filter(Boolean);
  const mergedText = resolvedPageTexts.length > 0
    ? resolvedPageTexts.join('\n\n')
    : normalizePdfExtractText(combinedTexts.join('\n\n'));

  return {
    text: mergedText,
    pageTexts: resolvedPageTexts,
    parsedPageCount: resolvedPageTexts.length
  };
}

async function main() {
  const parser = new PDFParse({ data: Buffer.from(workerData && workerData.pdfBytes ? workerData.pdfBytes : []) });

  try {
    postProgress({ phase: 'metadata', message: 'Reading PDF metadata...' });
    const info = await parser.getInfo();
    let pageCount = Number(info && info.total) || 0;
    if (pageCount > 0) {
      postProgress({
        phase: 'prepare',
        pageCount,
        message: `Preparing ${pageCount} PDF page${pageCount === 1 ? '' : 's'} for extraction...`
      });
    }

    if (pageCount > 0 && pageCount <= DEFAULT_BATCH_SIZE) {
      postProgress({
        phase: 'parsing-pages',
        batchIndex: 1,
        totalBatches: 1,
        pageCount,
        startPage: 1,
        endPage: pageCount,
        message: `Parsing pages 1-${pageCount} of ${pageCount}...`
      });
    }

    const fullTextResult = pageCount > DEFAULT_BATCH_SIZE
      ? await extractPdfTextByPageBatches(parser, pageCount)
      : buildFullPdfText(await parser.getText({
          partial: buildPdfPartialPageList(pageCount),
          pageJoiner: '\n\n'
        }));

    if (!pageCount && Number(fullTextResult && fullTextResult.parsedPageCount) > 0) {
      pageCount = Number(fullTextResult.parsedPageCount) || 0;
    }

    parentPort.postMessage({
      type: 'result',
      result: {
        text: normalizePdfExtractText(fullTextResult && fullTextResult.text),
        pageTexts: Array.isArray(fullTextResult && fullTextResult.pageTexts) ? fullTextResult.pageTexts : [],
        parsedPageCount: Number(fullTextResult && fullTextResult.parsedPageCount) || 0,
        pageCount
      }
    });
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      error: error && error.message ? error.message : 'Failed to extract PDF text.'
    });
  } finally {
    await parser.destroy().catch(() => {});
  }
}

void main();