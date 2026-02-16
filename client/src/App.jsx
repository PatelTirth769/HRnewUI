import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import Dashboard from './pages/Dashboard';
import EmployeeSelfService from './pages/ESS/EmployeeSelfService';
import EmployeeMIS from './pages/EmployeeMIS';
import CompanyMaster from './components/company/CompanyMaster';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
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
import UploadMonthlyLeaveBalance from './pages/TALV/UploadMonthlyLeaveBalance';


function App() {
  const location = useLocation();

  return (
    <div className="App">
      <Header />
      <main className="main-content min-h-screen bg-gray-50">
        <div className="flex">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/employee-self-service/*" element={<EmployeeSelfService />} />
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
              <Route path="/talv/attendance-dashboard" element={<AttendanceDashboard />} />
              <Route path="/talv/attendance-policy" element={<AttendancePolicyMaster />} />
              <Route path="/talv/leave-policy-config" element={<LeavePolicyConfig />} />
              <Route path="/talv/employee-leave-master" element={<EmployeeLeaveMaster />} />
              <Route path="/talv/upload-opening-leave-balance" element={<UploadOpeningLeaveBalance />} />
              <Route path="/talv/mobile-app-linking" element={<MobileAppLinking />} />
              <Route path="/talv/attendance-control" element={<AttendanceControl />} />
              <Route path="/talv/shift-planning-upload" element={<ShiftPlanningUpload />} />
              <Route path="/talv/shift-master" element={<ShiftMaster />} />
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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
