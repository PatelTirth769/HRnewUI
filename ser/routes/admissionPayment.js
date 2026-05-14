const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
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
            fee_type, fee_name, amount, parent_name, parent_mobile, parent_email
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

        // Create Razorpay Order
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
            parent_email
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

        // 2. Check existing payment doc
        const paymentDoc = await db.collection(PAYMENTS_PATH).doc(razorpay_order_id).get();
        if (!paymentDoc.exists) {
            return res.status(404).json({ success: false, message: 'Order not found in logs' });
        }

        // Check if already processed (Idempotency)
        if (paymentDoc.data().status === 'verified') {
            return res.json({ success: true, message: 'Payment already processed', receipt_no: paymentDoc.data().receipt_no });
        }

        // 3. Generate Receipt Number
        const receiptNo = await generateReceiptNo();

        // 4. Build receipt record
        const receiptRecord = {
            status: 'verified',
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            student_name: student_name || '',
            registration_no: registration_no || '',
            admission_no: admission_no || '',
            program: program || '',
            academic_year: academic_year || '',
            fee_type: fee_type || '',
            fee_name: fee_name || fee_type || '',
            amount: parseFloat(amount) || 0,
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
router.post('/record-manual', async (req, res) => {
    try {
        const {
            student_name, registration_no, admission_no, program, academic_year,
            fee_type, fee_name, amount, payment_mode, manual_receipt_no,
            parent_name, parent_mobile, parent_email
        } = req.body;

        if (!student_name || !amount || !fee_type || !payment_mode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: student_name, amount, fee_type, and payment_mode are required.'
            });
        }

        const receiptNo = await generateReceiptNo();
        const docId = `manual_${Date.now()}`;
        const numAmount = parseFloat(amount) || 0;

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
        };

        // Store in both collections
        await db.collection(PAYMENTS_PATH).doc(docId).set(record);
        await db.collection(RECEIPTS_PATH).doc(docId).set(record);

        console.log(`✅ [AdmissionPayment] Manual payment recorded: ${receiptNo} (${payment_mode})`);

        res.json({
            success: true,
            message: 'Manual payment recorded successfully',
            receipt_no: receiptNo,
            payment_id: docId
        });

    } catch (err) {
        console.error('[AdmissionPayment] Record Manual Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /history-all
 * Fetches ALL admission fee payment records for reporting
 */
router.get('/history-all', async (req, res) => {
    try {
        const snapshot = await db.collection(PAYMENTS_PATH)
            .orderBy('created_at', 'desc')
            .limit(2000)
            .get();

        const history = [];
        snapshot.forEach(doc => history.push(doc.data()));

        console.log(`[AdmissionPayment] Fetched ${history.length} payment records`);
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

module.exports = router;
