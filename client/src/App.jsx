import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import Header from './components/common/Header';
import { useUserRole } from './hooks/useUserRole';
import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import EmployeeSelfService from './pages/ESS/EmployeeSelfService';
import Approver from './pages/ESS/Approver';

import EmployeeMIS from './pages/EmployeeMIS';
import CompanyMaster from './components/company/CompanyMaster';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import ChartOfAccounts from './pages/Accounting/ChartOfAccounts';
import AccountSettings from './pages/Accounting/AccountSettings';
import FiscalYear from './pages/Accounting/FiscalYear';
import AccountingDimension from './pages/Accounting/AccountingDimension';
import FinanceBook from './pages/Accounting/FinanceBook';
import AccountingPeriod from './pages/Accounting/AccountingPeriod';
import PaymentTerm from './pages/Accounting/PaymentTerm';
import ModeOfPayment from './pages/Accounting/ModeOfPayment';
import SalesTaxesTemplate from './pages/Accounting/SalesTaxesTemplate';
import PurchaseTaxesTemplate from './pages/Accounting/PurchaseTaxesTemplate';
import ItemTaxTemplate from './pages/Accounting/ItemTaxTemplate';
import TaxCategory from './pages/Accounting/TaxCategory';
import TaxRule from './pages/Accounting/TaxRule';
import TaxWithholdingCategory from './pages/Accounting/TaxWithholdingCategory';
import LowerDeductionCertificate from './pages/Accounting/LowerDeductionCertificate';
import PaymentEntry from './pages/Accounting/PaymentEntry';
import JournalEntry from './pages/Accounting/JournalEntry';
import JournalEntryTemplate from './pages/Accounting/JournalEntryTemplate';
import TermsAndConditions from './pages/Accounting/TermsAndConditions';
import CostCenter from './pages/Accounting/CostCenter';
import Budget from './pages/Accounting/Budget';
import BudgetVariations from './pages/Accounting/BudgetVariations';
import CostCenterAllocation from './pages/Accounting/CostCenterAllocation';
import MonthlyDistribution from './pages/Accounting/MonthlyDistribution';
import Currency from './pages/Accounting/Currency';
import CurrencyExchange from './pages/Accounting/CurrencyExchange';
import ExchangeRateRevaluation from './pages/Accounting/ExchangeRateRevaluation';
import Bank from './pages/Accounting/Bank';
import Item from './pages/Accounting/Item';
import LoginPage from './pages/auth/LoginPage.jsx';
import Register from './pages/auth/Register.jsx';
import DepartmentList from './pages/departments/DepartmentList';
import DepartmentDetail from './pages/departments/DepartmentDetail';
import DepartmentEdit from './pages/departments/DepartmentEdit';
import DepartmentForm from './pages/departments/DepartmentForm';
import DesignationList from './pages/designations/DesignationList';
import DesignationDetail from './pages/designations/DesignationDetail';
import DesignationEdit from './pages/designations/DesignationEdit';
import HolidayList from './pages/holidays/HolidayList';
import HolidayEdit from './pages/holidays/HolidayEdit';
import HolidayNew from './pages/holidays/HolidayNew';
import EntityMaster from './pages/masters/EntityMaster';
import EntityEdit from './pages/masters/EntityEdit';
import QualificationMaster from './pages/masters/QualificationMaster';
import QualificationEdit from './pages/masters/QualificationEdit';
import QualificationNew from './pages/masters/QualificationNew';
import CityMaster from './pages/CityMaster/CityMaster';
import StateMaster from './pages/StateMaster/StateMaster';
import CountryMaster from './pages/CountryMaster/CountryMaster';
import BankMaster from './pages/BankMaster/BankMaster';
import AddBank from './pages/BankMaster/AddBank';
import HRSettings from './pages/Master/HRSettings';
import EmployeeGrade from './pages/Master/EmployeeGrade';
import Branch from './pages/Master/Branch';
import TickerMaster from './pages/TickerMaster/TickerMaster';
import AddTicker from './pages/TickerMaster/AddTicker';
import EventPlanner from './pages/EventPlanner/EventPlanner';
import AddEvent from './pages/EventPlanner/AddEvent';
import PolicyUpload from './pages/PolicyUpload/PolicyUpload';
import AddPolicy from './pages/PolicyUpload/AddPolicy';
import EmployeeMaster from './pages/EmployeeMaster/EmployeeMaster';
import AddEmployee from './pages/EmployeeMaster/AddEmployee';
import EmployeeReportView from './pages/EmployeeMaster/EmployeeReportView';
import UploadEmpMasterUpdate from './pages/UploadEmpMasterUpdate/UploadEmpMasterUpdate';
import ReportingFinanceManagerMapping from './pages/ReportingFinanceManagerMapping/ReportingFinanceManagerMapping';
import AddReportingFinanceMapping from './pages/ReportingFinanceManagerMapping/AddReportingFinanceMapping';
import NeedsPage from './pages/Needs/NeedsPage';
import Vendor from './pages/Needs/Vendor';
import CVStatus from './pages/Needs/CVStatus';
import Miscellaneous from './pages/Needs/Miscellaneous';
import ManpowerBudget from './pages/Needs/ManpowerBudget';
import TalentRegister from './pages/Needs/TalentRegister';
import ManageCV from './pages/Needs/ManageCV';
import SearchCV from './pages/Needs/SearchCV';
import TRTracker from './pages/Needs/TRTracker';
import UploadCandidateMaster from './pages/Needs/UploadCandidateMaster';
import TalentAcquisition from './pages/Needs/TalentAcquisition';
import TalentAcquisitionApproval from './pages/Needs/TalentAcquisitionApproval';
import TalentAcquisitionManagerApproval from './pages/Needs/TalentAcquisitionManagerApproval';
import HRViewTalentAcquisitions from './pages/Needs/HRViewTalentAcquisitions';
import UploadPayrollMaster from './pages/Payroll/UploadPayrollMaster';
import PayrollConfig from './pages/Payroll/PayrollConfig';
import SalaryHeads from './pages/Payroll/SalaryHeads';
import StatutorySettings from './pages/Payroll/StatutorySettings';
import PreparePayroll from './pages/Payroll/PreparePayroll';
import RunPayroll from './pages/Payroll/RunPayroll';
import PostPayroll from './pages/Payroll/PostPayroll';
import PayrollDashboard from './pages/Payroll/PayrollDashboard';
import BiometricUpload from './pages/TALV/CaptureAttendance/BiometricUpload';
import ImportAttendance from './pages/TALV/CaptureAttendance/ImportAttendance';
import ImportInOutTime from './pages/TALV/CaptureAttendance/ImportInOutTime';
import ShiftPunchRegister from './pages/TALV/AttendanceReports/ShiftPunchRegister';
import AttendanceRegister from './pages/TALV/AttendanceReports/AttendanceRegister';
import OverTimeCompOff from './pages/TALV/AttendanceReports/OverTimeCompOff';
import ShiftPlanRegister from './pages/TALV/AttendanceReports/ShiftPlanRegister';
import ShiftDeviationRegister from './pages/TALV/AttendanceReports/ShiftDeviationRegister';
import AbscondingReport from './pages/TALV/AttendanceReports/AbscondingReport';
import OTSummary from './pages/TALV/AttendanceReports/OTSummary';
import HeadcountOccupancyReport from './pages/TALV/AttendanceReports/HeadcountOccupancyReport';
import AttendanceDashboard from './pages/TALV/AttendanceDashboard';
import AttendancePolicyMaster from './pages/TALV/AttendancePolicyMaster';
import LeavePolicyConfig from './pages/TALV/LeavePolicyConfig';
import EmployeeLeaveMaster from './pages/TALV/EmployeeLeaveMaster';
import UploadOpeningLeaveBalance from './pages/TALV/UploadOpeningLeaveBalance';
import MobileAppLinking from './pages/TALV/MobileAppLinking';
import AttendanceControl from './pages/TALV/AttendanceControl';
import ShiftPlanningUpload from './pages/TALV/ShiftPlanningUpload';
import ShiftMaster from './pages/TALV/ShiftMaster';
import HRViewLeavesOutdoor from './pages/TALV/HRViewLeavesOutdoor';
import EmpMasterUpload from './pages/EmpMasterUpload/EmpMasterUpload';

