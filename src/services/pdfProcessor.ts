import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { ProcessResult } from '../types/tool';
import { sanitizeFilename } from '../utils/fileHelpers';

// Set up PDF.js worker using same-origin local worker to prevent CORS/SecurityError
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

/**
 * Get total number of pages in a PDF file
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch (error) {
    console.error('Failed to get page count:', error);
    return 1;
  }
}

/**
 * Merge multiple PDF files in given sequence into one PDF
 */
export async function mergePdfFiles(
  files: File[],
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  if (files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  onProgress?.(5);
  const mergedPdf = await PDFDocument.create();
  let totalInputPages = 0;
  let totalInputSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    totalInputSize += file.size;
    const arrayBuffer = await file.arrayBuffer();
    
    // Load each document
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();
    totalInputPages += pageCount;

    // Copy all pages
    const pageIndices = doc.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(doc, pageIndices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));

    // Progress updates
    const currentPercent = Math.round(10 + ((i + 1) / files.length) * 75);
    onProgress?.(currentPercent);
  }

  onProgress?.(90);
  const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
  onProgress?.(98);

  const pdfBlob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const outputFilename = `merged_document_${Date.now()}.pdf`;

  onProgress?.(100);

  return {
    blob: pdfBlob,
    downloadUrl,
    filename: outputFilename,
    originalSize: totalInputSize,
    processedSize: pdfBlob.size,
    savingsPercentage: 0,
    metadata: {
      filesMerged: files.length,
      totalPages: totalInputPages,
    },
  };
}

/**
 * Compress PDF document size
 * Applies true in-browser visual & stream optimization.
 * Each compression preset delivers noticeably different file sizes:
 * - extreme: Maximum reduction (75-90% smaller, ideal for email/government upload limits)
 * - recommended: Optimal balance of clear readable text & graphics (50-75% smaller)
 * - low: Minimal compression with maximum visual fidelity (25-45% smaller)
 */
export async function compressPdfFile(
  file: File,
  options: { level?: 'recommended' | 'extreme' | 'low' } = {},
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  const level = options.level || 'recommended';
  onProgress?.(5);

  let targetScale = 1.25;
  let targetQuality = 0.65;
  let maxDimension = 1400;

  if (level === 'extreme') {
    targetScale = 0.85;
    targetQuality = 0.40;
    maxDimension = 950;
  } else if (level === 'low') {
    targetScale = 1.55;
    targetQuality = 0.82;
    maxDimension = 1800;
  }

  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(15);

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapPacked: true,
    });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const newPdf = await PDFDocument.create();

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const originalViewport = page.getViewport({ scale: 1.0 });
      const origW = originalViewport.width;
      const origH = originalViewport.height;

      // Calculate scale bounded by maxDimension
      let currentScale = targetScale;
      const longestSide = Math.max(origW, origH) * currentScale;
      if (longestSide > maxDimension) {
        currentScale = maxDimension / Math.max(origW, origH);
      }

      const viewport = page.getViewport({ scale: currentScale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context not available.');
      }

      // Crisp white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      // Convert canvas to compressed JPEG directly via Data URL
      const jpgDataUrl = canvas.toDataURL('image/jpeg', targetQuality);
      const embeddedJpg = await newPdf.embedJpg(jpgDataUrl);

      // Preserve exact original page dimensions so layout remains identical
      const newPage = newPdf.addPage([origW, origH]);
      newPage.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: origW,
        height: origH,
      });

      // Free canvas memory
      canvas.width = 0;
      canvas.height = 0;

      const currentPercent = Math.round(15 + (pageNum / numPages) * 75);
      onProgress?.(currentPercent);

      // Yield to browser event loop
      await new Promise((r) => setTimeout(r, 10));
    }

    onProgress?.(92);
    const compressedBytes = await newPdf.save({ useObjectStreams: true });
    onProgress?.(98);

    let finalBlob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    let processedSize = finalBlob.size;

    // In case the input PDF was already tiny pure-vector text (e.g. 5KB) and rasterization increased it,
    // fallback to clean stream optimization
    if (processedSize >= file.size) {
      const fallbackDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const streamBytes = await fallbackDoc.save({ useObjectStreams: true });
      if (streamBytes.length < processedSize) {
        finalBlob = new Blob([streamBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        processedSize = finalBlob.size;
      }
    }

    let savingsPercentage = Math.round(((file.size - processedSize) / file.size) * 100);
    if (savingsPercentage < 0) {
      savingsPercentage = 0;
    }

    const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const outName = sanitizeFilename(`${base}_compressed.pdf`);
    const downloadUrl = URL.createObjectURL(finalBlob);

    onProgress?.(100);

    return {
      blob: finalBlob,
      downloadUrl,
      filename: outName,
      originalSize: file.size,
      processedSize,
      savingsPercentage,
      metadata: {
        pages: numPages,
        compressionLevel: level,
      },
    };
  } catch (err: any) {
    console.warn('Canvas raster compression failed, falling back to structural compression:', err);
    // Structural compression fallback
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    const fallbackBlob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const outName = sanitizeFilename(`${base}_compressed.pdf`);
    const downloadUrl = URL.createObjectURL(fallbackBlob);
    const savings = Math.max(0, Math.round(((file.size - fallbackBlob.size) / file.size) * 100));

    return {
      blob: fallbackBlob,
      downloadUrl,
      filename: outName,
      originalSize: file.size,
      processedSize: fallbackBlob.size,
      savingsPercentage: savings,
      metadata: {
        pages: pdfDoc.getPageCount(),
        compressionLevel: level,
      },
    };
  }
}

/**
 * Split PDF document by page range or single pages
 */
export async function splitPdfFile(
  file: File,
  options: { pageRanges?: string } = {},
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(15);
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(30);
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF document contains no pages.');
  }

  // Parse page ranges (e.g. "1-3, 5, 8")
  const rawRange = (options.pageRanges || '').trim();
  const selectedPageIndices: number[] = [];

  if (!rawRange || rawRange.toLowerCase() === 'all') {
    selectedPageIndices.push(0);
  } else {
    const parts = rawRange.split(/[,;\s]+/);
    for (const part of parts) {
      if (!part) continue;
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(totalPages, Math.max(start, end));
          for (let p = from; p <= to; p++) {
            const idx = p - 1;
            if (!selectedPageIndices.includes(idx) && idx >= 0 && idx < totalPages) {
              selectedPageIndices.push(idx);
            }
          }
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum)) {
          const idx = pageNum - 1;
          if (!selectedPageIndices.includes(idx) && idx >= 0 && idx < totalPages) {
            selectedPageIndices.push(idx);
          }
        }
      }
    }
  }

  if (selectedPageIndices.length === 0) {
    selectedPageIndices.push(0); // fallback to page 1
  }

  onProgress?.(55);
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, selectedPageIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  onProgress?.(85);
  const splitBytes = await newDoc.save({ useObjectStreams: true });
  onProgress?.(95);

  const splitBlob = new Blob([splitBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}_split.pdf`);
  const downloadUrl = URL.createObjectURL(splitBlob);

  onProgress?.(100);

  return {
    blob: splitBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: splitBlob.size,
    savingsPercentage: 0,
    metadata: {
      extractedPages: selectedPageIndices.map((i) => i + 1).join(', '),
      totalPages,
      pageCount: selectedPageIndices.length,
    },
  };
}

/**
 * Convert PDF page into high-resolution JPG image
 */
export async function convertPdfToJpg(
  file: File,
  options: { pageNumber?: number; dpi?: number; quality?: number } = {},
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(15);
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(30);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  onProgress?.(50);
  const targetPage = options.pageNumber ? Math.min(Math.max(1, options.pageNumber), numPages) : 1;
  const page = await pdfDoc.getPage(targetPage);

  const scale = options.dpi === 300 ? 2.5 : 1.5;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D rendering context not available.');
  }

  // Pure white background for PDF page rendering
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  onProgress?.(70);
  await page.render({
    canvasContext: ctx,
    viewport: viewport,
  }).promise;

  onProgress?.(90);
  const quality = (options.quality || 90) / 100;
  const jpgBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create JPG image from PDF canvas.'));
      },
      'image/jpeg',
      quality
    );
  });

  onProgress?.(100);
  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}_page_${targetPage}.jpg`);
  const downloadUrl = URL.createObjectURL(jpgBlob);

  return {
    blob: jpgBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: jpgBlob.size,
    savingsPercentage: 0,
    metadata: {
      totalPages: numPages,
      extractedPage: targetPage,
      dimensions: `${Math.round(viewport.width)} x ${Math.round(viewport.height)}`,
    },
  };
}

// ==========================================
// PDF EDITOR TYPES AND SERVICES
// ==========================================

