const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function testPdf(pdfPath) {
  console.log('Testing PDF:', pdfPath);
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log('Num pages:', doc.numPages);

  const page = await doc.getPage(1);
  const textContent = await page.getTextContent();
  const styles = textContent.styles;
  console.log('\nStyles (fonts defined in page):', JSON.stringify(styles, null, 2));

  console.log('\nText items in page:');
  for (let i = 0; i < textContent.items.length; i++) {
    const it = textContent.items[i];
    if (it.str && (it.str.includes('SAURAV') || it.str.includes('ARVIND') || it.str.includes('NAWADA') || it.str.includes('Statement'))) {
      const style = styles[it.fontName];
      console.log(`- "${it.str}" | fontName: ${it.fontName} | style: ${JSON.stringify(style)} | transform: ${JSON.stringify(it.transform)} | width: ${it.width} | height: ${it.height}`);
    }
  }
}

testPdf('C:/Users/sshin/OneDrive/Desktop/1765191127042.pdf').catch(console.error);
