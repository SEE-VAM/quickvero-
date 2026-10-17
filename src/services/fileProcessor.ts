import { jsPDF } from 'jspdf';
import { ProcessResult } from '../types/tool';
import { sanitizeFilename } from '../utils/fileHelpers';
import { loadImageFromFile } from './imageProcessor';

/**
 * Generate cryptographic hash for any file or text using Web Crypto API
 */
export async function generateFileHash(
  fileOrText: File | string,
  algorithm: 'SHA-256' | 'SHA-512' | 'SHA-1' = 'SHA-256'
): Promise<string> {
  let buffer: ArrayBuffer;

  if (typeof fileOrText === 'string') {
    const encoder = new TextEncoder();
    buffer = encoder.encode(fileOrText).buffer;
  } else {
    buffer = await fileOrText.arrayBuffer();
  }

  const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Convert file to Base64 String and Data URI
 */
export function fileToBase64(file: File): Promise<{ base64: string; dataUri: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      const base64 = dataUri.split(',')[1] || '';
      resolve({ base64, dataUri });
    };
    reader.onerror = () => reject(new Error('Failed to read file as Base64.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert Base64 string to downloadable Blob
 */
export function base64ToBlob(base64Data: string, mimeType: string = 'application/octet-stream'): Blob {
  // Remove data URL prefix if present
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const byteCharacters = atob(cleanBase64.trim());
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Real in-browser conversion of single or multiple images to a multi-page PDF using jsPDF
 */
export async function convertImagesToPdf(
  files: File[],
  orientation: 'auto' | 'p' | 'l' = 'auto',
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  if (!files || files.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  let pdf: jsPDF | null = null;
  const totalFiles = files.length;
  let totalOriginalSize = 0;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    totalOriginalSize += file.size;

    const startPct = Math.round((i / totalFiles) * 85);
    onProgress?.(startPct + 5);

    const img = await loadImageFromFile(file);
    const imgWidth = img.naturalWidth || img.width || 800;
    const imgHeight = img.naturalHeight || img.height || 600;

    let pageOrientation: 'p' | 'l' = 'p';
    if (orientation === 'auto') {
      pageOrientation = imgWidth > imgHeight ? 'l' : 'p';
    } else {
      pageOrientation = orientation;
    }

    if (i === 0) {
      pdf = new jsPDF({
        orientation: pageOrientation,
        unit: 'pt',
        format: 'a4',
      });
    } else {
      pdf!.addPage('a4', pageOrientation);
    }

    const pageWidth = pdf!.internal.pageSize.getWidth();
    const pageHeight = pdf!.internal.pageSize.getHeight();

    // Scale image to fit within margins
    const margin = 20;
    const maxW = pageWidth - margin * 2;
    const maxH = pageHeight - margin * 2;

    let renderW = maxW;
    let renderH = (imgHeight * renderW) / imgWidth;

    if (renderH > maxH) {
      renderH = maxH;
      renderW = (imgWidth * renderH) / imgHeight;
    }

    const posX = (pageWidth - renderW) / 2;
    const posY = (pageHeight - renderH) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      pdf!.addImage(dataUrl, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
    } else {
      pdf!.addImage(img, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
    }
  }

  onProgress?.(92);
  const pdfBlob = pdf!.output('blob');
  onProgress?.(100);

  const outName = files.length === 1
    ? sanitizeFilename(files[0].name, 'pdf')
    : `quickvero-converted-${files.length}-pages.pdf`;

  return {
    blob: pdfBlob,
    downloadUrl: URL.createObjectURL(pdfBlob),
    filename: outName,
    originalSize: totalOriginalSize,
    processedSize: pdfBlob.size,
    savingsPercentage: 0,
    metadata: {
      totalPages: totalFiles,
      pages: totalFiles,
      orientation,
    },
  };
}

/**
 * Real in-browser JPG to PDF conversion using jsPDF
 */
export async function convertImageToPdf(
  file: File,
  orientation: 'auto' | 'p' | 'l' = 'auto',
  onProgress?: (percent: number) => void
): Promise<ProcessResult> {
  return convertImagesToPdf([file], orientation, onProgress);
}

/**
 * File size & download time calculation utility
 */
export interface BandwidthCalculation {
  bytes: number;
  kb: number;
  mb: number;
  gb: number;
  tb: number;
  downloadTimes: {
    gigabitFiber: string; // 1000 Mbps
    broadband100M: string; // 100 Mbps
    fiveG: string;        // 300 Mbps
    fourGLte: string;     // 25 Mbps
    dsl10M: string;       // 10 Mbps
  };
}

export function calculateBandwidthEstimates(bytes: number): BandwidthCalculation {
  const formatTime = (seconds: number): string => {
    if (seconds < 1) return '< 1 second';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} sec`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours} hr ${mins} min`;
  };

  const bits = bytes * 8;
  return {
    bytes,
    kb: bytes / 1024,
    mb: bytes / (1024 * 1024),
    gb: bytes / (1024 * 1024 * 1024),
    tb: bytes / (1024 * 1024 * 1024 * 1024),
    downloadTimes: {
      gigabitFiber: formatTime(bits / (1000 * 1000 * 1000)),
      fiveG: formatTime(bits / (300 * 1000 * 1000)),
      broadband100M: formatTime(bits / (100 * 1000 * 1000)),
      fourGLte: formatTime(bits / (25 * 1000 * 1000)),
      dsl10M: formatTime(bits / (10 * 1000 * 1000)),
    },
  };
}