export interface DetectedTextItem {
  id: string;
  originalText: string;
  currentText: string;
  xPercent: number;
  yPercent: number;
  baselineYPercent?: number;
  widthPercent: number;
  heightPercent: number;
  fontSize: number;
  fontFamily: string;
  fontWeight?: number | string;
  isBold: boolean;
  isItalic: boolean;
  textColor: string;
  backgroundColor?: string;
  letterSpacing?: number;
}

export interface CustomTextBox {
  id: string;
  text: string;
  xPercent: number;
  yPercent: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
}

export interface WhiteoutBox {
  id: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface PlacableImage {
  id: string;
  dataUrl: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface PlacableShape {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'highlight';
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  color: string;
  opacity: number;
  strokeWidth: number;
}

export interface PlacableStamp {
  id: string;
  text: string;
  color: string;
  xPercent: number;
  yPercent: number;
  widthPercent?: number;
  heightPercent?: number;
}

export interface PageEdits {
  editedItems: Record<string, string>; // item id -> replacement text
  customBoxes: CustomTextBox[];
  whiteouts: WhiteoutBox[];
  signatures: PlacableImage[];
  images: PlacableImage[];
  shapes: PlacableShape[];
  stamps: PlacableStamp[];
  rotation?: number; // 0, 90, 180, 270
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image from data URL'));
    img.src = dataUrl;
  });
}

export interface FontAnalysis {
  fontFamily: string;
  fontWeight: number;
  isBold: boolean;
  isItalic: boolean;
}

export function normalizeFontFamily(
  rawFontName: string,
  rawFamily?: string,
  _charWidthRatio?: number
): FontAnalysis {
  const cleanName = rawFontName.includes('+') ? rawFontName.split('+')[1] : rawFontName;
  const combined = `${cleanName} ${rawFontName} ${rawFamily || ''}`.toLowerCase();

  // 1. Detect Font Weight
  let isBold = false;
  let fontWeight = 400;

  if (
    combined.includes('black') ||
    combined.includes('heavy') ||
    combined.includes('extrabold') ||
    combined.includes('ultrabold') ||
    combined.includes('900') ||
    combined.includes('800')
  ) {
    isBold = true;
    fontWeight = 800;
  } else if (
    combined.includes('bold') ||
    combined.includes('700') ||
    /\bbd\b|-bd\b|_bd\b/i.test(combined) ||
    /bold/i.test(rawFamily || '')
  ) {
    isBold = true;
    fontWeight = 700;
  } else if (
    combined.includes('semibold') ||
    combined.includes('demibold') ||
    combined.includes('600')
  ) {
    isBold = true;
    fontWeight = 600;
  } else if (
    combined.includes('medium') ||
    combined.includes('500')
  ) {
    fontWeight = 500;
  } else if (
    combined.includes('light') ||
    combined.includes('thin') ||
    combined.includes('hairline') ||
    combined.includes('300') ||
    combined.includes('200')
  ) {
    fontWeight = 300;
  } else {
    // Normal document font renders with standard regular weight 400
    fontWeight = 400;
  }

  // 2. Detect Italic
  const isItalic =
    combined.includes('italic') ||
    combined.includes('oblique') ||
    combined.includes('slant') ||
    /\bital\b|\bit\b|-it\b|_it\b/i.test(combined) ||
    /italic|oblique/i.test(rawFamily || '');

  // 3. Monospace fonts (ONLY if name or family explicitly indicates monospace)
  const isMonoName =
    combined.includes('courier') ||
    combined.includes('consolas') ||
    combined.includes('menlo') ||
    combined.includes('inconsolata') ||
    combined.includes('typewriter') ||
    combined.includes('ocr') ||
    combined.includes('lineprinter') ||
    combined.includes('draft') ||
    /\bmono\b|monospace/i.test(combined) ||
    rawFamily?.toLowerCase() === 'monospace';

  if (isMonoName) {
    return {
      fontFamily: "'Courier New', 'Courier', 'Lucida Console', monospace",
      fontWeight: isBold ? 700 : fontWeight,
      isBold,
      isItalic,
    };
  }

  // 4. Serif typefaces
  if (
    (combined.includes('serif') && !combined.includes('sans')) ||
    combined.includes('times') ||
    combined.includes('georgia') ||
    combined.includes('cambria') ||
    combined.includes('garamond') ||
    combined.includes('baskerville') ||
    combined.includes('palatino') ||
    combined.includes('minion') ||
    combined.includes('merriweather') ||
    combined.includes('caslon') ||
    combined.includes('bookman') ||
    combined.includes('century') ||
    combined.includes('antiqua') ||
    combined.includes('didot') ||
    combined.includes('bodoni') ||
    combined.includes('roman') ||
    combined.includes('tmsrmn') ||
    combined.includes('liberation serif') ||
    combined.includes('nimbus rom') ||
    rawFamily?.toLowerCase() === 'serif'
  ) {
    let fam = "'Times New Roman', 'Times', 'Liberation Serif', serif";
    if (combined.includes('georgia')) fam = "'Georgia', 'Times New Roman', serif";
    else if (combined.includes('cambria')) fam = "'Cambria', 'Georgia', serif";
    else if (combined.includes('garamond')) fam = "'Garamond', 'Georgia', serif";
    else if (combined.includes('palatino')) fam = "'Palatino Linotype', 'Book Antiqua', Palatino, serif";

    return {
      fontFamily: fam,
      fontWeight: isBold ? 700 : fontWeight,
      isBold,
      isItalic,
    };
  }

  // 5. Sans-Serif typefaces (Universal default for clean modern documents)
  let sansFam = "'Arial', 'Helvetica Neue', Helvetica, sans-serif";
  if (combined.includes('calibri')) sansFam = "'Calibri', 'Arial', sans-serif";
  else if (combined.includes('aptos')) sansFam = "'Aptos', 'Calibri', 'Arial', sans-serif";
  else if (combined.includes('roboto')) sansFam = "'Roboto', 'Segoe UI', 'Arial', sans-serif";
  else if (combined.includes('segoe')) sansFam = "'Segoe UI', 'Arial', sans-serif";
  else if (combined.includes('tahoma')) sansFam = "'Tahoma', 'Arial', sans-serif";
  else if (combined.includes('verdana')) sansFam = "'Verdana', 'Arial', sans-serif";
  else if (combined.includes('trebuchet')) sansFam = "'Trebuchet MS', 'Arial', sans-serif";
  else if (combined.includes('helvetica')) sansFam = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  else if (combined.includes('open sans') || combined.includes('opensans')) sansFam = "'Open Sans', 'Arial', sans-serif";
  else if (combined.includes('lato')) sansFam = "'Lato', 'Arial', sans-serif";
  else if (combined.includes('poppins')) sansFam = "'Poppins', 'Arial', sans-serif";
  else if (combined.includes('montserrat')) sansFam = "'Montserrat', 'Arial', sans-serif";

  return {
    fontFamily: sansFam,
    fontWeight: isBold ? 700 : fontWeight,
    isBold,
    isItalic,
  };
}

/**
 * Accurately sample the background color and text color from the rendered canvas behind the text box.
 * Uses color distribution mode (histogram) to find the true document paper/cell background
 * and high-contrast foreground text color.
 */
