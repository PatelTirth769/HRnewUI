import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './App.css'
import ManageYearPage from './pages/ManageYearPage'
import ManageStream from './pages/Master/ManageStream'
import ManageSemesterProgram from './pages/Master/ManageSemesterProgram'
import ManageInstituteSemester from './pages/Master/ManageInstituteSemester'
import ManageExamCenter from './pages/ManageExamCenter'
import ManageStateDistrictCity from './pages/ManageStateDistrictCity'
import ManageCastCategory from './pages/ManageCastCategory'
import ManageUserRights from './pages/ManageUserRights'
import ManageInstitute from './pages/ManageInstitute'
import ManageDegree from './pages/ManageDegree'
import ManageStudentDetail from './pages/ManageStudentDetail'
import YearConfiguration from './pages/YearConfiguration'
import ManageProgram from './pages/ManageProgram'
import ManageExam from './pages/ManageExam'
import ManageExamGroup from './pages/ManageExamGroup'
import SynchronizeSubject from './pages/SynchronizeSubject'
import ManageSubjectHead from './pages/ManageSubjectHead'
import ManageExamFee from './pages/ManageExamFee'
import ManageBacklogNorms from './pages/ManageBacklogNorms'
import SeatNumberGeneration from './pages/SeatNumberGeneration'
import SetAttendanceEligibility from './pages/SetAttendanceEligibility'
import StudentTermGrant from './pages/StudentTermGrant'
import SetInternalPracticalMarksEntry from './pages/SetInternalPracticalMarksEntry'
import InternalPracticalMarksEntryLock from './pages/InternalPracticalMarksEntryLock'
import MarksEntryChecklistReport from './pages/MarksEntryChecklistReport'
import SetGracingCondonationRule from "./pages/SetGracingCondonationRule";
import SetGradeClassRule from './pages/SetGradeClassRule';
import StudentResultProcess from './pages/StudentResultProcess';
import ResultDeclarationDetail from './pages/ResultDeclarationDetail';
import NotificationReport from './pages/NotificationReport';
import PostExaminationReport from './pages/PostExaminationReport';
import SetReassessmentFees from './pages/SetReassessmentFees';
import ReAssApplication from './pages/ReAssApplication';
import ReAssMarksEntry from './pages/ReAssMarksEntry';
import ReAssResultProcess from './pages/ReAssResultProcess';
import ReAssReport from './pages/ReAssReport';
import SetFacultyReassessment from './pages/SetFacultyReassessment';
import SecondAssessment from './pages/SecondAssessment';
import FacultySecondAssessment from './pages/FacultySecondAssessment';
import ApplyNearestMarks from './pages/ApplyNearestMarks';
import ExamDatesheet from './pages/ExamDatesheet';
import ManageCopyCaseNorms from './pages/ManageCopyCaseNorms';
import ExamBlockConfig from './pages/ExamBlockConfig';
import ManageBlockAndResource from './pages/ManageBlockAndResource';
import GenerateBarcodeSticker from './pages/GenerateBarcodeSticker';
import PreExamReports from './pages/PreExamReports';
import GenerateFacultyDummyId from './pages/GenerateFacultyDummyId';
import WithBarcodeMarksEntry from './pages/WithBarcodeMarksEntry';
import Sidebar from './components/Sidebar'

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            <Routes>
              <Route path="/" element={<ManageYearPage />} />
              <Route path="/master/manage-stream" element={<ManageStream />} />
              <Route path="/master/manage-semester-program" element={<ManageSemesterProgram />} />
              <Route path="/master/manage-institute-wise-semester" element={<ManageInstituteSemester />} />
              <Route path="/master/manage-exam-center" element={<ManageExamCenter />} />
              <Route path="/master/manage-state-district-city" element={<ManageStateDistrictCity />} />
              <Route path="/master/manage-cast-category" element={<ManageCastCategory />} />
              <Route path="/master/manage-user-rights" element={<ManageUserRights />} />
              <Route path="/master/manage-institute" element={<ManageInstitute />} />
              <Route path="/master/manage-degree" element={<ManageDegree />} />
              <Route path="/master/manage-student-detail" element={<ManageStudentDetail />} />
              <Route path="/pre-examination/year-configuration" element={<YearConfiguration />} />
              <Route path="/pre-examination/manage-program" element={<ManageProgram />} />
              <Route path="/pre-examination/manage-exam-term" element={<ManageExam />} />
              <Route path="/pre-examination/manage-exam-group" element={<ManageExamGroup />} />
              <Route path="/pre-examination/seat-number-generation" element={<SeatNumberGeneration />} />
              <Route path="/pre-examination/synchronize-subject" element={<SynchronizeSubject />} />
              <Route path="/pre-examination/manage-subject-head" element={<ManageSubjectHead />} />
                <Route path="/pre-examination/manage-exam-fee" element={<ManageExamFee />} />
                <Route path="/pre-examination/manage-backlog-norms" element={<ManageBacklogNorms />} />
              <Route path="/pre-examination/manage-copy-case-norms" element={<ManageCopyCaseNorms />} />
              <Route path="/pre-examination/exam-block-config" element={<ExamBlockConfig />} />
              <Route path="/pre-examination/manage-block-and-resource" element={<ManageBlockAndResource />} />
              <Route path="/pre-examination/generate-barcode-sticker" element={<GenerateBarcodeSticker />} />
              <Route path="/pre-examination/pre-exam-reports" element={<PreExamReports />} />
              <Route path="/pre-examination/set-attendance-eligibility" element={<SetAttendanceEligibility />} />
              <Route path="/pre-examination/student-term-grant" element={<StudentTermGrant />} />
              {/* Post Examination */}
              <Route path="/post-examination/set-internal-practical-marks-entry" element={<SetInternalPracticalMarksEntry />} />
              <Route path="/post-examination/internal-practical-marks-entry-lock" element={<InternalPracticalMarksEntryLock />} />
              <Route path="/post-examination/marks-entry-checklist-report" element={<MarksEntryChecklistReport />} />
              <Route path="/post-examination/set-gracing-condonation-rule" element={<SetGracingCondonationRule />} />
              <Route path="/post-examination/set-grade-class-rule" element={<SetGradeClassRule />} />
              <Route path="/post-examination/student-result-process" element={<StudentResultProcess />} />
              <Route path="/post-examination/result-declaration-detail" element={<ResultDeclarationDetail />} />
              <Route path="/post-examination/generate-faculty-dummy-id" element={<GenerateFacultyDummyId />} />
              <Route path="/post-examination/with-barcode-marks-entry" element={<WithBarcodeMarksEntry />} />
            <Route path="/post-examination/notification-report" element={<NotificationReport />} />
            <Route path="/post-examination/post-examination-report" element={<PostExaminationReport />} />
                  <Route path="/reassessment/set-reassessment-fees" element={<SetReassessmentFees />} />
              <Route path="/reassessment/re-ass-application" element={<ReAssApplication />} />
              <Route path="/reassessment/re-ass-marks-entry" element={<ReAssMarksEntry />} />
              <Route path="/reassessment/re-ass-result-process" element={<ReAssResultProcess />} />
              <Route path="/reassessment/re-ass-report" element={<ReAssReport />} />
              <Route path="/reassessment/set-faculty-reassessment" element={<SetFacultyReassessment />} />
              <Route path="/reassessment/second-assessment" element={<SecondAssessment />} />
              <Route path="/reassessment/faculty-second-assessment" element={<FacultySecondAssessment />} />
              <Route path="/reassessment/apply-nearest-marks" element={<ApplyNearestMarks />} />
              <Route path="/exam/datesheet" element={<ExamDatesheet />} />
            </Routes>
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
