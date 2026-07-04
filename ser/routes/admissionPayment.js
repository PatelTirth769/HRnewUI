const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');
const { db } = require('../firebase');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Firebase collection paths under enquiry_management
const PAYMENTS_PATH = 'schooler_system/enquiry_management/admission_fee_payments';
const RECEIPTS_PATH = 'schooler_system/enquiry_management/admission_fee_receipts';

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
        const targetBase = process.env.SCHOOLER_ERP_URL || 'https://3iinfotech.hrhovercraft.in';
        const axiosConfig = {
            headers: { 'Cookie': req.headers.cookie },
            // Pass the host header so proxying doesn't fail on Frappe
            ...(targetBase.includes('http') ? { host: new URL(targetBase).host } : {})
        };
        const authRes = await axios.get(`${targetBase}/api/method/frappe.auth.get_logged_user`, axiosConfig);
        
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
 * Generate sequential receipt number: ADM-RCPT-YYYYMM-XXX
 */
async function generateReceiptNo() {
    const now = new Date();
    const prefix = `ADM-RCPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Count existing receipts this month
    const snapshot = await db.collection(RECEIPTS_PATH)
        .where('receipt_no', '>=', prefix)
        .where('receipt_no', '<=', prefix + '\uf8ff')
        .get();

    const seq = snapshot.size + 1;
    return `${prefix}-${String(seq).padStart(3, '0')}`;
}

/**
 * POST /create-order
 * Payload: { student_name, registration_no, admission_no, program, academic_year,
 *            fee_type, fee_name, amount, parent_name, parent_mobile, parent_email }
 */
router.post('/create-order', async (req, res) => {
    try {
        const {
            student_name, registration_no, admission_no, program, academic_year,
            fee_type, fee_name, amount, parent_name, parent_mobile, parent_email, total_fee
        } = req.body;

        if (!student_name || !amount || !fee_type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: student_name, amount, and fee_type are required.'
            });
        }

        // Razorpay minimum amount is ₹1 (100 paise)
        const numAmount = parseFloat(amount);
        if (numAmount < 1) {
            return res.status(400).json({
                success: false,
                message: `Amount ₹${numAmount} is below the minimum ₹1.00 required by Razorpay.`
            });
        }

        // Remove expected fee validation as we now support partial payments
        const amountInPaise = Math.round(numAmount * 100);
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `adm_rcpt_${Date.now()}`,
            notes: {
                student_name,
                registration_no: registration_no || '',
                admission_no: admission_no || '',
                fee_type,
                fee_name: fee_name || fee_type
            }
        };

        console.log(`[AdmissionPayment] Creating order: ₹${numAmount} for ${student_name} (${fee_type})`);
        const order = await razorpay.orders.create(options);

        // Log to Firebase
        await db.collection(PAYMENTS_PATH).doc(order.id).set({
            order_id: order.id,
            student_name: student_name || '',
            registration_no: registration_no || '',
            admission_no: admission_no || '',
            program: program || '',
            academic_year: academic_year || '',
            fee_type: fee_type || '',
            fee_name: fee_name || fee_type || '',
            amount: numAmount,
            currency: 'INR',
            status: 'created',
            total_fee: total_fee || amount,
            payment_mode: 'ONLINE',
            parent_name: parent_name || '',
            parent_mobile: parent_mobile || '',
            parent_email: parent_email || '',
            school_name: 'SSV CAMPUS - CBSE',
            created_at: new Date().toISOString(),
        });

        console.log(`✅ [AdmissionPayment] Order created & logged: ${order.id}`);
        res.json({
            success: true,
            order_id: order.id,
            amount: amountInPaise,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        console.error('[AdmissionPayment] Create Order Error:', err);
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
 * Payload: { razorpay_order_id, razorpay_payment_id, razorpay_signature, ...original data }
 */
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            student_name,
            registration_no,
            admission_no,
            program,
            academic_year,
            fee_type,
            fee_name,
            amount,
            parent_name,
            parent_mobile,
            parent_email,
            total_fee
        } = req.body;

        console.log(`[AdmissionPayment] Verifying: Order=${razorpay_order_id}, Payment=${razorpay_payment_id}, Student=${student_name}`);

        // 1. Verify Signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            await db.collection(PAYMENTS_PATH).doc(razorpay_order_id).update({
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
                const docRef = db.collection(PAYMENTS_PATH).doc(razorpay_order_id);
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
                // If it was already verified, we need to return the existing receipt_no
                const existingDoc = await db.collection(PAYMENTS_PATH).doc(razorpay_order_id).get();
                return res.json({ success: true, message: 'Payment already processed', receipt_no: existingDoc.data()?.receipt_no });
            }
            return res.status(404).json({ success: false, message: err.message });
        }

        // 3. Fetch true amount from Razorpay (Security Validation)
        let trueAmount = parseFloat(amount) || 0;
        try {
            const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
            trueAmount = rzpPayment.amount / 100; // Razorpay returns amount in paise
            if (trueAmount != amount) {
                console.warn(`🚨 [SECURITY WARNING] Client admission amount (₹${amount}) spoofed! True amount collected: ₹${trueAmount}`);
            }
        } catch (rzpErr) {
            console.error('Razorpay Fetch Error:', rzpErr);
            await db.collection(PAYMENTS_PATH).doc(razorpay_order_id).update({ status: 'failed', error: 'Could not verify true amount from Razorpay' });
            return res.status(500).json({ success: false, message: 'Could not securely verify payment amount with gateway' });
        }

        // 4a. Calculate aggregates
        let prevTotalPaid = 0;
        if (registration_no) {
            const pastReceipts = await db.collection(RECEIPTS_PATH)
                .where('registration_no', '==', registration_no)
                .where('status', 'in', ['verified', 'paid', 'success'])
                .get();
            pastReceipts.forEach(d => { prevTotalPaid += Number(d.data().amount || 0); });
        }
        const tFee = Number(total_fee || trueAmount);
        const totalPaidSoFar = prevTotalPaid + trueAmount;
        const pendingDue = Math.max(0, tFee - totalPaidSoFar);

        // 4b. Generate Receipt Number
        const receiptNo = await generateReceiptNo();

        // 4. Build receipt record
        const receiptRecord = {
            status: 'verified',
            total_fee: tFee,
            total_paid_so_far: totalPaidSoFar,
            pending_due: pendingDue,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            student_name: student_name || '',
            registration_no: registration_no || '',
            admission_no: admission_no || '',
            program: program || '',
            academic_year: academic_year || '',
            fee_type: fee_type || '',
            fee_name: fee_name || fee_type || '',
            amount: trueAmount,
            payment_mode: 'ONLINE',
            receipt_no: receiptNo,
            receipt_date: new Date().toISOString(),
            parent_name: parent_name || '',
            parent_mobile: parent_mobile || '',
            parent_email: parent_email || '',
            razorpay_signature: razorpay_signature || '',
            school_name: 'SSV CAMPUS - CBSE',
            verified_at: new Date().toISOString(),
        };

        // 5. Update payment record
        await db.collection(PAYMENTS_PATH).doc(razorpay_order_id).update(receiptRecord);

        // 6. Create dedicated receipt entry
        await db.collection(RECEIPTS_PATH).doc(razorpay_payment_id).set({
            ...receiptRecord,
            created_at: new Date().toISOString()
        });

        console.log(`✅ [AdmissionPayment] Payment verified & receipt stored: ${receiptNo} (${razorpay_payment_id})`);

        res.json({
            success: true,
            message: 'Payment verified successfully',
            receipt_no: receiptNo,
            payment_id: razorpay_payment_id
        });

    } catch (err) {
        console.error('[AdmissionPayment] Verify Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /record-manual
 * For Cash/Cheque payments that don't go through Razorpay
 * Payload: { student_name, registration_no, admission_no, program, academic_year,
 *            fee_type, fee_name, amount, payment_mode, manual_receipt_no, parent_name, parent_mobile }
 */
router.post('/record-manual', requireAdminAuth, async (req, res) => {
    try {
        const {
            student_name, registration_no, admission_no, program, academic_year,
            fee_type, fee_name, amount, payment_mode, manual_receipt_no,
            parent_name, parent_mobile, parent_email, total_fee, remarks
        } = req.body;

        if (!student_name || !amount || !fee_type || !payment_mode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: student_name, amount, fee_type, and payment_mode are required.'
            });
        }

        const numAmount = parseFloat(amount) || 0;

        // Aggregate prior payments for this registration
        let prevTotalPaid = 0;
        if (registration_no) {
            const pastReceipts = await db.collection(RECEIPTS_PATH)
                .where('registration_no', '==', registration_no)
                .where('status', 'in', ['verified', 'paid', 'success'])
                .get();
            pastReceipts.forEach(d => { prevTotalPaid += Number(d.data().amount || 0); });
        }
        const tFee = Number(total_fee || numAmount);
        const totalPaidSoFar = prevTotalPaid + numAmount;
        const pendingDue = Math.max(0, tFee - totalPaidSoFar);

        const receiptNo = await generateReceiptNo();
        const docId = `manual_${Date.now()}`;

        const record = {
            order_id: docId,
            payment_id: docId,
            student_name: student_name || '',
            registration_no: registration_no || '',
            admission_no: admission_no || '',
            program: program || '',
            academic_year: academic_year || '',
            fee_type: fee_type || '',
            fee_name: fee_name || fee_type || '',
            amount: numAmount,
            currency: 'INR',
            status: 'verified',
            payment_mode: payment_mode.toUpperCase(),
            receipt_no: receiptNo,
            manual_receipt_ref: manual_receipt_no || '',
            receipt_date: new Date().toISOString(),
            parent_name: parent_name || '',
            parent_mobile: parent_mobile || '',
            parent_email: parent_email || '',
            school_name: 'SSV CAMPUS - CBSE',
            created_at: new Date().toISOString(),
            verified_at: new Date().toISOString(),
            total_fee: tFee,
            total_paid_so_far: totalPaidSoFar,
            pending_due: pendingDue,
            remarks: remarks || ''
        };

        // Store in both collections
        await db.collection(PAYMENTS_PATH).doc(docId).set(record);
        await db.collection(RECEIPTS_PATH).doc(docId).set(record);

        // Update registration document
        if (registration_no) {
            const regQuery = await db.collection('schooler_system/enquiry_management/registrations')
                .where('registrationNo', '==', registration_no)
                .get();
            if (!regQuery.empty) {
                for (const doc of regQuery.docs) {
                    await doc.ref.update({
                        totalFee: tFee,
                        totalPaid: totalPaidSoFar,
                        pendingFee: pendingDue,
                        isFeePaid: pendingDue <= 0,
                        fees_status: pendingDue > 0 ? 'partial' : 'paid',
                        receiptNo: receiptNo,
                        paymentMode: payment_mode,
                        paymentDate: new Date().toISOString().split('T')[0]
                    });
                }
            }
        }

        console.log(`✅ [AdmissionPayment] Manual payment recorded: ${receiptNo} (${payment_mode}) | Total: ${tFee}, Paid: ${totalPaidSoFar}, Due: ${pendingDue}`);

        res.json({
            success: true,
            message: 'Manual payment recorded successfully',
            receipt_no: receiptNo,
            payment_id: docId,
            total_fee: tFee,
            total_paid: totalPaidSoFar,
            pending_due: pendingDue
        });

    } catch (err) {
        console.error('[AdmissionPayment] Record Manual Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /history-all
 * Fetches ALL admission fee payment records for reporting, including UNPAID registrations
 */
router.get('/history-all', async (req, res) => {
    try {
        // 1. Fetch actual payment records
        const paySnapshot = await db.collection(PAYMENTS_PATH)
            .orderBy('created_at', 'desc')
            .limit(2000)
            .get();

        const payments = [];
        paySnapshot.forEach(doc => payments.push(doc.data()));

        // 2. Fetch all registrations to find unpaid students
        const regSnapshot = await db.collection('schooler_system/enquiry_management/registrations')
            .orderBy('created_at', 'desc')
            .get();

        const history = [];
        const regMap = {};

        // Build registration map for easy lookup
        regSnapshot.forEach(doc => {
            const reg = doc.data();
            if (reg.registrationNo) {
                regMap[reg.registrationNo] = {
                    board: reg.custom_board || '',
                    feeAmount: parseFloat(reg.feeAmount) || 0
                };
            }
        });

        // Calculate total paid for each registration
        const paymentTotals = {};
        payments.forEach(p => {
            const status = (p.status || '').toLowerCase();
            if (['verified', 'paid', 'success'].includes(status) && p.registration_no) {
                paymentTotals[p.registration_no] = (paymentTotals[p.registration_no] || 0) + (parseFloat(p.amount) || 0);
            }
        });

        // Add all actual payments with board and fee calculations mapped from registrations
        payments.forEach(p => {
            const regData = regMap[p.registration_no] || {};
            p.board = regData.board || '';
            
            // Fee calculations
            p.total_fee = regData.feeAmount > 0 ? regData.feeAmount : (parseFloat(p.amount) || 0);
            p.total_paid_so_far = paymentTotals[p.registration_no] || 0;
            p.pending_due = Math.max(0, p.total_fee - p.total_paid_so_far);

            history.push(p);
        });

        // Add unpaid registrations
        regSnapshot.forEach(doc => {
            const reg = doc.data();
            // Skip disabled/left students
            if (reg.isDisabled) return;
            
            // Check if this registration already has a payment
            const hasPayment = payments.some(p => p.registration_no === reg.registrationNo);
            
            if (!hasPayment) {
                history.push({
                    order_id: `unpaid_${reg.registrationNo}`,
                    payment_id: '-',
                    student_name: reg.student_full_name || reg.first_name || 'Unknown',
                    registration_no: reg.registrationNo || '',
                    admission_no: '',
                    program: reg.program || '',
                    academic_year: reg.academic_year || '',
                    board: reg.custom_board || '',
                    fee_name: 'Registration Fee',
                    fee_type: 'Registration',
                    amount: parseFloat(reg.feeAmount) || 0,
                    status: 'unpaid',
                    payment_mode: '-',
                    receipt_no: '-',
                    created_at: reg.created_at ? (reg.created_at.toDate ? reg.created_at.toDate().toISOString() : new Date(reg.created_at).toISOString()) : new Date().toISOString()
                });
            }
        });

        // Sort combined history by created_at desc
        history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        console.log(`[AdmissionPayment] Fetched ${history.length} combined fee records`);
        res.json({ success: true, data: history });
    } catch (err) {
        console.error('[AdmissionPayment] Fetch All Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /receipt/:paymentId
 * Fetches a single receipt by payment ID
 */
router.get('/receipt/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const doc = await db.collection(RECEIPTS_PATH).doc(paymentId).get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Receipt not found' });
        }

        res.json({ success: true, data: doc.data() });
    } catch (err) {
        console.error('[AdmissionPayment] Fetch Receipt Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});


/**
 * DELETE /receipt/:paymentId
 * Deletes an admission fee payment and receipt record by paymentId (or order_id)
 */
router.delete('/receipt/:paymentId', requireAdminAuth, async (req, res) => {
    try {
        const { paymentId } = req.params;
        if (!paymentId) {
            return res.status(400).json({ success: false, message: 'Payment ID is required' });
        }

        console.log(`[AdmissionPayment] Deleting payment & receipt for ID: ${paymentId}`);

        let registrationNo = null;

        // Need to delete from both collections
        // Check PAYMENTS_PATH by doc id
        const payRef = db.collection(PAYMENTS_PATH).doc(paymentId);
        const payDoc = await payRef.get();

        if (!payDoc.exists) {
            // Also try to find by payment_id instead of order_id just in case
            const payQuery = await db.collection(PAYMENTS_PATH).where('payment_id', '==', paymentId).get();
            if (!payQuery.empty) {
                for (const doc of payQuery.docs) {
                    if (doc.data().registration_no) registrationNo = doc.data().registration_no;
                    await doc.ref.delete();
                }
            }
        } else {
            if (payDoc.data().registration_no) registrationNo = payDoc.data().registration_no;
            await payRef.delete();
        }

        // Check RECEIPTS_PATH by doc id
        const recRef = db.collection(RECEIPTS_PATH).doc(paymentId);
        const recDoc = await recRef.get();
        
        if (!recDoc.exists) {
            // Also try to find by order_id just in case
            const recQuery = await db.collection(RECEIPTS_PATH).where('order_id', '==', paymentId).get();
            if (!recQuery.empty) {
                for (const doc of recQuery.docs) {
                    await doc.ref.delete();
                }
            }
        } else {
            await recRef.delete();
        }

        // RECALCULATE & UPDATE REGISTRATION DOCUMENT
        if (registrationNo) {
            console.log(`[AdmissionPayment] Recalculating balance for registration ${registrationNo} after deletion`);
            
            const remainingReceipts = await db.collection(RECEIPTS_PATH)
                .where('registration_no', '==', registrationNo)
                .where('status', 'in', ['verified', 'paid', 'success'])
                .get();
            
            let totalPaidSoFar = 0;
            remainingReceipts.forEach(d => { totalPaidSoFar += Number(d.data().amount || 0); });

            const regQuery = await db.collection('schooler_system/enquiry_management/registrations')
                .where('registrationNo', '==', registrationNo)
                .get();
            
            if (!regQuery.empty) {
                for (const doc of regQuery.docs) {
                    const regData = doc.data();
                    const tFee = Number(regData.totalFee || regData.feeAmount || 0);
                    const pendingDue = Math.max(0, tFee - totalPaidSoFar);

                    // Find latest receipt to show on reg
                    let latestReceipt = null;
                    if (!remainingReceipts.empty) {
                        const sorted = remainingReceipts.docs.map(d=>d.data()).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                        latestReceipt = sorted[0];
                    }

                    await doc.ref.update({
                        totalPaid: totalPaidSoFar,
                        pendingFee: pendingDue,
                        isFeePaid: pendingDue <= 0,
                        fees_status: totalPaidSoFar === 0 ? 'unpaid' : (pendingDue > 0 ? 'partial' : 'paid'),
                        receiptNo: latestReceipt ? latestReceipt.receipt_no : null,
                        paymentMode: latestReceipt ? latestReceipt.payment_mode : null,
                        paymentDate: latestReceipt ? (latestReceipt.receipt_date || latestReceipt.created_at) : null
                    });
                }
            }
        }

        console.log(`✅ [AdmissionPayment] Successfully deleted payment & receipt: ${paymentId}`);
        res.json({ success: true, message: 'Payment record deleted successfully' });

    } catch (err) {
        console.error('[AdmissionPayment] Delete Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /history-by-registration/:regNo
 * Fetches all admission fee payment receipts for a specific registration number
 */
router.get('/history-by-registration/:regNo', async (req, res) => {
    try {
        const { regNo } = req.params;
        if (!regNo) return res.status(400).json({ success: false, message: 'Registration number required' });

        const snapshot = await db.collection(RECEIPTS_PATH)
            .where('registration_no', '==', regNo)
            .get();

        const receipts = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Filter out failed/pending payments just in case
            if (data.status === 'verified' || data.status === 'paid' || data.status === 'success') {
                receipts.push(data);
            }
        });

        // Sort by date descending
        receipts.sort((a, b) => new Date(b.created_at || b.receipt_date) - new Date(a.created_at || a.receipt_date));

        res.json({ success: true, data: receipts });
    } catch (err) {
        console.error('[AdmissionPayment] Fetch History By RegNo Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
