// ===============================================
// CERTIFICATE GENERATOR - Downloadable PDF
// Creates a branded CodeHerWay completion certificate
// Uses jsPDF (client-side, no server needed)
// ===============================================

// jsPDF is lazy-imported on demand (391KB - only needed when downloading)

// Color palette
const COLORS = {
  bgDeep: [8, 8, 15],
  bgDark: [15, 15, 26],
  bgCard: [20, 20, 37],
  pink: [255, 107, 157],
  cyan: [78, 205, 196],
  amber: [255, 167, 38],
  purple: [179, 136, 255],
  text: [224, 224, 236],
  textDim: [136, 136, 168],
  textMuted: [90, 90, 122],
  white: [255, 255, 255],
};

const COURSE_COLORS = {
  html: COLORS.pink,
  css: COLORS.cyan,
  js: COLORS.amber,
  react: COLORS.purple,
};

export async function generateCertificate({ studentName, courseName, courseId, lessonCount, completionDate }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const W = 297; // A4 landscape width
  const H = 210; // A4 landscape height
  const accent = COURSE_COLORS[courseId] || COLORS.pink;

  // --- Background -----------------------------
  doc.setFillColor(...COLORS.bgDeep);
  doc.rect(0, 0, W, H, 'F');

  // Inner card background
  doc.setFillColor(...COLORS.bgDark);
  roundedRect(doc, 15, 15, W - 30, H - 30, 4);

  // --- Decorative border ----------------------
  // Outer glow border
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.8);
  roundedRectStroke(doc, 20, 20, W - 40, H - 40, 3);

  // Inner subtle border
  doc.setDrawColor(...COLORS.textMuted);
  doc.setLineWidth(0.3);
  roundedRectStroke(doc, 24, 24, W - 48, H - 48, 2);

  // --- Corner accents -------------------------
  doc.setDrawColor(...accent);
  doc.setLineWidth(1.2);
  const cornerLen = 12;
  // Top-left
  doc.line(20, 32, 20, 32 - cornerLen);
  doc.line(20, 20, 20 + cornerLen, 20);
  // Top-right
  doc.line(W - 20, 20, W - 20 - cornerLen, 20);
  doc.line(W - 20, 20, W - 20, 20 + cornerLen);
  // Bottom-left
  doc.line(20, H - 20, 20, H - 20 - cornerLen);
  doc.line(20, H - 20, 20 + cornerLen, H - 20);
  // Bottom-right
  doc.line(W - 20, H - 20, W - 20 - cornerLen, H - 20);
  doc.line(W - 20, H - 20, W - 20, H - 20 - cornerLen);

  // --- Top brand ------------------------------
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('*', W / 2 - 12, 38, { align: 'center' });
  doc.setTextColor(...accent);
  doc.setFont('courier', 'bold');
  doc.text('<Code>Her</Way>', W / 2 + 1, 38, { align: 'center' });

  // --- Certificate of Completion --------------
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('CERTIFICATE OF COMPLETION', W / 2, 52, { align: 'center' });

  // Decorative line under title
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 40, 56, W / 2 + 40, 56);

  // --- Course Name ----------------------------
  doc.setFontSize(28);
  doc.setTextColor(...accent);
  doc.setFont('courier', 'bold');
  doc.text(courseName, W / 2, 74, { align: 'center' });

  // --- "Awarded to" ---------------------------
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textDim);
  doc.setFont('helvetica', 'normal');
  doc.text('Awarded to', W / 2, 88, { align: 'center' });

  // --- Student Name ---------------------------
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(studentName || 'Learner', W / 2, 102, { align: 'center' });

  // Name underline
  const nameWidth = doc.getTextWidth(studentName || 'Learner');
  doc.setDrawColor(...COLORS.textMuted);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - nameWidth / 2 - 5, 105, W / 2 + nameWidth / 2 + 5, 105);

  // --- Description ----------------------------
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textDim);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `has successfully completed all ${lessonCount} lessons`,
    W / 2, 118, { align: 'center' }
  );
  doc.text(
    `in the ${courseName} course on CodeHerWay.`,
    W / 2, 125, { align: 'center' }
  );

  // --- Skills summary line --------------------
  const skillsText = getSkillsSummary(courseId);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(skillsText, W / 2, 135, { align: 'center' });

  // --- Bottom section -------------------------
  // Date
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textDim);
  doc.setFont('helvetica', 'normal');
  doc.text('Date of Completion', W / 2 - 55, 158, { align: 'center' });
  doc.setTextColor(...COLORS.white);
  doc.setFont('courier', 'bold');
  doc.text(completionDate, W / 2 - 55, 166, { align: 'center' });

  // Verification ID
  const verifyId = generateVerifyId(studentName, courseId);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.textDim);
  doc.setFont('helvetica', 'normal');
  doc.text('Certificate ID', W / 2 + 55, 158, { align: 'center' });
  doc.setTextColor(...COLORS.white);
  doc.setFont('courier', 'bold');
  doc.text(verifyId, W / 2 + 55, 166, { align: 'center' });

  // --- Footer ---------------------------------
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'CodeHerWay.com  *  Where women code, lead, and rewrite the future of tech',
    W / 2, H - 28, { align: 'center' }
  );

  // --- Accent dots (decorative) ---------------
  doc.setFillColor(...accent);
  doc.circle(W / 2 - 50, 56, 1, 'F');
  doc.circle(W / 2 + 50, 56, 1, 'F');
  doc.circle(W / 2 - 30, 148, 0.8, 'F');
  doc.circle(W / 2 + 30, 148, 0.8, 'F');

  // --- Save -----------------------------------
  const fileName = `CodeHerWay-${courseName.replace(/\s+/g, '-')}-Certificate.pdf`;
  doc.save(fileName);
}

// --- Helpers -------------------------------------

function roundedRect(doc, x, y, w, h, r) {
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

function roundedRectStroke(doc, x, y, w, h, r) {
  doc.roundedRect(x, y, w, h, r, r, 'S');
}

function generateVerifyId(name, courseId) {
  const hash = (name || 'user').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const now = Date.now().toString(36).slice(-4).toUpperCase();
  const prefix = courseId?.toUpperCase().slice(0, 3) || 'CHW';
  return `${prefix}-${hash.toString(16).toUpperCase().padStart(4, '0')}-${now}`;
}

function getSkillsSummary(courseId) {
  switch (courseId) {
    case 'html':
      return 'Skills: Document Structure * Semantic HTML * Forms * Accessibility * SEO';
    case 'css':
      return 'Skills: Selectors * Box Model * Flexbox * Grid * Responsive Design * Animations';
    case 'js':
      return 'Skills: DOM Manipulation * Async/Await * Functions * Arrays * Objects * APIs';
    case 'react':
      return 'Skills: Components * Hooks * State Management * Routing * Data Fetching * Deployment';
    default:
      return 'Skills: Web Development Fundamentals';
  }
}



