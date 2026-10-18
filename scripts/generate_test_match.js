import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pdfPath = 'C:\\Users\\sshin\\OneDrive\\Desktop\\1765191127042.pdf';
const pdfBytes = fs.readFileSync(pdfPath).toString('base64');

// We want to test different font families and stylings:
// 1) "g_d0_f3", 'Helvetica Neue', Helvetica, Arial, sans-serif
// 2) 'Arial', 'Helvetica Neue', sans-serif
// 3) 'Helvetica Neue', Arial, sans-serif
// 4) With letter spacing adjustments, font size adjustments, etc.

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<style>
  body { margin: 0; padding: 20px; background: #333; font-family: sans-serif; color: #fff; }
  .canvas-wrap { position: relative; display: inline-block; background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
  canvas { display: block; }
  .overlay { position: absolute; inset: 0; pointer-events: none; }
  .edited-box {
    position: absolute;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    background-color: #ffffff;
    box-shadow: 0 0 0 1.5px #ffffff;
    line-height: 1;
    white-space: nowrap;
  }
</style>
</head>
<body>
<h1>Testing PDF Text Match</h1>
<div class="canvas-wrap" id="wrap">
  <canvas id="c"></canvas>
  <div class="overlay" id="overlay"></div>
</div>

<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const base64 = "${pdfBytes}";
const binary = atob(base64);
const len = binary.length;
const bytes = new Uint8Array(len);
for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

pdfjsLib.getDocument({ data: bytes, cMapPacked: true }).promise.then(async (doc) => {
  const page = await doc.getPage(1);
  const scale = 1.5;
  const viewport = page.getViewport({ scale });
  const canvas = document.getElementById('c');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  const tc = await page.getTextContent();
  const overlay = document.getElementById('overlay');

  // Let's inspect font faces loaded in document.fonts:
  const loadedFonts = [];
  document.fonts.forEach(f => loadedFonts.push({ family: f.family, status: f.status }));
  console.log('Document loaded fonts:', JSON.stringify(loadedFonts));

  // Find line 4: HNO 0257 NEAR ARVIND PRESS NAWADA
  for (let i = 0; i < tc.items.length; i++) {
    const item = tc.items[i];
    if (item.str && item.str.includes('ARVIND PRESS')) {
      console.log('Target item found:', item);
      const [vx, vy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
      const fontScaleY = Math.hypot(item.transform[2], item.transform[3]) || Math.hypot(item.transform[0], item.transform[1]);
      const pdfFontHeight = item.height > 0 ? item.height : fontScaleY;
      const fontHeight = pdfFontHeight * scale;
      const itemWidth = Math.max(item.width * scale * 1.02, 12);
      const itemHeight = Math.max(fontHeight * 0.96, 12);
      const itemTop = Math.max(0, vy - fontHeight * 0.80);

      const xPercent = (vx / viewport.width) * 100;
      const yPercent = (itemTop / viewport.height) * 100;

      // Create edited replacement box:
      const div = document.createElement('div');
      div.className = 'edited-box';
      div.style.left = xPercent + '%';
      div.style.top = yPercent + '%';
      div.style.height = (itemHeight / viewport.height * 100) + '%';
      div.style.fontSize = fontHeight.toFixed(1) + 'px';
      div.style.fontFamily = '"' + item.fontName + '", Arial, "Helvetica Neue", Helvetica, sans-serif';
      div.style.color = '#000000';
      div.innerHTML = '<span style="padding:0;margin:0;line-height:1;">HNO 0257 NEAR ARVIND PRESS NAWADAA</span>';
      overlay.appendChild(div);

      // Measure character widths and compare
      const span = div.querySelector('span');
      console.log('Original PDF item.width * scale:', item.width * scale);
      console.log('Rendered span offsetWidth:', span.offsetWidth);
      console.log('Rendered font used:', div.style.fontFamily);
      break;
    }
  }

  document.body.setAttribute('data-done', 'true');
});
</script>
</body>
</html>`;

if (!fs.existsSync('scratch')) fs.mkdirSync('scratch');
fs.writeFileSync('scratch/test-font-match.html', html);
console.log('Written scratch/test-font-match.html');
