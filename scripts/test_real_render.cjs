const fs = require('fs');
const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

function sampleColors(ctx, x, y, w, h) {
  try {
    const startX = Math.max(0, Math.min(ctx.canvas.width - 2, Math.round(x)));
    const startY = Math.max(0, Math.min(ctx.canvas.height - 2, Math.round(y)));
    const sampleW = Math.max(2, Math.min(ctx.canvas.width - startX, Math.round(Math.min(w, 80))));
    const sampleH = Math.max(2, Math.min(ctx.canvas.height - startY, Math.round(Math.min(h, 40))));

    const imgData = ctx.getImageData(startX, startY, sampleW, sampleH).data;

    const bins = new Map();
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

    let maxCount = -1;
    let bgBin = null;
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

    const toHex = (c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0');

    let backgroundColor = '#ffffff';
    if (bgBrightness < 220 || bgR < 205 || bgG < 205 || bgB < 205) {
      backgroundColor = `#${toHex(bgR)}${toHex(bgG)}${toHex(bgB)}`;
    }

    let fgMaxCount = -1;
    let fgBin = null;

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

    return { textColor, backgroundColor, bgBrightness, bgR, bgG, bgB };
  } catch (err) {
    return { textColor: '#000000', backgroundColor: '#ffffff', error: err.message };
  }
}

async function renderAndSample() {
  const data = new Uint8Array(fs.readFileSync('C:/Users/sshin/OneDrive/Desktop/1765191127042.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const scale = 1.5;
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  const textContent = await page.getTextContent();
  for (const it of textContent.items) {
    if (it.str && (it.str.includes('SAURAV') || it.str.includes('ARVIND') || it.str.includes('Statement'))) {
      const [vx, vy] = viewport.convertToViewportPoint(it.transform[4], it.transform[5]);
      const fontScaleY = Math.hypot(it.transform[2], it.transform[3]) || Math.hypot(it.transform[0], it.transform[1]);
      const fontHeight = (it.height > 0 ? it.height : fontScaleY) * scale;
      const itemWidth = Math.max(it.width * scale * 1.02, 12);

      const colors = sampleColors(ctx, vx, vy - fontHeight * 0.78, itemWidth, fontHeight);
      console.log(`Text: "${it.str}"`);
      console.log(` - Pos: vx=${Math.round(vx)}, vy=${Math.round(vy)}, w=${Math.round(itemWidth)}, h=${Math.round(fontHeight)}`);
      console.log(` - Colors:`, colors);
    }
  }
}

renderAndSample().catch(console.error);
