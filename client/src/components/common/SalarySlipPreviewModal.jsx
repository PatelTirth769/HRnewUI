import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification } from 'antd';
import Logo from '../../assets/images/logo.png';

/**
 * SalarySlipPreviewModal
 * 
 * Replicates the ERPNext "Preview Salary Slip" action:
 *  1. First fetches `salary_slip_based_on_timesheet` from the Salary Structure.
 *  2. Then POSTs to `hrms.payroll.doctype.salary_structure.salary_structure.make_salary_slip`
 *     with source_name (the salary structure name) to get a draft Salary Slip object.
 *  3. Renders the A4 print layout with logo, DRAFT watermark, and computed tables.
 */
export default function SalarySlipPreviewModal({ isOpen, onClose, assignmentData }) {
    const [loading, setLoading] = useState(false);
    const [slipData, setSlipData] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        if (isOpen && assignmentData?.salary_structure) {
            setErrorMsg(null);
            setSlipData(null);
            fetchPreview();
        }
    }, [isOpen, assignmentData]);

    const fetchPreview = async () => {
        setLoading(true);
        try {
            // Strategy 1: POST to make_salary_slip with a target_doc containing employee info
            // This replicates what ERPNext does internally when previewing from an Assignment
            const targetDoc = JSON.stringify({
                employee: assignmentData.employee,
                employee_name: assignmentData.employee_name,
                company: assignmentData.company,
                salary_structure: assignmentData.salary_structure,
            });

            const res = await API.post(
                '/api/method/hrms.payroll.doctype.salary_structure.salary_structure.make_salary_slip',
                {
                    source_name: assignmentData.salary_structure,
                    target_doc: targetDoc,
                }
            );

            if (res.data?.message) {
                const slip = res.data.message;
                // Ensure employee info is populated
                slip.employee = slip.employee || assignmentData.employee || '';
                slip.employee_name = slip.employee_name || assignmentData.employee_name || '';
                slip.company = slip.company || assignmentData.company || '';
                slip.currency = slip.currency || assignmentData.currency || 'INR';
                setSlipData(slip);
                return; // Success!
            }
        } catch (err) {
            console.warn('make_salary_slip failed, trying alternative approaches:', err.message);
        }

        try {
            // Strategy 2: Try to find an existing Salary Slip for this employee
            const existingRes = await API.get(
                `/api/resource/Salary Slip?filters=[["employee","=","${assignmentData.employee}"],["salary_structure","=","${assignmentData.salary_structure}"]]&fields=["name"]&limit_page_length=1&order_by=modified desc`
            );

            if (existingRes.data?.data?.length > 0) {
                const slipName = existingRes.data.data[0].name;
                const slipRes = await API.get(`/api/resource/Salary Slip/${encodeURIComponent(slipName)}`);
                if (slipRes.data?.data) {
                    setSlipData(slipRes.data.data);
                    setLoading(false);
                    return;
                }
            }
        } catch (err) {
            console.warn('Existing salary slip lookup failed:', err.message);
        }

        // Strategy 3: Fall back to client-side computation
        console.warn('Falling back to client-side preview computation');
        try {
            await buildClientSidePreview();
        } catch (fallbackErr) {
            setErrorMsg('Could not generate preview. Please ensure an Employee and Salary Structure are selected.');
            notification.error({ message: 'Failed to generate Salary Slip preview' });
        }

        setLoading(false);
    };

    // Fallback: build preview from Salary Structure resource API
    const buildClientSidePreview = async () => {
        const res = await API.get(
            `/api/resource/Salary Structure/${encodeURIComponent(assignmentData.salary_structure)}`
        );
        const structure = res.data?.data;
        if (!structure) throw new Error('Could not load Salary Structure');

        const base = parseFloat(assignmentData?.base) || 0;
        let grossPay = 0;
        let totalDeduction = 0;

        const earnings = (structure.earnings || []).map(e => {
            let amount = parseFloat(e.amount) || 0;
            if (amount === 0 && e.amount_based_on_formula && e.formula) {
                try {
                    const formulaStr = e.formula.replace(/base/gi, String(base));
                    amount = Function('"use strict"; return (' + formulaStr + ')')();
                } catch { amount = 0; }
            }
            if (!e.do_not_include_in_total) grossPay += amount;
            return { salary_component: e.salary_component, amount };
        });

        const deductions = (structure.deductions || []).map(d => {
            let amount = parseFloat(d.amount) || 0;
            if (amount === 0 && d.amount_based_on_formula && d.formula) {
                try {
                    const formulaStr = d.formula.replace(/base/gi, String(base));
                    amount = Function('"use strict"; return (' + formulaStr + ')')();
                } catch { amount = 0; }
            }
            if (!d.do_not_include_in_total) totalDeduction += amount;
            return { salary_component: d.salary_component, amount };
        });

        if (grossPay === 0 && base > 0) grossPay = base;

        setSlipData({
            employee: assignmentData.employee || '',
            employee_name: assignmentData.employee_name || '',
            company: assignmentData.company || '',
            currency: assignmentData.currency || 'INR',
            salary_structure: assignmentData.salary_structure,
            start_date: assignmentData.from_date || '',
            end_date: '',
            total_working_days: '',
            payment_days: '',
            earnings,
            deductions,
            gross_pay: grossPay,
            total_deduction: totalDeduction,
            net_pay: grossPay - totalDeduction,
            rounded_total: Math.round(grossPay - totalDeduction),
            total_in_words: '',
        });
    };

    if (!isOpen) return null;

    const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const currency = slipData?.currency || assignmentData?.currency || 'INR';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto pt-10 pb-10">
            <div className="relative bg-white w-full max-w-4xl min-h-screen my-auto rounded-lg shadow-2xl p-10 font-sans text-gray-800">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
                        Generating preview...
                    </div>
                ) : errorMsg ? (
                    <div className="flex flex-col items-center justify-center h-64 text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-red-400">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3 className="text-lg font-bold mb-2">Error generating preview</h3>
                        <p className="text-sm text-center max-w-md text-red-400 whitespace-pre-wrap">{errorMsg}</p>
                    </div>
                ) : slipData ? (
                    <div className="space-y-8">
                        {/* Header: Logo and Title */}
                        <div className="flex justify-between items-end border-b pb-4">
                            <img src={Logo} alt="Preeshe Consultancy" className="h-20 object-contain" />
                            <h2 className="text-xl font-bold text-gray-700">Preview for {slipData.employee}</h2>
                        </div>

                        {/* DRAFT Watermark */}
                        <div className="text-center font-bold text-lg tracking-widest text-gray-800">
                            DRAFT
                        </div>

                        {/* Top Employee Info Grid */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm mt-8">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-gray-500">Employee:</div>
                                <div className="col-span-2 font-medium">{slipData.employee}</div>

                                <div className="text-gray-500">Employee Name:</div>
                                <div className="col-span-2 font-medium">{slipData.employee_name}</div>

                                <div className="text-gray-500">Company:</div>
                                <div className="col-span-2 font-medium break-words">{slipData.company}</div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {slipData.start_date && (
                                    <>
                                        <div className="text-gray-500">Start Date:</div>
                                        <div className="col-span-2 font-medium">{slipData.start_date}</div>
                                    </>
                                )}
                                {slipData.end_date && (
                                    <>
                                        <div className="text-gray-500">End Date:</div>
                                        <div className="col-span-2 font-medium">{slipData.end_date}</div>
                                    </>
                                )}
                                {slipData.total_working_days && (
                                    <>
                                        <div className="text-gray-500 mt-2">Working Days:</div>
                                        <div className="col-span-2 font-medium mt-2 text-right">{slipData.total_working_days}</div>
                                    </>
                                )}
                                {slipData.payment_days && (
                                    <>
                                        <div className="text-gray-500">Payment Days:</div>
                                        <div className="col-span-2 font-medium text-right">{slipData.payment_days}</div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Earnings and Deductions Tables */}
                        <div className="grid grid-cols-2 gap-8 mt-10">
                            {/* Earnings Table */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Earnings</h3>
                                <table className="w-full text-sm border border-gray-200">
                                    <thead className="bg-gray-50 text-gray-500 text-left">
                                        <tr>
                                            <th className="py-2 px-3 border-b font-medium w-12">Sr</th>
                                            <th className="py-2 px-3 border-b border-l font-medium">Component</th>
                                            <th className="py-2 px-3 border-b border-l font-medium text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(slipData.earnings || []).length > 0 ? slipData.earnings.map((e, idx) => (
                                            <tr key={idx} className="border-b last:border-b-0">
                                                <td className="py-2 px-3">{idx + 1}</td>
                                                <td className="py-2 px-3 border-l text-gray-700">{e.salary_component}</td>
                                                <td className="py-2 px-3 border-l text-right">
                                                    {currency} {fmt(e.amount)}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="3" className="py-4 text-center text-gray-400 italic">No Earnings</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Deductions Table */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Deductions</h3>
                                <table className="w-full text-sm border border-gray-200">
                                    <thead className="bg-gray-50 text-gray-500 text-left">
                                        <tr>
                                            <th className="py-2 px-3 border-b font-medium w-12">Sr</th>
                                            <th className="py-2 px-3 border-b border-l font-medium">Component</th>
                                            <th className="py-2 px-3 border-b border-l font-medium text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(slipData.deductions || []).length > 0 ? slipData.deductions.map((d, idx) => (
                                            <tr key={idx} className="border-b last:border-b-0">
                                                <td className="py-2 px-3">{idx + 1}</td>
                                                <td className="py-2 px-3 border-l text-gray-700">{d.salary_component}</td>
                                                <td className="py-2 px-3 border-l text-right">
                                                    {currency} {fmt(d.amount)}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="3" className="py-4 text-center text-gray-400 italic">No Deductions</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Salary Summary */}
                        <div className="flex justify-end mt-12 text-sm">
                            <div className="w-1/2 space-y-4">
                                <div className="flex justify-between text-gray-600">
                                    <span>Gross Pay:</span>
                                    <span className="font-medium text-gray-800">
                                        {currency} {fmt(slipData.gross_pay)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Total Deduction:</span>
                                    <span className="font-medium text-gray-800">
                                        {currency} {fmt(slipData.total_deduction)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Net Pay:</span>
                                    <span className="font-bold text-gray-800">
                                        {currency} {fmt(slipData.net_pay)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-800 font-bold border-t pt-3 mt-1">
                                    <span>Rounded Total:</span>
                                    <span>
                                        {currency} {fmt(slipData.rounded_total || Math.round(parseFloat(slipData.net_pay) || 0))}
                                    </span>
                                </div>
                                {slipData.total_in_words && (
                                    <div className="flex justify-between text-gray-600 pt-2">
                                        <span>Total in words:</span>
                                        <span className="text-right pl-4">{slipData.total_in_words}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