import UploadMonthlyLeaveBalance from './pages/TALV/UploadMonthlyLeaveBalance';
import EmployeeLeaveBalance from './pages/TALV/EmployeeLeaveBalance';
import LeaveApplicationList from './pages/TALV/LeaveApplicationList';
import LeaveApplicationForm from './pages/TALV/LeaveApplicationForm';
import CompensatoryLeaveRequest from './pages/TALV/CompensatoryLeaveRequest';
import AttendanceRequest from './pages/TALV/AttendanceRequest';
import UploadResume from './pages/TALV/UploadResume';
import ResumeDatabase from './pages/TALV/ResumeDatabase';

// ERP Payroll - Masters
import ERPSalaryComponent from './pages/ERPPayroll/SalaryComponent';
import ERPSalaryStructure from './pages/ERPPayroll/SalaryStructure';
import ERPIncomeTaxSlab from './pages/ERPPayroll/IncomeTaxSlab';
import ERPPayrollPeriod from './pages/ERPPayroll/PayrollPeriod';
// ERP Payroll - Payroll
import ERPSalaryStructureAssignment from './pages/ERPPayroll/SalaryStructureAssignment';
import ERPBulkSalaryStructureAssignment from './pages/ERPPayroll/BulkSalaryStructureAssignment';
import ERPSalarySlip from './pages/ERPPayroll/SalarySlip';
import ERPPayrollEntry from './pages/ERPPayroll/PayrollEntry';
import ERPSalaryWithholding from './pages/ERPPayroll/SalaryWithholding';
// ERP Payroll - Incentives
import ERPAdditionalSalary from './pages/ERPPayroll/AdditionalSalary';
import ERPEmployeeIncentive from './pages/ERPPayroll/EmployeeIncentive';
import ERPRetentionBonus from './pages/ERPPayroll/RetentionBonus';
// ERP Payroll - Tax & Benefits
import ERPTaxExemptionDeclaration from './pages/ERPPayroll/TaxExemptionDeclaration';
import ERPTaxExemptionProof from './pages/ERPPayroll/TaxExemptionProof';
import ERPTaxExemptionCategories from './pages/ERPPayroll/TaxExemptionCategories';
import ERPBenefitApplication from './pages/ERPPayroll/BenefitApplication';
import ERPBenefitClaim from './pages/ERPPayroll/BenefitClaim';
// ERP Payroll - Reports
import ERPSalaryRegister from './pages/ERPPayroll/Reports/SalaryRegister';
import ERPSalaryPaymentsMode from './pages/ERPPayroll/Reports/SalaryPaymentsMode';
import ERPSalaryPaymentsECS from './pages/ERPPayroll/Reports/SalaryPaymentsECS';
import ERPIncomeTaxComputation from './pages/ERPPayroll/Reports/IncomeTaxComputation';
import ERPPFDeductions from './pages/ERPPayroll/Reports/PFDeductions';
import ERPPTDeductions from './pages/ERPPayroll/Reports/PTDeductions';
import ERPIncomeTaxDeductions from './pages/ERPPayroll/Reports/IncomeTaxDeductions';
import BulkSalaryStructureAssignment from './pages/ERPPayroll/BulkSalaryStructureAssignment';