function sampleColors(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): { textColor: string; backgroundColor: string } {
  try {
    const startX = Math.max(0, Math.min(ctx.canvas.width - 2, Math.round(x)));
    const startY = Math.max(0, Math.min(ctx.canvas.height - 2, Math.round(y)));
    const sampleW = Math.max(2, Math.min(ctx.canvas.width - startX, Math.round(Math.min(w, 80))));
    const sampleH = Math.max(2, Math.min(ctx.canvas.height - startY, Math.round(Math.min(h, 40))));

    const imgData = ctx.getImageData(startX, startY, sampleW, sampleH).data;

    const bins = new Map<string, { count: number; sumR: number; sumG: number; sumB: number }>();
    let totalPixels = 0;

    for (let py = 0; py < sampleH; py++) {
      for (let px = 0; px < sampleW; px++) {
        const i = (py * sampleW + px) * 4;
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];
        if (a < 50) continue;

        totalPixels++;
        // Quantize to 16-step bins to group subtle anti-aliasing variations
        const binR = Math.round(r / 16) * 16;
        const binG = Math.round(g / 16) * 16;
        const binB = Math.round(b / 16) * 16;
        const binKey = `${binR},${binG},${binB}`;

        const existing = bins.get(binKey);
        if (existing) {
          existing.count++;
          existing.sumR += r;
          existing.sumG += g;
          existing.sumB += b;
        } else {
          bins.set(binKey, { count: 1, sumR: r, sumG: g, sumB: b });
        }
      }
    }

    if (totalPixels === 0 || bins.size === 0) {
      return { textColor: '#000000', backgroundColor: '#ffffff' };
    }

    // Find dominant background bin (mode of the color distribution, background is always >= 70% of area)
    let maxCount = -1;
    let bgBin: { count: number; sumR: number; sumG: number; sumB: number } | null = null;
    for (const bin of bins.values()) {
      if (bin.count > maxCount) {
        maxCount = bin.count;
        bgBin = bin;
      }
    }

    if (!bgBin) {
      return { textColor: '#000000', backgroundColor: '#ffffff' };
    }

    const bgR = Math.round(bgBin.sumR / bgBin.count);
    const bgG = Math.round(bgBin.sumG / bgBin.count);
    const bgB = Math.round(bgBin.sumB / bgBin.count);
    const bgBrightness = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

    const toHex = (c: number) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0');

    // If brightness is high (paper background >= 220), snap to pure #ffffff to prevent any gray box
    let backgroundColor = '#ffffff';
    if (bgBrightness < 220 || bgR < 205 || bgG < 205 || bgB < 205) {
      backgroundColor = `#${toHex(bgR)}${toHex(bgG)}${toHex(bgB)}`;
    }

    // Find dominant foreground text bin (pixels with significant distance from background)
    let fgMaxCount = -1;
    let fgBin: { count: number; sumR: number; sumG: number; sumB: number } | null = null;

    for (const bin of bins.values()) {
      if (bin === bgBin) continue;
      const avgR = bin.sumR / bin.count;
      const avgG = bin.sumG / bin.count;
      const avgB = bin.sumB / bin.count;
      const dist = Math.abs(avgR - bgR) + Math.abs(avgG - bgG) + Math.abs(avgB - bgB);
      if (dist > 60 && bin.count > fgMaxCount) {
        fgMaxCount = bin.count;
        fgBin = bin;
      }
    }

    let textColor = bgBrightness > 128 ? '#000000' : '#ffffff';
    if (fgBin) {
      const textR = Math.round(fgBin.sumR / fgBin.count);
      const textG = Math.round(fgBin.sumG / fgBin.count);
      const textB = Math.round(fgBin.sumB / fgBin.count);
      const textBrightness = 0.299 * textR + 0.587 * textG + 0.114 * textB;

      if (textBrightness <= 50 || (textR <= 45 && textG <= 45 && textB <= 45)) {
        textColor = '#000000';
      } else if (textBrightness >= 235) {
        textColor = '#ffffff';
      } else {
        textColor = `#${toHex(textR)}${toHex(textG)}${toHex(textB)}`;
      }
    }

    return { textColor, backgroundColor };
  } catch (_) {
    return { textColor: '#000000', backgroundColor: '#ffffff' };
  }
}

/**
 * Load a single page of PDF for visual interactive editing with text layer detection
 */
