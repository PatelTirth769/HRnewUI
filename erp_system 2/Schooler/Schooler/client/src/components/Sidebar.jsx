import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaCalendarAlt, FaChalkboardTeacher, FaClipboardList, 
  FaUniversity, FaMapMarkerAlt, FaUsers, FaUserShield, FaEdit } from 'react-icons/fa';

const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState({
    master: false,
    preExam: false,
    postExam: false,
    reassessment: false,
    result: false,
    exam: false
  });

  const toggleMenu = (menu, e) => {
    // Prevent the event from propagating to parent elements
    e.stopPropagation();
    
    setOpenMenus({
      ...openMenus,
      [menu]: !openMenus[menu]
    });
  };

  return (
    <div className="w-64 bg-white shadow-md h-full overflow-scroll">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Logixica Schooler</h2>
        <p className="text-sm text-gray-500">Exam Management</p>
      </div>
      
      <nav className="mt-4">
        {/* 1. Master Menu */}
        <div className="px-4 py-2">
          <div className="flex justify-between items-center cursor-pointer" onClick={(e) => toggleMenu('master', e)}>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">1. Master</h3>
            <span>{openMenus.master ? '▼' : '►'}</span>
          </div>
          {openMenus.master && (
            <div className="mt-2 space-y-1">
              <Link to="/" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaCalendarAlt className="mr-3" />
                Manage Year / Stream
              </Link>
              <Link to="/master/manage-stream" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaGraduationCap className="mr-3" />
                Manage Stream
              </Link>
              <Link to="/master/manage-semester-program" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaGraduationCap className="mr-3" />
                Manage Semester Program
              </Link>
              <Link to="/master/manage-institute-wise-semester" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaUniversity className="mr-3" />
                Manage Institute Wise Semester
              </Link>
              <Link to="/master/manage-exam-center" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Manage Exam Center
              </Link>
              <Link to="/master/manage-state-district-city" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaMapMarkerAlt className="mr-3" />
                Manage State/District/City
              </Link>
              <Link to="/master/manage-cast-category" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaUsers className="mr-3" />
                Manage Cast/Category
              </Link>
              <Link to="/master/manage-institute" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaUniversity className="mr-3" />
                Manage Institute
              </Link>
              <Link to="/master/manage-degree" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaGraduationCap className="mr-3" />
                Manage Degree
              </Link>
              <Link to="/master/manage-student-detail" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaUsers className="mr-3" />
                Student Detail
              </Link>
            </div>
          )}
        </div>
        
        {/* 2. Pre-Examination Menu */}
        <div className="px-4 py-2 mt-6">
          <div className="flex justify-between items-center cursor-pointer" onClick={(e) => toggleMenu('preExam', e)}>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">2. Pre-Examination</h3>
            <span>{openMenus.preExam ? '▼' : '►'}</span>
          </div>
          {openMenus.preExam && (
            <div className="mt-2 space-y-1">
              <Link to="/pre-examination/year-configuration" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaCalendarAlt className="mr-3" />
                Year Configuration
              </Link>
              <Link to="/pre-examination/manage-program" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaGraduationCap className="mr-3" />
                Manage Program
              </Link>
              <Link to="/pre-examination/manage-exam-term" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaEdit className="mr-3" />
                Manage Exam/Term
              </Link>
              <Link to="/pre-examination/manage-exam-group" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Manage Exam Group
              </Link>
              <Link to="/pre-examination/synchronize-subject" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaEdit className="mr-3" />
                Synchronize Subject (From Academic portal)
              </Link>
              <Link to="/pre-examination/manage-subject-head" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaChalkboardTeacher className="mr-3" />
                Manage Subject Head
              </Link>
              <Link to="/pre-examination/manage-exam-fee" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaUniversity className="mr-3" />
                Manage Exam Fee
              </Link>
              <Link to="/pre-examination/manage-copy-case-norms" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Manage Copy Case Norms
              </Link>
              <Link to="/pre-examination/manage-backlog-norms" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Manage Backlog Norms
              </Link>
              <Link to="/pre-examination/set-attendance-eligibility" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaUsers className="mr-3" />
                Set Attendance Eligibility
              </Link>
              <Link to="/pre-examination/student-term-grant" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaGraduationCap className="mr-3" />
                Student Term Grant
              </Link>
              <Link to="/pre-examination/seat-number-generation" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaEdit className="mr-3" />
                Seat Number Generation
              </Link>
              <Link to="/pre-examination/exam-block-config" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaUniversity className="mr-3" />
                Exam Block Config
              </Link>
              <Link to="/pre-examination/manage-block-and-resource" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaUniversity className="mr-3" />
                Manage Block and Resource
              </Link>
              <Link to="/pre-examination/generate-barcode-sticker" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaEdit className="mr-3" />
                Generate Barcode Sticker
              </Link>
              <Link to="/pre-examination/pre-exam-reports" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Pre Exam Reports
              </Link>
            </div>
          )}
        </div>
        
        {/* 3. Post Examination Menu */}
        <div className="px-4 py-2 mt-6">
          <div className="flex justify-between items-center cursor-pointer" onClick={(e) => toggleMenu('postExam', e)}>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">3. Post Examination</h3>
            <span>{openMenus.postExam ? '▼' : '►'}</span>
          </div>
          {openMenus.postExam && (
            <div className="mt-2 space-y-1">
              <Link to="/post-examination/generate-faculty-dummy-id" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Generate Faculty Dummy ID Sticker
              </Link>
              <Link to="/post-examination/set-internal-practical-marks-entry" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Set Internal / Practical Marks Entry
              </Link>
              <Link to="/post-examination/internal-practical-marks-entry-lock" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Internal / Practical Marks Entry Lock
              </Link>
              <Link to="/post-examination/marks-entry-checklist-report" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Marks Entry Checklist Report
              </Link>
              <Link to="/post-examination/set-gracing-condonation-rule" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Set Gracing / Condonation Rule
              </Link>
              <Link to="/post-examination/with-barcode-marks-entry" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                With Barcode Marks Entry
              </Link> 
              <Link to="/post-examination/set-grade-class-rule" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Set Grade & Class Rule
              </Link>
              <Link to="/post-examination/student-result-process" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Student Result Process
              </Link>
              <Link to="/post-examination/result-declaration-detail" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Result Declaration Detail
              </Link>
              <Link to="/post-examination/notification-report" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Notification Report
              </Link>
              <Link to="/post-examination/post-examination-report" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Post Examination Report
              </Link>
            </div>
          )}
        </div>

        {/* 4. Reassessment Menu */}
        <div className="px-4 py-2 mt-6">
          <div className="flex justify-between items-center cursor-pointer" onClick={(e) => toggleMenu('reassessment', e)}>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">4. Reassessment</h3>
            <span>{openMenus.reassessment ? '▼' : '►'}</span>
          </div>
          {openMenus.reassessment && (
            <div className="mt-2 space-y-1">
              <Link to="/reassessment/set-reassessment-fees" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Set Reassessment Fees
              </Link>
              <Link to="/reassessment/re-ass-application" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Re-Ass Application
              </Link>
              <Link to="/reassessment/set-faculty-reassessment" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Set Faculty for Re-assessment
              </Link>
              <Link to="/reassessment/re-ass-marks-entry" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Re-ass Marks Entry
              </Link>
              <Link to="/reassessment/second-assessment" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Second Assessment
              </Link>
              <Link to="/reassessment/faculty-second-assessment" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Faculty for Second Assessment
              </Link>
              <Link to="/reassessment/apply-nearest-marks" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Apply Nearest Marks
              </Link>
              <Link to="/reassessment/re-ass-result-process" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Re-ass Result Process
              </Link>
              <Link to="/reassessment/re-ass-report" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Re-ass Report
              </Link>
            </div>
          )}
        </div>

        {/* 5. Result Menu */}
        <div className="px-4 py-2 mt-6">
          <div className="flex justify-between items-center cursor-pointer" onClick={(e) => toggleMenu('result', e)}>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">5. Result</h3>
            <span>{openMenus.result ? '▼' : '►'}</span>
          </div>
          {openMenus.result && (
            <div className="mt-2 space-y-1">
              <Link to="/result/provisional-mark-sheet" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Provisional Mark Sheet
              </Link>
              <Link to="/result/final-mark-sheet" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Final Mark Sheet
              </Link>
              <Link to="/result/web-mark-sheet" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Web Mark Sheet
              </Link>
              <Link to="/result/top-student-list" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Top Student List
              </Link>
              <Link to="/result/student-transcript" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Student Transcript
              </Link>
              <Link to="/result/provisional-degree-certificate" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Provisional Degree Certificate
              </Link>
              <Link to="/result/final-degree-certificate" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Final Degree Certificate
              </Link>
              <Link to="/result/result-analysis-report" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaClipboardList className="mr-3" />
                Result Analysis Report
              </Link>
            </div>
          )}
        </div>

        {/* 6. Exam Menu */}
        <div className="px-4 py-2 mt-6 mb-8">
          <div className="flex justify-between items-center cursor-pointer" onClick={(e) => toggleMenu('exam', e)}>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">6. Exam</h3>
            <span>{openMenus.exam ? '▼' : '►'}</span>
          </div>
          {openMenus.exam && (
            <div className="mt-2 space-y-1">
              <Link to="/exam/datesheet" className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                <FaCalendarAlt className="mr-3" />
                Exam Datesheet
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;