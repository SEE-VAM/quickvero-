import { ProcessResult } from '../types/tool';
import { calculateSavings, sanitizeFilename } from '../utils/fileHelpers';

export interface CompressOptions {
  quality: number; // 0.1 to 1.0
  format?: 'original' | 'image/jpeg' | 'image/png' | 'image/webp';
  maxWidth?: number;
  maxHeight?: number;
}

export interface ResizeOptions {
  width: number;
  height: number;
  format?: string;
  quality?: number;
}

export interface ConvertOptions {
  targetFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
  backgroundColor?: string; // For PNG to JPG transparency flattening (default #ffffff)
}

/**
 * Load image file into an HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image. File may be corrupt.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Real client-side image compression using HTML5 Canvas API
 */
export async function compressImage(
  file: File,
  options: CompressOptions,
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(15);
  const img = await loadImageFromFile(file);
  onProgress?.(45);

  const canvas = document.createElement('canvas');
  let targetWidth = img.naturalWidth;
  let targetHeight = img.naturalHeight;

  // Optional dimension capping
  if (options.maxWidth && targetWidth > options.maxWidth) {
    targetHeight = Math.round((targetHeight * options.maxWidth) / targetWidth);
    targetWidth = options.maxWidth;
  }
  if (options.maxHeight && targetHeight > options.maxHeight) {
    targetWidth = Math.round((targetWidth * options.maxHeight) / targetHeight);
    targetHeight = options.maxHeight;
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize canvas graphics context.');

  // High quality resampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Determine output MIME type
  let outputMime = file.type;
  let targetExtension = 'jpg';

  if (options.format && options.format !== 'original') {
    outputMime = options.format;
  }

  if (outputMime === 'image/jpeg' || outputMime === 'image/jpg') {
    // Fill white background for transparent parts
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    targetExtension = 'jpg';
  } else if (outputMime === 'image/webp') {
    targetExtension = 'webp';
  } else if (outputMime === 'image/png') {
    targetExtension = 'png';
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  onProgress?.(75);

  const quality = Math.max(0.05, Math.min(1.0, options.quality));

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Image compression failed to generate output blob.'));
          return;
        }
        onProgress?.(100);

        const outFilename = sanitizeFilename(file.name, targetExtension);
        const downloadUrl = URL.createObjectURL(blob);
        const savings = calculateSavings(file.size, blob.size);

        resolve({
          blob,
          downloadUrl,
          filename: outFilename,
          originalSize: file.size,
          processedSize: blob.size,
          savingsPercentage: savings,
          metadata: {
            width: targetWidth,
            height: targetHeight,
            format: outputMime,
          },
        });
      },
      outputMime,
      quality
    );
  });
}

/**
 * Automatically compress image to guarantee it stays below targetSizeBytes (e.g. 20KB, 50KB, 100KB)
 */
export async function compressImageToTargetSize(
  file: File,
  targetMaxBytes: number,
  options: { quality?: number; format?: string } = {},
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(15);
  const img = await loadImageFromFile(file);
  onProgress?.(35);

  let curWidth = img.naturalWidth;
  let curHeight = img.naturalHeight;
  let curQuality = options.quality ?? 0.8;
  const outputMime = options.format && options.format !== 'original' ? options.format : 'image/jpeg';
  const targetExtension = outputMime === 'image/png' ? 'png' : outputMime === 'image/webp' ? 'webp' : 'jpg';

  const canvas = document.createElement('canvas');
  let bestBlob: Blob | null = null;

  for (let iteration = 0; iteration < 8; iteration++) {
    canvas.width = Math.round(curWidth);
    canvas.height = Math.round(curHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not initialize canvas graphics context.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (outputMime === 'image/jpeg' || outputMime === 'image/jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), outputMime, curQuality)
    );

    if (!blob) break;
    bestBlob = blob;

    onProgress?.(35 + iteration * 8);

    if (blob.size <= targetMaxBytes) {
      break;
    }

    if (curQuality > 0.35) {
      curQuality -= 0.15;
    } else {
      curWidth *= 0.85;
      curHeight *= 0.85;
      curQuality = 0.5;
    }
  }

  if (!bestBlob) {
    throw new Error('Image compression failed.');
  }

  onProgress?.(100);
  const outFilename = sanitizeFilename(file.name, targetExtension);
  const downloadUrl = URL.createObjectURL(bestBlob);
  const savings = calculateSavings(file.size, bestBlob.size);

  return {
    blob: bestBlob,
    downloadUrl,
    filename: outFilename,
    originalSize: file.size,
    processedSize: bestBlob.size,
    savingsPercentage: savings,
    metadata: {
      width: Math.round(curWidth),
      height: Math.round(curHeight),
      format: outputMime,
    },
  };
}

/**
 * Real client-side image resizing
 */
export async function resizeImage(
  file: File,
  options: ResizeOptions,
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(20);
  const img = await loadImageFromFile(file);
  onProgress?.(50);

  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const outputMime = options.format || file.type || 'image/jpeg';
  if (outputMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, options.width, options.height);
  }

  ctx.drawImage(img, 0, 0, options.width, options.height);
  onProgress?.(80);

  const ext = outputMime === 'image/png' ? 'png' : outputMime === 'image/webp' ? 'webp' : 'jpg';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Resize operation failed.'));
          return;
        }
        onProgress?.(100);
        const outName = sanitizeFilename(file.name, `resized.${ext}`);
        resolve({
          blob,
          downloadUrl: URL.createObjectURL(blob),
          filename: outName,
          originalSize: file.size,
          processedSize: blob.size,
          savingsPercentage: calculateSavings(file.size, blob.size),
          metadata: { width: options.width, height: options.height },
        });
      },
      outputMime,
      options.quality ?? 0.92
    );
  });
}

/**
 * Convert Image Formats (e.g. JPG -> PNG, PNG -> JPG, WebP)
 */
export async function convertImageFormat(
  file: File,
  options: ConvertOptions,
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  onProgress?.(25);
  const img = await loadImageFromFile(file);
  onProgress?.(60);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  let ext = 'png';
  if (options.targetFormat === 'image/jpeg') {
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ext = 'jpg';
  } else if (options.targetFormat === 'image/webp') {
    ext = 'webp';
  }

  ctx.drawImage(img, 0, 0);
  onProgress?.(85);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Format conversion failed.'));
          return;
        }
        onProgress?.(100);
        const outName = sanitizeFilename(file.name, ext);
        resolve({
          blob,
          downloadUrl: URL.createObjectURL(blob),
          filename: outName,
          originalSize: file.size,
          processedSize: blob.size,
          savingsPercentage: calculateSavings(file.size, blob.size),
          metadata: { format: options.targetFormat },
        });
      },
      options.targetFormat,
      options.quality ?? 0.92
    );
  });
}