export async function loadPdfPageForEditing(
  file: File,
  pageNumber: number,
  scale: number = 1.5,
  rotation: number = 0
): Promise<{
  canvasDataUrl: string;
  width: number;
  height: number;
  numPages: number;
  textItems: DetectedTextItem[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapPacked: true,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const targetPageNum = Math.min(Math.max(1, pageNumber), numPages);
  const page = await pdfDoc.getPage(targetPageNum);

  const totalRotation = ((page.rotate || 0) + (rotation || 0)) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  const canvasDataUrl = canvas.toDataURL('image/jpeg', 0.95);

  // Extract text items
  const textContent = await page.getTextContent();
  const textItems: DetectedTextItem[] = [];

  // Pre-resolve all fonts used across this page from commonObjs
  const fontMap = new Map<string, any>();
  const fontPromises: Promise<void>[] = [];

  for (let i = 0; i < textContent.items.length; i++) {
    const it: any = textContent.items[i];
    if (!it.fontName || fontMap.has(it.fontName)) continue;
    fontMap.set(it.fontName, null);

    const p = new Promise<void>((resolve) => {
      try {
        if ((page as any).commonObjs?.has?.(it.fontName)) {
          (page as any).commonObjs.get(it.fontName, async (fontData: any) => {
            if (fontData) {
              fontMap.set(it.fontName, fontData);
              // Register FontFace in browser if embedded data exists
              if (
                typeof document !== 'undefined' &&
                typeof FontFace !== 'undefined' &&
                fontData.data &&
                fontData.loadedName &&
                !document.fonts.check(`12px "${fontData.loadedName}"`)
              ) {
                try {
                  const ff = new FontFace(fontData.loadedName, fontData.data);
                  await ff.load();
                  document.fonts.add(ff);
                } catch (_) {}
              }
            }
            resolve();
          });
        } else {
          resolve();
        }
      } catch (_) {
        resolve();
      }
    });
    fontPromises.push(p);
  }

  await Promise.race([
    Promise.all(fontPromises),
    new Promise((res) => setTimeout(res, 250)),
  ]);

  for (let i = 0; i < textContent.items.length; i++) {
    const item: any = textContent.items[i];
    if (!item.str || !item.str.trim()) continue;

    // Viewport coordinates
    const [vx, vy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
    
    // Calculate accurate font scale
    const fontScaleY = Math.hypot(item.transform[2], item.transform[3]) || Math.hypot(item.transform[0], item.transform[1]);
    const pdfFontHeight = item.height > 0 ? item.height : fontScaleY;
    const fontHeight = pdfFontHeight * scale;

    const itemWidth = Math.max(item.width * scale * 1.02, 12);
    const itemHeight = Math.max(fontHeight * 0.96, 12);
    // Baseline-adjusted top
    const itemTop = Math.max(0, vy - fontHeight * 0.80);

    const xPercent = (vx / viewport.width) * 100;
    const yPercent = (itemTop / viewport.height) * 100;
    const baselineYPercent = (vy / viewport.height) * 100;
    const widthPercent = (itemWidth / viewport.width) * 100;
    const heightPercent = (itemHeight / viewport.height) * 100;

    // Resolve font name from pre-resolved fontMap or commonObjs
    let rawFontName = item.fontName;
    const fontObj = fontMap.get(item.fontName);
    if (fontObj?.name) {
      rawFontName = fontObj.name;
    }

    const style = textContent.styles[item.fontName];
    const charWidthRatio = item.str.length > 0 ? (item.width / item.str.length) / pdfFontHeight : undefined;
    const analysis = normalizeFontFamily(rawFontName, style?.fontFamily, charWidthRatio);

    // Use the accurately matched system font family (Arial, Calibri, Times, etc.)
    const resolvedFontFamily = analysis.fontFamily;

    // Accurately sample the text color and background color from the rendered canvas
    const colors = sampleColors(ctx, vx, vy - fontHeight * 0.78, itemWidth, fontHeight);

    textItems.push({
      id: `p${targetPageNum}_t${i}`,
      originalText: item.str,
      currentText: item.str,
      xPercent,
      yPercent,
      baselineYPercent,
      widthPercent,
      heightPercent,
      fontSize: Math.round(fontHeight),
      fontFamily: resolvedFontFamily,
      fontWeight: analysis.fontWeight,
      isBold: analysis.isBold,
      isItalic: analysis.isItalic,
      textColor: colors.textColor,
      backgroundColor: colors.backgroundColor,
    });
  }

  return {
    canvasDataUrl,
    width: viewport.width,
    height: viewport.height,
    numPages,
    textItems,
  };
}

/**
 * Synthesizes all modified pages, text replacements, custom text, and whiteouts into a newly generated PDF
 */
export async function exportEditedPdf(
  file: File,
  allPageEdits: Record<number, PageEdits>,
  pageItemsMap: Record<number, DetectedTextItem[]>,
  deletedPages: Set<number> = new Set(),
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(10);
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapPacked: true,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const newPdf = await PDFDocument.create();
  let exportedPagesCount = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    // Skip deleted pages
    if (deletedPages.has(pageNum)) {
      continue;
    }

    exportedPagesCount++;
    const page = await pdfDoc.getPage(pageNum);
    const pageEdits = allPageEdits[pageNum];
    const rot = ((pageEdits?.rotation || 0) % 360);
    const totalRot = ((page.rotate || 0) + rot) % 360;

    const scale = 2.0; // High resolution export for crisp print
    const viewport = page.getViewport({ scale, rotation: totalRot });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const items = pageItemsMap[pageNum] || [];

    if (pageEdits) {
      // 1. Apply Whiteouts
      if (pageEdits.whiteouts && pageEdits.whiteouts.length > 0) {
        ctx.fillStyle = '#ffffff';
        for (const w of pageEdits.whiteouts) {
          const wx = (w.xPercent / 100) * canvas.width;
          const wy = (w.yPercent / 100) * canvas.height;
          const ww = (w.widthPercent / 100) * canvas.width;
          const wh = (w.heightPercent / 100) * canvas.height;
          ctx.fillRect(wx, wy, ww, wh);
        }
      }

      // 2. Apply Text Item Edits (in matching font family, size, weight, and baseline)
      if (pageEdits.editedItems) {
        for (const [id, newText] of Object.entries(pageEdits.editedItems)) {
          const item = items.find((t) => t.id === id);
          if (!item) continue;

          const ix = (item.xPercent / 100) * canvas.width;
          const iy = (item.yPercent / 100) * canvas.height;
          const iw = (item.widthPercent / 100) * canvas.width;

          // Render replacement text in exact matching font
          const scaledFontSize = Math.round(item.fontSize * (scale / 1.5));
          const weight = item.fontWeight || (item.isBold ? 'bold' : 'normal');
          ctx.font = `${weight} ${item.isItalic ? 'italic ' : ''}${scaledFontSize}px ${item.fontFamily}`;

          // Accurately measure new text width with font set
          const measuredWidth = ctx.measureText(newText).width;
          const fillWidth = Math.max(iw, measuredWidth) + 4;

          // Calculate exact baseline Y coordinate
          const baselineY = item.baselineYPercent !== undefined
            ? (item.baselineYPercent / 100) * canvas.height
            : iy + scaledFontSize * 0.82;

          // Eraser matches the exact sampled background of the paper or table cell
          ctx.fillStyle = item.backgroundColor || '#ffffff';
          const ascent = scaledFontSize * 0.88;
          const descent = scaledFontSize * 0.28;
          ctx.fillRect(ix, baselineY - ascent, fillWidth, ascent + descent);

          if (newText.trim()) {
            ctx.fillStyle = item.textColor || '#000000';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(newText, ix, baselineY);
          }
        }
      }

      // 3. Apply Highlighters & Shapes
      if (pageEdits.shapes && pageEdits.shapes.length > 0) {
        for (const shape of pageEdits.shapes) {
          const sx = (shape.xPercent / 100) * canvas.width;
          const sy = (shape.yPercent / 100) * canvas.height;
          const sw = (shape.widthPercent / 100) * canvas.width;
          const sh = (shape.heightPercent / 100) * canvas.height;

          ctx.save();
          if (shape.type === 'highlight') {
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = shape.color || '#fef08a';
            ctx.fillRect(sx, sy, sw, sh);
          } else if (shape.type === 'rectangle') {
            ctx.globalAlpha = shape.opacity || 1.0;
            ctx.strokeStyle = shape.color || '#000000';
            ctx.lineWidth = (shape.strokeWidth || 2) * (scale / 1.5);
            ctx.strokeRect(sx, sy, sw, sh);
          } else if (shape.type === 'circle') {
            ctx.globalAlpha = shape.opacity || 1.0;
            ctx.strokeStyle = shape.color || '#000000';
            ctx.lineWidth = (shape.strokeWidth || 2) * (scale / 1.5);
            ctx.beginPath();
            ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else if (shape.type === 'line') {
            ctx.globalAlpha = shape.opacity || 1.0;
            ctx.strokeStyle = shape.color || '#000000';
            ctx.lineWidth = (shape.strokeWidth || 2) * (scale / 1.5);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + sw, sy + sh);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // 4. Apply Images & Logos
      if (pageEdits.images && pageEdits.images.length > 0) {
        for (const imgItem of pageEdits.images) {
          try {
            const img = await loadImageFromDataUrl(imgItem.dataUrl);
            const imX = (imgItem.xPercent / 100) * canvas.width;
            const imY = (imgItem.yPercent / 100) * canvas.height;
            const imW = (imgItem.widthPercent / 100) * canvas.width;
            const imH = (imgItem.heightPercent / 100) * canvas.height;
            ctx.drawImage(img, imX, imY, imW, imH);
          } catch (e) {
            console.warn('Failed to draw image item:', e);
          }
        }
      }

      // 5. Apply Signatures
      if (pageEdits.signatures && pageEdits.signatures.length > 0) {
        for (const sig of pageEdits.signatures) {
          try {
            const sigImg = await loadImageFromDataUrl(sig.dataUrl);
            const sigX = (sig.xPercent / 100) * canvas.width;
            const sigY = (sig.yPercent / 100) * canvas.height;
            const sigW = (sig.widthPercent / 100) * canvas.width;
            const sigH = (sig.heightPercent / 100) * canvas.height;
            ctx.drawImage(sigImg, sigX, sigY, sigW, sigH);
          } catch (e) {
            console.warn('Failed to draw signature:', e);
          }
        }
      }

      // 6. Apply Added Custom Text Boxes
      if (pageEdits.customBoxes && pageEdits.customBoxes.length > 0) {
        for (const box of pageEdits.customBoxes) {
          const bx = (box.xPercent / 100) * canvas.width;
          const by = (box.yPercent / 100) * canvas.height;
          const scaledFontSize = Math.round(box.fontSize * (scale / 1.5));
          ctx.font = `${box.isBold ? 'bold ' : ''}${box.isItalic ? 'italic ' : ''}${scaledFontSize}px ${box.fontFamily}`;
          ctx.fillStyle = box.color || '#000000';
          ctx.textBaseline = 'top';
          ctx.fillText(box.text, bx, by);
        }
      }

      // 7. Apply Status Stamps
      if (pageEdits.stamps && pageEdits.stamps.length > 0) {
        for (const stamp of pageEdits.stamps) {
          const stX = (stamp.xPercent / 100) * canvas.width;
          const stY = (stamp.yPercent / 100) * canvas.height;
          const stampW = stamp.widthPercent
            ? (stamp.widthPercent / 100) * canvas.width
            : 150 * (scale / 1.5);
          const stampH = stamp.heightPercent
            ? (stamp.heightPercent / 100) * canvas.height
            : 46 * (scale / 1.5);

          ctx.save();
          ctx.translate(stX, stY);
          ctx.rotate(-0.12);
          ctx.strokeStyle = stamp.color;
          ctx.lineWidth = Math.max(2, Math.round(stampH * 0.08));
          ctx.strokeRect(0, 0, stampW, stampH);

          ctx.fillStyle = stamp.color;
          const charCount = Math.max(stamp.text.length, 6);
          const maxFontFromWidth = Math.floor((stampW - 14) / (charCount * 0.72));
          const fontSize = Math.max(
            10,
            Math.min(
              Math.round(stampH * 0.52),
              maxFontFromWidth
            )
          );
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stamp.text, stampW / 2, stampH / 2);
          ctx.restore();
        }
      }
    }

    // Embed synthesized page into new PDF
    const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.94);
    const embeddedImg = await newPdf.embedJpg(jpgDataUrl);

    const origViewport = page.getViewport({ scale: 1.0, rotation: totalRot });
    const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });

    const progress = Math.round(10 + (pageNum / numPages) * 85);
    onProgress?.(progress);
    await new Promise((r) => setTimeout(r, 10));
  }

  const outputPdfBytes = await newPdf.save({ useObjectStreams: true });
  const finalBlob = new Blob([outputPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}_edited.pdf`);
  const downloadUrl = URL.createObjectURL(finalBlob);

  onProgress?.(100);

  return {
    blob: finalBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: finalBlob.size,
    savingsPercentage: 0,
    metadata: {
      pages: exportedPagesCount,
    },
  };
}

/**
 * Export a single composite page with all edits, whiteouts, and Canva elements as a high-res JPG or PNG
 */
export async function exportPageAsImage(
  file: File,
  pageNum: number,
  pageEdits: PageEdits | undefined,
  textItems: DetectedTextItem[],
  format: 'jpeg' | 'png' = 'png'
): Promise<{ dataUrl: string; filename: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapPacked: true,
  });
  const pdfDoc = await loadingTask.promise;
  const targetPageNum = Math.min(Math.max(1, pageNum), pdfDoc.numPages);
  const page = await pdfDoc.getPage(targetPageNum);

  const rot = ((pageEdits?.rotation || 0) % 360);
  const totalRot = ((page.rotate || 0) + rot) % 360;
  const scale = 2.0;
  const viewport = page.getViewport({ scale, rotation: totalRot });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  if (pageEdits) {
    // 1. Whiteout boxes
    if (pageEdits.whiteouts && pageEdits.whiteouts.length > 0) {
      ctx.fillStyle = '#ffffff';
      for (const w of pageEdits.whiteouts) {
        const wx = (w.xPercent / 100) * canvas.width;
        const wy = (w.yPercent / 100) * canvas.height;
        const ww = (w.widthPercent / 100) * canvas.width;
        const wh = (w.heightPercent / 100) * canvas.height;
        ctx.fillRect(wx, wy, ww, wh);
      }
    }

    // 2. Text replacements in matching font
    if (pageEdits.editedItems && textItems && textItems.length > 0) {
      for (const item of textItems) {
        const replacement = pageEdits.editedItems[item.id];
        if (replacement !== undefined && replacement !== item.originalText) {
          const ix = (item.xPercent / 100) * canvas.width;
          const iy = (item.yPercent / 100) * canvas.height;
          const iw = (item.widthPercent / 100) * canvas.width;
          const ih = (item.heightPercent / 100) * canvas.height;

          // Render replacement text in exact matching font
          const scaledFontSize = Math.round(item.fontSize * (scale / 1.5));
          ctx.font = `${item.isBold ? 'bold ' : ''}${item.isItalic ? 'italic ' : ''}${scaledFontSize}px ${item.fontFamily}`;

          // Accurately measure new text width with font set
          const measuredWidth = ctx.measureText(replacement).width;
          const fillWidth = Math.max(iw, measuredWidth) + 4;
          const fillHeight = Math.max(ih, scaledFontSize * 1.05);

          // Whiteout old text area cleanly without bleeding into adjacent lines
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ix - 1, iy, fillWidth, fillHeight);

          if (replacement.trim()) {
            ctx.fillStyle = item.textColor || '#000000';
            ctx.textBaseline = 'top';
            ctx.fillText(replacement, ix, iy);
          }
        }
      }
    }

    // 3. Highlighters & Shapes
    if (pageEdits.shapes && pageEdits.shapes.length > 0) {
      for (const shape of pageEdits.shapes) {
        const sx = (shape.xPercent / 100) * canvas.width;
        const sy = (shape.yPercent / 100) * canvas.height;
        const sw = (shape.widthPercent / 100) * canvas.width;
        const sh = (shape.heightPercent / 100) * canvas.height;

        ctx.save();
        if (shape.type === 'highlight') {
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = shape.color || '#fef08a';
          ctx.fillRect(sx, sy, sw, sh);
        } else if (shape.type === 'rectangle') {
          ctx.globalAlpha = shape.opacity || 1.0;
          ctx.strokeStyle = shape.color || '#000000';
          ctx.lineWidth = (shape.strokeWidth || 2) * (scale / 1.5);
          ctx.strokeRect(sx, sy, sw, sh);
        } else if (shape.type === 'circle') {
          ctx.globalAlpha = shape.opacity || 1.0;
          ctx.strokeStyle = shape.color || '#000000';
          ctx.lineWidth = (shape.strokeWidth || 2) * (scale / 1.5);
          ctx.beginPath();
          ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shape.type === 'line') {
          ctx.globalAlpha = shape.opacity || 1.0;
          ctx.strokeStyle = shape.color || '#000000';
          ctx.lineWidth = (shape.strokeWidth || 2) * (scale / 1.5);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + sw, sy + sh);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // 4. Images & Logos
    if (pageEdits.images && pageEdits.images.length > 0) {
      for (const imgItem of pageEdits.images) {
        try {
          const img = await loadImageFromDataUrl(imgItem.dataUrl);
          const imX = (imgItem.xPercent / 100) * canvas.width;
          const imY = (imgItem.yPercent / 100) * canvas.height;
          const imW = (imgItem.widthPercent / 100) * canvas.width;
          const imH = (imgItem.heightPercent / 100) * canvas.height;
          ctx.drawImage(img, imX, imY, imW, imH);
        } catch (e) {
          console.warn('Failed to draw image item:', e);
        }
      }
    }

    // 5. Signatures
    if (pageEdits.signatures && pageEdits.signatures.length > 0) {
      for (const sig of pageEdits.signatures) {
        try {
          const sigImg = await loadImageFromDataUrl(sig.dataUrl);
          const sigX = (sig.xPercent / 100) * canvas.width;
          const sigY = (sig.yPercent / 100) * canvas.height;
          const sigW = (sig.widthPercent / 100) * canvas.width;
          const sigH = (sig.heightPercent / 100) * canvas.height;
          ctx.drawImage(sigImg, sigX, sigY, sigW, sigH);
        } catch (e) {
          console.warn('Failed to draw signature:', e);
        }
      }
    }

    // 6. Custom Text Boxes
    if (pageEdits.customBoxes && pageEdits.customBoxes.length > 0) {
      for (const box of pageEdits.customBoxes) {
        const bx = (box.xPercent / 100) * canvas.width;
        const by = (box.yPercent / 100) * canvas.height;
        const scaledFontSize = Math.round(box.fontSize * (scale / 1.5));
        ctx.font = `${box.isBold ? 'bold ' : ''}${box.isItalic ? 'italic ' : ''}${scaledFontSize}px ${box.fontFamily}`;
        ctx.fillStyle = box.color || '#000000';
        ctx.textBaseline = 'top';
        ctx.fillText(box.text, bx, by);
      }
    }

    // 7. Status Stamps
    if (pageEdits.stamps && pageEdits.stamps.length > 0) {
      for (const stamp of pageEdits.stamps) {
        const stX = (stamp.xPercent / 100) * canvas.width;
        const stY = (stamp.yPercent / 100) * canvas.height;
        const stampW = stamp.widthPercent
          ? (stamp.widthPercent / 100) * canvas.width
          : 150 * (scale / 1.5);
        const stampH = stamp.heightPercent
          ? (stamp.heightPercent / 100) * canvas.height
          : 46 * (scale / 1.5);

        ctx.save();
        ctx.translate(stX, stY);
        ctx.rotate(-0.12);
        ctx.strokeStyle = stamp.color;
        ctx.lineWidth = Math.max(2, Math.round(stampH * 0.08));
        ctx.strokeRect(0, 0, stampW, stampH);

        ctx.fillStyle = stamp.color;
        const charCount = Math.max(stamp.text.length, 6);
        const maxFontFromWidth = Math.floor((stampW - 14) / (charCount * 0.72));
        const fontSize = Math.max(
          10,
          Math.min(
            Math.round(stampH * 0.52),
            maxFontFromWidth
          )
        );
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stamp.text, stampW / 2, stampH / 2);
        ctx.restore();
      }
    }
  }

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const dataUrl = canvas.toDataURL(mime, 0.95);
  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const filename = sanitizeFilename(`${base}_page_${targetPageNum}.${ext}`);

  return { dataUrl, filename };
}

// ==========================================
// WORD TO PDF CONVERSION (docx-preview + html2canvas + jspdf)
// ==========================================

const CONVERT_API_SECRET = 'mfSj1lSiIUJqPU8QoEMyA0aDF70hhpkp';

function base64ToBlob(base64: string, mime: string = 'application/pdf'): Blob {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes.buffer], { type: mime });
}
const base64ToPdfBlob = (b: string) => base64ToBlob(b, 'application/pdf');

/**
 * Convert a .docx / .doc Word file to PDF using ConvertAPI (Microsoft Office engine)
 * with automatic fallback to DOM renderer if offline.
 */
export async function convertWordToPdf(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  let currentProg = 15;
  onProgress?.(currentProg);
  const progTimer = setInterval(() => {
    if (currentProg < 88) {
      currentProg += Math.floor(Math.random() * 15) + 10;
      onProgress?.(Math.min(88, currentProg));
    }
  }, 250);

  // 1. Primary Engine: High-fidelity Microsoft Office API
  try {
    const ext = file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx') ? 'doc' : 'docx';
    const fd = new FormData();
    fd.append('File', file, file.name);

    const res = await fetch(`https://v2.convertapi.com/convert/${ext}/to/pdf?StoreFile=false`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONVERT_API_SECRET}`,
      },
      body: fd,
    });

    if (res.ok) {
      const data = await res.json();
      const fileObj = data.Files?.[0];

      if (fileObj) {
        let pdfBlob: Blob;
        if (fileObj.FileData) {
          pdfBlob = base64ToPdfBlob(fileObj.FileData);
        } else if (fileObj.Url) {
          const dlRes = await fetch(fileObj.Url);
          pdfBlob = await dlRes.blob();
        } else {
          throw new Error('No valid file output returned by conversion engine');
        }

        clearInterval(progTimer);
        const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const outName = sanitizeFilename(`${base}.pdf`);
        const downloadUrl = URL.createObjectURL(pdfBlob);

        onProgress?.(100);

        return {
          blob: pdfBlob,
          downloadUrl,
          filename: outName,
          originalSize: file.size,
          processedSize: pdfBlob.size,
          savingsPercentage: 0,
          metadata: { engine: 'microsoft-office', quality: '100% vector' },
        };
      }
    } else {
      const errTxt = await res.text();
      console.warn('ConvertAPI Word to PDF returned error status:', res.status, errTxt);
    }
  } catch (apiErr) {
    console.warn('ConvertAPI request failed, switching to local renderer:', apiErr);
  } finally {
    clearInterval(progTimer);
  }

  // 2. Fallback Engine: In-browser DOM rendering
  const [{ renderAsync }, { jsPDF }] = await Promise.all([
    import('docx-preview'),
    import('jspdf'),
  ]);

  onProgress?.(15);
  const arrayBuffer = await file.arrayBuffer();

  // Create off-screen rendering host below the viewport (so styles & fonts compute properly)
  const container = document.createElement('div');
  container.id = 'quickvero-docx-host';
  container.style.cssText = [
    'position: fixed',
    'top: 100vh',
    'left: 0',
    'width: auto',
    'min-width: 850px',
    'background: #ffffff',
    'z-index: -9999',
    'opacity: 1',
    'visibility: visible',
    'pointer-events: none',
  ].join(';');
  document.body.appendChild(container);

  try {
    onProgress?.(25);
    // Use docx-preview's native wrapper & classes so Word margins, tab stops, and font rules are honored
    await renderAsync(arrayBuffer, container, undefined, {
      className: 'docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      useBase64URL: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
    });

    onProgress?.(45);

    // Wait for fonts & layout to stabilize
    if ((document as any).fonts?.ready) {
      await (document as any).fonts.ready;
    }
    await new Promise((r) => setTimeout(r, 200));

    const { default: html2canvas } = await import('html2canvas');

    // Query all rendered pages produced by docx-preview
    let sections = Array.from(container.querySelectorAll<HTMLElement>('section.docx'));

    // Fallback if no section.docx found
    if (sections.length === 0) {
      const wrapper = container.querySelector<HTMLElement>('.docx-wrapper') || container;
      sections = [wrapper];
    }

    onProgress?.(55);

    let pdf: any = null;

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];

      // Remove any shadows or outside borders for print cleanliness
      const originalShadow = sec.style.boxShadow;
      const originalMargin = sec.style.marginBottom;
      sec.style.boxShadow = 'none';
      sec.style.marginBottom = '0';

      const secW = sec.offsetWidth || 816;
      const secH = sec.offsetHeight || 1056;

      const canvas = await html2canvas(sec, {
        scale: 2.2, // Razor sharp text without excessive memory
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: secW,
        height: secH,
      });

      // Restore styling
      sec.style.boxShadow = originalShadow;
      sec.style.marginBottom = originalMargin;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const isLandscape = secW > secH;
      const orientation = isLandscape ? 'landscape' : 'portrait';

      if (i === 0) {
        pdf = new jsPDF({
          unit: 'px',
          format: [secW, secH],
          orientation,
          hotfixes: ['px_scaling'],
        });
      } else {
        pdf.addPage([secW, secH], orientation);
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, secW, secH, undefined, 'FAST');

      const currentPercent = Math.round(55 + ((i + 1) / sections.length) * 40);
      onProgress?.(currentPercent);
      await new Promise((r) => setTimeout(r, 20));
    }

    onProgress?.(96);
    const pdfBytes = pdf.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const outName = sanitizeFilename(`${base}.pdf`);
    const downloadUrl = URL.createObjectURL(pdfBlob);

    onProgress?.(100);

    return {
      blob: pdfBlob,
      downloadUrl,
      filename: outName,
      originalSize: file.size,
      processedSize: pdfBlob.size,
      savingsPercentage: 0,
      metadata: { pages: sections.length, source: 'docx' },
    };
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

