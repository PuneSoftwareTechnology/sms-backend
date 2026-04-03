import PDFDocument from 'pdfkit';
import sharp from 'sharp';

const INSTITUTE_CONFIG = {
  PST: {
    name: 'Pune Software Technologies',
    shortName: 'PST',
    address: '',
    authorizedBy: 'Autorized - Pune Software Technologies',
    headerColor: '#1a3c7a',
    headerColorRgb: [26, 60, 122],
    logo: 'https://www.punesoftwaretechnologies.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FLogo.a02dd24f.png&w=64&q=75',
  },
  TCH: {
    name: 'TCH Software Services LLP',
    shortName: 'TCH',
    address: 'Office -305, Royal Tranquil, Konkane Chowck, Pune - 411027',
    authorizedBy: 'Autorized - Tech Concept Hub',
    headerColor: '#4a1a8a',
    headerColorRgb: [74, 26, 138],
    logo: 'https://media2.dev.to/dynamic/image/width=320,height=320,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Fuser%2Fprofile_image%2F2662376%2Fe53bb90e-9bba-4bd7-af12-a7cbc862e9d6.png',
  },
};

// --- Helper functions (mirrored from frontend) ---

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(n) {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function numberToWords(num) {
  if (num === 0) return 'Zero Rupees only';
  let n = Math.abs(Math.floor(num));
  let words = '';
  if (n >= 10000000) { words += twoDigitWords(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
  if (n >= 100000) { words += twoDigitWords(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
  if (n >= 1000) { words += twoDigitWords(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
  if (n >= 100) { words += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
  if (n > 0) words += twoDigitWords(n) + ' ';
  return words.trim() + ' Rupees only';
}

function generateReceiptNumber(enrollmentId, installmentDate) {
  const date = installmentDate ? new Date(installmentDate) : new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = (fyStart + 1) % 100;
  const idPart = enrollmentId.slice(0, 8).toUpperCase();
  return `FY${fyStart}-${fyEnd.toString().padStart(2, '0')}-${idPart}`;
}

function formatReceiptDate(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  if (isNaN(date.getTime())) return '';
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}

function formatINR(amount) {
  return 'Rs.' + Number(amount).toLocaleString('en-IN');
}

// --- Receipt HTML (matches frontend PaymentReceipt.tsx exactly) ---

export function generateReceiptHtml(data) {
  const config = INSTITUTE_CONFIG[data.institute] || INSTITUTE_CONFIG.PST;
  const receiptNo = generateReceiptNumber(data.enrollmentId, data.installmentDate);
  const receiptDate = formatReceiptDate(data.installmentDate);
  const amountInWords = numberToWords(data.amountReceived);
  const dueColor = data.pendingAmount > 0 ? '#c0392b' : '#27ae60';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background: #f4f4f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  </style>
</head>
<body>
  <div style="width:210mm;min-height:297mm;padding:20mm;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;font-size:14px;color:#222;background:#fff;box-sizing:border-box;margin:0 auto;">
    <div style="border:2px solid #333;padding:0;">

      <!-- Header -->
      <div style="padding:20px 30px;">
        <table style="border-collapse:collapse;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;padding-right:16px;">
              <img src="${config.logo}" alt="${config.shortName}" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:contain;" />
            </td>
            <td style="vertical-align:middle;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:${config.headerColor};">${config.name}</h1>
              ${config.address ? `<p style="margin:4px 0 0;font-size:13px;color:#444;">${config.address}</p>` : ''}
            </td>
          </tr>
        </table>
      </div>

      <!-- Title -->
      <div style="text-align:center;padding:10px 0 16px;">
        <h2 style="margin:0;font-size:20px;font-weight:700;color:#d35400;">Payment Receipt</h2>
      </div>

      <!-- Separator -->
      <hr style="margin:0 20px;border:none;border-top:1.5px solid #333;">

      <!-- Receipt Info -->
      <div style="padding:16px 30px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-weight:600;width:140px;">Receipt No</td>
            <td style="padding:6px 0;">${receiptNo}</td>
            <td style="padding:6px 0;text-align:right;font-weight:600;">Date&nbsp;&nbsp;${receiptDate}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Student Name</td>
            <td style="padding:6px 0;" colspan="2">${data.studentName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Course Name</td>
            <td style="padding:6px 0;" colspan="2">${data.courseName}</td>
          </tr>
        </table>
      </div>

      <!-- Separator -->
      <hr style="margin:0 20px;border:none;border-top:1.5px solid #333;">

      <!-- Fee Details -->
      <div style="padding:16px 30px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;font-weight:600;">Training Fees</td>
            <td style="padding:10px 0;text-align:right;font-weight:600;">${formatINR(data.totalFee)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:600;">Amount Received</td>
            <td style="padding:10px 0;text-align:right;font-weight:600;color:#27ae60;">${formatINR(data.amountReceived)}</td>
          </tr>
          <tr>
            <td style="padding:14px 0 10px;font-weight:700;font-size:15px;">Total Amount Due</td>
            <td style="padding:14px 0 10px;text-align:right;font-weight:700;font-size:15px;color:${dueColor};">${formatINR(data.pendingAmount)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:10px 0;font-weight:600;">
              Amount received in word&nbsp;&nbsp;&nbsp;&nbsp;<span style="font-weight:400;">${amountInWords}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Separator -->
      <hr style="margin:0 20px;border:none;border-top:1px solid #999;">

      <!-- Mode of Payment & Signature -->
      <div style="padding:16px 30px 24px;">
        <p style="margin:0 0 30px;font-weight:600;">Mode of Payment: ${data.paymentMode || 'Cash / UPI / Cheque / Bank Transfer Transaction'}</p>
        <div style="text-align:right;margin-top:20px;">
          <p style="margin:0 0 4px;font-weight:600;">Received By</p>
          <p style="margin:0;font-size:13px;color:#555;">${config.authorizedBy}</p>
        </div>
      </div>

      <!-- Terms and Conditions -->
      <div style="border-top:2px solid #333;padding:16px 30px;background:#fafafa;">
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;text-decoration:underline;">Terms and Conditions</h3>
        <ol style="margin:0;padding-left:16px;font-size:12px;line-height:1.7;color:#444;">
          <li>Fees once paid are non-refundable under any circumstances.</li>
          <li>Fees once paid are non-transferable to any other student or course.</li>
          <li>Course change is subject to institute approval and availability.</li>
          <li>The institute reserves the right to change batch timings or faculty if required.</li>
        </ol>
      </div>

    </div>
  </div>
</body>
</html>`;
}

// --- PDF generation via pdfkit ---

async function fetchImageBuffer(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // Convert any format (webp, etc.) to PNG for pdfkit compatibility
  return sharp(buffer).png().toBuffer();
}

export default function generateReceiptPdf(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const config = INSTITUTE_CONFIG[data.institute] || INSTITUTE_CONFIG.PST;
      const receiptNo = generateReceiptNumber(data.enrollmentId, data.installmentDate);
      const receiptDate = formatReceiptDate(data.installmentDate);
      const amountInWords = numberToWords(data.amountReceived);

      // Fetch logo image
      let logoBuffer = null;
      try {
        logoBuffer = await fetchImageBuffer(config.logo);
      } catch (e) {
        // Continue without logo if fetch fails
      }

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer.toString('base64'));
      });
      doc.on('error', reject);

      const pageW = doc.page.width;
      const marginL = 50;
      const marginR = 50;
      const contentW = pageW - marginL - marginR;

      // ── Outer border ──
      doc.rect(marginL - 10, 40, contentW + 20, 700).stroke('#333333');

      // ── Header ──
      const [r, g, b] = config.headerColorRgb;
      let headerTextX = marginL;

      if (logoBuffer) {
        doc.image(logoBuffer, marginL, 55, { width: 50, height: 50 });
        headerTextX = marginL + 60;
      }

      doc.fontSize(20).fillColor([r, g, b]).font('Helvetica-Bold')
        .text(config.name, headerTextX, 60, { width: contentW - (headerTextX - marginL) });

      if (config.address) {
        doc.fontSize(10).fillColor('#444444').font('Helvetica')
          .text(config.address, headerTextX, doc.y + 4, { width: contentW - (headerTextX - marginL) });
      }

      // ── Title ──
      doc.moveDown(1);
      doc.fontSize(18).fillColor('#d35400').font('Helvetica-Bold')
        .text('Payment Receipt', marginL, doc.y, { width: contentW, align: 'center' });

      // ── Separator ──
      const sep1Y = doc.y + 10;
      doc.moveTo(marginL, sep1Y).lineTo(pageW - marginR, sep1Y).lineWidth(1.5).stroke('#333333');

      // ── Receipt info ──
      let y = sep1Y + 16;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#222222');

      doc.text('Receipt No', marginL, y);
      doc.font('Helvetica').text(receiptNo, marginL + 120, y);
      doc.font('Helvetica-Bold').text(`Date  ${receiptDate}`, marginL, y, { width: contentW, align: 'right' });

      y += 24;
      doc.font('Helvetica-Bold').text('Student Name', marginL, y);
      doc.font('Helvetica').text(data.studentName, marginL + 120, y);

      y += 24;
      doc.font('Helvetica-Bold').text('Course Name', marginL, y);
      doc.font('Helvetica').text(data.courseName, marginL + 120, y);

      // ── Separator ──
      y += 30;
      doc.moveTo(marginL, y).lineTo(pageW - marginR, y).lineWidth(1.5).stroke('#333333');

      // ── Fee details ──
      y += 16;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#222222');

      doc.text('Training Fees', marginL, y);
      doc.text(formatINR(data.totalFee), marginL, y, { width: contentW, align: 'right' });

      y += 28;
      doc.text('Amount Received', marginL, y);
      doc.fillColor('#27ae60').text(formatINR(data.amountReceived), marginL, y, { width: contentW, align: 'right' });

      y += 28;
      doc.fontSize(12).fillColor('#222222').text('Total Amount Due', marginL, y);
      const dueColor = data.pendingAmount > 0 ? '#c0392b' : '#27ae60';
      doc.fillColor(dueColor).text(formatINR(data.pendingAmount), marginL, y, { width: contentW, align: 'right' });

      y += 28;
      doc.fontSize(11).fillColor('#222222').font('Helvetica-Bold')
        .text('Amount received in word    ', marginL, y, { continued: true })
        .font('Helvetica').text(amountInWords);

      // ── Separator ──
      y = doc.y + 16;
      doc.moveTo(marginL, y).lineTo(pageW - marginR, y).lineWidth(0.75).stroke('#999999');

      // ── Mode of payment & signature ──
      y += 16;
      const modeLabel = data.paymentMode || 'Cash / UPI / Cheque / Bank Transfer Transaction';
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#222222')
        .text(`Mode of Payment: ${modeLabel}`, marginL, y);

      y += 40;
      doc.font('Helvetica-Bold').text('Received By', marginL, y, { width: contentW, align: 'right' });
      y += 14;
      doc.font('Helvetica').fontSize(10).fillColor('#555555')
        .text(config.authorizedBy, marginL, y, { width: contentW, align: 'right' });

      // ── Terms & Conditions ──
      y += 30;
      doc.moveTo(marginL - 10, y).lineTo(pageW - marginR + 10, y).lineWidth(1.5).stroke('#333333');

      y += 14;
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#222222')
        .text('Terms and Conditions', marginL, y);

      y += 20;
      const terms = [
        'Fees once paid are non-refundable under any circumstances.',
        'Fees once paid are non-transferable to any other student or course.',
        'Course change is subject to institute approval and availability.',
        'The institute reserves the right to change batch timings or faculty if required.',
      ];
      doc.font('Helvetica').fontSize(9).fillColor('#444444');
      terms.forEach((term, i) => {
        doc.text(`${i + 1}. ${term}`, marginL + 4, y, { width: contentW - 8 });
        y = doc.y + 4;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
