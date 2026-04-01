export const moduleNavigation = {
    hr: {
        title: 'HR',
        sections: [
            {
                title: 'Setup',
                icon: 'cog',
                items: [
                    { label: 'Company', path: '/companies' },
                    { label: 'Department', path: '/master/departments' },
                    { label: 'Designation', path: '/master/designations' },
                    { label: 'Branch', path: '/master/branch' },
                ],
            },
            {
                title: 'Employee',
                icon: 'user-group',
                items: [
                    { label: 'Employee', path: '/employee-master' },
                    { label: 'Employee Grade', path: '/master/employee-grade' },
                ],
            },
            {
                title: 'Leaves',
                icon: 'calendar',
                items: [
                    { label: 'Leave Application', path: '/talv/leave-application' },
                    { label: 'Compensatory Leave Request', path: '/talv/compensatory-leave-request' },
                ],
            },
            {
                title: 'Settings',
                icon: 'adjustments',
                items: [
                    { label: 'HR Settings', path: '/master/hr-settings' },
                ],
            },
            {
                title: 'Attendance',
                icon: 'clock',
                items: [
                    { label: 'Attendance', path: '/talv/attendance-dashboard' },
                    { label: 'Attendance Request', path: '/talv/attendance-request' },
                    { label: 'Attendance Control', path: '/talv/attendance-control' },
                    { label: 'Employee Checkin', path: '/talv/attendance-reports/shift-punch-register' },
                ],
            },
            {
                title: 'Key Reports',
                icon: 'chart-bar',
                items: [
                    { label: 'Employee Leave Balance', path: '/talv/employee-leave-balance' },
                ],
            },
        ],
    },
    recruitment: {
        title: 'Recruitment',
        sections: [
            {
                title: 'Jobs',
                icon: 'briefcase',
                items: [
                    { label: 'Staffing Plan', path: '/recruitment/staffing-plan', adminOnly: true },
                    { label: 'Job Requisition', path: '/recruitment/job-requisition', adminOnly: true },
                    { label: 'Job Opening', path: '/recruitment/job-opening' },
                    { label: 'Job Applicant', path: '/recruitment/job-applicant', adminOnly: true },
                    { label: 'Job Offer', path: '/recruitment/job-offer', adminOnly: true },
                    { label: 'Employee Referral', path: '/recruitment/employee-referral' },
                    { label: 'Upload Resume', path: '/talv/upload-resume', adminOnly: true },
                    { label: 'Resume Database', path: '/talv/resume-database', adminOnly: true },
                ],
            },
            {
                title: 'Interviews',
                icon: 'user-voice',
                items: [
                    { label: 'Interview Type', path: '/recruitment/interview-type', adminOnly: true },
                    { label: 'Interview Round', path: '/recruitment/interview-round', adminOnly: true },
                    { label: 'Interview', path: '/recruitment/interview', adminOnly: true },
                    { label: 'Interview Feedback', path: '/recruitment/interview-feedback', adminOnly: true },
                ],
            },
            {
                title: 'Appointment',
                icon: 'document-text',
                items: [
                    { label: 'Appointment Letter Template', path: '/recruitment/appointment-letter-template', adminOnly: true },
                    { label: 'Appointment Letter', path: '/recruitment/appointment-letter', adminOnly: true },
                ],
            },
            {
                title: 'Reports',
                icon: 'chart-pie',
                items: [
                    { label: 'Recruitment Analytics', path: '/recruitment/recruitment-analytics', adminOnly: true },
                ],
            },
            {
                title: 'Settings',
                icon: 'cog',
                items: [
                    { label: 'Recruitment Setting', path: '/recruitment/settings', adminOnly: true },
                ],
            },
        ],
    },
    performance: {
        title: 'Performance',
        sections: [
            {
                title: 'Master',
                icon: 'database',
                items: [
                    { label: 'Appraisal Template', path: '/performance/appraisal-template' },
                    { label: 'KRA', path: '/performance/kra', adminOnly: true },
                    { label: 'Employee Feedback Criteria', path: '/performance/employee-feedback-criteria', adminOnly: true },
                ],
            },
            {
                title: 'Appraisal',
                icon: 'star',
                items: [
                    { label: 'Appraisal', path: '/performance/appraisal' },
                    { label: 'Appraisal Cycle', path: '/performance/appraisal-cycle' },
                    { label: 'Employee Performance Feedback', path: '/performance/employee-performance-feedback' },
                    { label: 'Employee Performance Feedback by HR', path: '/performance/employee-performance-feedback-by-hr' },
                    { label: 'Goal', path: '/performance/goal' },
                ],
            },
            {
                title: 'Reports',
                icon: 'clipboard-list',
                items: [
                    { label: 'Appraisal Overview', path: '/performance/appraisal-overview' },
                    { label: 'Training Needs Identification', path: '/performance/training-needs-identification', adminOnly: true },
                ],
            },
        ],
    },
    shiftAttendance: {
        title: 'Shift & Attendance',
        sections: [
            {
                title: 'Shifts',
                icon: 'switch-horizontal',
                items: [
                    { label: 'Shift Type', path: '/talv/shift-master' },
                    { label: 'Shift Assignment', path: '/talv/shift-planning-upload' },
                ],
            },
            {
                title: 'Attendance',
                icon: 'fingerprint',
                items: [
                    { label: 'Attendance', path: '/talv/attendance-dashboard' },
                    { label: 'Employee Checkin', path: '/talv/attendance-reports/shift-punch-register' },
                    { label: 'Upload Attendance', path: '/talv/capture-attendance/import-attendance' },
                ],
            },
            {
                title: 'Attendance Report',
                icon: 'document-report',
                items: [
                    { label: 'Shift Punch Register', path: '/talv/attendance-reports/shift-punch-register' },
                    { label: 'Attendance Register', path: '/talv/attendance-reports/attendance-register' },
                    { label: 'Over Time/Comp-Off', path: '/talv/attendance-reports/over-time-comp-off' },
                    { label: 'Shift Plan Register', path: '/talv/attendance-reports/shift-plan-register' },
                    { label: 'Shift Deviation Register', path: '/talv/attendance-reports/shift-deviation-register' },
                    { label: 'Absconding Report', path: '/talv/attendance-reports/absconding-report' },
                    { label: 'OT Summary', path: '/talv/attendance-reports/ot-summary' },
                    { label: 'Headcount/Occupancy Report', path: '/talv/attendance-reports/headcount-occupancy-report' },
                ],
            },
            {
                title: 'Reports',
                icon: 'collection',
                items: [
                    { label: 'Monthly Attendance Sheet', path: '/talv/attendance-reports/attendance-register' },
                ],
            },
        ],
    },
    leave: {
        title: 'Leave',
        sections: [
            {
                title: 'Setup',
                icon: 'cog',
                items: [
                    { label: 'Holiday List', path: '/master/holiday-master' },
                    { label: 'Leave Policy', path: '/talv/leave-policy-config', adminOnly: true },
                ],
            },
            {
                title: 'Allocation',
                icon: 'user-add',
                items: [
                    { label: 'Leave Allocation', path: '/talv/employee-leave-master', adminOnly: true },
                    { label: 'Upload Opening Leave Balance', path: '/talv/upload-opening-leave-balance', adminOnly: true },
                ],
            },
            {
                title: 'Application',
                icon: 'document-add',
                items: [
                    { label: 'Leave Application', path: '/talv/leave-application' },
                    { label: 'Compensatory Leave Request', path: '/talv/compensatory-leave-request' },
                    { label: 'HR View Leaves & Outdoor', path: '/talv/hr-view-leaves-outdoor', adminOnly: true },
                ],
            },
            {
                title: 'Reports',
                icon: 'presentation-chart-line',
                items: [
                    { label: 'Employee Leave Balance', path: '/talv/employee-leave-balance' },
                ],
            },
        ],
    },
    erpPayroll: {
        title: 'Payroll',
        sections: [
            {
                title: 'Masters',
                icon: 'database',
                items: [
                    { label: 'Salary Component', path: '/erp-payroll/salary-component' },
                    { label: 'Salary Structure', path: '/erp-payroll/salary-structure' },
                    { label: 'Income Tax Slab', path: '/erp-payroll/income-tax-slab' },
                    { label: 'Payroll Period', path: '/erp-payroll/payroll-period' },
                ],
            },
            {
                title: 'Payroll',
                icon: 'clock',
                items: [
                    { label: 'Salary Structure Assignment', path: '/erp-payroll/salary-structure-assignment' },
                    { label: 'Bulk Salary Structure Assignment', path: '/erp-payroll/bulk-salary-structure-assignment' },
                    { label: 'Salary Slip', path: '/erp-payroll/salary-slip' },
                    { label: 'Payroll Entry', path: '/erp-payroll/payroll-entry' },
                    { label: 'Salary Withholding', path: '/erp-payroll/salary-withholding' },
                ],
            },
            {
                title: 'Incentives',
                icon: 'star',
                items: [
                    { label: 'Additional Salary', path: '/erp-payroll/additional-salary' },
                    { label: 'Employee Incentive', path: '/erp-payroll/employee-incentive' },
                    { label: 'Retention Bonus', path: '/erp-payroll/retention-bonus' },
                ],
            },
            {
                title: 'Tax & Benefits',
                icon: 'adjustments',
                items: [
                    { label: 'Tax Exemption Declaration', path: '/erp-payroll/tax-exemption-declaration' },
                    { label: 'Tax Exemption Proof', path: '/erp-payroll/tax-exemption-proof' },
                    { label: 'Tax Exemption Categories', path: '/erp-payroll/tax-exemption-categories' },
                    { label: 'Benefit Application', path: '/erp-payroll/benefit-application' },
                    { label: 'Benefit Claim', path: '/erp-payroll/benefit-claim' },
                ],
            },
            {
                title: 'Payroll Reports',
                icon: 'presentation-chart-line',
                items: [
                    { label: 'Salary Register', path: '/erp-payroll/reports/salary-register' },
                    { label: 'Salary Payments by Mode', path: '/erp-payroll/reports/salary-payments-mode' },
                    { label: 'Salary Payments via ECS', path: '/erp-payroll/reports/salary-payments-ecs' },
                    { label: 'Income Tax Computation', path: '/erp-payroll/reports/income-tax-computation' },
                ],
            },
            {
                title: 'Deduction Reports',
                icon: 'document-report',
                items: [
                    { label: 'PF Deductions', path: '/erp-payroll/reports/pf-deductions' },
                    { label: 'PT Deductions', path: '/erp-payroll/reports/pt-deductions' },
                    { label: 'Income Tax Deductions', path: '/erp-payroll/reports/income-tax-deductions' },
                ],
            },
        ],
    },
    elcLetters: {
        title: 'ELC & Letters',
        sections: [
            {
                title: 'Letter Printing',
                icon: 'document-text',
                items: [
                    { label: 'Offer Letter', path: '/recruitment/job-offer' },
                    { label: 'Appointment Letter', path: '/recruitment/appointment-letter' },
                    { label: 'Confirmation Letter', path: '/elc/confirmation-letter' },
                    { label: 'Address Proof Letter', path: '/elc/address-proof-letter' },
                    { label: 'Appraisal Letter', path: '/performance/appraisal' },
                    { label: 'Salary Certificate', path: '/elc/salary-certificate' },
                    { label: 'Transfer Letter', path: '/elc/transfer-letter' },
                    { label: 'Miscellaneous Letter', path: '/elc/miscellaneous-letter' },
                ],
            },
            {
                title: 'ELC Process',
                icon: 'switch-horizontal',
                items: [
                    { label: 'Process Master', path: '/elc/process-master' },
                    { label: 'Employee Process Master', path: '/elc/employee-process-master' },
                    { label: 'Exit Notes/Remarks/Warnings', path: '/elc/exit-notes' },
                    { label: 'Send Mail', path: '/elc/send-mail' },
                    { label: 'Letter Designer', path: '/elc/letter-designer' },
                    { label: 'Letters Audit Trail', path: '/elc/letters-audit-trail' },
                ],
            },
        ],
    },
    master: {
        title: 'Master',
        sections: [
            {
                title: 'Org Setup',
                icon: 'office-building',
                items: [
                    { label: 'Company', path: '/companies' },
                    { label: 'Department', path: '/master/departments' },
                    { label: 'Designation', path: '/master/designations' },
                    { label: 'Holiday Master', path: '/master/holiday-master' },
                    { label: 'Branch', path: '/master/branch' },
                ],
            },
            {
                title: 'Employee Data',
                icon: 'user-circle',
                items: [
                    { label: 'Employee Master', path: '/employee-master' },
                    { label: 'Employee Report View', path: '/employee-master/report-view' },
                    { label: 'Emp Master Upload', path: '/emp-master-upload' },
                    { label: 'Upload Emp Master Update', path: '/upload-emp-master-update' },
                    { label: 'Upload ELC Master', path: '/upload-elc-master' },
                ],
            },
            {
                title: 'Recruitment Needs',
                icon: 'clipboard-list',
                items: [
                    { label: 'Position', path: '/needs/position' },
                    { label: 'Vendor', path: '/needs/vendor' },
                    { label: 'CV Status', path: '/needs/cv-status' },
                    { label: 'Miscellaneous', path: '/needs/miscellaneous' },
                    { label: 'Manpower Budget', path: '/needs/manpower-budget' },
                    { label: 'Talent Register', path: '/needs/talent-register' },
                    { label: 'Manage CV', path: '/needs/manage-cv' },
                    { label: 'Search CV', path: '/needs/search-cv' },
                    { label: 'TR Tracker', path: '/needs/tr-tracker' },
                    { label: 'Upload Candidate Master', path: '/needs/upload-candidate-master' },
                    { label: 'Talent Acquisition', path: '/needs/talent-acquisition' },
                    { label: 'Talent Acquisition Approval', path: '/needs/talent-acquisition-approval' },
                    { label: 'Talent Acquisition Manager Approval', path: '/needs/talent-acquisition-manager-approval' },
                    { label: 'HR View Talent Acquisitions', path: '/needs/hr-view-talent-acquisitions' },
                ],
            },
            {
                title: 'Settings',
                icon: 'cog',
                items: [
                    { label: 'Settings', path: '/settings' },
                ],
            },
        ],
    },
    approvers: {
        title: 'Approvers',
        sections: [
            {
                title: 'Approvals',
                icon: 'briefcase',
                items: [
                    { label: 'Attendance Regularisation', path: '/approver/approvals-attendance-regularisation' },
                    { label: 'Leave/OD/WFH', path: '/approver/approvals-leave-od-wfh' },
                    { label: 'HelpDesk', path: '/approver/approvals-helpdesk' },
                    { label: 'Work On Holiday', path: '/approver/approvals-work-on-holiday' },
                    { label: 'Resignations', path: '/approver/approvals-resignations' },
                    { label: 'Confirmation Review', path: '/approver/approvals-confirmation-review' },
                    { label: 'HOD Attendance Regularisation', path: '/approver/approvals-hod-attendance-regularisation' },
                    { label: 'Proxy Leave Application', path: '/approver/approvals-proxy-leave-application' },
                ],
            },
            {
                title: 'HR Approvals',
                icon: 'user-group',
                items: [
                    { label: 'Attendance Regularisation', path: '/approver/hrapprovals-attendance-regularisation' },
                    { label: 'Resignations', path: '/approver/hrapprovals-resignations' },
                    { label: 'HR Confirmation Review', path: '/approver/hrapprovals-hr-confirmation-review' },
                    { label: 'Work On Holiday', path: '/approver/hrapprovals-work-on-holiday' },
                ],
            },
            {
                title: 'Finance Approval',
                icon: 'chart-bar',
                items: [
                    { label: 'Expense Requisition', path: '/approver/financeapproval-expense-requisition' },
                    { label: 'Expense Claim', path: '/approver/financeapproval-expense-claim' },
                ],
            },
            {
                title: 'Claim Approval',
                icon: 'document-text',
                items: [
                    { label: 'Expense Claim', path: '/approver/claimapproval-expense-claim' },
                    { label: 'Reimbursement', path: '/approver/claimapproval-reimbursement' },
                    { label: 'Expense Requisition', path: '/approver/claimapproval-expense-requisition' },
                ],
            },
        ],
    },
    assets: {
        title: 'Assets',
        sections: [
            {
                title: 'Assets',
                icon: 'database',
                items: [
                    { label: 'Asset', path: '/assets/asset' },
                    { label: 'Asset Movement', path: '/assets/asset-movement' },
                    { label: 'Asset Category', path: '/assets/asset-category' },
                    { label: 'Location', path: '/assets/location' },
                ],
            },
            {
                title: 'Maintenance',
                icon: 'cog',
                items: [
                    { label: 'Asset Maintenance Team', path: '/assets/asset-maintenance-team' },
                    { label: 'Asset Maintenance', path: '/assets/asset-maintenance' },
                    { label: 'Asset Maintenance Log', path: '/assets/asset-maintenance-log' },
                    { label: 'Asset Value Adjustment', path: '/assets/asset-value-adjustment' },
                    { label: 'Asset Repair', path: '/assets/asset-repair' },
                    { label: 'Asset Capitalization', path: '/assets/asset-capitalization' },
                ],
            },
            {
                title: 'Reports',
                icon: 'chart-bar',
                items: [
                    { label: 'Asset Depreciation Ledger', path: '/assets/report/asset-depreciation-ledger' },
                    { label: 'Asset Depreciations and Balances', path: '/assets/report/asset-depreciations-balances' },
                    { label: 'Asset Maintenance Report', path: '/assets/report/asset-maintenance' },
                    { label: 'Asset Activity Report', path: '/assets/report/asset-activity' },
                ],
            },
        ],
    },
    education: {
        title: 'Education',
        sections: [
            {
                title: 'Master',
                icon: 'database',
                items: [
                    { label: 'Program', path: '/education/program' },
                    { label: 'Course', path: '/education/course' },
                    { label: 'Topic', path: '/education/topic' },
                    { label: 'Room', path: '/education/room' },
                ],
            },
            {
                title: 'CONTENT MASTER',
                icon: 'file-text',
                items: [
                    { label: 'Article', path: '/education/article' },
                    { label: 'Video', path: '/education/video' },
                    { label: 'Quiz', path: '/education/quiz' },
                ],
            },
            {
                title: 'Student and Instructor',
                icon: 'user-group',
                items: [
                    { label: 'Student', path: '/education/student' },
                    { label: 'Student Group', path: '/education/student-group' },
                    { label: 'Student Log', path: '/education/student-log' },
                    { label: 'Instructor', path: '/education/instructor' },
                    { label: 'Guardian', path: '/education/guardian' },
                ],
            },
            {
                title: 'ADMISSION',
                icon: 'academic-cap',
                items: [
                    { label: 'Student Admission', path: '/education/student-admission' },
                    { label: 'Student Applicant', path: '/education/student-applicant' },
                    { label: 'Program Enrollment', path: '/education/program-enrollment' },
                    { label: 'Course Enrollment', path: '/education/course-enrollment' },
                ],
            },
            {
                title: 'Schedule',
                icon: 'calendar',
                items: [
                    { label: 'Course Schedule', path: '/education/course-schedule' },
                    { label: 'Course Scheduling Tool', path: '/education/course-scheduling-tool' },
                ],
            },
            {
                title: 'ATTENDANCE',
                icon: 'check-badge',
                items: [
                    { label: 'Student Attendance', path: '/education/student-attendance' },
                    { label: 'Student Leave Application', path: '/education/student-leave-application' },
                    { label: 'Student Monthly Attendance Sheet', path: '/education/student-monthly-attendance-sheet' },
                    { label: 'Absent Student Report', path: '/education/absent-student-report' },
                    { label: 'Student Batch-Wise Attendance', path: '/education/student-batch-wise-attendance' },
                    { label: 'Course Enrollment', path: '/education/course-enrollment' },
                    { label: 'Course Activity', path: '/education/course-activity' },
                    { label: 'Quiz Activity', path: '/education/quiz-activity' },
                ],
            },
            {
                title: 'ASSESSMENT',
                items: [
                    { label: 'Assessment Plan', path: '/education/assessment-plan' },
                    { label: 'Assessment Group', path: '/education/assessment-group' },
                    { label: 'Assessment Result', path: '/education/assessment-result' },
                    { label: 'Assessment Criteria', path: '/education/assessment-criteria' },
                ],
            },
            {
                title: 'Assessment Reports',
                icon: 'presentation-chart-line',
                items: [
                    { label: 'Course wise Assessment Report', path: '/education/course-wise-assessment-report' },
                    { label: 'Final Assessment Grades', path: '/education/final-assessment-grades' },
                    { label: 'Assessment Plan Status', path: '/education/assessment-plan-status' },
                    { label: 'Student Report Generation Tool', path: '/education/student-report-generation-tool' },
                ],
            },
            {
                title: 'Tools',
                icon: 'view-grid-add',
                items: [
                    { label: 'Student Attendance Tool', path: '/education/student-attendance-tool' },
                    { label: 'Assessment Result Tool', path: '/education/assessment-result-tool' },
                    { label: 'Student Group Creation Tool', path: '/education/student-group-creation-tool' },
                    { label: 'Program Enrollment Tool', path: '/education/program-enrollment-tool' },
                    { label: 'Course Scheduling Tool', path: '/education/course-scheduling-tool' },
                ],
            },
            {
                title: 'Other Reports',
                icon: 'document-text',
                items: [
                    { label: 'Student and Guardian Contact Details', path: '/education/student-and-guardian-contact-details-report' },
                ],
            },
            {
                title: 'FEES',
                icon: 'banknotes',
                items: [
                    { label: 'Fee Structure', path: '/education/fee-structure' },
                    { label: 'Fee Category', path: '/education/fee-category' },
                    { label: 'Fee Schedule', path: '/education/fee-schedule' },
                    { label: 'Fees', path: '/education/fees' },
                    { label: 'Student Fee Collection', path: '/education/student-fee-collection' },
                    { label: 'Program wise Fee Collection', path: '/education/program-wise-fee-collection' },
                ],
            },
            {
                title: 'SETTINGS',
                icon: 'cog',
                items: [
                    { label: 'Education Settings', path: '/education/settings' },
                    { label: 'Student Category', path: '/education/student-category' },
                    { label: 'Student Batch Name', path: '/education/student-batch-name' },
                    { label: 'Grading Scale', path: '/education/grading-scale' },
                    { label: 'Academic Year', path: '/education/academic-year' },
                    { label: 'Academic Term', path: '/education/academic-term' },
                ],
            },
        ],
    },
    accounting: {
        title: 'Accounting',
        sections: [
            {
                title: 'Tax Masters',
                icon: 'receipt-tax',
                items: [
                    { label: 'Sales Taxes and Charges Template', path: '/accounting/sales-taxes-template' },
                    { label: 'Purchase Taxes and Charges Template', path: '/accounting/purchase-taxes-template' },
                    { label: 'Item Tax Template', path: '/accounting/item-tax-template' },
                    { label: 'Tax Category', path: '/accounting/tax-category' },
                    { label: 'Tax Rule', path: '/accounting/tax-rule' },
                    { label: 'Tax Withholding Category', path: '/accounting/tax-withholding-category' },
                    { label: 'Lower Deduction Certificate', path: '/accounting/lower-deduction-certificate' },
                ],
            },
            {
                title: 'Accounting Masters',
                icon: 'database',
                items: [
                    { label: 'Company', path: '/accounting/company' },
                    { label: 'Chart of Accounts', path: '/accounting/chart-of-accounts' },
                    { label: 'Fiscal Year', path: '/accounting/fiscal-year' },
                    { label: 'Account Settings', path: '/accounting/accounts-settings' },
                    { label: 'Accounting Dimension', path: '/accounting/accounting-dimension' },
                    { label: 'Finance Book', path: '/accounting/finance-book' },
                    { label: 'Accounting Period', path: '/accounting/accounting-period' },
                    { label: 'Payment Term', path: '/accounting/payment-term' },
                ],
            },
            {
                title: 'Payments',
                icon: 'collection',
                items: [
                    { label: 'Payment Entry', path: '/accounting/payment-entry' },
                    { label: 'Journal Entry', path: '/accounting/journal-entry' },
                    { label: 'Journal Entry Template', path: '/accounting/journal-entry-template' },
                    { label: 'Terms and Conditions', path: '/accounting/terms-and-conditions' },
                    { label: 'Mode of Payment', path: '/accounting/mode-of-payment' },
                ],
            },
            {
                title: 'Cost Center and Budgeting',
                icon: 'view-grid-add',
                items: [
                    { label: 'Cost Center', path: '/accounting/cost-center' },
                    { label: 'Budget', path: '/accounting/budget' },
                    { label: 'Budget Variations Report', path: '/accounting/budget-variations' },
                    { label: 'Accounting Dimension', path: '/accounting/accounting-dimension' },
                    { label: 'Cost Center Allocation', path: '/accounting/cost-center-allocation' },
                    { label: 'Monthly Distribution', path: '/accounting/monthly-distribution' },
                ],
            },
            {
                title: 'Multi Currency',
                icon: 'currency-dollar',
                items: [
                    { label: 'Currency', path: '/accounting/currency' },
                    { label: 'Currency Exchange', path: '/accounting/currency-exchange' },
                    { label: 'Exchange Rate Revaluation', path: '/accounting/exchange-rate-revaluation' },
                ],
            },
            {
                title: 'Banking',
                icon: 'library',
                items: [
                    { label: 'Bank', path: '/accounting/bank' },
                ],
            }
        ],
    },
    selling: {
        title: 'Selling',
        sections: [
            {
                title: 'Selling',
                icon: 'collection',
                items: [
                    { label: 'Customer', path: '/selling/customer' },
                    { label: 'Quotation', path: '/selling/quotation' },
                    { label: 'Sales Order', path: '/selling/sales-order' },
                    { label: 'Sales Invoice', path: '/selling/sales-invoice' },
                    { label: 'Blanket Order', path: '/selling/blanket-order' },
                    { label: 'Sales Partner', path: '/selling/sales-partner' },
                    { label: 'Sales Person', path: '/selling/sales-person' },
                ],
            },
            {
                title: 'Point of Sale',
                icon: 'shopping-cart',
                items: [
                    { label: 'Loyalty Program', path: '/selling/loyalty-program' },
                    { label: 'Loyalty Point Entry', path: '/selling/loyalty-point-entry' },
                ],
            },
            {
                title: 'Items and Pricing',
                icon: 'tag',
                items: [
                    { label: 'Item', path: '/selling/item' },
                    { label: 'Item Price', path: '/selling/item-price' },
                    { label: 'Price List', path: '/selling/price-list' },
                    { label: 'Item Group', path: '/selling/item-group' }
                ],
            }
        ],
    },
};
