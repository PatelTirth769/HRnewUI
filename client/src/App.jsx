import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import Header from './components/common/Header';
import { useUserRole } from './hooks/useUserRole';
import Sidebar from './components/common/Sidebar';
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const EmployeeSelfService = React.lazy(() => import('./pages/ESS/EmployeeSelfService'));
const Approver = React.lazy(() => import('./pages/ESS/Approver'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const StudentDashboard = React.lazy(() => import('./pages/Education/StudentDashboard'));
const InstructorDashboard = React.lazy(() => import('./pages/Education/InstructorDashboard'));
const CoordinatorDashboard = React.lazy(() => import('./pages/Education/CoordinatorDashboard'));
const GuardianDashboard = React.lazy(() => import('./pages/Education/GuardianDashboard'));
const ImportLogs = React.lazy(() => import('./pages/Education/ImportLogs'));
const RegistrationImportLogs = React.lazy(() => import('./pages/Enquiry/RegistrationImportLogs'));

const CompanyMaster = React.lazy(() => import('./components/company/CompanyMaster'));
const EmployeeMIS = React.lazy(() => import('./pages/EmployeeMIS'));
const TransportConfiguration = React.lazy(() => import('./pages/Transport/Settings/TransportConfiguration'));
const SetPunchTiming = React.lazy(() => import('./pages/Transport/Transaction/SetPunchTiming'));
const TransportRange = React.lazy(() => import('./pages/Transport/Master/TransportRange'));
const TransportCarryForward = React.lazy(() => import('./pages/Transport/Transaction/TransportCarryForward'));
const NewTransportReport = React.lazy(() => import('./pages/Transport/Reports/NewTransportReport'));
const RouteExcelImport = React.lazy(() => import('./pages/Transport/Transaction/RouteExcelImport'));
const StudentTransportAllocation = React.lazy(() => import('./pages/Transport/Transaction/StudentTransportAllocation'));
const StudentPunchDetail = React.lazy(() => import('./pages/Transport/Reports/StudentPunchDetail'));
const TransportSMS = React.lazy(() => import('./pages/Transport/Transaction/TransportSMS'));
const TransportFeeImport = React.lazy(() => import('./pages/Transport/Transaction/TransportFeeImport'));
const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Reports = React.lazy(() => import('./pages/Reports'));
const ChartOfAccounts = React.lazy(() => import('./pages/Accounting/ChartOfAccounts'));
const AccountSettings = React.lazy(() => import('./pages/Accounting/AccountSettings'));
const FiscalYear = React.lazy(() => import('./pages/Accounting/FiscalYear'));
const AccountingDimension = React.lazy(() => import('./pages/Accounting/AccountingDimension'));
const FinanceBook = React.lazy(() => import('./pages/Accounting/FinanceBook'));
const AccountingPeriod = React.lazy(() => import('./pages/Accounting/AccountingPeriod'));
const PaymentTerm = React.lazy(() => import('./pages/Accounting/PaymentTerm'));
const ModeOfPayment = React.lazy(() => import('./pages/Accounting/ModeOfPayment'));
const SalesTaxesTemplate = React.lazy(() => import('./pages/Accounting/SalesTaxesTemplate'));
const PurchaseTaxesTemplate = React.lazy(() => import('./pages/Accounting/PurchaseTaxesTemplate'));
const ItemTaxTemplate = React.lazy(() => import('./pages/Accounting/ItemTaxTemplate'));
const TaxCategory = React.lazy(() => import('./pages/Accounting/TaxCategory'));
const TaxRule = React.lazy(() => import('./pages/Accounting/TaxRule'));
const TaxWithholdingCategory = React.lazy(() => import('./pages/Accounting/TaxWithholdingCategory'));
const LowerDeductionCertificate = React.lazy(() => import('./pages/Accounting/LowerDeductionCertificate'));
const PaymentEntry = React.lazy(() => import('./pages/Accounting/PaymentEntry'));
const JournalEntry = React.lazy(() => import('./pages/Accounting/JournalEntry'));
const JournalEntryTemplate = React.lazy(() => import('./pages/Accounting/JournalEntryTemplate'));
const TermsAndConditions = React.lazy(() => import('./pages/Accounting/TermsAndConditions'));
const CostCenter = React.lazy(() => import('./pages/Accounting/CostCenter'));
const Budget = React.lazy(() => import('./pages/Accounting/Budget'));
const BudgetVariations = React.lazy(() => import('./pages/Accounting/BudgetVariations'));
const CostCenterAllocation = React.lazy(() => import('./pages/Accounting/CostCenterAllocation'));
const MonthlyDistribution = React.lazy(() => import('./pages/Accounting/MonthlyDistribution'));
const Currency = React.lazy(() => import('./pages/Accounting/Currency'));
const CurrencyExchange = React.lazy(() => import('./pages/Accounting/CurrencyExchange'));
const ExchangeRateRevaluation = React.lazy(() => import('./pages/Accounting/ExchangeRateRevaluation'));
const Bank = React.lazy(() => import('./pages/Accounting/Bank'));
const Item = React.lazy(() => import('./pages/Stock/Item'));
const ItemGroup = React.lazy(() => import('./pages/Stock/ItemGroup'));
const ProductBundle = React.lazy(() => import('./pages/Stock/ProductBundle'));
const ShippingRule = React.lazy(() => import('./pages/Stock/ShippingRule'));
const ItemAlternative = React.lazy(() => import('./pages/Stock/ItemAlternative'));
const ItemManufacturer = React.lazy(() => import('./pages/Stock/ItemManufacturer'));
const MaterialRequest = React.lazy(() => import('./pages/Stock/MaterialRequest'));
const StockEntry = React.lazy(() => import('./pages/Stock/StockEntry'));
const DeliveryNote = React.lazy(() => import('./pages/Stock/DeliveryNote'));
const PurchaseReceipt = React.lazy(() => import('./pages/Stock/PurchaseReceipt'));
const PickList = React.lazy(() => import('./pages/Stock/PickList'));
const DeliveryTrip = React.lazy(() => import('./pages/Stock/DeliveryTrip'));
const StockLedger = React.lazy(() => import('./pages/Stock/StockLedger'));
const StockBalance = React.lazy(() => import('./pages/Stock/StockBalance'));
const StockProjectedQty = React.lazy(() => import('./pages/Stock/StockProjectedQty'));
const StockSummary = React.lazy(() => import('./pages/Stock/StockSummary'));
const StockAgeing = React.lazy(() => import('./pages/Stock/StockAgeing'));
const ItemPriceStock = React.lazy(() => import('./pages/Stock/ItemPriceStock'));
const WarehouseWiseStock = React.lazy(() => import('./pages/Stock/WarehouseWiseStock'));
const StockSettings = React.lazy(() => import('./pages/Stock/StockSettings'));
const WarehouseMaster = React.lazy(() => import('./pages/Stock/WarehouseMaster'));
const UOM = React.lazy(() => import('./pages/Stock/UOM'));
const Brand = React.lazy(() => import('./pages/Stock/Brand'));
const SerialNo = React.lazy(() => import('./pages/Stock/SerialNo'));
const Batch = React.lazy(() => import('./pages/Stock/Batch'));
const InstallationNote = React.lazy(() => import('./pages/Stock/InstallationNote'));
const ItemAttribute = React.lazy(() => import('./pages/Stock/ItemAttribute'));
const UOMConversionFactor = React.lazy(() => import('./pages/Stock/UOMConversionFactor'));
const ItemVariantSettings = React.lazy(() => import('./pages/Stock/ItemVariantSettings'));
const SerialNoServiceContractExpiry = React.lazy(() => import('./pages/Stock/SerialNoServiceContractExpiry'));
const SerialNoStatus = React.lazy(() => import('./pages/Stock/SerialNoStatus'));
const StockReconciliation = React.lazy(() => import('./pages/Stock/StockReconciliation'));
const LandedCostVoucher = React.lazy(() => import('./pages/Stock/LandedCostVoucher'));
const PackingSlip = React.lazy(() => import('./pages/Stock/PackingSlip'));
const QualityInspection = React.lazy(() => import('./pages/Stock/QualityInspection'));
const QualityInspectionTemplate = React.lazy(() => import('./pages/Stock/QualityInspectionTemplate'));
const QuickStockBalance = React.lazy(() => import('./pages/Stock/QuickStockBalance'));
const StockAnalytics = React.lazy(() => import('./pages/Stock/StockAnalytics'));
const DeliveryNoteTrends = React.lazy(() => import('./pages/Stock/DeliveryNoteTrends'));
const PurchaseReceiptTrends = React.lazy(() => import('./pages/Stock/PurchaseReceiptTrends'));
const SalesOrderAnalysis = React.lazy(() => import('./pages/Stock/SalesOrderAnalysis'));
const PurchaseOrderAnalysis = React.lazy(() => import('./pages/Stock/PurchaseOrderAnalysis'));
const ItemShortageReport = React.lazy(() => import('./pages/Stock/ItemShortageReport'));
const BatchWiseBalanceHistory = React.lazy(() => import('./pages/Stock/BatchWiseBalanceHistory'));
const RequestedItemsTransfer = React.lazy(() => import('./pages/Stock/RequestedItemsTransfer'));
const BatchItemExpiryStatus = React.lazy(() => import('./pages/Stock/BatchItemExpiryStatus'));
const ItemPrices = React.lazy(() => import('./pages/Stock/ItemPrices'));
const RecommendedReorderLevel = React.lazy(() => import('./pages/Stock/RecommendedReorderLevel'));
const ItemVariantDetails = React.lazy(() => import('./pages/Stock/ItemVariantDetails'));
const SubcontractRawMaterialsTransfer = React.lazy(() => import('./pages/Stock/SubcontractRawMaterialsTransfer'));
const SubcontractItemReceived = React.lazy(() => import('./pages/Stock/SubcontractItemReceived'));
const DepartmentList = React.lazy(() => import('./pages/departments/DepartmentList'));
const DepartmentDetail = React.lazy(() => import('./pages/departments/DepartmentDetail'));
const DepartmentEdit = React.lazy(() => import('./pages/departments/DepartmentEdit'));
const DepartmentForm = React.lazy(() => import('./pages/departments/DepartmentForm'));
const DesignationList = React.lazy(() => import('./pages/designations/DesignationList'));
const DesignationDetail = React.lazy(() => import('./pages/designations/DesignationDetail'));
const DesignationEdit = React.lazy(() => import('./pages/designations/DesignationEdit'));
const HolidayList = React.lazy(() => import('./pages/holidays/HolidayList'));
const HolidayEdit = React.lazy(() => import('./pages/holidays/HolidayEdit'));
const HolidayNew = React.lazy(() => import('./pages/holidays/HolidayNew'));
const EntityMaster = React.lazy(() => import('./pages/masters/EntityMaster'));
const EntityEdit = React.lazy(() => import('./pages/masters/EntityEdit'));
const QualificationMaster = React.lazy(() => import('./pages/masters/QualificationMaster'));
const QualificationEdit = React.lazy(() => import('./pages/masters/QualificationEdit'));
const QualificationNew = React.lazy(() => import('./pages/masters/QualificationNew'));
const CityMaster = React.lazy(() => import('./pages/CityMaster/CityMaster'));
const StateMaster = React.lazy(() => import('./pages/StateMaster/StateMaster'));
const CountryMaster = React.lazy(() => import('./pages/CountryMaster/CountryMaster'));
const BankMaster = React.lazy(() => import('./pages/BankMaster/BankMaster'));
const AddBank = React.lazy(() => import('./pages/BankMaster/AddBank'));
const HRSettings = React.lazy(() => import('./pages/Master/HRSettings'));
const EmployeeGrade = React.lazy(() => import('./pages/Master/EmployeeGrade'));
const Branch = React.lazy(() => import('./pages/Master/Branch'));
const TickerMaster = React.lazy(() => import('./pages/TickerMaster/TickerMaster'));
const AddTicker = React.lazy(() => import('./pages/TickerMaster/AddTicker'));
const EventPlanner = React.lazy(() => import('./pages/EventPlanner/EventPlanner'));
const AddEvent = React.lazy(() => import('./pages/EventPlanner/AddEvent'));
const PolicyUpload = React.lazy(() => import('./pages/PolicyUpload/PolicyUpload'));
const AddPolicy = React.lazy(() => import('./pages/PolicyUpload/AddPolicy'));
const EmployeeMaster = React.lazy(() => import('./pages/EmployeeMaster/EmployeeMaster'));
const AddEmployee = React.lazy(() => import('./pages/EmployeeMaster/AddEmployee'));
const EmployeeReportView = React.lazy(() => import('./pages/EmployeeMaster/EmployeeReportView'));
const UploadEmpMasterUpdate = React.lazy(() => import('./pages/UploadEmpMasterUpdate/UploadEmpMasterUpdate'));
const ReportingFinanceManagerMapping = React.lazy(() => import('./pages/ReportingFinanceManagerMapping/ReportingFinanceManagerMapping'));
const AddReportingFinanceMapping = React.lazy(() => import('./pages/ReportingFinanceManagerMapping/AddReportingFinanceMapping'));
const NeedsPage = React.lazy(() => import('./pages/Needs/NeedsPage'));
const Vendor = React.lazy(() => import('./pages/Needs/Vendor'));
const CVStatus = React.lazy(() => import('./pages/Needs/CVStatus'));
const Miscellaneous = React.lazy(() => import('./pages/Needs/Miscellaneous'));
const ManpowerBudget = React.lazy(() => import('./pages/Needs/ManpowerBudget'));
const TalentRegister = React.lazy(() => import('./pages/Needs/TalentRegister'));
const ManageCV = React.lazy(() => import('./pages/Needs/ManageCV'));

// Transport 
const AddVehicle = React.lazy(() => import('./pages/Transport/Master/AddVehicle'));
const AddBusStop = React.lazy(() => import('./pages/Transport/Master/AddBusStop'));
const AddBusRoutes = React.lazy(() => import('./pages/Transport/Master/AddBusRoutes'));
const SearchCV = React.lazy(() => import('./pages/Needs/SearchCV'));
const TRTracker = React.lazy(() => import('./pages/Needs/TRTracker'));
const UploadCandidateMaster = React.lazy(() => import('./pages/Needs/UploadCandidateMaster'));
const TalentAcquisition = React.lazy(() => import('./pages/Needs/TalentAcquisition'));
const TalentAcquisitionApproval = React.lazy(() => import('./pages/Needs/TalentAcquisitionApproval'));
const TalentAcquisitionManagerApproval = React.lazy(() => import('./pages/Needs/TalentAcquisitionManagerApproval'));
const HRViewTalentAcquisitions = React.lazy(() => import('./pages/Needs/HRViewTalentAcquisitions'));
const UploadPayrollMaster = React.lazy(() => import('./pages/Payroll/UploadPayrollMaster'));
const PayrollConfig = React.lazy(() => import('./pages/Payroll/PayrollConfig'));
const SalaryHeads = React.lazy(() => import('./pages/Payroll/SalaryHeads'));
const StatutorySettings = React.lazy(() => import('./pages/Payroll/StatutorySettings'));
const PreparePayroll = React.lazy(() => import('./pages/Payroll/PreparePayroll'));
const RunPayroll = React.lazy(() => import('./pages/Payroll/RunPayroll'));
const PostPayroll = React.lazy(() => import('./pages/Payroll/PostPayroll'));
const PayrollDashboard = React.lazy(() => import('./pages/Payroll/PayrollDashboard'));
const BiometricUpload = React.lazy(() => import('./pages/TALV/CaptureAttendance/BiometricUpload'));
const ImportAttendance = React.lazy(() => import('./pages/TALV/CaptureAttendance/ImportAttendance'));
const ImportInOutTime = React.lazy(() => import('./pages/TALV/CaptureAttendance/ImportInOutTime'));
const ShiftPunchRegister = React.lazy(() => import('./pages/TALV/AttendanceReports/ShiftPunchRegister'));
const AttendanceRegister = React.lazy(() => import('./pages/TALV/AttendanceReports/AttendanceRegister'));
const OverTimeCompOff = React.lazy(() => import('./pages/TALV/AttendanceReports/OverTimeCompOff'));
const ShiftPlanRegister = React.lazy(() => import('./pages/TALV/AttendanceReports/ShiftPlanRegister'));
const ShiftDeviationRegister = React.lazy(() => import('./pages/TALV/AttendanceReports/ShiftDeviationRegister'));
const AbscondingReport = React.lazy(() => import('./pages/TALV/AttendanceReports/AbscondingReport'));
const OTSummary = React.lazy(() => import('./pages/TALV/AttendanceReports/OTSummary'));
const HeadcountOccupancyReport = React.lazy(() => import('./pages/TALV/AttendanceReports/HeadcountOccupancyReport'));
const AttendanceDashboard = React.lazy(() => import('./pages/TALV/AttendanceDashboard'));
const AttendancePolicyMaster = React.lazy(() => import('./pages/TALV/AttendancePolicyMaster'));
const LeavePolicyConfig = React.lazy(() => import('./pages/TALV/LeavePolicyConfig'));
const EmployeeLeaveMaster = React.lazy(() => import('./pages/TALV/EmployeeLeaveMaster'));
const UploadOpeningLeaveBalance = React.lazy(() => import('./pages/TALV/UploadOpeningLeaveBalance'));
const MobileAppLinking = React.lazy(() => import('./pages/TALV/MobileAppLinking'));
const AttendanceControl = React.lazy(() => import('./pages/TALV/AttendanceControl'));
const ShiftPlanningUpload = React.lazy(() => import('./pages/TALV/ShiftPlanningUpload'));
const ShiftMaster = React.lazy(() => import('./pages/TALV/ShiftMaster'));
const HRViewLeavesOutdoor = React.lazy(() => import('./pages/TALV/HRViewLeavesOutdoor'));
const EmpMasterUpload = React.lazy(() => import('./pages/EmpMasterUpload/EmpMasterUpload'));

const UploadMonthlyLeaveBalance = React.lazy(() => import('./pages/TALV/UploadMonthlyLeaveBalance'));
const EmployeeLeaveBalance = React.lazy(() => import('./pages/TALV/EmployeeLeaveBalance'));
const LeaveApplicationList = React.lazy(() => import('./pages/TALV/LeaveApplicationList'));
const LeaveApplicationForm = React.lazy(() => import('./pages/TALV/LeaveApplicationForm'));
const CompensatoryLeaveRequest = React.lazy(() => import('./pages/TALV/CompensatoryLeaveRequest'));
const AttendanceRequest = React.lazy(() => import('./pages/TALV/AttendanceRequest'));
const UploadResume = React.lazy(() => import('./pages/TALV/UploadResume'));
const ResumeDatabase = React.lazy(() => import('./pages/TALV/ResumeDatabase'));

// ERP Payroll - Masters
const ERPSalaryComponent = React.lazy(() => import('./pages/ERPPayroll/SalaryComponent'));
const ERPSalaryStructure = React.lazy(() => import('./pages/ERPPayroll/SalaryStructure'));
const ERPIncomeTaxSlab = React.lazy(() => import('./pages/ERPPayroll/IncomeTaxSlab'));
const ERPPayrollPeriod = React.lazy(() => import('./pages/ERPPayroll/PayrollPeriod'));
// ERP Payroll - Payroll
const ERPSalaryStructureAssignment = React.lazy(() => import('./pages/ERPPayroll/SalaryStructureAssignment'));
const ERPBulkSalaryStructureAssignment = React.lazy(() => import('./pages/ERPPayroll/BulkSalaryStructureAssignment'));
const ERPSalarySlip = React.lazy(() => import('./pages/ERPPayroll/SalarySlip'));
const ERPPayrollEntry = React.lazy(() => import('./pages/ERPPayroll/PayrollEntry'));
const ERPSalaryWithholding = React.lazy(() => import('./pages/ERPPayroll/SalaryWithholding'));
// ERP Payroll - Incentives
const ERPAdditionalSalary = React.lazy(() => import('./pages/ERPPayroll/AdditionalSalary'));
const ERPEmployeeIncentive = React.lazy(() => import('./pages/ERPPayroll/EmployeeIncentive'));
const ERPRetentionBonus = React.lazy(() => import('./pages/ERPPayroll/RetentionBonus'));
// ERP Payroll - Tax & Benefits
const ERPTaxExemptionDeclaration = React.lazy(() => import('./pages/ERPPayroll/TaxExemptionDeclaration'));
const ERPTaxExemptionProof = React.lazy(() => import('./pages/ERPPayroll/TaxExemptionProof'));
const ERPTaxExemptionCategories = React.lazy(() => import('./pages/ERPPayroll/TaxExemptionCategories'));
const ERPBenefitApplication = React.lazy(() => import('./pages/ERPPayroll/BenefitApplication'));
const ERPBenefitClaim = React.lazy(() => import('./pages/ERPPayroll/BenefitClaim'));
// ERP Payroll - Reports
const ERPSalaryRegister = React.lazy(() => import('./pages/ERPPayroll/Reports/SalaryRegister'));
const ERPSalaryPaymentsMode = React.lazy(() => import('./pages/ERPPayroll/Reports/SalaryPaymentsMode'));
const ERPSalaryPaymentsECS = React.lazy(() => import('./pages/ERPPayroll/Reports/SalaryPaymentsECS'));
const ERPIncomeTaxComputation = React.lazy(() => import('./pages/ERPPayroll/Reports/IncomeTaxComputation'));
const ERPPFDeductions = React.lazy(() => import('./pages/ERPPayroll/Reports/PFDeductions'));
const ERPPTDeductions = React.lazy(() => import('./pages/ERPPayroll/Reports/PTDeductions'));
const ERPIncomeTaxDeductions = React.lazy(() => import('./pages/ERPPayroll/Reports/IncomeTaxDeductions'));
const BulkSalaryStructureAssignment = React.lazy(() => import('./pages/ERPPayroll/BulkSalaryStructureAssignment'));

// Performance Module
const AppraisalTemplate = React.lazy(() => import('./pages/Performance/AppraisalTemplate'));
const KRA = React.lazy(() => import('./pages/Performance/KRA'));
const EmployeeFeedbackCriteria = React.lazy(() => import('./pages/Performance/EmployeeFeedbackCriteria'));
const Appraisal = React.lazy(() => import('./pages/Performance/Appraisal'));
const AppraisalCycle = React.lazy(() => import('./pages/Performance/AppraisalCycle'));
const EmployeePerformanceFeedback = React.lazy(() => import('./pages/Performance/EmployeePerformanceFeedback'));
const EmployeePerformanceFeedbackByHR = React.lazy(() => import('./pages/Performance/EmployeePerformanceFeedbackByHR'));
const Goal = React.lazy(() => import('./pages/Performance/Goal'));
const AppraisalOverview = React.lazy(() => import('./pages/Performance/AppraisalOverview'));
const TrainingNeedsIdentification = React.lazy(() => import('./pages/Performance/TrainingNeedsIdentification'));
const StaffingPlan = React.lazy(() => import('./pages/Recruitment/StaffingPlan'));
const JobRequisition = React.lazy(() => import('./pages/Recruitment/JobRequisition'));
const JobOpening = React.lazy(() => import('./pages/Recruitment/JobOpening'));
const JobApplicant = React.lazy(() => import('./pages/Recruitment/JobApplicant'));
const JobOffer = React.lazy(() => import('./pages/Recruitment/JobOffer'));
const EmployeeReferral = React.lazy(() => import('./pages/Recruitment/EmployeeReferral'));
const InterviewType = React.lazy(() => import('./pages/Recruitment/InterviewType'));
const InterviewRound = React.lazy(() => import('./pages/Recruitment/InterviewRound'));
const Interview = React.lazy(() => import('./pages/Recruitment/Interview'));
const InterviewFeedback = React.lazy(() => import('./pages/Recruitment/InterviewFeedback'));
const AppointmentLetterTemplate = React.lazy(() => import('./pages/Recruitment/AppointmentLetterTemplate'));
const AppointmentLetter = React.lazy(() => import('./pages/Recruitment/AppointmentLetter'));
const RecruitmentAnalytics = React.lazy(() => import('./pages/Recruitment/RecruitmentAnalytics'));
const RecruitmentDashboard = React.lazy(() => import('./pages/Recruitment/RecruitmentDashboard'));
const RecruitmentSettings = React.lazy(() => import('./pages/Recruitment/RecruitmentSettings'));
const HRModule = React.lazy(() => import('./pages/HR/HRModule'));
const RecruitmentModule = React.lazy(() => import('./pages/HR/RecruitmentModule'));
const PerformanceModule = React.lazy(() => import('./pages/HR/PerformanceModule'));
const ShiftAttendanceModule = React.lazy(() => import('./pages/HR/ShiftAttendanceModule'));
const LeaveModule = React.lazy(() => import('./pages/HR/LeaveModule'));
const HRDashboard = React.lazy(() => import('./pages/HR/HRDashboard'));
const ERPPayrollDashboard = React.lazy(() => import('./pages/ERPPayroll/ERPPayrollDashboard'));
const AssetList = React.lazy(() => import('./pages/Assets/AssetList'));
const AssetForm = React.lazy(() => import('./pages/Assets/AssetForm'));
const Location = React.lazy(() => import('./pages/Assets/Location'));
const AssetCategory = React.lazy(() => import('./pages/Assets/AssetCategory'));
const AssetMovement = React.lazy(() => import('./pages/Assets/AssetMovement'));
const AssetMaintenanceTeam = React.lazy(() => import('./pages/Assets/AssetMaintenanceTeam'));
const AssetMaintenance = React.lazy(() => import('./pages/Assets/AssetMaintenance'));
const AssetMaintenanceLog = React.lazy(() => import('./pages/Assets/AssetMaintenanceLog'));
const AssetValueAdjustment = React.lazy(() => import('./pages/Assets/AssetValueAdjustment'));
const AssetRepair = React.lazy(() => import('./pages/Assets/AssetRepair'));
const AssetCapitalization = React.lazy(() => import('./pages/Assets/AssetCapitalization'));
const AssetDepreciationLedger = React.lazy(() => import('./pages/Assets/AssetDepreciationLedger'));
const AssetDepreciationsBalances = React.lazy(() => import('./pages/Assets/AssetDepreciationsBalances'));
const AssetMaintenanceReport = React.lazy(() => import('./pages/Assets/AssetMaintenanceReport'));
const AssetActivityReport = React.lazy(() => import('./pages/Assets/AssetActivityReport'));

// Education Module
const Student = React.lazy(() => import('./pages/Education/Student'));
const StudentGroup = React.lazy(() => import('./pages/Education/StudentGroup'));
const StudentLog = React.lazy(() => import('./pages/Education/StudentLog'));
const Program = React.lazy(() => import('./pages/Education/Program'));
const Course = React.lazy(() => import('./pages/Education/Course'));
const Topic = React.lazy(() => import('./pages/Education/Topic'));
const Room = React.lazy(() => import('./pages/Education/Room'));
const Instructor = React.lazy(() => import('./pages/Education/Instructor'));
const Guardian = React.lazy(() => import('./pages/Education/Guardian'));
const StudentApplicant = React.lazy(() => import('./pages/Education/StudentApplicant'));
const StudentAdmission = React.lazy(() => import('./pages/Education/StudentAdmission'));
const ProgramEnrollment = React.lazy(() => import('./pages/Education/ProgramEnrollment'));
const CourseEnrollment = React.lazy(() => import('./pages/Education/CourseEnrollment'));
const FeeStructure = React.lazy(() => import('./pages/Education/FeeStructure'));
const FeeCategory = React.lazy(() => import('./pages/Education/FeeCategory'));
const FeeSchedule = React.lazy(() => import('./pages/Education/FeeSchedule'));
const Fees = React.lazy(() => import('./pages/Education/Fees'));
const FeesDiscountScreen = React.lazy(() => import('./pages/Education/FeesDiscountScreen'));
const StudentFeeCollection = React.lazy(() => import('./pages/Education/StudentFeeCollection'));
const FeesReport = React.lazy(() => import('./pages/Education/FeesReport'));
const ProgramWiseFeeCollection = React.lazy(() => import('./pages/Education/ProgramWiseFeeCollection'));
const CourseSchedule = React.lazy(() => import('./pages/Education/CourseSchedule'));
// CourseSchedulingTool moved down to standardized tools section
const StudentAttendance = React.lazy(() => import('./pages/Education/StudentAttendance'));
const StudentLeaveApplication = React.lazy(() => import('./pages/Education/StudentLeaveApplication'));
const StudentMonthlyAttendanceSheet = React.lazy(() => import('./pages/Education/StudentMonthlyAttendanceSheet'));
const AbsentStudentReport = React.lazy(() => import('./pages/Education/AbsentStudentReport'));
const StudentBatchWiseAttendance = React.lazy(() => import('./pages/Education/StudentBatchWiseAttendance'));
const CourseActivity = React.lazy(() => import('./pages/Education/CourseActivity'));
const QuizActivity = React.lazy(() => import('./pages/Education/QuizActivity'));
const AssessmentPlan = React.lazy(() => import('./pages/Education/AssessmentPlan'));
const AssessmentGroup = React.lazy(() => import('./pages/Education/AssessmentGroup'));
const AssessmentResult = React.lazy(() => import('./pages/Education/AssessmentResult'));
const AssessmentCriteria = React.lazy(() => import('./pages/Education/AssessmentCriteria'));
const CourseWiseAssessmentReport = React.lazy(() => import('./pages/Education/CourseWiseAssessmentReport'));
const FinalAssessmentGrades = React.lazy(() => import('./pages/Education/FinalAssessmentGrades'));
const AssessmentPlanStatus = React.lazy(() => import('./pages/Education/AssessmentPlanStatus'));
const StudentReportGenerationTool = React.lazy(() => import('./pages/Education/StudentReportGenerationTool'));
const StudentAttendanceTool = React.lazy(() => import('./pages/Education/StudentAttendanceTool'));
const QuickAttendance = React.lazy(() => import('./pages/Education/QuickAttendance'));
const HomeworkAssignment = React.lazy(() => import('./pages/Homework/HomeworkAssignment'));
const ClassworkAssignment = React.lazy(() => import('./pages/Homework/ClassworkAssignment'));
const WeeklyPlan = React.lazy(() => import('./pages/Homework/WeeklyPlan'));
const AssessmentResultTool = React.lazy(() => import('./pages/Education/AssessmentResultTool'));
const StudentGroupCreationTool = React.lazy(() => import('./pages/Education/StudentGroupCreationTool'));
const ProgramEnrollmentTool = React.lazy(() => import('./pages/Education/ProgramEnrollmentTool'));
const CourseSchedulingTool = React.lazy(() => import('./pages/Education/CourseSchedulingTool'));
const ClasswiseSubjectAllocationTool = React.lazy(() => import('./pages/Education/ClasswiseSubjectAllocationTool'));
const StudentAndGuardianContactDetailsReport = React.lazy(() => import('./pages/Education/StudentAndGuardianContactDetailsReport'));
const Article = React.lazy(() => import('./pages/Education/Article'));
const Video = React.lazy(() => import('./pages/Education/Video'));
const Quiz = React.lazy(() => import('./pages/Education/Quiz'));
const EducationSettings = React.lazy(() => import('./pages/Education/EducationSettings'));
const StudentCategory = React.lazy(() => import('./pages/Education/StudentCategory'));
const StudentBatchName = React.lazy(() => import('./pages/Education/StudentBatchName'));
const GradingScale = React.lazy(() => import('./pages/Education/GradingScale'));
const AcademicYear = React.lazy(() => import('./pages/Education/AcademicYear'));
const AcademicTerm = React.lazy(() => import('./pages/Education/AcademicTerm'));
const RollGRAssign = React.lazy(() => import('./pages/Education/RollGRAssign'));
const DashboardFeesManage = React.lazy(() => import('./pages/Education/DashboardFeesManage'));

// Enquiry Module
const AddEnquiry = React.lazy(() => import('./pages/Enquiry/AddEnquiry'));
const FollowUpDays = React.lazy(() => import('./pages/Enquiry/FollowUpDays'));
const SourceOfEnquiry = React.lazy(() => import('./pages/Enquiry/SourceOfEnquiry'));
const EnquiryFollowUpList = React.lazy(() => import('./pages/Enquiry/EnquiryFollowUpList'));
const ReferrerMaster = React.lazy(() => import('./pages/Enquiry/ReferrerMaster'));
const RegistrationForm = React.lazy(() => import('./pages/Enquiry/RegistrationForm'));
const FormFeeSetup = React.lazy(() => import('./pages/Enquiry/FormFeeSetup'));
const FinalAdmissionForm = React.lazy(() => import('./pages/Enquiry/FinalAdmissionForm'));
const DownloadAdmissionForm = React.lazy(() => import('./pages/Enquiry/DownloadAdmissionForm'));
const EnquiryReport = React.lazy(() => import('./pages/Enquiry/EnquiryReport'));
const RegistrationReport = React.lazy(() => import('./pages/Enquiry/RegistrationReport'));
const AdmissionReport = React.lazy(() => import('./pages/Enquiry/AdmissionReport'));
const AdmissionFeesReport = React.lazy(() => import('./pages/Enquiry/AdmissionFeesReport'));
const EnquiryCustomReport = React.lazy(() => import('./pages/Enquiry/EnquiryCustomReport'));
const RegistrationCustomReport = React.lazy(() => import('./pages/Enquiry/RegistrationCustomReport'));
const ClassRestrictionSetup = React.lazy(() => import('./pages/Enquiry/ClassRestrictionSetup'));
const Announcement = React.lazy(() => import('./pages/Enquiry/Announcement'));
const CoordinatorSetup = React.lazy(() => import('./pages/Enquiry/CoordinatorSetup'));







// Selling Module
const Customer = React.lazy(() => import('./pages/Selling/Customer'));
const Quotation = React.lazy(() => import('./pages/Selling/Quotation'));
const SalesOrder = React.lazy(() => import('./pages/Selling/SalesOrder'));
const SalesInvoice = React.lazy(() => import('./pages/Selling/SalesInvoice'));
const BlanketOrder = React.lazy(() => import('./pages/Selling/BlanketOrder'));
const SalesPartner = React.lazy(() => import('./pages/Selling/SalesPartner'));
const SalesPerson = React.lazy(() => import('./pages/Selling/SalesPerson'));
const POSProfile = React.lazy(() => import('./pages/Selling/POSProfile'));
const POSSettings = React.lazy(() => import('./pages/Selling/POSSettings'));
const LoyaltyProgram = React.lazy(() => import('./pages/Selling/LoyaltyProgram'));
const LoyaltyPointEntry = React.lazy(() => import('./pages/Selling/LoyaltyPointEntry'));
const ItemPrice = React.lazy(() => import('./pages/Accounting/ItemPrice'));
const PriceList = React.lazy(() => import('./pages/Accounting/PriceList'));
const PromotionalScheme = React.lazy(() => import('./pages/Selling/PromotionalScheme'));
const PricingRule = React.lazy(() => import('./pages/Selling/PricingRule'));
const CouponCode = React.lazy(() => import('./pages/Selling/CouponCode'));
const WebsiteItem = React.lazy(() => import('./pages/Website/WebsiteItem'));

// Buying Module
const PurchaseOrder = React.lazy(() => import('./pages/Buying/PurchaseOrder'));

const CertificatesDashboard = React.lazy(() => import('./pages/Certificates/CertificatesDashboard'));
const BonafideCertificate = React.lazy(() => import('./pages/Certificates/BonafideCertificate'));
const TrialCertificate = React.lazy(() => import('./pages/Certificates/TrialCertificate'));
const TransferCertificate = React.lazy(() => import('./pages/Certificates/TransferCertificate'));
const DomisileCharacterCertificate = React.lazy(() => import('./pages/Certificates/DomisileCharacterCertificate'));
const CertificateRecords = React.lazy(() => import('./pages/Certificates/CertificateRecords'));
const UserList = React.lazy(() => import('./pages/masters/UserList'));
const RoleList = React.lazy(() => import('./pages/masters/RoleList'));
const RoleProfileList = React.lazy(() => import('./pages/masters/RoleProfileList'));
const ModuleProfileList = React.lazy(() => import('./pages/masters/ModuleProfileList'));
const StoredDocuments = React.lazy(() => import('./pages/StoredDocuments/StoredDocuments'));

const RootRedirect = () => {
  const { isAdmin, isStudent, isInstructor, isGuardian, isAttendanceManager, isCoordinator } = useUserRole();
  if (isAttendanceManager) return <Navigate to="/education/student-attendance" replace />;
  if (isAdmin) return <Navigate to="/home" replace />;
  if (isStudent) return <Navigate to="/student-dashboard" replace />;
  if (isCoordinator) return <Navigate to="/coordinator-dashboard" replace />;
  if (isInstructor) return <Navigate to="/instructor-dashboard" replace />;
  if (isGuardian) return <Navigate to="/guardian-dashboard" replace />;
  return <Navigate to="/employee-self-service" replace />;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isStudent, isInstructor, isGuardian, isAttendanceManager, isCoordinator } = useUserRole();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeModule, setActiveModule] = React.useState(null);

  // Sync activeModule and keep sidebar open for Attendance Manager
  React.useEffect(() => {
    if (isAttendanceManager) {
      setActiveModule('education');
      setIsSidebarOpen(true);
    }
  }, [isAttendanceManager]);

  // Strict route protection for Attendance Manager
  React.useEffect(() => {
    const isLogged = localStorage.getItem('isLogged') === 'true';
    const allowedAttendancePaths = [
      '/',
      '/education/student-attendance',
      '/education/quick-attendance',
      '/education/student-leave-application',
      '/education/student-monthly-attendance-sheet',
      '/education/absent-student-report',
      '/education/student-batch-wise-attendance'
    ];

    if (isLogged && isAttendanceManager && !allowedAttendancePaths.includes(location.pathname)) {
      navigate('/education/student-attendance', { replace: true });
    }
  }, [location.pathname, isAttendanceManager, navigate]);

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
        if (isAttendanceManager) navigate('/education/student-attendance');
        else if (isStudent) navigate('/student-dashboard');
        else if (isCoordinator) navigate('/coordinator-dashboard');
        else if (isInstructor) navigate('/instructor-dashboard');
        else if (isGuardian) navigate('/guardian-dashboard');
        else navigate('/education/student');
    } else if (moduleKey === 'accounting') {
        navigate('/accounting/company');
    } else if (moduleKey === 'selling') {
        navigate('/selling/customer');
    } else if (moduleKey === 'buying') {
        navigate('/buying/purchase-order');
    } else if (moduleKey === 'master') {
        navigate('/dashboard');
    } else if (moduleKey === 'users') {
        navigate('/users');
    } else if (moduleKey === 'companies') {
        navigate('/companies');
    } else if (moduleKey === 'stock') {
        navigate('/stock/item');
    } else if (moduleKey === 'transport') {
        navigate('/transport/dashboard');
    } else if (moduleKey === 'enquiry') {
        navigate('/enquiry/dashboard');
    } else if (moduleKey === 'homework') {
        navigate('/homework/assignments');
    } else if (moduleKey === 'importLogs') {
        navigate('/import-logs/students');
    } else if (moduleKey === 'certificates') {
        navigate('/certificates/dashboard');
    } else if (moduleKey === 'storedDocuments') {
        navigate('/stored-documents');
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
            <React.Suspense fallback={<div className="flex items-center justify-center h-screen w-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
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
                <Route path="/student-dashboard" element={<StudentDashboard />} />
                <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
                <Route path="/coordinator-dashboard" element={<CoordinatorDashboard />} />
                <Route path="/guardian-dashboard" element={<GuardianDashboard />} />
                <Route path="/approver/*" element={<Approver />} />
                
                {/* Users Routes */}
                <Route path="/users" element={<UserList />} />
                <Route path="/users/roles" element={<RoleList />} />
                <Route path="/users/role-profiles" element={<RoleProfileList />} />
                <Route path="/users/module-profiles" element={<ModuleProfileList />} />

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
                <Route path="/education/roll-gr-assign" element={<RollGRAssign />} />
                <Route path="/education/dashboard-fees-manage" element={<DashboardFeesManage />} />
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
                <Route path="/education/fees-discount" element={<FeesDiscountScreen />} />
                <Route path="/education/student-fee-collection" element={<StudentFeeCollection />} />
                <Route path="/education/fees-report" element={<FeesReport />} />
                <Route path="/education/program-wise-fee-collection" element={<ProgramWiseFeeCollection />} />
                <Route path="/education/course-schedule" element={<CourseSchedule />} />
                <Route path="/education/course-scheduling-tool" element={<CourseSchedulingTool />} />
                <Route path="/education/student-attendance" element={<StudentAttendance />} />
                <Route path="/education/quick-attendance" element={<QuickAttendance />} />
                <Route path="/education/student-leave-application" element={<StudentLeaveApplication />} />
                <Route path="/education/student-monthly-attendance-sheet" element={<StudentMonthlyAttendanceSheet />} />
                <Route path="/education/absent-student-report" element={<AbsentStudentReport />} />
                <Route path="/education/student-batch-wise-attendance" element={<StudentBatchWiseAttendance />} />
                <Route path="/education/course-activity" element={<CourseActivity />} />
                <Route path="/education/roll-gr-assign" element={<RollGRAssign />} />
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
                <Route path="/education/classwise-subject-allocation-tool" element={<ClasswiseSubjectAllocationTool />} />
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
                <Route path="/stock/item" element={<Item />} />
                <Route path="/stock/item-group" element={<ItemGroup />} />
                <Route path="/stock/product-bundle" element={<ProductBundle />} />
                <Route path="/stock/shipping-rule" element={<ShippingRule />} />
                <Route path="/stock/item-alternative" element={<ItemAlternative />} />
                <Route path="/stock/item-manufacturer" element={<ItemManufacturer />} />
                <Route path="/stock/material-request" element={<MaterialRequest />} />
                <Route path="/stock/stock-entry" element={<StockEntry />} />
                <Route path="/stock/delivery-note" element={<DeliveryNote />} />
                <Route path="/stock/purchase-receipt" element={<PurchaseReceipt />} />
                <Route path="/stock/pick-list" element={<PickList />} />
                <Route path="/stock/delivery-trip" element={<DeliveryTrip />} />
                <Route path="/stock/stock-ledger" element={<StockLedger />} />
                <Route path="/stock/stock-balance" element={<StockBalance />} />
                <Route path="/stock/stock-projected-qty" element={<StockProjectedQty />} />
                <Route path="/stock/stock-summary" element={<StockSummary />} />
                <Route path="/stock/stock-ageing" element={<StockAgeing />} />
                <Route path="/stock/item-price-stock" element={<ItemPriceStock />} />
                <Route path="/stock/warehouse-wise-stock-balance" element={<WarehouseWiseStock />} />
                <Route path="/stock/stock-settings" element={<StockSettings />} />
                <Route path="/stock/warehouse" element={<WarehouseMaster />} />
                <Route path="/stock/uom" element={<UOM />} />
                <Route path="/stock/brand" element={<Brand />} />
                <Route path="/stock/serial-no" element={<SerialNo />} />
                <Route path="/stock/batch" element={<Batch />} />
                <Route path="/stock/installation-note" element={<InstallationNote />} />
                <Route path="/stock/item-attribute" element={<ItemAttribute />} />
                <Route path="/stock/uom-conversion-factor" element={<UOMConversionFactor />} />
                <Route path="/stock/item-variant-settings" element={<ItemVariantSettings />} />
                <Route path="/stock/serial-no-service-contract-expiry" element={<SerialNoServiceContractExpiry />} />
                <Route path="/stock/serial-no-status" element={<SerialNoStatus />} />
                <Route path="/stock/stock-reconciliation" element={<StockReconciliation />} />
                <Route path="/stock/landed-cost-voucher" element={<LandedCostVoucher />} />
                <Route path="/stock/packing-slip" element={<PackingSlip />} />
                <Route path="/stock/quality-inspection" element={<QualityInspection />} />
                <Route path="/stock/quality-inspection-template" element={<QualityInspectionTemplate />} />
                <Route path="/stock/quick-stock-balance" element={<QuickStockBalance />} />
                <Route path="/stock/report/stock-analytics" element={<StockAnalytics />} />
                <Route path="/stock/report/delivery-note-trends" element={<DeliveryNoteTrends />} />
                <Route path="/stock/report/purchase-receipt-trends" element={<PurchaseReceiptTrends />} />
                <Route path="/stock/report/sales-order-analysis" element={<SalesOrderAnalysis />} />
                <Route path="/stock/report/purchase-order-analysis" element={<PurchaseOrderAnalysis />} />
                <Route path="/stock/report/item-shortage-report" element={<ItemShortageReport />} />
                <Route path="/stock/report/batch-wise-balance-history" element={<BatchWiseBalanceHistory />} />
                <Route path="/stock/report/batch-item-expiry-status" element={<BatchItemExpiryStatus />} />
                <Route path="/stock/report/item-prices" element={<ItemPrices />} />
                <Route path="/stock/report/recommended-reorder-level" element={<RecommendedReorderLevel />} />
                <Route path="/stock/report/item-variant-details" element={<ItemVariantDetails />} />
                <Route path="/stock/report/subcontract-raw-materials-transfer" element={<SubcontractRawMaterialsTransfer />} />
                <Route path="/stock/report/subcontract-item-received" element={<SubcontractItemReceived />} />
                
                {/* Transport Routes */}
                <Route path="/transport/dashboard" element={<div className="p-8"><h1 className="text-2xl font-bold">Transport Dashboard</h1><p className="mt-4 text-gray-500">Integration with Firebase for content coming soon...</p></div>} />
                <Route path="/transport/settings/config" element={<TransportConfiguration />} />
                <Route path="/transport/master/add-vehicle" element={<AddVehicle />} />
                <Route path="/transport/master/add-bus-stop" element={<AddBusStop />} />
                <Route path="/transport/master/add-bus-routes" element={<AddBusRoutes />} />
                <Route path="/transport/master/range" element={<TransportRange />} />
                <Route path="/transport/transaction/student-allocation" element={<StudentTransportAllocation />} />
                <Route path="/transport/transaction/route-excel-import" element={<RouteExcelImport />} />
                <Route path="/transport/transaction/punch-timing" element={<SetPunchTiming />} />
                <Route path="/transport/transaction/transport-sms" element={<TransportSMS />} />
                <Route path="/transport/transaction/carry-forward" element={<TransportCarryForward />} />
                <Route path="/transport/transaction/fee-import" element={<TransportFeeImport />} />
                <Route path="/transport/reports/student-punch-detail" element={<StudentPunchDetail />} />
                <Route path="/transport/reports/new-transport-report" element={<NewTransportReport />} />

                {/* Homework Routes */}
                <Route path="/homework/assignments" element={<HomeworkAssignment />} />
                <Route path="/homework/classwork" element={<ClassworkAssignment />} />
                <Route path="/homework/weekly-plan" element={<WeeklyPlan />} />

                {/* Enquiry Routes */}
                <Route path="/enquiry/dashboard" element={<div className="p-8"><h1 className="text-2xl font-bold">Enquiry Dashboard</h1><p className="mt-4 text-gray-500">Enquiry module content coming soon...</p></div>} />
                <Route path="/enquiry/add" element={<AddEnquiry />} />
                <Route path="/enquiry/follow-up-days" element={<FollowUpDays />} />
                <Route path="/enquiry/source" element={<SourceOfEnquiry />} />
                <Route path="/enquiry/follow-up-list" element={<EnquiryFollowUpList />} />
                <Route path="/enquiry/referrer" element={<ReferrerMaster />} />
                <Route path="/enquiry/registration/add" element={<RegistrationForm initialView="form" />} />
                <Route path="/enquiry/registration/manage" element={<RegistrationForm initialView="list" />} />
                <Route path="/enquiry/admission/fee-setup" element={<FormFeeSetup />} />
                <Route path="/enquiry/admission/final-form" element={<FinalAdmissionForm initialView="list" />} />
                <Route path="/enquiry/admission/download" element={<DownloadAdmissionForm />} />
                <Route path="/enquiry/reports/enquiry" element={<EnquiryReport />} />
                <Route path="/enquiry/reports/registration" element={<RegistrationReport />} />
                <Route path="/enquiry/reports/admission" element={<AdmissionReport />} />
                <Route path="/enquiry/reports/admission-fees" element={<AdmissionFeesReport />} />
                <Route path="/enquiry/reports/enquiry-custom" element={<EnquiryCustomReport />} />
                <Route path="/enquiry/reports/registration-custom" element={<RegistrationCustomReport />} />
                <Route path="/enquiry/setup/class-restriction" element={<ClassRestrictionSetup />} />
                <Route path="/enquiry/announcement" element={<Announcement />} />
                <Route path="/enquiry/coordinator-setup" element={<CoordinatorSetup />} />
                {/* Import Logs Routes */}
                <Route path="/import-logs/students" element={<ImportLogs />} />
                <Route path="/import-logs/registrations" element={<RegistrationImportLogs />} />

                {/* Certificates Routes */}
                <Route path="/certificates/dashboard" element={<CertificatesDashboard />} />
                <Route path="/certificates/bonafide" element={<BonafideCertificate />} />
                <Route path="/certificates/trial" element={<TrialCertificate />} />
                <Route path="/certificates/transfer" element={<TransferCertificate />} />
                <Route path="/certificates/domisile" element={<DomisileCharacterCertificate />} />
                <Route path="/certificates/records" element={<CertificateRecords />} />

                {/* Stored Documents */}
                <Route path="/stored-documents" element={<StoredDocuments />} />

              </Route> {/* End of Protected Routes */}

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
            </React.Suspense>
            {/* Route verification active */}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
