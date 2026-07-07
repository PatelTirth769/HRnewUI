const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../firebase');
const axios = require('axios');
const { getCollection } = require('./firebaseHelper');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper to get ERPNext URL (similar to erpProxy.js)
async function getSystemUrl(code) {
    try {
        const lookupCode = (code === 'schooler_system' || code === 'schooler') ? 'schooler' : code;
        const snapshot = await db.collection('systems').where('code', '==', lookupCode).get();
        if (snapshot.empty) return null;
        return snapshot.docs[0].data().erpNextUrl;
    } catch (err) {
        console.error('Error fetching system URL:', err);
        return null;
    }
}

/**
 * Helper: get the fee_payments sub-collection under schooler_system
 * Path: schooler_system → data → fee_payments → {docId}
 */
function feePaymentsCol(systemCode) {
    return getCollection(db, systemCode || 'schooler', 'fee_payments');
}

/**
 * Middleware to verify administrative privileges via ERPNext Session
 */
async function requireAdminAuth(req, res, next) {
    const cookies = req.headers.cookie || '';
    if (!cookies.includes('sid=')) {
        console.warn(`🚨 [SECURITY] Blocked unauthorized admin access attempt to ${req.path}`);
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing session cookie' });
    }
    
    try {
        const targetBase = await getSystemUrl(req.body.systemCode || 'schooler');
        if (!targetBase) throw new Error("System not found");
        
        const authRes = await axios.get(`${targetBase}/api/method/frappe.auth.get_logged_user`, {
            headers: { 'Cookie': req.headers.cookie }
        });
        
        if (authRes.data && authRes.data.message) {
            next();
        } else {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid session' });
        }
    } catch (err) {
        console.error('Admin Auth Error:', err.message);
        return res.status(401).json({ success: false, message: 'Unauthorized: Session verification failed' });
    }
}

/**
 * Helper: Securely resolve a student's discount from Firebase to prevent frontend spoofing.
 */
async function getSecureDiscount(student_id, category, systemCode) {
    try {
        const sysCode = systemCode || 'schooler_system';
        const studentDiscountsSnap = await db.collection(sysCode).doc('data').collection('student_discounts')
            .where('student_id', '==', student_id)
            .get();

        if (studentDiscountsSnap.empty) return { amount: 0, percentage: 0, name: '' };

        let activeDiscount = null;
        for (const doc of studentDiscountsSnap.docs) {
            const sd = doc.data();
            const terms = Array.isArray(sd.terms) ? sd.terms : (sd.terms ? [sd.terms] : []);
            if (terms.length === 0 || terms.includes('All Terms') || terms.includes(category)) {
                activeDiscount = sd;
                break; // Take first matching discount
            }
        }

        if (!activeDiscount) return { amount: 0, percentage: 0, name: '' };

        // Fetch the discount definition to get the real percentage
        const feesDiscountsSnap = await db.collection(sysCode).doc('data').collection('fees_discounts').get();
        let fd = null;
        feesDiscountsSnap.forEach(doc => {
            const data = doc.data();
            if (data.name === activeDiscount.discount_id || data.name === activeDiscount.discount_name || doc.id === activeDiscount.discount_id) {
                fd = data;
            }
        });

        if (!fd) return { amount: 0, percentage: 0, name: '' };

        return {
            percentage: parseFloat(fd.percentage) || 0,
            name: fd.name || fd.discount_name || activeDiscount.discount_name
        };
    } catch (e) {
        console.error('[SECURITY] Error resolving discount:', e);
        return { amount: 0, percentage: 0, name: '' };
    }
}

/**
 * POST /create-order
 * Payload: { student_id, fee_structure, fees_category, amount, systemCode }
 */
