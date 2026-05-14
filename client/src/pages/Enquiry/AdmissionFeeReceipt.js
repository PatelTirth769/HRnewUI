import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import schoolLogo from '../../assets/images/SSVLOGO.png';

/**
 * Convert number to words (reused from FeeReceiptTemplate)
 */
export const numberToWords = (num) => {
    const a = [
        '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN',
        'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
    ];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' CRORE ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' LAKH ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' THOUSAND ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' HUNDRED ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'AND ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' RUPEES ONLY';
};

/**
 * Generate a professional admission fee receipt PDF
 * @param {Object} data - Payment/receipt data
 * @param {string} data.receipt_no - Receipt number
 * @param {string} data.student_name - Student full name
 * @param {string} data.registration_no - Registration number
 * @param {string} data.admission_no - Admission number (if applicable)
 * @param {string} data.program - Program / Class
 * @param {string} data.academic_year - Academic year
 * @param {string} data.fee_type - Registration / Admission
 * @param {string} data.fee_name - Fee description
 * @param {number} data.amount - Amount paid
 * @param {string} data.payment_mode - ONLINE / CASH / CHEQUE
 * @param {string} data.payment_id - Transaction / Payment ID
 * @param {string} data.receipt_date - Payment date
 * @param {string} data.parent_name - Parent / Guardian name
 * @param {string} data.parent_mobile - Contact number
 */
const getOptimizedLogoUrl = async (src) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 120, 120);
            ctx.drawImage(img, 0, 0, 120, 120);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(src);
        img.src = src;
    });
};

export const generateAdmissionReceipt = async (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ─── HEADER BACKGROUND ───
    doc.setFillColor(30, 58, 138); // Deep blue
    doc.rect(0, 0, pageWidth, 45, 'F');

    // School Logo - Downscaled via canvas to prevent uncompressed 32MB raw PDF payloads
    try {
        const optimizedLogo = await getOptimizedLogoUrl(schoolLogo);
        const format = optimizedLogo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(optimizedLogo, format, 15, 8, 28, 28, undefined, 'FAST');
    } catch (e) {
        console.warn('Could not add logo to PDF:', e);
    }

    // School Name & Info
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SSV CAMPUS - CBSE', 50, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sector-3B, Gandhinagar | Phone: +91 76220 11101', 50, 30);
    doc.setFontSize(9);
    doc.text('ssvcampus.gandhinagar@gmail.com | www.ssvschool.edu.in', 50, 37);

    // ─── TITLE ───
    let y = 58;
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 48, pageWidth, 18, 'F');
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const feeTypeLabel = (data.fee_type || 'ADMISSION').toUpperCase();
    doc.text(`${feeTypeLabel} FEE PAYMENT RECEIPT`, pageWidth / 2, y, { align: 'center' });

    // ─── RECEIPT META ───
    y = 75;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);

    // Receipt info box - left
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, y - 5, 85, 30, 3, 3, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Receipt No:', 20, y + 3);
    doc.text('Date:', 20, y + 14);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(data.receipt_no || 'N/A', 20, y + 9);
    doc.setFontSize(10);
    const receiptDate = data.receipt_date
        ? new Date(data.receipt_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.text(receiptDate, 20, y + 20);

    // Receipt info box - right
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(110, y - 5, 85, 30, 3, 3, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Fee Type:', 115, y + 3);
    doc.text('Academic Year:', 115, y + 14);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${data.fee_type || 'Admission'} Fee`, 115, y + 9);
    doc.text(data.academic_year || '2025-2026', 115, y + 20);

    // ─── STUDENT DETAILS TABLE ───
    y = 112;
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT DETAILS', 15, y);
    doc.setLineWidth(0.5);
    doc.setDrawColor(30, 58, 138);
    doc.line(15, y + 2, pageWidth - 15, y + 2);

    const studentDetails = [
        ['Student Name', (data.student_name || 'N/A').toUpperCase()],
        ['Registration No', data.registration_no || 'N/A'],
        ['Program / Class', data.program || 'N/A'],
        ['Parent / Guardian', data.parent_name || 'N/A'],
        ['Contact Number', data.parent_mobile || 'N/A'],
    ];

    if (data.admission_no && data.admission_no !== '' && data.admission_no !== 'N/A') {
        studentDetails.splice(2, 0, ['Admission No', data.admission_no]);
    }

    autoTable(doc, {
        startY: y + 5,
        head: [],
        body: studentDetails,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3, lineColor: [226, 232, 240] },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 55, textColor: [71, 85, 105] },
            1: { fontStyle: 'bold', textColor: [15, 23, 42] }
        },
        margin: { left: 15, right: 15 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    // ─── FEE BREAKDOWN TABLE ───
    let afterStudentY = doc.lastAutoTable.finalY + 12;
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FEE DETAILS', 15, afterStudentY);
    doc.setLineWidth(0.5);
    doc.line(15, afterStudentY + 2, pageWidth - 15, afterStudentY + 2);

    const amount = parseFloat(data.amount) || 0;

    autoTable(doc, {
        startY: afterStudentY + 5,
        head: [['Description', 'Amount (INR)']],
        body: [
            [data.fee_name || `${data.fee_type || 'Admission'} Fee`, `INR ${amount.toLocaleString('en-IN')}`]
        ],
        foot: [['Grand Total', `INR ${amount.toLocaleString('en-IN')}`]],
        theme: 'grid',
        styles: { fontSize: 11, cellPadding: 6 },
        headStyles: {
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
            fontStyle: 'bold',
            fontSize: 10
        },
        footStyles: {
            fillColor: [30, 58, 138],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11
        },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 15, right: 15 }
    });

    // ─── PAYMENT DETAILS BOX ───
    let afterFeeY = doc.lastAutoTable.finalY + 10;
    
    // Ensure we have enough space for the payment box and the footer without running off the page
    const pageHeight = doc.internal.pageSize.getHeight();
    if (afterFeeY + 55 > pageHeight) {
        doc.addPage();
        afterFeeY = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, afterFeeY, pageWidth - 30, 34, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, afterFeeY, pageWidth - 30, 34, 3, 3, 'S');

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Mode:', 20, afterFeeY + 9);
    doc.text('Transaction ID:', 20, afterFeeY + 18);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const paymentModeDisplay = (data.payment_mode || 'ONLINE').toUpperCase() === 'ONLINE'
        ? 'ONLINE PAYMENT (Razorpay)'
        : (data.payment_mode || '').toUpperCase();
    doc.text(paymentModeDisplay, 60, afterFeeY + 9);
    doc.text(data.payment_id || data.manual_receipt_ref || 'N/A', 60, afterFeeY + 18);

    // Amount in words
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bolditalic');
    doc.text(`Amount in Words: ${numberToWords(Math.round(amount))}`, 20, afterFeeY + 28);

    // ─── FOOTER ───
    // Beautifully spaced below the box, guaranteed to be inside printable margins
    const footerY = Math.min(afterFeeY + 44, pageHeight - 20);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('* This is a computer generated receipt.', 15, footerY);
    doc.text('* Signature not required.', 15, footerY + 5);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 15, footerY + 10);

    // Signature line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 75, footerY, pageWidth - 15, footerY);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signatory', pageWidth - 60, footerY + 6);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('SSV CAMPUS - CBSE', pageWidth - 58, footerY + 11);

    // Save
    const fileName = `${feeTypeLabel}_Fee_Receipt_${data.receipt_no || 'receipt'}.pdf`;
    doc.save(fileName);
};

export default generateAdmissionReceipt;
