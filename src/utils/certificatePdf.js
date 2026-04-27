import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// JPEG, not PNG — pdfkit's PNG support trips on 8-bit colormap (indexed) images
// like the source certificate background; the JPEG re-encode embeds reliably.
const BG_PATH = path.resolve(__dirname, '../assets/certificate-background.jpg');

function formatCertificateDate(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  if (isNaN(date.getTime())) return '';
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}

// Mirrors the frontend Certificate.tsx layout: full-page background image with
// student name, course name, and date overlaid at the same percentage offsets.
export default function generateCertificatePdf({ studentName, courseName, completionDate }) {
  return new Promise((resolve, reject) => {
    try {
      // Read the background ourselves rather than letting pdfkit resolve a
      // path — bundlers / containerized runtimes can resolve __dirname to
      // the wrong location, and pdfkit silently swallows the error, leaving
      // the stream empty (which then attaches as zero-byte to the email).
      if (!fs.existsSync(BG_PATH)) {
        return reject(new Error(`Certificate background not found at ${BG_PATH}`));
      }
      const bgBuffer = fs.readFileSync(BG_PATH);

      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (!buf.length) {
          return reject(new Error('Certificate PDF stream produced 0 bytes'));
        }
        resolve(buf.toString('base64'));
      });
      doc.on('error', reject);

      const pageW = doc.page.width;   // 595.28 pt (A4)
      const pageH = doc.page.height;  // 841.89 pt (A4)

      // Background fills the page
      doc.image(bgBuffer, 0, 0, { width: pageW, height: pageH });

      // Student name — italic bold, sits on the first underline
      doc.font('Times-BoldItalic').fontSize(22).fillColor('#222222');
      doc.text(studentName || '', 0, pageH * 0.475, {
        width: pageW,
        align: 'center',
      });

      // Course name — bold, sits on the second underline
      doc.font('Times-Bold').fontSize(19).fillColor('#222222');
      doc.text(courseName || '', 0, pageH * 0.635, {
        width: pageW,
        align: 'center',
      });

      // Date — sits on the underline next to the baked-in "DATE" label
      doc.font('Times-Bold').fontSize(11).fillColor('#222222');
      doc.text(formatCertificateDate(completionDate), pageW * 0.135, pageH * 0.965, {
        lineBreak: false,
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