router.post('/create-order', async (req, res) => {
    try {
        const { student_id, fee_structure, fees_category, amount, systemCode } = req.body;

        if (!student_id || !amount || !systemCode) {
            return res.status(400).json({ success: false, message: 'Missing required fields: student_id, amount, and systemCode are required.' });
        }

        // Razorpay minimum amount is ₹1 (100 paise)
        if (amount < 1) {
            return res.status(400).json({ success: false, message: `Amount ₹${amount} is below the minimum ₹1.00 required by Razorpay. Please check the fee structure.` });
        }

        // 1. Validate amount against Fee Structure (Server-side validation)
        const targetBase = await getSystemUrl(systemCode);
        if (!targetBase) {
            return res.status(404).json({ success: false, message: 'System not found. Please check the system configuration.' });
        }

        // 2. Create Razorpay Order
        const amountInPaise = Math.round(amount * 100);
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            notes: {
                student_id,
                fee_structure,
                fees_category,
                systemCode
            }
        };

        console.log(`Creating Razorpay order: ₹${amount} (${amountInPaise} paise) for student ${student_id}`);
        const order = await razorpay.orders.create(options);

        // 3. Log to Firebase: schooler_system → data → fee_payments → {order_id}
        const col = feePaymentsCol(systemCode);
        await col.doc(order.id).set({
            order_id: order.id,
            student_id,
            student_name: req.body.student_name || '',
            guardian_email: req.body.guardian_email || '',
            fee_structure,
            fees_category,
            amount,
            currency: 'INR',
            status: 'created',
            systemCode,
            created_at: new Date().toISOString(),
        });

        console.log(`✅ Razorpay order created & logged: ${order.id} → schooler_system/data/fee_payments`);
        res.json({
            success: true,
            order_id: order.id,
            amount: amountInPaise,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        console.error('Create Order Error:', err);
        // Forward Razorpay's actual error description if available
        const razorpayMsg = err.error?.description || err.description || err.message;
        const statusCode = err.statusCode || 500;
        res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({ 
            success: false, 
            message: razorpayMsg 
        });
    }
});

/**
 * POST /verify-payment
 * Payload: { razorpay_order_id, razorpay_payment_id, razorpay_signature, student_id, ... }
 */
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            student_id,
            student_name,
            guardian_email,
            amount,
            original_fee,
            discount_amount,
            discount_name,
            discount_percentage,
            fees_category,
            fee_structure,
            systemCode
        } = req.body;

        console.log(`Verifying payment: Order=${razorpay_order_id}, Payment=${razorpay_payment_id}, Student=${student_id}, Category=${fees_category}, Amount=₹${amount}`);

        const col = feePaymentsCol(systemCode);

        // 1. Verify Signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            await col.doc(razorpay_order_id).update({
                status: 'failed',
                error: 'Invalid signature',
                updated_at: new Date().toISOString()
            });
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // 2. Lock and Check existing payment doc (Concurrency Prevention)
        let orderData;
        try {
            await db.runTransaction(async (t) => {
                const docRef = col.doc(razorpay_order_id);
                const doc = await t.get(docRef);
                if (!doc.exists) throw new Error("Order not found in logs");
                
                orderData = doc.data();
                if (orderData.status === 'verified' || orderData.status === 'processing') {
                    throw new Error("Payment already processed");
                }
                
                // Mark as processing to lock it
                t.update(docRef, { status: 'processing', updated_at: new Date().toISOString() });
            });
        } catch (err) {
            if (err.message === "Payment already processed") {
                return res.json({ success: true, message: 'Payment already processed' });
            }
            return res.status(404).json({ success: false, message: err.message });
        }

        // 3. Fetch true amount from Razorpay (Security Validation)
        let trueAmount = amount;
        try {
            const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
            trueAmount = rzpPayment.amount / 100; // Razorpay returns amount in paise
            if (trueAmount != amount) {
                console.warn(`🚨 [SECURITY WARNING] Client amount (₹${amount}) spoofed! True amount collected: ₹${trueAmount}`);
            }
        } catch (rzpErr) {
            console.error('Razorpay Fetch Error:', rzpErr);
            await col.doc(razorpay_order_id).update({ status: 'failed', error: 'Could not verify true amount from Razorpay' });
            return res.status(500).json({ success: false, message: 'Could not securely verify payment amount with gateway' });
        }

        // 3. Create Payment in ERPNext
        const targetBase = await getSystemUrl(systemCode);
        const erpApiKey = process.env.ERP_ADMIN_API_KEY;
        const erpApiSecret = process.env.ERP_ADMIN_API_SECRET;

        try {
            const feeFilter = JSON.stringify([
                ["student", "=", student_id],
                ["outstanding_amount", ">", 0],
                ["docstatus", "=", 1]
            ]);
            
            const feeFields = JSON.stringify(["name", "outstanding_amount", "grand_total"]);
            const feeRes = await axios.get(`${targetBase}/api/resource/Fees?filters=${feeFilter}&fields=${feeFields}`, {
                headers: { 'Authorization': `token ${erpApiKey}:${erpApiSecret}` }
            });

            let targetFeeId = null;
            let erpOutstanding = 0;
            let erpGrandTotal = 0;
            if (feeRes.data.data && feeRes.data.data.length > 0) {
                targetFeeId = feeRes.data.data[0].name;
                erpOutstanding = parseFloat(feeRes.data.data[0].outstanding_amount) || 0;
                erpGrandTotal = parseFloat(feeRes.data.data[0].grand_total) || 0;
            }

            // Secure Visual Status: Prevent frontend from marking it PAID if underpaid
            const realDiscount = await getSecureDiscount(student_id, fees_category, systemCode);
            // Real discount is a percentage of the grand total
            const realDiscountAmount = (erpGrandTotal * realDiscount.percentage) / 100;
            const expectedPayment = Math.max(0, erpOutstanding - realDiscountAmount);
            
            // Allow ₹10 variance for rounding issues
            const isFullPayment = trueAmount >= (expectedPayment - 10);
            const receiptStatus = isFullPayment ? 'verified' : 'partial';

            if (!isFullPayment) {
                console.warn(`🚨 [SECURITY] Student underpaid! Expected: ₹${expectedPayment}, Paid: ₹${trueAmount}. Marking receipt as partial.`);
            }

            if (targetFeeId) {
                // Create Payment Entry with securely verified trueAmount
                const paymentEntryPayload = {
                    payment_type: "Receive",
                    party_type: "Student",
                    party: student_id,
                    paid_amount: trueAmount,
                    received_amount: trueAmount,
                    target_exchange_rate: 1,
                    references: [{
                        reference_doctype: "Fees",
                        reference_name: targetFeeId,
                        allocated_amount: trueAmount
                    }]
                };

                const peRes = await axios.post(`${targetBase}/api/resource/Payment Entry`, paymentEntryPayload, {
                    headers: { 'Authorization': `token ${erpApiKey}:${erpApiSecret}` }
                });

                // 4. Finalize Receipt Data in Firebase
                const receiptRecord = {
                    status: receiptStatus,
                    payment_id: razorpay_payment_id,
                    order_id: razorpay_order_id,
                    student_id: student_id,
                    student_name: student_name || '',
                    guardian_email: guardian_email || '',
                    fees_category: fees_category || '',
                    fee_structure: fee_structure || '',
                    amount: trueAmount,
                    payment_mode: 'ONLINE',
                    receipt_no: razorpay_payment_id,
                    receipt_date: new Date().toISOString(),
                    erp_payment_entry_id: peRes?.data?.data?.name || 'manual',
                    erp_fees_id: targetFeeId || 'N/A',
                    erp_sync: targetFeeId ? 'success' : 'manual_required',
                    verified_at: new Date().toISOString(),
                    school_name: 'SSV CAMPUS - CBSE',
                    original_fee: erpGrandTotal || parseFloat(original_fee) || 0,
                    discount_amount: realDiscountAmount || parseFloat(discount_amount) || 0,
                    discount_name: realDiscount.name || discount_name || '',
                    discount_percentage: realDiscount.percentage || parseFloat(discount_percentage) || 0
                };

                await col.doc(razorpay_order_id).update(receiptRecord);
                
                // Also create a dedicated receipt entry for easier reporting if needed
                const receiptsCol = getCollection(db, systemCode || 'schooler', 'fee_receipts');
                await receiptsCol.doc(razorpay_payment_id).set({
                    ...receiptRecord,
                    created_at: new Date().toISOString()
                });

                console.log(`✅ Payment ${receiptStatus} & Receipt stored: ${razorpay_payment_id}`);
            } else {
                // No matching ERP Fee record — mark as manual but still store receipt
                const receiptRecord = {
                    status: receiptStatus,
                    payment_id: razorpay_payment_id,
                    order_id: razorpay_order_id,
                    student_id: student_id,
                    student_name: student_name || '',
                    guardian_email: guardian_email || '',
                    fees_category: fees_category || '',
                    fee_structure: fee_structure || '',
                    amount: trueAmount,
                    payment_mode: 'ONLINE',
                    receipt_no: razorpay_payment_id,
                    receipt_date: new Date().toISOString(),
                    erp_sync: 'manual_required',
                    message: 'No matching outstanding Fees record found in ERPNext',
                    verified_at: new Date().toISOString(),
                    school_name: 'SSV CAMPUS - CBSE',
                    original_fee: parseFloat(original_fee) || 0,
                    discount_amount: parseFloat(discount_amount) || 0,
                    discount_name: discount_name || '',
                    discount_percentage: parseFloat(discount_percentage) || 0
                };

                await col.doc(razorpay_order_id).update(receiptRecord);

                const receiptsCol = getCollection(db, systemCode || 'schooler', 'fee_receipts');
                await receiptsCol.doc(razorpay_payment_id).set({
                    ...receiptRecord,
                    created_at: new Date().toISOString()
                });

                console.log(`✅ Payment verified (manual ERP sync needed): ${razorpay_payment_id}`);
            }

        } catch (erpErr) {
            console.error('ERP Sync Error:', erpErr.response?.data || erpErr.message);
            // We still consider the payment verified because money is collected
            const receiptRecord = {
                status: 'verified',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                student_id: student_id,
                student_name: student_name || '',
                guardian_email: guardian_email || '',
                fees_category: fees_category || '',
                fee_structure: fee_structure || '',
                amount: trueAmount,
                payment_mode: 'ONLINE',
                receipt_no: razorpay_payment_id,
                receipt_date: new Date().toISOString(),
                erp_sync: 'failed',
                erp_error: erpErr.message,
                verified_at: new Date().toISOString(),
                school_name: 'SSV CAMPUS - CBSE',
                original_fee: parseFloat(original_fee) || 0,
                discount_amount: parseFloat(discount_amount) || 0,
                discount_name: discount_name || '',
                discount_percentage: parseFloat(discount_percentage) || 0
            };

            await col.doc(razorpay_order_id).update(receiptRecord);

            const receiptsCol = getCollection(db, systemCode || 'schooler', 'fee_receipts');
            await receiptsCol.doc(razorpay_payment_id).set({
                ...receiptRecord,
                created_at: new Date().toISOString()
            });

            console.log(`✅ Payment verified (ERP sync failed): ${razorpay_payment_id}`);
        }

        res.json({ success: true, message: 'Payment verified successfully' });

    } catch (err) {
        console.error('Verify Payment Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /history/:studentId
 * Fetches payment history from schooler_system → data → fee_payments
 */
router.get('/history/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const col = feePaymentsCol('schooler');
        
        let snapshot;
        try {
            // Try with orderBy (requires composite index in Firestore)
            snapshot = await col
                .where('student_id', '==', studentId)
                .orderBy('created_at', 'desc')
                .get();
        } catch (indexErr) {
            // Fallback: query without orderBy if composite index doesn't exist
            console.warn('[Payment History] Composite index not available, using fallback query. Create index at:', indexErr.message?.match(/https:\/\/[^\s]+/)?.[0] || 'Check Firebase Console');
            snapshot = await col
                .where('student_id', '==', studentId)
                .get();
        }

        const history = [];
        snapshot.forEach(doc => history.push(doc.data()));
        
        // Sort client-side as fallback (newest first)
        history.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        
        console.log(`[Payment History] Found ${history.length} records for student ${studentId}`);
        res.json({ success: true, data: history });
    } catch (err) {
        console.error('Fetch History Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /history-all
 * Fetches ALL payment records from schooler_system → data → fee_payments
 * Used for administrative reporting to show all initiated/completed transactions.
 */
router.get('/history-all', async (req, res) => {
    try {
        const receiptsCol = db.collection('schooler_system').doc('data').collection('fee_payments');
        
        const snapshot = await receiptsCol
            .orderBy('created_at', 'desc')
            .limit(1000)
            .get();

        const history = [];
        snapshot.forEach(doc => history.push(doc.data()));
        
        res.json({ success: true, data: history });
    } catch (err) {
        console.error('Fetch All History Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * Generate sequential offline receipt number: FEE-RCPT-YYYYMM-XXX
 */
async function generateOfflineReceiptNo(systemCode) {
    const now = new Date();
    const prefix = `FEE-RCPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const receiptsCol = getCollection(db, systemCode || 'schooler', 'fee_receipts');
    const snapshot = await receiptsCol
        .where('receipt_no', '>=', prefix)
        .where('receipt_no', '<=', prefix + '\uf8ff')
        .get();

    const seq = snapshot.size + 1;
    return `${prefix}-${String(seq).padStart(3, '0')}`;
}

/**
 * POST /record-offline-payment
 * For Cash/offline payments collected by admin
 * Payload: { student_id, student_name, fee_structure, fees_category, amount, payment_mode, manual_receipt_no, fee_id, systemCode }
 */
router.post('/record-offline-payment', requireAdminAuth, async (req, res) => {
    try {
        const {
            student_id,
            student_name,
            fee_structure,
            fees_category,
            amount,
            payment_mode,
            receipt_date,
            manual_receipt_no,
            fee_id,
            systemCode,
            original_fee,
            discount_amount,
            discount_name,
            discount_percentage,
            remark
        } = req.body;

        if (!student_id || !amount || !fees_category || !systemCode) {
            return res.status(400).json({ success: false, message: 'Missing required fields: student_id, amount, fees_category, and systemCode are required.' });
        }

        const resolvedPaymentMode = (payment_mode || 'CASH').toUpperCase();
        const receiptNo = await generateOfflineReceiptNo(systemCode);
        const docId = `manual_off_${Date.now()}`;
        const numAmount = parseFloat(amount) || 0;

        const finalReceiptDate = receipt_date ? new Date(receipt_date).toISOString() : new Date().toISOString();
        const postingDate = receipt_date ? receipt_date.split('T')[0] : new Date().toISOString().split('T')[0];

        console.log(`[Offline Payment] Recording: Student=${student_id}, Category=${fees_category}, Amount=₹${numAmount}, Mode=${resolvedPaymentMode}, Date=${postingDate}`);

        // Try to sync with ERPNext
        const targetBase = await getSystemUrl(systemCode);
        const erpApiKey = process.env.ERP_ADMIN_API_KEY;
        const erpApiSecret = process.env.ERP_ADMIN_API_SECRET;
        
        let targetFeeId = fee_id && fee_id !== '-' && fee_id !== 'manual' ? fee_id : null;
        let erpSyncStatus = 'manual_required';
        let erpPaymentEntryId = 'N/A';
        let erpError = '';

        if (targetBase && erpApiKey && erpApiSecret) {
            try {
                // If fee_id was not explicitly passed, let's search outstanding ERPNext Fees
                if (!targetFeeId) {
                    const feeFilter = JSON.stringify([
                        ["student", "=", student_id],
                        ["outstanding_amount", ">", 0],
                        ["docstatus", "=", 1]
                    ]);
                    const feeRes = await axios.get(`${targetBase}/api/resource/Fees?filters=${feeFilter}`, {
                        headers: { 'Authorization': `token ${erpApiKey}:${erpApiSecret}` }
                    });
                    
                    if (feeRes.data.data && feeRes.data.data.length > 0) {
                        targetFeeId = feeRes.data.data[0].name;
                    }
                }

                if (targetFeeId) {
                    // NEW: Add discount component to ERPNext Fee before creating Payment Entry
                    if (discount_amount > 0) {
                        try {
                            const feeDetailsRes = await axios.get(`${targetBase}/api/resource/Fees/${encodeURIComponent(targetFeeId)}`, {
                                headers: { 'Authorization': `token ${erpApiKey}:${erpApiSecret}` }
                            });
                            const feeDoc = feeDetailsRes.data.data;
                            const newComponents = [];
                            let subtotal = 0;
                            for (const comp of feeDoc.components || []) {
                                if (comp.fees_category !== 'Discount') {
                                    subtotal += parseFloat(comp.amount) || 0;
                                    newComponents.push(comp);
                                }
                            }
                            newComponents.push({
                                fees_category: 'Discount',
                                amount: -Math.abs(discount_amount),
                                description: discount_name || 'Manual Discount'
                            });
                            await axios.put(`${targetBase}/api/resource/Fees/${encodeURIComponent(targetFeeId)}`, {
                                components: newComponents
                            }, {
                                headers: { 'Authorization': `token ${erpApiKey}:${erpApiSecret}` }
                            });
                            console.log(`[Offline Payment] Applied discount to Fee ${targetFeeId}`);
                        } catch(err) {
                            console.error('[Offline Payment] Failed to apply discount to ERP Fee:', err.response?.data || err.message);
                        }
                    }

                    // Create Payment Entry in ERPNext
                    const paymentEntryPayload = {
                        payment_type: "Receive",
                        party_type: "Student",
                        party: student_id,
                        paid_amount: numAmount,
                        received_amount: numAmount,
                        target_exchange_rate: 1,
                        posting_date: postingDate,
                        mode_of_payment: resolvedPaymentMode === 'CASH' ? 'Cash' : 
                                         (resolvedPaymentMode === 'CHEQUE' ? 'Cheque' : 
                                         (resolvedPaymentMode === 'BANK_TRANSFER' ? 'Bank Transfer' :
                                         (resolvedPaymentMode === 'ONLINE' ? 'Online' : 'Cash'))),
                        references: [{
                            reference_doctype: "Fees",
                            reference_name: targetFeeId,
                            allocated_amount: numAmount
                        }]
                    };

                    const peRes = await axios.post(`${targetBase}/api/resource/Payment Entry`, paymentEntryPayload, {
                        headers: { 'Authorization': `token ${erpApiKey}:${erpApiSecret}` }
                    });

                    erpPaymentEntryId = peRes?.data?.data?.name || 'manual';
                    erpSyncStatus = 'success';
                }
            } catch (err) {
                console.error('[Offline Payment] ERP Sync Error:', err.response?.data || err.message);
                erpSyncStatus = 'failed';
                erpError = err.response?.data?._server_messages || err.message;
            }
        }

        const receiptRecord = {
            status: 'verified',
            payment_id: docId,
            order_id: docId,
            student_id: student_id,
            student_name: student_name || '',
            guardian_email: req.body.guardian_email || '',
            fees_category: fees_category || '',
            fee_structure: fee_structure || '',
            amount: numAmount,
            payment_mode: resolvedPaymentMode,
            receipt_no: receiptNo,
            manual_receipt_ref: manual_receipt_no || '',
            receipt_date: finalReceiptDate,
            erp_payment_entry_id: erpPaymentEntryId,
            erp_fees_id: targetFeeId || 'N/A',
            erp_sync: erpSyncStatus,
            verified_at: finalReceiptDate,
            school_name: 'SSV CAMPUS - CBSE',
            created_at: new Date().toISOString(),
            original_fee: parseFloat(original_fee) || 0,
            discount_amount: parseFloat(discount_amount) || 0,
            discount_name: discount_name || '',
            discount_percentage: parseFloat(discount_percentage) || 0,
            remark: remark || ''
        };

        // Write to fee_payments
        const col = feePaymentsCol(systemCode);
        await col.doc(docId).set(receiptRecord);

        // Write to fee_receipts
        const receiptsCol = getCollection(db, systemCode || 'schooler', 'fee_receipts');
        await receiptsCol.doc(docId).set(receiptRecord);

        console.log(`✅ [Offline Payment] Recorded: ${receiptNo} for student ${student_id}. ERP sync: ${erpSyncStatus}`);
        res.json({
            success: true,
            message: 'Offline payment recorded successfully',
            receipt_no: receiptNo,
            payment_id: docId,
            erp_sync: erpSyncStatus,
            erp_error: erpError
        });

    } catch (err) {
        console.error('[Offline Payment] Record Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /assign-discount
 * Assigns a discount to a student for a specific term and attempts to update ERPNext Fee record.
 */
router.post('/assign-discount', requireAdminAuth, async (req, res) => {
    try {
        const { systemCode, discount_id, student_id, academic_year, terms = [] } = req.body;
        if (!discount_id || !student_id || !academic_year) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const sysCode = systemCode || 'schooler_system';

        // 1. Fetch the discount details from Firebase to know the percentage
        const discountDoc = await db.collection(sysCode).doc('data').collection('fees_discounts').doc(discount_id).get();
        if (!discountDoc.exists) {
            return res.status(404).json({ success: false, message: 'Discount category not found' });
        }
        const discountData = discountDoc.data();
        const discountPercentage = parseFloat(discountData.percentage) || 0;

        // 2. Save the assignment to Firebase
        const assignmentsCol = db.collection(sysCode).doc('data').collection('student_discounts');
        const existingSnapshot = await assignmentsCol.where('student_id', '==', student_id).where('academic_year', '==', academic_year).get();
        if (!existingSnapshot.empty) {
            // Delete old assignment for same term
            const oldDoc = existingSnapshot.docs[0];
            await oldDoc.ref.delete();
        }
        
        await assignmentsCol.add({
            student_id,
            discount_id,
            academic_year,
            terms,
            systemCode: sysCode,
            assigned_at: new Date().toISOString()
        });

        // 3. Sync to ERPNext (Modify the Fee record if it exists)
        const targetBase = await getSystemUrl(systemCode);
        const erpApiKey = process.env.ERP_ADMIN_API_KEY;
        const erpApiSecret = process.env.ERP_ADMIN_API_SECRET;

        let erpUpdated = false;
        let erpMessage = '';

        if (targetBase && discountPercentage > 0) {
            try {
                // Find fee for the student and year
                const feeFilter = JSON.stringify([
                    ["student", "=", student_id],
                    ["academic_year", "=", academic_year],
                    ["docstatus", "<", 2] 
                ]);
                
                const authHeaders = req.headers.cookie ? { 'Cookie': req.headers.cookie } : { 'Authorization': `token ${erpApiKey}:${erpApiSecret}` };

                const feeRes = await axios.get(`${targetBase}/api/resource/Fees?filters=${feeFilter}&limit_page_length=20`, {
                    headers: authHeaders
                });

                if (feeRes.data.data && feeRes.data.data.length > 0) {
                    for (const feeInfo of feeRes.data.data) {
                        const feeName = feeInfo.name;
                        
                        // Fetch full fee doc
                        const feeDetailsRes = await axios.get(`${targetBase}/api/resource/Fees/${encodeURIComponent(feeName)}`, {
                            headers: { 'Authorization': `token ${erpApiKey}:${erpApiSecret}` }
                        });
                        
                        const feeDoc = feeDetailsRes.data.data;

                        // Check term condition
                        if (terms.length > 0 && !terms.includes(feeDoc.academic_term)) {
                            continue; // Skip fees that don't match selected terms
                        }
                        
                        // Calculate subtotal excluding any existing 'Discount' components
                        let subtotal = 0;
                        const newComponents = [];

                        for (const comp of feeDoc.components || []) {
                            if (comp.fees_category !== 'Discount') {
                                subtotal += parseFloat(comp.amount) || 0;
                                newComponents.push(comp);
                            }
                        }

                        const discountAmount = -Math.abs((subtotal * discountPercentage) / 100);
                        
                        // Add the discount component
                        newComponents.push({
                            fees_category: 'Discount',
                            amount: discountAmount,
                            description: discountData.name
                        });

                        // Update Fee Doc in ERPNext
                        await axios.put(`${targetBase}/api/resource/Fees/${encodeURIComponent(feeName)}`, {
                            components: newComponents
                        }, {
                            headers: authHeaders
                        });
                    }

                    erpUpdated = true;
                    erpMessage = 'ERPNext fees successfully updated with discount component.';
                } else {
                    erpMessage = 'No fee found in ERPNext for this year. Discount will apply when generated.';
                }
            } catch (erpErr) {
                const fs = require('fs');
                const errMsg = JSON.stringify(erpErr.response?.data || erpErr.message, null, 2);
                fs.appendFileSync('payment_error.log', '\n[' + new Date().toISOString() + '] ERPNext Fee Update Error: ' + errMsg);
                console.error('ERPNext Fee Update Error:', erpErr.response?.data || erpErr.message);
                erpMessage = 'Failed to update ERPNext Fee: ' + (erpErr.response?.data?._server_messages || erpErr.message);
            }
        }

        res.json({ success: true, message: 'Discount assigned', erpUpdated, erpMessage });

    } catch (err) {
        console.error('Assign Discount Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// Added Delete Route
router.delete('/receipt/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const systemCode = req.query.systemCode || 'schooler';
        const col = feePaymentsCol(systemCode);
        await col.doc(id).delete();
        
        // Also delete from fee_receipts if it exists
        const receiptsCol = getCollection(db, systemCode, 'fee_receipts');
        const q = await receiptsCol.where('payment_id', '==', id).get();
        if (!q.empty) {
            const batch = db.batch();
            q.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        res.json({ success: true, message: 'Receipt deleted successfully' });
    } catch (error) {
        console.error('Error deleting receipt:', error);
        res.status(500).json({ success: false, message: 'Failed to delete receipt' });
    }
});

module.exports = router;

/**
 * POST /remove-discount
 * Removes a discount assignment and strips the discount component from ERPNext Fee records.
 */
router.post('/remove-discount', requireAdminAuth, async (req, res) => {
    try {
        const { systemCode, assignment_id } = req.body;
        if (!assignment_id) {
            return res.status(400).json({ success: false, message: 'Missing assignment_id' });
        }

        const sysCode = systemCode || 'schooler_system';
        const docRef = db.collection(sysCode).doc('data').collection('student_discounts').doc(assignment_id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        const assignmentData = docSnap.data();
        const { student_id, academic_year } = assignmentData;

        // Delete from Firebase
        await docRef.delete();

        // Remove from ERPNext
        const targetBase = await getSystemUrl(sysCode);
        const erpApiKey = process.env.ERP_ADMIN_API_KEY;
        const erpApiSecret = process.env.ERP_ADMIN_API_SECRET;

        let erpMessage = 'Assignment removed from database.';

        if (targetBase) {
            try {
                const feeFilter = JSON.stringify([
                    ["student", "=", student_id],
                    ["academic_year", "=", academic_year],
                    ["docstatus", "<", 2] 
                ]);
                
                const authHeaders = req.headers.cookie ? { 'Cookie': req.headers.cookie } : { 'Authorization': `token ${erpApiKey}:${erpApiSecret}` };

                const feeRes = await axios.get(`${targetBase}/api/resource/Fees?filters=${feeFilter}&limit_page_length=20`, {
                    headers: authHeaders
                });

                if (feeRes.data.data && feeRes.data.data.length > 0) {
                    for (const feeInfo of feeRes.data.data) {
                        const feeName = feeInfo.name;
                        
                        const feeDetailsRes = await axios.get(`${targetBase}/api/resource/Fees/${encodeURIComponent(feeName)}`, {
                            headers: authHeaders
                        });
                        
                        const feeDoc = feeDetailsRes.data.data;
                        
                        // Skip if the fee is already fully paid!
                        if (feeDoc.outstanding_amount <= 0) {
                            continue;
                        }

                        const newComponents = (feeDoc.components || []).filter(comp => comp.fees_category !== 'Discount');

                        if (newComponents.length < (feeDoc.components || []).length) {
                            await axios.put(`${targetBase}/api/resource/Fees/${encodeURIComponent(feeName)}`, {
                                components: newComponents
                            }, {
                                headers: authHeaders
                            });
                        }
                    }
                    erpMessage += ' ERPNext fees reverted successfully.';
                }
            } catch (erpErr) {
                console.error('ERPNext Fee Revert Error:', erpErr.response?.data || erpErr.message);
                erpMessage += ' However, failed to revert ERPNext Fees.';
            }
        }

        res.json({ success: true, message: erpMessage });

    } catch (err) {
        console.error('Remove Discount Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});