// ==========================================
// EXCEL TO PDF CONVERSION (xlsx + html2canvas + jspdf)
// ==========================================

/**
 * Convert .xlsx / .xls Excel files to PDF using ConvertAPI (Microsoft Excel engine)
 * with automatic fallback to client-side spreadsheet engine if offline.
 */
export async function convertExcelToPdf(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(5);

  // 1. Primary Engine: High-fidelity Microsoft Excel API
  try {
    const ext = file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx') ? 'xls' : 'xlsx';
    const fd = new FormData();
    fd.append('File', file, file.name);

    onProgress?.(25);

    const res = await fetch(`https://v2.convertapi.com/convert/${ext}/to/pdf?StoreFile=false`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONVERT_API_SECRET}`,
      },
      body: fd,
    });

    if (res.ok) {
      onProgress?.(75);
      const data = await res.json();
      const fileObj = data.Files?.[0];

      if (fileObj) {
        let pdfBlob: Blob;
        if (fileObj.Url) {
          const dlRes = await fetch(fileObj.Url);
          pdfBlob = await dlRes.blob();
        } else if (fileObj.FileData) {
          pdfBlob = base64ToPdfBlob(fileObj.FileData);
        } else {
          throw new Error('No valid file output returned by conversion engine');
        }

        const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const outName = sanitizeFilename(`${base}.pdf`);
        const downloadUrl = URL.createObjectURL(pdfBlob);

        onProgress?.(100);

        return {
          blob: pdfBlob,
          downloadUrl,
          filename: outName,
          originalSize: file.size,
          processedSize: pdfBlob.size,
          savingsPercentage: 0,
          metadata: { engine: 'microsoft-excel', quality: '100% vector' },
        };
      }
    } else {
      const errTxt = await res.text();
      console.warn('ConvertAPI Excel to PDF returned error status:', res.status, errTxt);
    }
  } catch (apiErr) {
    console.warn('ConvertAPI request failed for Excel, switching to local renderer:', apiErr);
  }

  // 2. Fallback Engine: In-browser spreadsheet renderer
  const [{ read, utils }, { jsPDF }, { default: html2canvas }] = await Promise.all([
    import('xlsx'),
    import('jspdf'),
    import('html2canvas'),
  ]);

  onProgress?.(20);

  const arrayBuffer = await file.arrayBuffer();
  const workbook = read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('No sheets found in the Excel file.');
  }

  onProgress?.(35);

  // Host container positioned just below viewport for accurate rendering
  const host = document.createElement('div');
  host.id = 'quickvero-excel-host';
  host.style.cssText = [
    'position: fixed',
    'top: 100vh',
    'left: 0',
    'z-index: -9999',
    'background: #ffffff',
    'opacity: 1',
    'visibility: visible',
    'pointer-events: none',
  ].join(';');
  document.body.appendChild(host);

  let pdf: any = null;
  const ROWS_PER_PAGE = 30; // Clean pagination for long sheets

  try {
    for (let si = 0; si < sheetNames.length; si++) {
      const sheetName = sheetNames[si];
      const worksheet = workbook.Sheets[sheetName];
      const rawData: any[][] = utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      // Filter out completely blank trailing rows
      const data = rawData.filter((row) =>
        row.some((cell) => cell !== '' && cell !== null && cell !== undefined)
      );

      if (data.length === 0) continue;

      // Determine max columns
      const maxCols = Math.max(...data.map((r) => r.length), 1);
      // Auto-detect orientation: <= 6 columns fits portrait beautifully, > 6 uses landscape
      const isLandscape = maxCols > 6;
      const pageWidthPx = isLandscape ? 1123 : 794;
      const pageHeightPx = isLandscape ? 794 : 1123;

      const headerRow = data[0] || [];
      const bodyRows = data.slice(1);
      const totalPagesForSheet = Math.max(1, Math.ceil(bodyRows.length / ROWS_PER_PAGE));

      for (let pageIdx = 0; pageIdx < totalPagesForSheet; pageIdx++) {
        const pageRows = bodyRows.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);

        // Build single page element
        const pageEl = document.createElement('div');
        pageEl.style.cssText = `
          width: ${pageWidthPx}px;
          min-height: ${pageHeightPx}px;
          background: #ffffff;
          padding: 40px 48px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1f2937;
          display: flex;
          flex-direction: column;
        `;

        // Sheet Header Badge (Clean & Professional)
        const headerEl = document.createElement('div');
        headerEl.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          margin-bottom: 16px;
          border-bottom: 1.5px solid #e2e8f0;
        `;
        headerEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #107c41; color: #ffffff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px;">EXCEL</span>
            <span style="font-size: 15px; font-weight: 700; color: #1e293b;">${escapeHtml(sheetName)}</span>
          </div>
          <span style="font-size: 11px; color: #64748b; font-weight: 500;">
            ${totalPagesForSheet > 1 ? `Page ${pageIdx + 1} of ${totalPagesForSheet}` : ''}
          </span>
        `;
        pageEl.appendChild(headerEl);

        // Table Element (Natural width, crisp Excel borders)
        const table = document.createElement('table');
        table.style.cssText = `
          border-collapse: collapse;
          width: auto;
          max-width: 100%;
          border: 1px solid #cbd5e1;
          font-size: 12px;
          border-radius: 4px;
          overflow: hidden;
        `;

        // Table Header
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        for (let c = 0; c < maxCols; c++) {
          const th = document.createElement('th');
          th.style.cssText = `
            background: #f1f5f9;
            color: #0f172a;
            font-weight: 700;
            font-size: 12px;
            padding: 9px 18px;
            border: 1px solid #cbd5e1;
            text-align: left;
            white-space: nowrap;
          `;
          th.textContent = String(headerRow[c] ?? '');
          trHead.appendChild(th);
        }
        thead.appendChild(trHead);
        table.appendChild(thead);

        // Table Body
        const tbody = document.createElement('tbody');
        pageRows.forEach((row, rIdx) => {
          const tr = document.createElement('tr');
          const isEven = rIdx % 2 === 0;
          for (let c = 0; c < maxCols; c++) {
            const td = document.createElement('td');
            const val = row[c] ?? '';
            const isNumeric = typeof val === 'number' || (!isNaN(Number(val)) && String(val).trim() !== '');

            td.style.cssText = `
              background: ${isEven ? '#ffffff' : '#f8fafc'};
              color: #334155;
              padding: 8px 18px;
              border: 1px solid #e2e8f0;
              font-size: 12px;
              text-align: ${isNumeric ? 'right' : 'left'};
              white-space: nowrap;
            `;
            td.textContent = String(val);
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        pageEl.appendChild(table);

        host.appendChild(pageEl);

        // Render page element to canvas
        const canvas = await html2canvas(pageEl, {
          scale: 2.2, // High resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: pageWidthPx,
          height: pageHeightPx,
        });

        // Clean up from DOM to free memory
        host.removeChild(pageEl);

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const orientation = isLandscape ? 'landscape' : 'portrait';

        if (!pdf) {
          pdf = new jsPDF({
            unit: 'px',
            format: [pageWidthPx, pageHeightPx],
            orientation,
            hotfixes: ['px_scaling'],
          });
        } else {
          pdf.addPage([pageWidthPx, pageHeightPx], orientation);
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthPx, pageHeightPx, undefined, 'FAST');

        const currentProg = Math.round(35 + (((si + 1) * (pageIdx + 1)) / (sheetNames.length * totalPagesForSheet)) * 60);
        onProgress?.(Math.min(96, currentProg));
        await new Promise((r) => setTimeout(r, 20));
      }
    }

    if (!pdf) {
      throw new Error('No readable data could be found in the Excel document.');
    }

    onProgress?.(98);
    const pdfBytes = pdf.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const outName = sanitizeFilename(`${base}.pdf`);
    const downloadUrl = URL.createObjectURL(pdfBlob);

    onProgress?.(100);

    return {
      blob: pdfBlob,
      downloadUrl,
      filename: outName,
      originalSize: file.size,
      processedSize: pdfBlob.size,
      savingsPercentage: 0,
      metadata: { sheets: sheetNames.length, source: 'xlsx' },
    };
  } finally {
    if (document.body.contains(host)) {
      document.body.removeChild(host);
    }
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// PDF TO WORD CONVERSION (ConvertAPI + Client Fallback)
// ==========================================

export async function convertPdfToWord(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  let currentProg = 15;
  onProgress?.(currentProg);
  const progTimer = setInterval(() => {
    if (currentProg < 88) {
      currentProg += Math.floor(Math.random() * 15) + 10;
      onProgress?.(Math.min(88, currentProg));
    }
  }, 250);

  // 1. Primary Engine: ConvertAPI (high-fidelity Word docx output)
  try {
    const fd = new FormData();
    fd.append('File', file, file.name);

    const res = await fetch('https://v2.convertapi.com/convert/pdf/to/docx?StoreFile=false', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONVERT_API_SECRET}`,
      },
      body: fd,
    });

    if (res.ok) {
      const data = await res.json();
      const fileObj = data.Files?.[0];

      if (fileObj) {
        let docxBlob: Blob;
        if (fileObj.FileData) {
          docxBlob = base64ToBlob(
            fileObj.FileData,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          );
        } else if (fileObj.Url) {
          const dlRes = await fetch(fileObj.Url);
          docxBlob = await dlRes.blob();
        } else {
          throw new Error('No valid file output returned by conversion engine');
        }

        clearInterval(progTimer);
        const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const outName = sanitizeFilename(`${base}.docx`);
        const downloadUrl = URL.createObjectURL(docxBlob);

        onProgress?.(100);

        return {
          blob: docxBlob,
          downloadUrl,
          filename: outName,
          originalSize: file.size,
          processedSize: docxBlob.size,
          savingsPercentage: 0,
          metadata: { engine: 'microsoft-word', quality: '100% editable' },
        };
      }
    } else {
      const errTxt = await res.text();
      console.warn('ConvertAPI PDF to Word returned error status:', res.status, errTxt);
    }
  } catch (apiErr) {
    console.warn('ConvertAPI request failed for PDF to Word, switching to local text extractor:', apiErr);
  } finally {
    clearInterval(progTimer);
  }

  // 2. Fallback Engine: In-browser text extraction to formatted Word document
  onProgress?.(50);
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapPacked: true,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let fullHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;padding:24px;">';

  for (let p = 1; p <= numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();
    
    // Group text items by vertical line (Y position) and sort horizontally (X position)
    const lineMap: Record<number, { x: number; text: string }[]> = {};
    for (const item of textContent.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const y = item.transform ? Math.round(item.transform[5] / 10) * 10 : 0;
      const x = item.transform ? Math.round(item.transform[4]) : 0;
      if (!lineMap[y]) lineMap[y] = [];
      lineMap[y].push({ x, text: item.str });
    }

    let pageText = `<div style="margin-bottom:30px;page-break-after:always;">`;
    const sortedYs = Object.keys(lineMap).map(Number).sort((a, b) => b - a);
    for (const y of sortedYs) {
      const lineItems = lineMap[y].sort((a, b) => a.x - b.x);
      const lineStr = lineItems.map((item) => escapeHtml(item.text)).join('&nbsp;&nbsp;');
      pageText += `<p style="margin:4px 0;line-height:1.5;">${lineStr}</p>`;
    }
    pageText += `</div>`;
    fullHtml += pageText;
    onProgress?.(50 + Math.round((p / numPages) * 45));
  }
  fullHtml += '</body></html>';

  const wordBlob = new Blob(['\ufeff' + fullHtml], {
    type: 'application/msword',
  });
  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}.doc`);
  const downloadUrl = URL.createObjectURL(wordBlob);

  onProgress?.(100);

  return {
    blob: wordBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: wordBlob.size,
    savingsPercentage: 0,
    metadata: { pages: numPages, fallback: true },
  };
}

// ==========================================
// PDF TO EXCEL CONVERSION (ConvertAPI + Client Fallback)
// ==========================================

export async function convertPdfToExcel(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(10);

  // 1. Primary Engine: ConvertAPI
  try {
    const fd = new FormData();
    fd.append('File', file, file.name);

    onProgress?.(30);

    const res = await fetch('https://v2.convertapi.com/convert/pdf/to/xlsx?StoreFile=false', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONVERT_API_SECRET}`,
      },
      body: fd,
    });

    if (res.ok) {
      onProgress?.(80);
      const data = await res.json();
      const fileObj = data.Files?.[0];

      if (fileObj) {
        let xlsxBlob: Blob;
        if (fileObj.Url) {
          const dlRes = await fetch(fileObj.Url);
          xlsxBlob = await dlRes.blob();
        } else if (fileObj.FileData) {
          xlsxBlob = base64ToBlob(
            fileObj.FileData,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          );
        } else {
          throw new Error('No valid file output returned by conversion engine');
        }

        const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const outName = sanitizeFilename(`${base}.xlsx`);
        const downloadUrl = URL.createObjectURL(xlsxBlob);

        onProgress?.(100);

        return {
          blob: xlsxBlob,
          downloadUrl,
          filename: outName,
          originalSize: file.size,
          processedSize: xlsxBlob.size,
          savingsPercentage: 0,
          metadata: { engine: 'microsoft-excel', quality: '100% spreadsheet' },
        };
      }
    } else {
      const errTxt = await res.text();
      console.warn('ConvertAPI PDF to Excel returned error status:', res.status, errTxt);
    }
  } catch (apiErr) {
    console.warn('ConvertAPI request failed for PDF to Excel, switching to local table extractor:', apiErr);
  }

  // 2. Fallback Engine: In-browser table extraction to SheetJS XLSX
  onProgress?.(50);
  const [{ utils, write }] = await Promise.all([import('xlsx')]);
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapPacked: true,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const rows: string[][] = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();

    const lineMap: Record<number, { x: number; text: string }[]> = {};
    for (const item of textContent.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const y = item.transform ? Math.round(item.transform[5] / 10) * 10 : 0;
      const x = item.transform ? Math.round(item.transform[4]) : 0;
      if (!lineMap[y]) lineMap[y] = [];
      lineMap[y].push({ x, text: item.str.trim() });
    }

    const sortedYs = Object.keys(lineMap).map(Number).sort((a, b) => b - a);
    for (const y of sortedYs) {
      const itemsInLine = lineMap[y].sort((a, b) => a.x - b.x);
      rows.push(itemsInLine.map((i) => i.text));
    }

    onProgress?.(50 + Math.round((p / numPages) * 45));
  }

  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet(rows.length > 0 ? rows : [['No tabular data found in PDF']]);
  utils.book_append_sheet(wb, ws, 'Extracted Data');
  const xlsxArray = write(wb, { type: 'array', bookType: 'xlsx' });
  const xlsxBlob = new Blob([xlsxArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}.xlsx`);
  const downloadUrl = URL.createObjectURL(xlsxBlob);

  onProgress?.(100);

  return {
    blob: xlsxBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: xlsxBlob.size,
    savingsPercentage: 0,
    metadata: { pages: numPages, fallback: true },
  };
}

/**
 * Rotate PDF pages by 90, 180, or 270 degrees
 */
export async function rotatePdfFile(
  file: File,
  options: { angle?: number } = {},
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(15);
  const arrayBuffer = await file.arrayBuffer();
  const angle = options.angle ?? 90;

  onProgress?.(40);
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = doc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + angle) % 360));
  }

  onProgress?.(80);
  const pdfBytes = await doc.save({ useObjectStreams: true });
  const finalBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}_rotated.pdf`);
  const downloadUrl = URL.createObjectURL(finalBlob);

  onProgress?.(100);

  return {
    blob: finalBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: finalBlob.size,
    savingsPercentage: 0,
    metadata: { pages: pages.length, rotation: angle },
  };
}