// Performance Module
import AppraisalTemplate from './pages/Performance/AppraisalTemplate';
import KRA from './pages/Performance/KRA';
import EmployeeFeedbackCriteria from './pages/Performance/EmployeeFeedbackCriteria';
import Appraisal from './pages/Performance/Appraisal';
import AppraisalCycle from './pages/Performance/AppraisalCycle';
import EmployeePerformanceFeedback from './pages/Performance/EmployeePerformanceFeedback';
import EmployeePerformanceFeedbackByHR from './pages/Performance/EmployeePerformanceFeedbackByHR';
import Goal from './pages/Performance/Goal';
import AppraisalOverview from './pages/Performance/AppraisalOverview';
import TrainingNeedsIdentification from './pages/Performance/TrainingNeedsIdentification';
import StaffingPlan from './pages/Recruitment/StaffingPlan';
import JobRequisition from './pages/Recruitment/JobRequisition';
import JobOpening from './pages/Recruitment/JobOpening';
import JobApplicant from './pages/Recruitment/JobApplicant';
import JobOffer from './pages/Recruitment/JobOffer';
import EmployeeReferral from './pages/Recruitment/EmployeeReferral';
import InterviewType from './pages/Recruitment/InterviewType';
import InterviewRound from './pages/Recruitment/InterviewRound';
import Interview from './pages/Recruitment/Interview';
import InterviewFeedback from './pages/Recruitment/InterviewFeedback';
import AppointmentLetterTemplate from './pages/Recruitment/AppointmentLetterTemplate';
import AppointmentLetter from './pages/Recruitment/AppointmentLetter';
import RecruitmentAnalytics from './pages/Recruitment/RecruitmentAnalytics';
import RecruitmentDashboard from './pages/Recruitment/RecruitmentDashboard';
import RecruitmentSettings from './pages/Recruitment/RecruitmentSettings';
import HRModule from './pages/HR/HRModule';
import RecruitmentModule from './pages/HR/RecruitmentModule';
import PerformanceModule from './pages/HR/PerformanceModule';
import ShiftAttendanceModule from './pages/HR/ShiftAttendanceModule';
import LeaveModule from './pages/HR/LeaveModule';
import HRDashboard from './pages/HR/HRDashboard';
import ERPPayrollDashboard from './pages/ERPPayroll/ERPPayrollDashboard';
import AssetList from './pages/Assets/AssetList';
import AssetForm from './pages/Assets/AssetForm';
import Location from './pages/Assets/Location';
import AssetCategory from './pages/Assets/AssetCategory';
import AssetMovement from './pages/Assets/AssetMovement';
import AssetMaintenanceTeam from './pages/Assets/AssetMaintenanceTeam';
import AssetMaintenance from './pages/Assets/AssetMaintenance';
import AssetMaintenanceLog from './pages/Assets/AssetMaintenanceLog';
import AssetValueAdjustment from './pages/Assets/AssetValueAdjustment';
import AssetRepair from './pages/Assets/AssetRepair';
import AssetCapitalization from './pages/Assets/AssetCapitalization';
import AssetDepreciationLedger from './pages/Assets/AssetDepreciationLedger';
import AssetDepreciationsBalances from './pages/Assets/AssetDepreciationsBalances';
import AssetMaintenanceReport from './pages/Assets/AssetMaintenanceReport';
import AssetActivityReport from './pages/Assets/AssetActivityReport';

// Education Module
import Student from './pages/Education/Student';
import StudentGroup from './pages/Education/StudentGroup';
import StudentLog from './pages/Education/StudentLog';
import Program from './pages/Education/Program';
import Course from './pages/Education/Course';
import Topic from './pages/Education/Topic';
import Room from './pages/Education/Room';
import Instructor from './pages/Education/Instructor';
import Guardian from './pages/Education/Guardian';
import StudentApplicant from './pages/Education/StudentApplicant';
import StudentAdmission from './pages/Education/StudentAdmission';
import ProgramEnrollment from './pages/Education/ProgramEnrollment';
import CourseEnrollment from './pages/Education/CourseEnrollment';
import FeeStructure from './pages/Education/FeeStructure';
import FeeCategory from './pages/Education/FeeCategory';
import FeeSchedule from './pages/Education/FeeSchedule';
import Fees from './pages/Education/Fees';
import StudentFeeCollection from './pages/Education/StudentFeeCollection';
import ProgramWiseFeeCollection from './pages/Education/ProgramWiseFeeCollection';
import CourseSchedule from './pages/Education/CourseSchedule';
// CourseSchedulingTool moved down to standardized tools section
import StudentAttendance from './pages/Education/StudentAttendance';
import StudentLeaveApplication from './pages/Education/StudentLeaveApplication';
import StudentMonthlyAttendanceSheet from './pages/Education/StudentMonthlyAttendanceSheet';
import AbsentStudentReport from './pages/Education/AbsentStudentReport';
import StudentBatchWiseAttendance from './pages/Education/StudentBatchWiseAttendance';
import CourseActivity from './pages/Education/CourseActivity';
import QuizActivity from './pages/Education/QuizActivity';
import AssessmentPlan from './pages/Education/AssessmentPlan';
import AssessmentGroup from './pages/Education/AssessmentGroup';
import AssessmentResult from './pages/Education/AssessmentResult';
import AssessmentCriteria from './pages/Education/AssessmentCriteria';
import CourseWiseAssessmentReport from './pages/Education/CourseWiseAssessmentReport';
import FinalAssessmentGrades from './pages/Education/FinalAssessmentGrades';
import AssessmentPlanStatus from './pages/Education/AssessmentPlanStatus';
import StudentReportGenerationTool from './pages/Education/StudentReportGenerationTool';
import StudentAttendanceTool from './pages/Education/StudentAttendanceTool';
import AssessmentResultTool from './pages/Education/AssessmentResultTool';
import StudentGroupCreationTool from './pages/Education/StudentGroupCreationTool';
import ProgramEnrollmentTool from './pages/Education/ProgramEnrollmentTool';
import CourseSchedulingTool from './pages/Education/CourseSchedulingTool';
import StudentAndGuardianContactDetailsReport from './pages/Education/StudentAndGuardianContactDetailsReport';
import Article from './pages/Education/Article';
import Video from './pages/Education/Video';
import Quiz from './pages/Education/Quiz';
import EducationSettings from './pages/Education/EducationSettings';
import StudentCategory from './pages/Education/StudentCategory';
import StudentBatchName from './pages/Education/StudentBatchName';
import GradingScale from './pages/Education/GradingScale';
import AcademicYear from './pages/Education/AcademicYear';
import AcademicTerm from './pages/Education/AcademicTerm';

