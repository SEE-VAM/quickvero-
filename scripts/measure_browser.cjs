const http = require('http');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log('EXACT_MEASUREMENTS_FROM_CHROME:');
      console.log(JSON.parse(body));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
      setTimeout(() => process.exit(0), 100);
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 0; }
  .t { font-size: 11.98125px; line-height: 1; display: inline-block; white-space: pre; }
  .arial { font-family: Arial, sans-serif; }
  .helv { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; }
</style>
</head>
<body>
<div id="m1" class="t arial">SHIVAM SAURAV</div>
<div id="m2" class="t arial">HNO 0257 NEAR ARVIND PRESS NAWADA</div>
<div id="m3" class="t helv">SHIVAM SAURAV</div>
<div id="m4" class="t helv">HNO 0257 NEAR ARVIND PRESS NAWADA</div>
<script>
window.onload = () => {
  const data = {
    pdf_saurav_width: 65.03297583206407 * 1.5,
    pdf_arvind_width: 159.06470716483096 * 1.5,
    arial_saurav: document.getElementById('m1').getBoundingClientRect().width,
    arial_arvind: document.getElementById('m2').getBoundingClientRect().width,
    helv_saurav: document.getElementById('m3').getBoundingClientRect().width,
    helv_arvind: document.getElementById('m4').getBoundingClientRect().width,
  };
  fetch('http://localhost:8999', {
    method: 'POST',
    body: JSON.stringify(data, null, 2)
  });
};
</script>
</body>
</html>`);
});

server.listen(8999, () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  spawn(chromePath, ['--headless=new', '--disable-gpu', 'http://localhost:8999']);
});
