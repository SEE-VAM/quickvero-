import fs from 'fs';
import path from 'path';

const pdfPath = 'C:\\Users\\sshin\\OneDrive\\Desktop\\1765191127042.pdf';
const pdfBytes = fs.readFileSync(pdfPath).toString('base64');

const html = `<!DOCTYPE html>
<html>
<head>
<script src="../node_modules/pdfjs-dist/build/pdf.js"></script>
<style>
body { margin: 0; padding: 0; background: #eee; }
#wrap { position: relative; width: 1063px; height: 1262px; background: #fff; }
canvas { position: absolute; left: 0; top: 0; }
.box { position: absolute; border: 1.5px solid red; background: rgba(0,0,255,0.15); font-size: 10px; color: blue; pointer-events: none; box-sizing: border-box; }
</style>
</head>
<body>
<div id="wrap">
  <canvas id="c"></canvas>
  <div id="overlay"></div>
</div>
<script>
const base64 = "${pdfBytes}";
const binary = atob(base64);
const len = binary.length;
const bytes = new Uint8Array(len);
for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

pdfjsLib.GlobalWorkerOptions.workerSrc = '../node_modules/pdfjs-dist/build/pdf.worker.js';

pdfjsLib.getDocument({ data: bytes, cMapPacked: true }).promise.then(async (doc) => {
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.getElementById('c');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  
  const tc = await page.getTextContent();
  const overlay = document.getElementById('overlay');
  
  for (let i = 0; i < tc.items.length; i++) {
    const item = tc.items[i];
    if (!item.str || !item.str.trim()) continue;
    const [vx, vy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
    const fontHeight = Math.hypot(item.transform[0], item.transform[1]) * 1.5;
    const itemWidth = Math.max(item.width * 1.5 * 1.02, 12);
    const itemHeight = Math.max(fontHeight * 1.10, 13);
    const itemTop = Math.max(0, vy - fontHeight * 0.82);
    
    const div = document.createElement('div');
    div.className = 'box';
    div.style.left = (vx / viewport.width * 100) + '%';
    div.style.top = (itemTop / viewport.height * 100) + '%';
    div.style.width = (itemWidth / viewport.width * 100) + '%';
    div.style.height = (itemHeight / viewport.height * 100) + '%';
    overlay.appendChild(div);
  }
  document.body.setAttribute('data-done', 'true');
});
</script>
</body>
</html>`;

if (!fs.existsSync('scratch')) fs.mkdirSync('scratch');
fs.writeFileSync('scratch/test-render.html', html);
console.log('Successfully generated scratch/test-render.html');