/**
 * Helper to parse hex color to pdf-lib rgb
 */
function hexToRgb(hex: string) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return rgb(r, g, b);
}

/**
 * Add text watermark to all PDF pages
 */
export async function addWatermarkToPdf(
  file: File,
  options: {
    text: string;
    fontSize?: number;
    opacity?: number;
    rotation?: number;
    color?: string;
  },
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(15);
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  const watermarkText = options.text || 'CONFIDENTIAL';
  const size = options.fontSize || 48;
  const opacity = options.opacity ?? 0.35;
  const angle = options.rotation ?? 45;
  const color = hexToRgb(options.color || '#ef4444');

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(watermarkText, size);
    const textHeight = font.heightAtSize(size);

    // Approximate center with rotation
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const x = width / 2 - (textWidth / 2) * cos + (textHeight / 2) * sin;
    const y = height / 2 - (textWidth / 2) * sin - (textHeight / 2) * cos;

    page.drawText(watermarkText, {
      x,
      y,
      size,
      font,
      color,
      rotate: degrees(angle),
      opacity,
    });

    onProgress?.(20 + Math.round(((i + 1) / pages.length) * 60));
  }

  const pdfBytes = await doc.save({ useObjectStreams: true });
  const finalBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}_watermarked.pdf`);
  const downloadUrl = URL.createObjectURL(finalBlob);

  onProgress?.(100);

  return {
    blob: finalBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: finalBlob.size,
    savingsPercentage: 0,
    metadata: { pages: pages.length, watermarkText },
  };
}

/**
 * Add page numbers to all PDF pages
 */
export async function addPageNumbersToPdf(
  file: File,
  options: {
    position?: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center';
    format?: 'Page X of Y' | 'X of Y' | 'Page X' | 'X';
    fontSize?: number;
    margin?: number;
  } = {},
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(15);
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;

  const position = options.position || 'bottom-center';
  const format = options.format || 'Page X of Y';
  const size = options.fontSize || 11;
  const margin = options.margin || 24;
  const textColor = rgb(0.25, 0.25, 0.25);

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const current = i + 1;

    let text = `Page ${current} of ${total}`;
    if (format === 'X of Y') text = `${current} of ${total}`;
    else if (format === 'Page X') text = `Page ${current}`;
    else if (format === 'X') text = `${current}`;

    const textWidth = font.widthOfTextAtSize(text, size);
    let x = width / 2 - textWidth / 2;
    let y = margin;

    if (position === 'bottom-right') {
      x = width - margin - textWidth;
      y = margin;
    } else if (position === 'bottom-left') {
      x = margin;
      y = margin;
    } else if (position === 'top-center') {
      x = width / 2 - textWidth / 2;
      y = height - margin - size;
    } else if (position === 'top-right') {
      x = width - margin - textWidth;
      y = height - margin - size;
    }

    page.drawText(text, {
      x,
      y,
      size,
      font,
      color: textColor,
    });

    onProgress?.(20 + Math.round(((i + 1) / total) * 60));
  }

  const pdfBytes = await doc.save({ useObjectStreams: true });
  const finalBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}_numbered.pdf`);
  const downloadUrl = URL.createObjectURL(finalBlob);

  onProgress?.(100);

  return {
    blob: finalBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: finalBlob.size,
    savingsPercentage: 0,
    metadata: { pages: total, style: format },
  };
}

