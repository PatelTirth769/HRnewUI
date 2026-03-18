require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Navigation = require('../models/Navigation');

const modules = [
  {
    moduleKey: 'master',
    title: 'Master',
    order: 1,
    adminOnly: true,
    sections: [
      { title: 'Org Setup', icon: 'office-building', items: [
        { label: 'Company', path: '/companies' },
        { label: 'Department', path: '/master/departments' },
        { label: 'Designation', path: '/master/designations' },
        { label: 'Holiday Master', path: '/master/holiday-master' },
        { label: 'Branch', path: '/master/branch' },
      ]},
      { title: 'Employee Data', icon: 'user-circle', items: [
        { label: 'Employee Master', path: '/employee-master' },
        { label: 'Employee Report View', path: '/employee-master/report-view' },
        { label: 'Emp Master Upload', path: '/emp-master-upload' },
        { label: 'Upload Emp Master Update', path: '/upload-emp-master-update' },
        { label: 'Upload ELC Master', path: '/upload-elc-master' },
      ]},
      { title: 'Recruitment Needs', icon: 'clipboard-list', items: [
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
      ]},
    ],
  },
  {
    moduleKey: 'elcLetters',
    title: 'ELC & Letters',
    order: 2,
    adminOnly: true,
    sections: [
      { title: 'Letter Printing', icon: 'document-text', items: [
        { label: 'Offer Letter', path: '/recruitment/job-offer' },
        { label: 'Appointment Letter', path: '/recruitment/appointment-letter' },
        { label: 'Confirmation Letter', path: '/elc/confirmation-letter' },
        { label: 'Address Proof Letter', path: '/elc/address-proof-letter' },
        { label: 'Appraisal Letter', path: '/performance/appraisal' },
        { label: 'Salary Certificate', path: '/elc/salary-certificate' },
        { label: 'Transfer Letter', path: '/elc/transfer-letter' },
        { label: 'Miscellaneous Letter', path: '/elc/miscellaneous-letter' },
      ]},
      { title: 'ELC Process', icon: 'switch-horizontal', items: [
        { label: 'Process Master', path: '/elc/process-master' },
        { label: 'Employee Process Master', path: '/elc/employee-process-master' },
        { label: 'Exit Notes/Remarks/Warnings', path: '/elc/exit-notes' },
        { label: 'Send Mail', path: '/elc/send-mail' },
        { label: 'Letter Designer', path: '/elc/letter-designer' },
        { label: 'Letters Audit Trail', path: '/elc/letters-audit-trail' },
      ]},
    ],
  },
  {
    moduleKey: 'erpPayroll',
    title: 'Payroll',
    order: 3,
    adminOnly: false,
    sections: [
      { title: 'Masters', icon: 'database', items: [
        { label: 'Salary Component', path: '/erp-payroll/salary-component' },
        { label: 'Salary Structure', path: '/erp-payroll/salary-structure' },
        { label: 'Income Tax Slab', path: '/erp-payroll/income-tax-slab' },
        { label: 'Payroll Period', path: '/erp-payroll/payroll-period' },
      ]},
      { title: 'Payroll', icon: 'clock', items: [
        { label: 'Salary Structure Assignment', path: '/erp-payroll/salary-structure-assignment' },
        { label: 'Bulk Salary Structure Assignment', path: '/erp-payroll/bulk-salary-structure-assignment' },
        { label: 'Salary Slip', path: '/erp-payroll/salary-slip' },
        { label: 'Payroll Entry', path: '/erp-payroll/payroll-entry' },
        { label: 'Salary Withholding', path: '/erp-payroll/salary-withholding' },
      ]},
      { title: 'Incentives', icon: 'star', items: [
        { label: 'Additional Salary', path: '/erp-payroll/additional-salary' },
        { label: 'Employee Incentive', path: '/erp-payroll/employee-incentive' },
        { label: 'Retention Bonus', path: '/erp-payroll/retention-bonus' },
      ]},
      { title: 'Tax & Benefits', icon: 'adjustments', items: [
        { label: 'Tax Exemption Declaration', path: '/erp-payroll/tax-exemption-declaration' },
        { label: 'Tax Exemption Proof', path: '/erp-payroll/tax-exemption-proof' },
        { label: 'Tax Exemption Categories', path: '/erp-payroll/tax-exemption-categories' },
        { label: 'Benefit Application', path: '/erp-payroll/benefit-application' },
        { label: 'Benefit Claim', path: '/erp-payroll/benefit-claim' },
      ]},
      { title: 'Payroll Reports', icon: 'presentation-chart-line', items: [
        { label: 'Salary Register', path: '/erp-payroll/reports/salary-register' },
        { label: 'Salary Payments by Mode', path: '/erp-payroll/reports/salary-payments-mode' },
        { label: 'Salary Payments via ECS', path: '/erp-payroll/reports/salary-payments-ecs' },
        { label: 'Income Tax Computation', path: '/erp-payroll/reports/income-tax-computation' },
      ]},
      { title: 'Deduction Reports', icon: 'document-report', items: [
        { label: 'PF Deductions', path: '/erp-payroll/reports/pf-deductions' },
        { label: 'PT Deductions', path: '/erp-payroll/reports/pt-deductions' },
        { label: 'Income Tax Deductions', path: '/erp-payroll/reports/income-tax-deductions' },
      ]},
    ],
  },
  {
    moduleKey: 'hr',
    title: 'HR',
    order: 4,
    adminOnly: false,
    sections: [
      { title: 'Setup', icon: 'cog', items: [
        { label: 'Company', path: '/companies' },
        { label: 'Department', path: '/master/departments' },
        { label: 'Designation', path: '/master/designations' },
        { label: 'Branch', path: '/master/branch' },
      ]},
      { title: 'Employee', icon: 'user-group', items: [
        { label: 'Employee', path: '/employee-master' },
        { label: 'Employee Grade', path: '/master/employee-grade' },
      ]},
      { title: 'Leaves', icon: 'calendar', items: [
        { label: 'Leave Application', path: '/talv/leave-application' },
        { label: 'Compensatory Leave Request', path: '/talv/compensatory-leave-request' },
      ]},
      { title: 'Settings', icon: 'adjustments', items: [
        { label: 'HR Settings', path: '/master/hr-settings' },
      ]},
      { title: 'Attendance', icon: 'clock', items: [
        { label: 'Attendance', path: '/talv/attendance-dashboard' },
        { label: 'Attendance Request', path: '/talv/attendance-request' },
        { label: 'Attendance Control', path: '/talv/attendance-control' },
        { label: 'Employee Checkin', path: '/talv/attendance-reports/shift-punch-register' },
      ]},
      { title: 'Key Reports', icon: 'chart-bar', items: [
        { label: 'Employee Leave Balance', path: '/talv/employee-leave-balance' },
      ]},
    ],
  },
  {
    moduleKey: 'recruitment',
    title: 'Recruitment',
    order: 5,
    adminOnly: false,
    sections: [
      { title: 'Jobs', icon: 'briefcase', items: [
        { label: 'Staffing Plan', path: '/recruitment/staffing-plan', adminOnly: true },
        { label: 'Job Requisition', path: '/recruitment/job-requisition', adminOnly: true },
        { label: 'Job Opening', path: '/recruitment/job-opening' },
        { label: 'Job Applicant', path: '/recruitment/job-applicant', adminOnly: true },
        { label: 'Job Offer', path: '/recruitment/job-offer', adminOnly: true },
        { label: 'Employee Referral', path: '/recruitment/employee-referral' },
        { label: 'Upload Resume', path: '/talv/upload-resume', adminOnly: true },
        { label: 'Resume Database', path: '/talv/resume-database', adminOnly: true },
      ]},
      { title: 'Interviews', icon: 'user-voice', items: [
        { label: 'Interview Type', path: '/recruitment/interview-type', adminOnly: true },
        { label: 'Interview Round', path: '/recruitment/interview-round', adminOnly: true },
        { label: 'Interview', path: '/recruitment/interview', adminOnly: true },
        { label: 'Interview Feedback', path: '/recruitment/interview-feedback', adminOnly: true },
      ]},
      { title: 'Appointment', icon: 'document-text', items: [
        { label: 'Appointment Letter Template', path: '/recruitment/appointment-letter-template', adminOnly: true },
        { label: 'Appointment Letter', path: '/recruitment/appointment-letter', adminOnly: true },
      ]},
      { title: 'Reports', icon: 'chart-pie', items: [
        { label: 'Recruitment Analytics', path: '/recruitment/recruitment-analytics', adminOnly: true },
      ]},
    ],
  },
  {
    moduleKey: 'performance',
    title: 'Performance',
    order: 6,
    adminOnly: false,
    sections: [
      { title: 'Master', icon: 'database', items: [
        { label: 'Appraisal Template', path: '/performance/appraisal-template' },
        { label: 'KRA', path: '/performance/kra', adminOnly: true },
        { label: 'Employee Feedback Criteria', path: '/performance/employee-feedback-criteria', adminOnly: true },
      ]},
      { title: 'Appraisal', icon: 'star', items: [
        { label: 'Appraisal', path: '/performance/appraisal' },
        { label: 'Appraisal Cycle', path: '/performance/appraisal-cycle' },
        { label: 'Employee Performance Feedback', path: '/performance/employee-performance-feedback' },
        { label: 'Employee Performance Feedback by HR', path: '/performance/employee-performance-feedback-by-hr' },
        { label: 'Goal', path: '/performance/goal' },
      ]},
      { title: 'Reports', icon: 'clipboard-list', items: [
        { label: 'Appraisal Overview', path: '/performance/appraisal-overview' },
        { label: 'Training Needs Identification', path: '/performance/training-needs-identification', adminOnly: true },
      ]},
    ],
  },
  {
    moduleKey: 'shiftAttendance',
    title: 'Shift & Attendance',
    order: 7,
    adminOnly: false,
    sections: [
      { title: 'Shifts', icon: 'switch-horizontal', items: [
        { label: 'Shift Type', path: '/talv/shift-master' },
        { label: 'Shift Assignment', path: '/talv/shift-planning-upload' },
      ]},
      { title: 'Attendance', icon: 'fingerprint', items: [
        { label: 'Attendance', path: '/talv/attendance-dashboard' },
        { label: 'Employee Checkin', path: '/talv/attendance-reports/shift-punch-register' },
        { label: 'Upload Attendance', path: '/talv/capture-attendance/import-attendance' },
      ]},
      { title: 'Attendance Report', icon: 'document-report', items: [
        { label: 'Shift Punch Register', path: '/talv/attendance-reports/shift-punch-register' },
        { label: 'Attendance Register', path: '/talv/attendance-reports/attendance-register' },
        { label: 'Over Time/Comp-Off', path: '/talv/attendance-reports/over-time-comp-off' },
        { label: 'Shift Plan Register', path: '/talv/attendance-reports/shift-plan-register' },
        { label: 'Shift Deviation Register', path: '/talv/attendance-reports/shift-deviation-register' },
        { label: 'Absconding Report', path: '/talv/attendance-reports/absconding-report' },
        { label: 'OT Summary', path: '/talv/attendance-reports/ot-summary' },
        { label: 'Headcount/Occupancy Report', path: '/talv/attendance-reports/headcount-occupancy-report' },
      ]},
      { title: 'Reports', icon: 'collection', items: [
        { label: 'Monthly Attendance Sheet', path: '/talv/attendance-reports/attendance-register' },
      ]},
    ],
  },
  {
    moduleKey: 'leave',
    title: 'Leave',
    order: 8,
    adminOnly: false,
    sections: [
      { title: 'Setup', icon: 'cog', items: [
        { label: 'Holiday List', path: '/master/holiday-master' },
        { label: 'Leave Policy', path: '/talv/leave-policy-config', adminOnly: true },
      ]},
      { title: 'Allocation', icon: 'user-add', items: [
        { label: 'Leave Allocation', path: '/talv/employee-leave-master', adminOnly: true },
        { label: 'Upload Opening Leave Balance', path: '/talv/upload-opening-leave-balance', adminOnly: true },
      ]},
      { title: 'Application', icon: 'document-add', items: [
        { label: 'Leave Application', path: '/talv/leave-application' },
        { label: 'Compensatory Leave Request', path: '/talv/compensatory-leave-request' },
        { label: 'HR View Leaves & Outdoor', path: '/talv/hr-view-leaves-outdoor', adminOnly: true },
      ]},
      { title: 'Reports', icon: 'presentation-chart-line', items: [
        { label: 'Employee Leave Balance', path: '/talv/employee-leave-balance' },
      ]},
    ],
  },
];

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not set'); process.exit(1); }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas');
  const moduleKeys = modules.map((mod) => mod.moduleKey);
  await Navigation.deleteMany({ moduleKey: { $nin: moduleKeys } });
  console.log('Removed stale navigation modules');
  for (const mod of modules) {
    await Navigation.findOneAndUpdate(
      { moduleKey: mod.moduleKey },
      mod,
      { upsert: true, new: true }
    );
    console.log(`Seeded: ${mod.moduleKey}`);
  }
  console.log('All modules seeded!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