// Selling Module
import Customer from './pages/Selling/Customer';
import Quotation from './pages/Selling/Quotation';
import SalesOrder from './pages/Selling/SalesOrder';
import SalesInvoice from './pages/Selling/SalesInvoice';
import BlanketOrder from './pages/Selling/BlanketOrder';
import SalesPartner from './pages/Selling/SalesPartner';
import SalesPerson from './pages/Selling/SalesPerson';
import POSProfile from './pages/Selling/POSProfile';
import POSSettings from './pages/Selling/POSSettings';
import LoyaltyProgram from './pages/Selling/LoyaltyProgram';
import LoyaltyPointEntry from './pages/Selling/LoyaltyPointEntry';
import ItemPrice from './pages/Accounting/ItemPrice';
import PriceList from './pages/Accounting/PriceList';
import ItemGroup from './pages/Accounting/ItemGroup';
import ProductBundle from './pages/Selling/ProductBundle';
import PromotionalScheme from './pages/Selling/PromotionalScheme';
import PricingRule from './pages/Selling/PricingRule';
import ShippingRule from './pages/Selling/ShippingRule';
import CouponCode from './pages/Selling/CouponCode';
import WebsiteItem from './pages/Website/WebsiteItem';

// Buying Module
import PurchaseOrder from './pages/Buying/PurchaseOrder';

