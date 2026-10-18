// Let's test standard Arial character widths vs PDF width:
const text = "HNO 0257 NEAR ARVIND PRESS NAWADA";
const pdfWidth = 238.6;
const fontSize = 12;
console.log('PDF text width:', pdfWidth);
console.log('Length:', text.length);
console.log('Avg char width:', pdfWidth / text.length);
