import React, { forwardRef } from 'react';
import ssvLogo from '../../assets/images/SSVLOGO.png';

// Convert number to words
export const numberToWords = (num) => {
    const a = [
        '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN',
        'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
    ];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' CRORE ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' LAKH ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' THOUSAND ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' HUNDRED ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'AND ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' RUPEES ONLY';
};

const FeeReceiptTemplate = forwardRef(({ receiptData, schoolData }, ref) => {
    if (!receiptData) return null;

    const {
        enrollmentNo = 'N/A',
        studentName = 'Unknown',
        courseName = 'N/A',
        semester = 'N/A',
        receiptDate = new Date().toLocaleDateString(),
        receiptNo = 'N/A',
        amount = 0,
        feeName = 'TUITION FEES',
        paymentMode = 'ONLINE PAYMENT',
        transactionNo = 'N/A',
    } = receiptData;

    const {
        schoolName = 'SSV CAMPUS - CBSE',
        address = 'Sector-3B, Gandhinagar',
        contact = 'Phone: +91 76220 11101',
        email = 'ssvcampus.gandhinagar@gmail.com',
        website = 'www.ssvschool.edu.in'
    } = schoolData || {};

    return (
        <div ref={ref} style={{ padding: '30px', width: '700px', margin: '0 auto', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#000000' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ width: '100px', marginRight: '20px' }}>
                    <img src={ssvLogo} alt="School Logo" style={{ width: '100%', height: 'auto' }} />
                </div>
                <div style={{ flex: '1' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a', margin: '0', textTransform: 'uppercase' }}>{schoolName}</h1>
                    <p style={{ fontSize: '14px', color: '#4b5563', margin: '5px 0' }}>{address}</p>
                    <p style={{ fontSize: '14px', color: '#4b5563', margin: '0' }}>{contact} | {email} | <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>{website}</span></p>
                </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '1px' }}>Fees Payment Receipt</h2>
            </div>

            {/* Content Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '8px 0', width: '20%', fontWeight: 'bold', color: '#4b5563' }}>Receipt No:</td>
                        <td style={{ padding: '8px 0', width: '30%', fontWeight: 'bold' }}>{receiptNo}</td>
                        <td style={{ padding: '8px 0', width: '20%', fontWeight: 'bold', color: '#4b5563' }}>Date:</td>
                        <td style={{ padding: '8px 0', width: '30%', fontWeight: 'bold' }}>{receiptDate}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Student ID:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{enrollmentNo}</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Class:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{courseName}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Student Name:</td>
                        <td colSpan="3" style={{ padding: '8px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>{studentName}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Semester/Year:</td>
                        <td colSpan="3" style={{ padding: '8px 0', fontWeight: 'bold' }}>{semester}</td>
                    </tr>
                </tbody>
            </table>

            {/* Fees Breakdown */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontSize: '14px', textTransform: 'uppercase' }}>Description</th>
                        <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #e5e7eb', fontSize: '14px', textTransform: 'uppercase', width: '150px' }}>Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ padding: '15px 12px', border: '1px solid #e5e7eb', fontWeight: '500' }}>{feeName}</td>
                        <td style={{ padding: '15px 12px', textAlign: 'right', border: '1px solid #e5e7eb', fontWeight: 'bold', fontSize: '16px' }}>{amount.toLocaleString('en-IN')}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase' }}>Grand Total</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px', color: '#1e3a8a' }}>₹ {amount.toLocaleString('en-IN')}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Payment Details */}
            <div style={{ marginBottom: '40px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}><span style={{ fontWeight: 'bold', color: '#475569' }}>Payment Mode:</span> {paymentMode}</p>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}><span style={{ fontWeight: 'bold', color: '#475569' }}>Transaction ID:</span> {transactionNo}</p>
                <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', fontStyle: 'italic' }}>
                    Amount in Words: {numberToWords(amount)}
                </p>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                    <p style={{ margin: '0' }}>* This is a computer generated receipt.</p>
                    <p style={{ margin: '0' }}>* Signature not required.</p>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <div style={{ borderBottom: '1px solid #000000', marginBottom: '5px' }}></div>
                    <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>Authorized Signatory</p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>{schoolName}</p>
                </div>
            </div>

        </div>
    );
});

export default FeeReceiptTemplate;
