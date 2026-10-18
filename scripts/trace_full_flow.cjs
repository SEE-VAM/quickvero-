const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

function normalizeFontFamily(rawFontName, rawFamily, _charWidthRatio) {
  const cleanName = rawFontName.includes('+') ? rawFontName.split('+')[1] : rawFontName;
  const combined = `${cleanName} ${rawFontName} ${rawFamily || ''}`.toLowerCase();

  let isBold = false;
  let fontWeight = 400;

  if (
    combined.includes('black') ||
    combined.includes('heavy') ||
    combined.includes('extrabold') ||
    combined.includes('ultrabold') ||
    combined.includes('900') ||
    combined.includes('800')
  ) {
    isBold = true;
    fontWeight = 800;
  } else if (
    combined.includes('bold') ||
    combined.includes('700') ||
    /\bbd\b|-bd\b|_bd\b/i.test(combined) ||
    /bold/i.test(rawFamily || '')
  ) {
    isBold = true;
    fontWeight = 700;
  } else if (
    combined.includes('semibold') ||
    combined.includes('demibold') ||
    combined.includes('600')
  ) {
    isBold = true;
    fontWeight = 600;
  } else if (
    combined.includes('medium') ||
    combined.includes('500')
  ) {
    fontWeight = 500;
  } else if (
    combined.includes('light') ||
    combined.includes('thin') ||
    combined.includes('hairline') ||
    combined.includes('300') ||
    combined.includes('200')
  ) {
    fontWeight = 300;
  } else {
    fontWeight = 400;
  }

  const isItalic =
    combined.includes('italic') ||
    combined.includes('oblique') ||
    combined.includes('slant') ||
    /\bital\b|\bit\b|-it\b|_it\b/i.test(combined) ||
    /italic|oblique/i.test(rawFamily || '');

  const isMonoName =
    combined.includes('courier') ||
    combined.includes('consolas') ||
    combined.includes('menlo') ||
    combined.includes('inconsolata') ||
    combined.includes('typewriter') ||
    combined.includes('ocr') ||
    combined.includes('lineprinter') ||
    combined.includes('draft') ||
    /\bmono\b|monospace/i.test(combined) ||
    rawFamily?.toLowerCase() === 'monospace';

  if (isMonoName) {
    return {
      fontFamily: "'Courier New', 'Courier', 'Lucida Console', monospace",
      fontWeight: isBold ? 700 : fontWeight,
      isBold,
      isItalic,
    };
  }

  if (
    (combined.includes('serif') && !combined.includes('sans')) ||
    combined.includes('times') ||
    combined.includes('georgia') ||
    combined.includes('cambria') ||
    combined.includes('garamond') ||
    combined.includes('baskerville') ||
    combined.includes('palatino') ||
    combined.includes('minion') ||
    combined.includes('merriweather') ||
    combined.includes('caslon') ||
    combined.includes('bookman') ||
    combined.includes('century') ||
    combined.includes('antiqua') ||
    combined.includes('didot') ||
    combined.includes('bodoni') ||
    combined.includes('roman') ||
    combined.includes('tmsrmn') ||
    combined.includes('liberation serif') ||
    combined.includes('nimbus rom') ||
    rawFamily?.toLowerCase() === 'serif'
  ) {
    let fam = "'Times New Roman', 'Times', 'Liberation Serif', serif";
    return {
      fontFamily: fam,
      fontWeight: isBold ? 700 : fontWeight,
      isBold,
      isItalic,
    };
  }

  let sansFam = "'Arial', 'Helvetica Neue', Helvetica, sans-serif";
  if (combined.includes('calibri')) sansFam = "'Calibri', 'Arial', sans-serif";
  else if (combined.includes('aptos')) sansFam = "'Aptos', 'Calibri', 'Arial', sans-serif";
  else if (combined.includes('roboto')) sansFam = "'Roboto', 'Segoe UI', 'Arial', sans-serif";
  else if (combined.includes('segoe')) sansFam = "'Segoe UI', 'Arial', sans-serif";
  else if (combined.includes('tahoma')) sansFam = "'Tahoma', 'Arial', sans-serif";
  else if (combined.includes('verdana')) sansFam = "'Verdana', 'Arial', sans-serif";
  else if (combined.includes('trebuchet')) sansFam = "'Trebuchet MS', 'Arial', sans-serif";
  else if (combined.includes('helvetica')) sansFam = "'Helvetica Neue', Helvetica, Arial, sans-serif";

  return {
    fontFamily: sansFam,
    fontWeight: isBold ? 700 : fontWeight,
    isBold,
    isItalic,
  };
}

async function trace() {
  const data = new Uint8Array(fs.readFileSync('C:/Users/sshin/OneDrive/Desktop/1765191127042.pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const textContent = await page.getTextContent();
  const scale = 1.5;
  const viewport = page.getViewport({ scale });

  // Map fonts from commonObjs
  const opList = await page.getOperatorList();
  const fontMap = new Map();
  for (const it of textContent.items) {
    if (it.fontName && !fontMap.has(it.fontName)) {
      if (page.commonObjs.has(it.fontName)) {
        const fontData = await new Promise(r => page.commonObjs.get(it.fontName, r));
        fontMap.set(it.fontName, fontData);
      }
    }
  }

  for (const it of textContent.items) {
    if (it.str && (it.str.includes('SAURAV') || it.str.includes('ARVIND') || it.str.includes('Statement'))) {
      let rawFontName = it.fontName;
      const fontObj = fontMap.get(it.fontName);
      if (fontObj?.name) {
        rawFontName = fontObj.name;
      }
      const style = textContent.styles[it.fontName];
      const fontScaleY = Math.hypot(it.transform[2], it.transform[3]) || Math.hypot(it.transform[0], it.transform[1]);
      const pdfFontHeight = it.height > 0 ? it.height : fontScaleY;
      const fontHeight = pdfFontHeight * scale;
      const charWidthRatio = it.str.length > 0 ? (it.width / it.str.length) / pdfFontHeight : undefined;

      const analysis = normalizeFontFamily(rawFontName, style?.fontFamily, charWidthRatio);

      console.log(`\n======================================================`);
      console.log(`Text: "${it.str}"`);
      console.log(`fontName from PDF: ${it.fontName}`);
      console.log(`rawFontName resolved: ${rawFontName}`);
      console.log(`analysis.fontFamily: ${analysis.fontFamily}`);
      console.log(`analysis.fontWeight: ${analysis.fontWeight}`);
      console.log(`analysis.isBold: ${analysis.isBold}`);
      console.log(`fontSize (fontHeight): ${Math.round(fontHeight)}px (raw fontHeight = ${fontHeight.toFixed(2)})`);
      console.log(`pdfFontHeight: ${pdfFontHeight}`);
      console.log(`width: ${(it.width * scale).toFixed(1)}px (char avg width: ${(it.width * scale / it.str.length).toFixed(1)}px)`);
    }
  }
}

trace().catch(console.error);