/**
 * Remove specified pages from PDF
 */
export async function removePdfPages(
  file: File,
  options: { pagesToRemove: string },
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(15);
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();

  const toRemoveSet = new Set<number>();
  const parts = options.pagesToRemove.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [sStr, eStr] = part.split('-');
      const s = parseInt(sStr, 10);
      const e = parseInt(eStr, 10);
      if (!isNaN(s) && !isNaN(e)) {
        const from = Math.max(1, Math.min(s, e));
        const to = Math.min(totalPages, Math.max(s, e));
        for (let p = from; p <= to; p++) toRemoveSet.add(p - 1);
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        toRemoveSet.add(p - 1);
      }
    }
  }

  if (toRemoveSet.size === 0) {
    throw new Error('Please specify valid page numbers to remove.');
  }

  if (toRemoveSet.size >= totalPages) {
    throw new Error('Cannot remove all pages from the PDF document.');
  }

  // Remove pages in descending order so earlier indices remain valid
  const sortedToRemove = Array.from(toRemoveSet).sort((a, b) => b - a);
  for (const idx of sortedToRemove) {
    doc.removePage(idx);
  }

  onProgress?.(70);
  const pdfBytes = await doc.save({ useObjectStreams: true });
  const finalBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}_edited.pdf`);
  const downloadUrl = URL.createObjectURL(finalBlob);

  onProgress?.(100);

  return {
    blob: finalBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: finalBlob.size,
    savingsPercentage: 0,
    metadata: { remainingPages: doc.getPageCount(), removedCount: sortedToRemove.length },
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1] || res;
      resolve(base64);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Encrypt and protect PDF with password via ConvertAPI
 */
export async function protectPdfFile(
  file: File,
  options: { password: string },
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  if (!options.password) {
    throw new Error('Please specify a password to protect the PDF document.');
  }

  onProgress?.(20);
  const base64Data = await fileToBase64(file);
  const secret = 'mfSj1lSiIUJqPU8QoEMyA0aDF70hhpkp';

  onProgress?.(45);
  const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/encrypt?Secret=${secret}&StoreFile=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Parameters: [
        {
          Name: 'File',
          FileValue: {
            Name: file.name,
            Data: base64Data,
          },
        },
        {
          Name: 'UserPassword',
          Value: options.password,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to protect PDF: ${errorText || response.statusText}`);
  }

  onProgress?.(80);
  const json = await response.json();
  const fileUrl = json?.Files?.[0]?.Url;
  if (!fileUrl) {
    throw new Error('Encryption completed but no file URL was returned.');
  }

  const fileRes = await fetch(fileUrl);
  const protectedBlob = await fileRes.blob();

  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}_protected.pdf`);
  const downloadUrl = URL.createObjectURL(protectedBlob);

  onProgress?.(100);

  return {
    blob: protectedBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: protectedBlob.size,
    savingsPercentage: 0,
    metadata: { protected: true },
  };
}

/**
 * Decrypt and unlock PDF with password via ConvertAPI
 */
export async function unlockPdfFile(
  file: File,
  options: { password?: string } = {},
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(20);
  const base64Data = await fileToBase64(file);
  const secret = 'mfSj1lSiIUJqPU8QoEMyA0aDF70hhpkp';

  const parameters: any[] = [
    {
      Name: 'File',
      FileValue: {
        Name: file.name,
        Data: base64Data,
      },
    },
  ];

  if (options.password) {
    parameters.push({
      Name: 'Password',
      Value: options.password,
    });
  }

  onProgress?.(45);
  const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/decrypt?Secret=${secret}&StoreFile=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Parameters: parameters }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to unlock PDF: ${errorText || 'Incorrect password or unsupported file format'}`);
  }

  onProgress?.(80);
  const json = await response.json();
  const fileUrl = json?.Files?.[0]?.Url;
  if (!fileUrl) {
    throw new Error('Decryption completed but no file URL was returned.');
  }

  const fileRes = await fetch(fileUrl);
  const unlockedBlob = await fileRes.blob();

  const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const outName = sanitizeFilename(`${base}_unlocked.pdf`);
  const downloadUrl = URL.createObjectURL(unlockedBlob);

  onProgress?.(100);

  return {
    blob: unlockedBlob,
    downloadUrl,
    filename: outName,
    originalSize: file.size,
    processedSize: unlockedBlob.size,
    savingsPercentage: 0,
    metadata: { unlocked: true },
  };
}