const RootRedirect = () => {
  const { isAdmin } = useUserRole();
  return <Navigate to={isAdmin ? "/home" : "/employee-self-service"} replace />;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeModule, setActiveModule] = React.useState(null);

  const handleModuleClick = (moduleKey) => {
    if (moduleKey === 'approvers') {
      navigate('/approver');
      return;
    }
    setActiveModule(moduleKey);
    setIsSidebarOpen(true);
    if (moduleKey === 'hr') {
        navigate('/hr-dashboard');
    } else if (moduleKey === 'recruitment') {
        navigate('/recruitment-dashboard');
    } else if (moduleKey === 'erpPayroll' || moduleKey === 'payroll') {
        navigate('/payroll-dashboard');
    } else if (moduleKey === 'assets') {
        navigate('/assets/asset');
    } else if (moduleKey === 'education') {
        navigate('/education/student');
    } else if (moduleKey === 'accounting') {
        navigate('/accounting/company');
    } else if (moduleKey === 'selling') {
        navigate('/selling/customer');
    } else if (moduleKey === 'buying') {
        navigate('/buying/purchase-order');
    }
  };

  const hideHeaderRoutes = ['/login', '/register'];
  const showHeader = !hideHeaderRoutes.includes(location.pathname);

  return (
    <div className="App flex flex-col h-screen overflow-hidden">
      {showHeader && <Header onModuleClick={handleModuleClick} />}

      <div className="flex flex-1 overflow-hidden relative">
        {showHeader && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            activeModule={activeModule}
          />
        )}

        <main
          className="flex-1 overflow-auto bg-gray-50 ml-0"
        >
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employee-self-service/*" element={<EmployeeSelfService />} />
                <Route path="/approver/*" element={<Approver />} />

                <Route path="/employee-mis" element={<EmployeeMIS />} />
                <Route path="/companies" element={<CompanyMaster />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/city-master" element={<CityMaster />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/master" element={<Navigate to="/master/departments" replace />} />
                <Route path="/master/departments" element={<DepartmentList />} />
                <Route path="/master/departments/new" element={<DepartmentForm />} />
                <Route path="/master/departments/:id" element={<DepartmentDetail />} />
                <Route path="/master/departments/:id/edit" element={<DepartmentEdit />} />
                <Route path="/master/designations" element={<DesignationList />} />
                <Route path="/master/designations/new" element={<DesignationEdit />} />
                <Route path="/master/designations/bombaim" element={<DesignationDetail />} />
                <Route path="/master/designations/:id" element={<DesignationDetail />} />
                <Route path="/master/designations/:id/edit" element={<DesignationEdit />} />
                <Route path="/master/holiday-master" element={<HolidayList />} />
                <Route path="/master/holiday-master/new" element={<HolidayNew />} />
                <Route path="/master/holiday-master/edit/:id" element={<HolidayEdit />} />
                <Route path="/master/entity-master" element={<EntityMaster />} />
                <Route path="/master/entity-master/edit/:id" element={<EntityEdit />} />
                <Route path="/master/qualification-master" element={<QualificationMaster />} />
                <Route path="/master/qualification-master/new" element={<QualificationNew />} />
                <Route path="/master/qualification-master/edit/:id" element={<QualificationEdit />} />
                <Route path="/master/state-master" element={<StateMaster />} />
                <Route path="/country-master" element={<CountryMaster />} />
                <Route path="/bank-master" element={<BankMaster />} />
                <Route path="/master/hr-settings" element={<HRSettings />} />
                <Route path="/master/employee-grade" element={<EmployeeGrade />} />
                <Route path="/master/branch" element={<Branch />} />
                <Route path="/add-bank" element={<AddBank />} />
                <Route path="/edit-bank/:id" element={<AddBank />} />
                <Route path="/policy-upload" element={<PolicyUpload />} />
                <Route path="/add-policy" element={<AddPolicy />} />
                <Route path="/edit-policy/:id" element={<AddPolicy />} />
                <Route path="/ticker-master" element={<TickerMaster />} />
                <Route path="/add-ticker" element={<AddTicker />} />
                <Route path="/edit-ticker/:id" element={<AddTicker />} />
                <Route path="/event-planner" element={<EventPlanner />} />
                <Route path="/add-event" element={<AddEvent />} />
                <Route path="/edit-event/:id" element={<AddEvent />} />
                <Route path="/employee-master" element={<EmployeeMaster />} />
                <Route path="/add-employee" element={<AddEmployee />} />
                <Route path="/edit-employee/:id" element={<AddEmployee />} />
                <Route path="/employee-master/report-view" element={<EmployeeReportView />} />
                <Route path="/upload-emp-master-update" element={<UploadEmpMasterUpdate />} />
                <Route path="/reporting-finance-manager-mapping" element={<ReportingFinanceManagerMapping />} />
                <Route path="/add-reporting-finance-mapping" element={<AddReportingFinanceMapping />} />
                <Route path="/edit-reporting-finance-mapping/:id" element={<AddReportingFinanceMapping />} />
                <Route path="/needs/position" element={<NeedsPage title="Position" />} />
                <Route path="/needs/vendor" element={<Vendor />} />
                <Route path="/needs/cv-status" element={<CVStatus />} />
                <Route path="/needs/miscellaneous" element={<Miscellaneous />} />
                <Route path="/needs/manpower-budget" element={<ManpowerBudget />} />
                <Route path="/needs/talent-register" element={<TalentRegister />} />
                <Route path="/needs/manage-cv" element={<ManageCV />} />
                <Route path="/needs/search-cv" element={<SearchCV />} />
                <Route path="/needs/tr-tracker" element={<TRTracker />} />
                <Route path="/needs/upload-candidate-master" element={<UploadCandidateMaster />} />
                <Route path="/needs/talent-acquisition" element={<TalentAcquisition />} />
                <Route path="/needs/talent-acquisition-approval" element={<TalentAcquisitionApproval />} />
                <Route path="/needs/talent-acquisition-manager-approval" element={<TalentAcquisitionManagerApproval />} />
                <Route path="/needs/hr-view-talent-acquisitions" element={<HRViewTalentAcquisitions />} />
                <Route path="/payroll/:country/upload" element={<UploadPayrollMaster />} />
                <Route path="/payroll/:country/config" element={<PayrollConfig />} />
                <Route path="/payroll/:country/salary-heads" element={<SalaryHeads />} />
                <Route path="/payroll/:country/statutory-settings" element={<StatutorySettings />} />
                <Route path="/payroll/:country/prepare" element={<PreparePayroll />} />
                <Route path="/payroll/:country/run" element={<RunPayroll />} />
                <Route path="/payroll/:country/post" element={<PostPayroll />} />
                <Route path="/payroll/:country/dashboard" element={<PayrollDashboard />} />
                {/* ERP Payroll Routes - Masters */}
                <Route path="/erp-payroll/salary-component" element={<ERPSalaryComponent />} />
                <Route path="/erp-payroll/salary-structure" element={<ERPSalaryStructure />} />
                <Route path="/erp-payroll/income-tax-slab" element={<ERPIncomeTaxSlab />} />
                <Route path="/erp-payroll/payroll-period" element={<ERPPayrollPeriod />} />
                {/* ERP Payroll Routes - Payroll */}
                <Route path="/erp-payroll/salary-structure-assignment" element={<ERPSalaryStructureAssignment />} />
                <Route path="/erp-payroll/bulk-salary-structure-assignment" element={<ERPBulkSalaryStructureAssignment />} />
                <Route path="/erp-payroll/salary-slip" element={<ERPSalarySlip />} />
                <Route path="/erp-payroll/payroll-entry" element={<ERPPayrollEntry />} />
                <Route path="/erp-payroll/salary-withholding" element={<ERPSalaryWithholding />} />
                {/* ERP Payroll Routes - Incentives */}
                <Route path="/erp-payroll/additional-salary" element={<ERPAdditionalSalary />} />
                <Route path="/erp-payroll/employee-incentive" element={<ERPEmployeeIncentive />} />
                <Route path="/erp-payroll/retention-bonus" element={<ERPRetentionBonus />} />
                {/* ERP Payroll Routes - Tax & Benefits */}
                <Route path="/erp-payroll/tax-exemption-declaration" element={<ERPTaxExemptionDeclaration />} />
                <Route path="/erp-payroll/tax-exemption-proof" element={<ERPTaxExemptionProof />} />
                <Route path="/erp-payroll/tax-exemption-categories" element={<ERPTaxExemptionCategories />} />
                <Route path="/erp-payroll/benefit-application" element={<ERPBenefitApplication />} />
                <Route path="/erp-payroll/benefit-claim" element={<ERPBenefitClaim />} />
                {/* ERP Payroll Routes - Reports */}
                <Route path="/erp-payroll/reports/salary-register" element={<ERPSalaryRegister />} />
                <Route path="/erp-payroll/reports/salary-payments-mode" element={<ERPSalaryPaymentsMode />} />
                <Route path="/erp-payroll/reports/salary-payments-ecs" element={<ERPSalaryPaymentsECS />} />
                <Route path="/erp-payroll/reports/income-tax-computation" element={<ERPIncomeTaxComputation />} />
                <Route path="/erp-payroll/reports/pf-deductions" element={<ERPPFDeductions />} />
                <Route path="/erp-payroll/reports/pt-deductions" element={<ERPPTDeductions />} />
                <Route path="/erp-payroll/reports/income-tax-deductions" element={<ERPIncomeTaxDeductions />} />
                <Route path="/talv/upload-resume" element={<UploadResume />} />
                <Route path="/talv/resume-database" element={<ResumeDatabase />} />
                <Route path="/talv/attendance-dashboard" element={<AttendanceDashboard />} />
                <Route path="/talv/attendance-policy" element={<AttendancePolicyMaster />} />
                <Route path="/talv/leave-policy-config" element={<LeavePolicyConfig />} />
                <Route path="/talv/leave" element={<LeaveModule />} />
                <Route path="/talv/employee-leave-master" element={<EmployeeLeaveMaster />} />
                <Route path="/talv/upload-opening-leave-balance" element={<UploadOpeningLeaveBalance />} />
                <Route path="/talv/mobile-app-linking" element={<MobileAppLinking />} />
                <Route path="/talv/attendance-control" element={<AttendanceControl />} />
                <Route path="/talv/attendance-request" element={<AttendanceRequest />} />
                <Route path="/talv/shift-planning-upload" element={<ShiftPlanningUpload />} />
                <Route path="/talv/shift-master" element={<ShiftMaster />} />
                <Route path="/talv/shift-assignment" element={<NeedsPage title="Shift Assignment" />} />
                <Route path="/talv/shift-schedule" element={<NeedsPage title="Shift Schedule" />} />
                <Route path="/talv/shift-schedule-assignment" element={<NeedsPage title="Shift Schedule Assignment" />} />
                <Route path="/talv/hr-view-leaves-outdoor" element={<HRViewLeavesOutdoor />} />
                <Route path="/talv/upload-monthly-leave-balance" element={<UploadMonthlyLeaveBalance />} />
                <Route path="/talv/capture-attendance/biometric-upload" element={<BiometricUpload />} />
                <Route path="/talv/capture-attendance/import-attendance" element={<ImportAttendance />} />
                <Route path="/talv/capture-attendance/import-in-out-time" element={<ImportInOutTime />} />
                <Route path="/talv/capture-attendance/client-emp-import-attendance" element={<NeedsPage title="Client Emp Import Attendance" />} />
                <Route path="/talv/attendance-reports/shift-punch-register" element={<ShiftPunchRegister />} />
                <Route path="/talv/attendance-reports/attendance-register" element={<AttendanceRegister />} />
                <Route path="/talv/attendance-reports/client-emp-attendance-register" element={<NeedsPage title="Client Emp Attendance Register" />} />
                <Route path="/talv/attendance-reports/over-time-comp-off" element={<OverTimeCompOff />} />
                <Route path="/talv/attendance-reports/shift-plan-register" element={<ShiftPlanRegister />} />
                <Route path="/talv/attendance-reports/shift-deviation-register" element={<ShiftDeviationRegister />} />
                <Route path="/talv/attendance-reports/absconding-report" element={<AbscondingReport />} />
                <Route path="/talv/attendance-reports/ot-summary" element={<OTSummary />} />

                <Route path="/talv/attendance-reports/headcount-occupancy-report" element={<HeadcountOccupancyReport />} />
                <Route path="/talv/employee-leave-balance" element={<EmployeeLeaveBalance />} />
                <Route path="/talv/leave-application" element={<LeaveApplicationList />} />
                <Route path="/talv/leave-application/new" element={<LeaveApplicationForm />} />
                <Route path="/talv/leave-application/edit/:id" element={<LeaveApplicationForm />} />
                <Route path="/talv/leave-application/new" element={<LeaveApplicationForm />} />
                <Route path="/talv/leave-application/edit/:id" element={<LeaveApplicationForm />} />
                <Route path="/talv/compensatory-leave-request" element={<CompensatoryLeaveRequest />} />
                <Route path="/emp-master-upload" element={<EmpMasterUpload />} />

                {/* Performance Routes */}
                <Route path="/performance/appraisal-template" element={<AppraisalTemplate />} />
                <Route path="/performance/kra" element={<KRA />} />
                <Route path="/performance/employee-feedback-criteria" element={<EmployeeFeedbackCriteria />} />
                {/* Performance - Appraisal */}
                <Route path="/performance/appraisal" element={<Appraisal />} />
                <Route path="/performance/appraisal-cycle" element={<AppraisalCycle />} />
                <Route path="/performance/employee-performance-feedback" element={<EmployeePerformanceFeedback />} />
                <Route path="/performance/employee-performance-feedback-by-hr" element={<EmployeePerformanceFeedbackByHR />} />
                <Route path="/performance/goal" element={<Goal />} />

                {/* Performance - Reports */}
                <Route path="/performance/appraisal-overview" element={<AppraisalOverview />} />
                <Route path="/performance/training-needs-identification" element={<TrainingNeedsIdentification />} />
                <Route path="/performance/reports/appraisal-overview" element={<Navigate to="/performance/appraisal-overview" replace />} />
                <Route path="/performance" element={<PerformanceModule />} />

                {/* Shift & Attendance */}
                <Route path="/shift-attendance" element={<ShiftAttendanceModule />} />

                {/* Recruitment */}
                <Route path="/recruitment" element={<RecruitmentModule />} />
                <Route path="/recruitment/staffing-plan" element={<StaffingPlan />} />
                <Route path="/recruitment/job-requisition" element={<JobRequisition />} />
                <Route path="/recruitment/job-opening" element={<JobOpening />} />
                <Route path="/recruitment/job-applicant" element={<JobApplicant />} />
                <Route path="/recruitment/job-offer" element={<JobOffer />} />
                <Route path="/recruitment/employee-referral" element={<EmployeeReferral />} />
                <Route path="/recruitment/interview-type" element={<InterviewType />} />
                <Route path="/recruitment/interview-round" element={<InterviewRound />} />
                <Route path="/recruitment/interview" element={<Interview />} />
                <Route path="/recruitment/interview-feedback" element={<InterviewFeedback />} />
                <Route path="/recruitment/appointment-letter-template" element={<AppointmentLetterTemplate />} />
                <Route path="/recruitment/appointment-letter" element={<AppointmentLetter />} />
                <Route path="/recruitment/recruitment-analytics" element={<RecruitmentAnalytics />} />
                <Route path="/recruitment-dashboard" element={<RecruitmentDashboard />} />
                <Route path="/recruitment/settings" element={<RecruitmentSettings />} />
                <Route path="/hr" element={<HRModule />} />
                <Route path="/hr-dashboard" element={<HRDashboard />} />
                <Route path="/payroll-dashboard" element={<ERPPayrollDashboard />} />

                {/* Assets */}
                <Route path="/assets/asset" element={<AssetList />} />
                <Route path="/assets/asset/new" element={<AssetForm />} />
                <Route path="/assets/asset/edit/:id" element={<AssetForm />} />
                <Route path="/assets/asset-movement" element={<AssetMovement />} />
                <Route path="/assets/asset-capitalization" element={<AssetCapitalization />} />
                <Route path="/assets/asset-value-adjustment" element={<AssetValueAdjustment />} />
                <Route path="/assets/asset-repair" element={<AssetRepair />} />
                <Route path="/assets/asset-maintenance-team" element={<AssetMaintenanceTeam />} />
                <Route path="/assets/asset-maintenance" element={<AssetMaintenance />} />
                <Route path="/assets/asset-maintenance-log" element={<AssetMaintenanceLog />} />
                <Route path="/assets/location" element={<Location />} />
                <Route path="/assets/asset-category" element={<AssetCategory />} />
                <Route path="/assets/report/asset-depreciation-ledger" element={<AssetDepreciationLedger />} />
                <Route path="/assets/report/asset-depreciations-balances" element={<AssetDepreciationsBalances />} />
                <Route path="/assets/report/asset-maintenance" element={<AssetMaintenanceReport />} />
                <Route path="/assets/report/asset-activity" element={<AssetActivityReport />} />

                {/* Accounting */}
                <Route path="/accounting" element={<Navigate to="/accounting/company" replace />} />
                <Route path="/accounting/company" element={<CompanyMaster />} />
                <Route path="/accounting/chart-of-accounts" element={<ChartOfAccounts />} />
                <Route path="/accounting/accounts-settings" element={<AccountSettings />} />
                <Route path="/accounting/fiscal-year" element={<FiscalYear />} />
                <Route path="/accounting/accounting-dimension" element={<AccountingDimension />} />
                <Route path="/accounting/finance-book" element={<FinanceBook />} />
                <Route path="/accounting/accounting-period" element={<AccountingPeriod />} />
                <Route path="/accounting/payment-term" element={<PaymentTerm />} />
                <Route path="/accounting/mode-of-payment" element={<ModeOfPayment />} />
                <Route path="/accounting/sales-taxes-template" element={<SalesTaxesTemplate />} />
                <Route path="/accounting/purchase-taxes-template" element={<PurchaseTaxesTemplate />} />
                <Route path="/accounting/item-tax-template" element={<ItemTaxTemplate />} />
                <Route path="/accounting/tax-category" element={<TaxCategory />} />
                <Route path="/accounting/tax-rule" element={<TaxRule />} />
                <Route path="/accounting/tax-withholding-category" element={<TaxWithholdingCategory />} />
                <Route path="/accounting/lower-deduction-certificate" element={<LowerDeductionCertificate />} />
                <Route path="/accounting/payment-entry" element={<PaymentEntry />} />
                <Route path="/accounting/journal-entry" element={<JournalEntry />} />
                <Route path="/accounting/journal-entry-template" element={<JournalEntryTemplate />} />
                <Route path="/accounting/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/accounting/cost-center" element={<CostCenter />} />
                <Route path="/accounting/budget" element={<Budget />} />
                <Route path="/accounting/budget-variations" element={<BudgetVariations />} />
                <Route path="/accounting/cost-center-allocation" element={<CostCenterAllocation />} />
                <Route path="/accounting/monthly-distribution" element={<MonthlyDistribution />} />
                <Route path="/accounting/currency" element={<Currency />} />
                <Route path="/accounting/currency-exchange" element={<CurrencyExchange />} />
                <Route path="/accounting/exchange-rate-revaluation" element={<ExchangeRateRevaluation />} />
                <Route path="/accounting/bank" element={<Bank />} />
                <Route path="/accounting/item" element={<Item />} />

                {/* Education */}
                <Route path="/education" element={<Navigate to="/education/student" replace />} />
                <Route path="/education/student" element={<Student />} />
                <Route path="/education/student-group" element={<StudentGroup />} />
                <Route path="/education/student-log" element={<StudentLog />} />
                <Route path="/education/program" element={<Program />} />
                <Route path="/education/course" element={<Course />} />
                <Route path="/education/topic" element={<Topic />} />
                <Route path="/education/room" element={<Room />} />
                <Route path="/education/student-category" element={<StudentCategory />} />
                <Route path="/education/student-batch-name" element={<StudentBatchName />} />
                <Route path="/education/grading-scale" element={<GradingScale />} />
                <Route path="/education/academic-year" element={<AcademicYear />} />
                <Route path="/education/academic-term" element={<AcademicTerm />} />
                <Route path="/education/article" element={<Article />} />
                <Route path="/education/video" element={<Video />} />
                <Route path="/education/quiz" element={<Quiz />} />
                <Route path="/education/settings" element={<EducationSettings />} />
                <Route path="/education/instructor" element={<Instructor />} />
                <Route path="/education/guardian" element={<Guardian />} />
                <Route path="/education/student-applicant" element={<StudentApplicant />} />
                <Route path="/education/student-admission" element={<StudentAdmission />} />
                <Route path="/education/program-enrollment" element={<ProgramEnrollment />} />
                <Route path="/education/course-enrollment" element={<CourseEnrollment />} />
                <Route path="/education/fee-structure" element={<FeeStructure />} />
                <Route path="/education/fee-category" element={<FeeCategory />} />
                <Route path="/education/fee-schedule" element={<FeeSchedule />} />
                <Route path="/education/fees" element={<Fees />} />
                <Route path="/education/student-fee-collection" element={<StudentFeeCollection />} />
                <Route path="/education/program-wise-fee-collection" element={<ProgramWiseFeeCollection />} />
                <Route path="/education/course-schedule" element={<CourseSchedule />} />
                <Route path="/education/course-scheduling-tool" element={<CourseSchedulingTool />} />
                <Route path="/education/student-attendance" element={<StudentAttendance />} />
                <Route path="/education/student-leave-application" element={<StudentLeaveApplication />} />
                <Route path="/education/student-monthly-attendance-sheet" element={<StudentMonthlyAttendanceSheet />} />
                <Route path="/education/absent-student-report" element={<AbsentStudentReport />} />
                <Route path="/education/student-batch-wise-attendance" element={<StudentBatchWiseAttendance />} />
                <Route path="/education/course-activity" element={<CourseActivity />} />
                <Route path="/education/quiz-activity" element={<QuizActivity />} />
                <Route path="/education/assessment-plan" element={<AssessmentPlan />} />
                <Route path="/education/assessment-group" element={<AssessmentGroup />} />
                <Route path="/education/assessment-result" element={<AssessmentResult />} />
                <Route path="/education/assessment-criteria" element={<AssessmentCriteria />} />
                <Route path="/education/course-wise-assessment-report" element={<CourseWiseAssessmentReport />} />
                <Route path="/education/final-assessment-grades" element={<FinalAssessmentGrades />} />
                <Route path="/education/assessment-plan-status" element={<AssessmentPlanStatus />} />
                <Route path="/education/student-report-generation-tool" element={<StudentReportGenerationTool />} />
                <Route path="/education/student-attendance-tool" element={<StudentAttendanceTool />} />
                <Route path="/education/assessment-result-tool" element={<AssessmentResultTool />} />
                <Route path="/education/student-group-creation-tool" element={<StudentGroupCreationTool />} />
                <Route path="/education/program-enrollment-tool" element={<ProgramEnrollmentTool />} />
                <Route path="/education/course-scheduling-tool" element={<CourseSchedulingTool />} />
                <Route path="/education/student-and-guardian-contact-details-report" element={<StudentAndGuardianContactDetailsReport />} />

                {/* Selling */}
                <Route path="/selling" element={<Navigate to="/selling/customer" replace />} />
                <Route path="/selling/customer" element={<Customer />} />
                <Route path="/selling/quotation" element={<Quotation />} />
                <Route path="/selling/sales-order" element={<SalesOrder />} />
                <Route path="/selling/sales-invoice" element={<SalesInvoice />} />
                <Route path="/selling/blanket-order" element={<BlanketOrder />} />
                <Route path="/selling/sales-partner" element={<SalesPartner />} />
                <Route path="/selling/sales-person" element={<SalesPerson />} />
                <Route path="/selling/pos-profile" element={<POSProfile />} />
                <Route path="/selling/pos-settings" element={<POSSettings />} />
                <Route path="/selling/loyalty-program" element={<LoyaltyProgram />} />
                <Route path="/selling/loyalty-point-entry" element={<LoyaltyPointEntry />} />
                <Route path="/selling/item" element={<Item />} />
                <Route path="/selling/item-price" element={<ItemPrice />} />
                <Route path="/selling/price-list" element={<PriceList />} />
                <Route path="/selling/item-group" element={<ItemGroup />} />
                <Route path="/selling/product-bundle" element={<ProductBundle />} />
                <Route path="/selling/promotional-scheme" element={<PromotionalScheme />} />
                <Route path="/selling/pricing-rule" element={<PricingRule />} />
                <Route path="/selling/shipping-rule" element={<ShippingRule />} />
                <Route path="/selling/coupon-code" element={<CouponCode />} />
                <Route path="/selling/website-item" element={<WebsiteItem />} />

                {/* Buying */}
                <Route path="/buying" element={<Navigate to="/buying/purchase-order" replace />} />
                <Route path="/buying/purchase-order" element={<PurchaseOrder />} />
              </Route> {/* End of Protected Routes */}

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
            {/* Route verification active */}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
