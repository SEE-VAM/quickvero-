const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const pdfPath = 'C:\\Users\\sshin\\OneDrive\\Desktop\\1765191127042.pdf';
const pdfBase64 = fs.readFileSync(pdfPath).toString('base64');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const imgBuf = Buffer.from(data.img.replace(/^data:image\/png;base64,/, ''), 'base64');
      fs.writeFileSync('scratch/workspace-preview-crop.png', imgBuf);
      console.log('Saved scratch/workspace-preview-crop.png successfully!');
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
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 20px; background: #222; }
  #container { position: relative; background: #fff; display: inline-block; }
  canvas { display: block; }
  .text-box {
    position: absolute;
    display: flex;
    align-items: center;
    background-color: #ffffff;
    box-shadow: 0 0 0 1.5px #ffffff;
    cursor: text;
    white-space: nowrap;
    overflow: visible;
  }
</style>
</head>
<body>
<div id="container">
  <canvas id="c"></canvas>
  <div id="overlay" style="position: absolute; inset: 0;"></div>
</div>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const base64 = "${pdfBase64}";
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
  const target = tc.items.find(it => it.str && it.str.includes('ARVIND PRESS'));

  if (target) {
    const [vx, vy] = viewport.convertToViewportPoint(target.transform[4], target.transform[5]);
    const fontScaleY = Math.hypot(target.transform[2], target.transform[3]) || Math.hypot(target.transform[0], target.transform[1]);
    const pdfFontHeight = target.height > 0 ? target.height : fontScaleY;
    const fontHeight = pdfFontHeight * scale;
    const itemHeight = Math.max(fontHeight * 0.96, 12);
    const itemTop = Math.max(0, vy - fontHeight * 0.80);

    const xPercent = (vx / viewport.width) * 100;
    const yPercent = (itemTop / viewport.height) * 100;
    const heightPercent = (itemHeight / viewport.height) * 100;

    const div = document.createElement('div');
    div.className = 'text-box';
    div.style.left = xPercent + '%';
    div.style.top = yPercent + '%';
    div.style.height = heightPercent + '%';
    div.style.fontSize = Number(fontHeight.toFixed(1)) + 'px';
    div.style.fontFamily = "Arial, 'Helvetica Neue', Helvetica, sans-serif";
    div.style.color = '#000000';
    div.style.fontWeight = '400';
    
    // Exact span
    div.innerHTML = '<span style="line-height:1;padding:0;margin:0;display:block;">HNO 0257 NEAR ARVIND PRESS NAWADAA</span>';
    overlay.appendChild(div);

    // Let's capture crop of this container using html2canvas or drawImage
    setTimeout(() => {
      const crop = document.createElement('canvas');
      crop.width = 450;
      crop.height = 120;
      const cCtx = crop.getContext('2d');
      // Draw canvas background
      cCtx.drawImage(canvas, vx - 20, vy - 50, 450, 120, 0, 0, 450, 120);

      // Now draw whiteout over line 4 and new text in the crop to see what div looks like:
      const divRect = div.getBoundingClientRect();
      const contRect = document.getElementById('container').getBoundingClientRect();
      const divX = divRect.left - contRect.left;
      const divY = divRect.top - contRect.top;

      // Draw overlay box
      cCtx.fillStyle = '#ffffff';
      cCtx.fillRect(divX - (vx - 20) - 1.5, divY - (vy - 50) - 1.5, divRect.width + 3, divRect.height + 3);

      cCtx.font = "400 " + Number(fontHeight.toFixed(1)) + "px Arial, 'Helvetica Neue', Helvetica, sans-serif";
      cCtx.fillStyle = '#000000';
      cCtx.textBaseline = 'alphabetic';
      cCtx.fillText('HNO 0257 NEAR ARVIND PRESS NAWADAA', divX - (vx - 20), vy - (vy - 50));

      fetch('http://localhost:8997', {
        method: 'POST',
        body: JSON.stringify({ img: crop.toDataURL('image/png') })
      });
    }, 100);
  }
});
</script>
</body>
</html>`);
});

server.listen(8997, () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  spawn(chromePath, ['--headless=new', '--disable-gpu', 'http://localhost:8997']);
});
