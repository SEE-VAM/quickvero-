const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

// Let's create an HTML page that runs the exact export logic from exportEditedPdf in real Chrome:
const pdfPath = 'C:\\Users\\sshin\\OneDrive\\Desktop\\1765191127042.pdf';
const pdfBase64 = fs.readFileSync(pdfPath).toString('base64');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const imgBuf = Buffer.from(data.img.replace(/^data:image\/png;base64,/, ''), 'base64');
      fs.writeFileSync('scratch/exported-page-crop.png', imgBuf);
      console.log('Saved scratch/exported-page-crop.png successfully!');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
      setTimeout(() => process.exit(0), 200);
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html>
<head>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
<canvas id="c"></canvas>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const base64 = "${pdfBase64}";
const binary = atob(base64);
const len = binary.length;
const bytes = new Uint8Array(len);
for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

pdfjsLib.getDocument({ data: bytes, cMapPacked: true }).promise.then(async (doc) => {
  const page = await doc.getPage(1);
  const scale = 2.0;
  const viewport = page.getViewport({ scale });
  const canvas = document.getElementById('c');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  const tc = await page.getTextContent();
  const target = tc.items.find(it => it.str && it.str.includes('ARVIND PRESS'));

  if (target) {
    const [vx, vy] = viewport.convertToViewportPoint(target.transform[4], target.transform[5]);
    const fontScaleY = Math.hypot(target.transform[2], target.transform[3]) || Math.hypot(target.transform[0], target.transform[1]);
    const pdfFontHeight = target.height > 0 ? target.height : fontScaleY;
    const scaledFontSize = Math.round(pdfFontHeight * scale); // 16px at scale 2.0
    const newText = "HNO 0257 NEAR ARVIND PRESS NAWADAA";

    ctx.font = "400 " + scaledFontSize + "px Arial, 'Helvetica Neue', Helvetica, sans-serif";
    const measuredWidth = ctx.measureText(newText).width;
    const fillWidth = Math.max(target.width * scale, measuredWidth) + 8;
    const baselineY = vy;

    // Erase original with pure white
    const ascent = scaledFontSize * 0.88;
    const descent = scaledFontSize * 0.28;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(vx - 2, baselineY - ascent, fillWidth, ascent + descent);

    // Draw new text
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(newText, vx, baselineY);

    // Crop just this section of the canvas to inspect closely:
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = 500;
    cropCanvas.height = 150;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, vx - 20, baselineY - 60, 500, 150, 0, 0, 500, 150);

    fetch('http://localhost:8998', {
      method: 'POST',
      body: JSON.stringify({ img: cropCanvas.toDataURL('image/png') })
    });
  }
});
</script>
</body>
</html>`);
});

server.listen(8998, () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  spawn(chromePath, ['--headless=new', '--disable-gpu', 'http://localhost:8998']);
});
