const fs = require('fs');

const buf = fs.readFileSync('C:/Users/sshin/OneDrive/Desktop/1765191127042.pdf');
const str = buf.toString('latin1');

// Search for /BaseFont in the PDF
const regex = /\/BaseFont\s*\/([^\s\/\>]+)/g;
let match;
const fonts = new Set();
while ((match = regex.exec(str)) !== null) {
  fonts.add(match[1]);
}
console.log('All BaseFonts found in the PDF:');
fonts.forEach(f => console.log(' -', f));

// Also search for /FontName
const regex2 = /\/FontName\s*\/([^\s\/\>]+)/g;
while ((match = regex2.exec(str)) !== null) {
  fonts.add(match[1]);
}
console.log('\nAll FontNames found:');
fonts.forEach(f => console.log(' -', f));

// Search for /Font << ... >> in page 1
console.log('\nPage 1 Font dictionary search:');
const p1Match = str.match(/\/Resources\s*<<[\s\S]*?\/Font\s*<<([\s\S]*?)>>/);
if (p1Match) {
  console.log(p1Match[1]);
}
