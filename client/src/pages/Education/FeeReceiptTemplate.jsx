import React, { forwardRef } from 'react';
import schoolHeader from '../../assets/images/newheader.jpeg';
import gsebHeader from '../../assets/images/gseb_header.png';

// Convert number to words
export const numberToWords = (num) => {
    const a = [
        '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN',
        'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
    ];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

    num = num.toString().split('.');
    let wholePart = num[0];
    let decimalPart = num[1] ? num[1].padEnd(2, '0').substr(0, 2) : '';
    
    if (wholePart.length > 9) return 'overflow';
    const n = ('000000000' + wholePart).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' CRORE ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' LAKH ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' THOUSAND ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' HUNDRED ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'AND ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    
    let result = str.trim() + ' RUPEES';
    if (decimalPart && Number(decimalPart) > 0) {
        result += ` AND ${Number(decimalPart)} PAISE`;
    }
    return result + ' ONLY';
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
        original_fee = 0,
        discount_amount = 0,
        discount_name = '',
        discount_percentage = 0,
        studentGroup = '',
        boardName = ''
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
            <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '2px solid #000000', paddingBottom: '10px', marginBottom: '30px', width: '100%' }}>
                <img src={(boardName && (boardName.toLowerCase().includes('gseb(eng)') || boardName.toLowerCase().includes('gseb(guj)'))) ? gsebHeader : schoolHeader} alt="School Header" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '1px' }}>Fees Payment Receipt</h2>
            </div>

            {/* Content Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', tableLayout: 'fixed' }}>
                <colgroup>
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '30%' }} />
                </colgroup>
                <tbody>
                    <tr>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Receipt No:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{receiptNo}</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Date:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{receiptDate}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Student ID:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{enrollmentNo}</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Class:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{courseName}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Student Name:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>{studentName}</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Section:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{studentGroup || '-'}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4b5563' }}>Year:</td>
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
                        <td style={{ padding: '15px 12px', border: '1px solid #e5e7eb', fontWeight: '500' }}>
                            {feeName} (Total Term Fee)
                            {discount_amount > 0 && (
                                <div style={{ fontSize: '11px', color: '#a855f7', marginTop: '4px', fontWeight: 'bold' }}>
                                    Includes Discount: {discount_name || 'Special Discount'} 
                                    {discount_percentage > 0 ? ` (${discount_percentage}%)` : ''}
                                </div>
                            )}
                        </td>
                        <td style={{ padding: '15px 12px', textAlign: 'right', border: '1px solid #e5e7eb', fontWeight: 'bold', fontSize: '16px' }}>
                            {discount_amount > 0 && (
                                <div style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '12px' }}>
                                    ₹ {original_fee.toLocaleString('en-IN')}
                                </div>
                            )}
                            {discount_amount > 0 && (
                                <div style={{ color: '#a855f7', fontSize: '12px', marginBottom: '4px' }}>
                                    -₹ {discount_amount.toLocaleString('en-IN')}
                                </div>
                            )}
                            ₹ {Math.max(0, original_fee - discount_amount).toLocaleString('en-IN')}
                        </td>
                    </tr>

                    {receiptData.previous_payments && receiptData.previous_payments.length > 0 && receiptData.previous_payments.map((prev, idx) => (
                        <tr key={idx}>
                            <td style={{ padding: '15px 12px', border: '1px solid #e5e7eb', fontWeight: '500', color: '#6b7280', fontSize: '13px' }}>
                                Previous Payment ({prev.date})
                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Receipt: {prev.receipt_no}</div>
                            </td>
                            <td style={{ padding: '15px 12px', textAlign: 'right', border: '1px solid #e5e7eb', fontWeight: 'bold', fontSize: '14px', color: '#6b7280' }}>
                                -₹ {prev.amount.toLocaleString('en-IN')}
                            </td>
                        </tr>
                    ))}

                    <tr>
                        <td style={{ padding: '15px 12px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1e3a8a' }}>
                            Current Payment
                        </td>
                        <td style={{ padding: '15px 12px', textAlign: 'right', border: '1px solid #e5e7eb', fontWeight: 'bold', fontSize: '16px', color: '#1e3a8a' }}>
                            -₹ {amount.toLocaleString('en-IN')}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase' }}>Amount Paid (This Receipt)</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px', color: '#1e3a8a' }}>₹ {amount.toLocaleString('en-IN')}</td>
                    </tr>
                    {receiptData.outstanding > 0 && (
                        <tr style={{ backgroundColor: '#fff5f5' }}>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: '#dc2626' }}>{feeName} PENDING FEES</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#dc2626' }}>₹ {receiptData.outstanding.toLocaleString('en-IN')}</td>
                        </tr>
                    )}
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
                </div>
            </div>

        </div>
    );
});

export default FeeReceiptTemplate;
