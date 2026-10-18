const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function checkFontMap() {
  const data = new Uint8Array(fs.readFileSync('C:/Users/sshin/OneDrive/Desktop/1765191127042.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page = await doc.getPage(1);

  // We need to run getOperatorList to populate commonObjs!
  const opList = await page.getOperatorList();
  console.log('Operator list items count:', opList.fnArray.length);

  const textContent = await page.getTextContent();
  const fontNames = [...new Set(textContent.items.map(it => it.fontName))];
  console.log('Unique font names in textContent:', fontNames);

  for (const fn of fontNames) {
    console.log(`\nChecking font: ${fn}`);
    console.log('page.commonObjs.has:', page.commonObjs.has(fn));
    if (page.commonObjs.has(fn)) {
      const data = await new Promise(res => page.commonObjs.get(fn, res));
      console.log('commonObjs.get data:', {
        name: data?.name,
        loadedName: data?.loadedName,
        fontFamily: data?.fontFamily,
        type: data?.type,
        fallbackName: data?.fallbackName,
        isBold: data?.black || data?.bold,
        dataLength: data?.data?.length
      });
    }
  }
}

checkFontMap().catch(console.error);
