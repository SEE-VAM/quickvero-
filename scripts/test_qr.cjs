const QRCode = require('qrcode');

const sampleStr = 'https://www.quickvero.in/menu?d=' + 'A'.repeat(2500);
console.log('Testing length:', sampleStr.length);
QRCode.toDataURL(sampleStr, { errorCorrectionLevel: 'L' }, (err, res) => {
  if (err) console.error('Error:', err.message);
  else console.log('Success with length:', res.length);
});
