import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '../../hooks/useUserRole';
import SimpleDonut from '../../components/charts/SimpleDonut';
import EmployeeReportExport from '../../components/report/EmployeeReportExport.jsx';
import API from '../../services/api';
import SalarySlipPreviewModal from '../../components/common/SalarySlipPreviewModal';
import ESSInvestmentDeclaration from './ESSInvestmentDeclaration';
import ESSTaxReport from './ESSTaxReport';
import ESSAnnualSalary from './ESSAnnualSalary';
import ESSToDo from './ESSToDo';
import ESSHolidayList from './ESSHolidayList';
import ESSLeaveReport from './ESSLeaveReport';
import ESSAttendanceReport from './ESSAttendanceReport';
import ESSProfilePersonal from './ESSProfilePersonal';
import ESSProfileCompany from './ESSProfileCompany';
import ESSProfileFamily from './ESSProfileFamily';
import ESSProfileWorkExperience from './ESSProfileWorkExperience';
import ESSProfileSkillAdditional from './ESSProfileSkillAdditional';
import ESSProfileQualification from './ESSProfileQualification';
import ESSProfilePhoto from './ESSProfilePhoto';
import ESSProfileDocuments from './ESSProfileDocuments';
import ESSProfileBank from './ESSProfileBank';
import ESSAttendanceDaily from './ESSAttendanceDaily';
import ESSAttendanceMonthly from './ESSAttendanceMonthly';
import ESSAttendanceYearly from './ESSAttendanceYearly';
import ESSAttendanceLeaveLedger from './ESSAttendanceLeaveLedger';
import ESSAttendanceExtraWork from './ESSAttendanceExtraWork';
import ESSAttendanceRegularise from './ESSAttendanceRegularise';
import ESSLeaveApplication from './ESSLeaveApplication';
import ESSActivityUpdate from './ESSActivityUpdate';
import ESSWorkOnHoliday from './ESSWorkOnHoliday';
import ESSHelpDesk from './ESSHelpDesk';
import ESSResignationNote from './ESSResignationNote';
import ESSLeaveEncashment from './ESSLeaveEncashment';
import ESSConfirmationReview from './ESSConfirmationReview';
import ESSProxyAttendance from './ESSProxyAttendance';
import ESSLateComeReport from './ESSLateComeReport';
import ESSEarlyGoReport from './ESSEarlyGoReport';
import ESSWorkingHrReport from './ESSWorkingHrReport';
import ESSLeaveAvailedRegister from './ESSLeaveAvailedRegister';
import ESSProductivityReport from './ESSProductivityReport';
import ESSLeaveYearlyRegister from './ESSLeaveYearlyRegister';
import ESSEmployeeReports from './ESSEmployeeReports';
import ESSSalarySlipListView from './ESSSalarySlipListView';
import ESSGenericReport from './ESSGenericReport';
import ESSChangeHomeImage from './ESSChangeHomeImage';
import ESSEmployeeDashboard from './ESSEmployeeDashboard';



const EmployeeSelfService = () => {
  const donutColors = {
    orange: ['#f59e0b', '#fcd34d'],
    green: ['#22c55e', '#86efac'],
    red: ['#ef4444', '#fecaca'],
    gender: ['#60a5fa', '#fb7185'],
    etype: ['#f59e0b', '#10b981', '#f43f5e'],
  };

  const sections = [
    { key: 'home', icon: '🏠', label: 'Home' },
    { key: 'links', icon: '🔗', label: 'My Links', children: [
      'My CTC', 'My Salary Slip', 'My Investment Declaration', 'My Tax Report', 'My Annual Salary', 'My To Do', 'My Leave Report', 'My Attendance Report', 'My Activity Update', 'Asset Allocated', 'View My Process Activities', 'My Form16', 'Remarks'
    ]},
    { key: 'profile', icon: '👤', label: 'My Profile', children: [
      'Personal', 'Company', 'Family', 'Work Experience', 'Skill & Additional Info.', 'Qualification', 'Photo', 'Documents', 'Bank Account Details'
    ]},
    { key: 'myAttendance', icon: '📆', label: 'My Attendance', children: [
      'Daily', 'Monthly', 'Yearly', 'Leave Ledger', 'Extra work & Comp offs'
    ]},
    { key: 'teamAttendance', icon: '👥', label: 'Team Attendance', children: [
      "Punches", "Monthly", "Attendance MIS", "Yearly", "Leave Ledger", "Day's Status", "Leave MIS"
    ]},
    { key: 'request', icon: '📝', label: 'Request', children: [
      'Attendance Regularise', 'Leave/OD/WFH', 'HelpDesk', 'Work on Holiday', 'Resignation Note', 'Leave Encashment', 'Confirmation Review Entry', 'ProxyAttendanceRegularise'
    ] },
    { key: 'myClaims', icon: '📝', label: 'My Claims' },

    { key: 'hrViews', icon: '👁️', label: 'HR Views', children: [
      'Expense Claim', 'HelpDesk', 'Expense Requisition', 'Confirmation Register'
    ] },
    { key: 'reports', icon: '📊', label: 'Reports', children: [
      'Late Come Report', 'Early Go Report', 'Working Hr/Present Count Report', 'Leave Availed Register', 'Productivity Report', 'Leave Yearly Register', 'Employee Reports'
    ] },
    { key: 'salary', icon: '💰', label: 'Salary', children: [
      'Salary Slip', 'Tax Report', 'Annual Salary', 'Form16', '3A', 'Parity Report', '12A', 'PF Challan', 'Salary MIS'
    ] },
    { key: 'corpInfo', icon: '🏢', label: 'Corp. Info.', children: [
      'Employees Directory', 'Holidays', 'Professional Tax', 'Income Tax', 'Change Home Image'
    ] },
    { key: 'valueAdd', icon: '🧩', label: 'Value Add' },
    { key: 'employeeBenefit', icon: '🎁', label: 'Employee Benefit' },
    { key: 'onboarding', icon: '📦', label: 'Onboarding' },
  ];
  const [open, setOpen] = useState({ links: false, profile: false, myAttendance: false, teamAttendance: false });
  const { isAdmin } = useUserRole();
  const [myEmpData, setMyEmpData] = useState(null);
  const [loadingMyEmp, setLoadingMyEmp] = useState(false);
  const [salarySlips, setSalarySlips] = useState([]);
  const [loadingSlips, setLoadingSlips] = useState(false);
  const [selectedSlipForPreview, setSelectedSlipForPreview] = useState(null);


  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const navigate = useNavigate();
  const location = useLocation();
  const base = '/employee-self-service';
  const activeView = (() => {
    const p = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : '';
    const seg = p.replace(/^\/+/, '').split('/').filter(Boolean);
    if (seg.length < 1) return 'ess-dashboard';
    const root = seg[0];
    return [root, seg[1]||''].filter(Boolean).join('-');
  })();

  const fetchMyEmpDetails = async () => {
    try {
      setLoadingMyEmp(true);
      // 1. Get logged in user id (email)
      const userRes = await API.get('/api/method/frappe.auth.get_logged_user');
      const userId = userRes.data.message;
      if (!userId) {
        setLoadingMyEmp(false);
        return;
      }

      // 2. Fetch employee id for the logged in user
      const empListRes = await API.get(`/api/resource/Employee?fields=["name"]&filters=[["user_id","=","${userId}"]]&limit_page_length=1`);
      const empId = empListRes.data?.data?.[0]?.name;
      if (!empId) {
        return;
      }

      // 3. Fetch full Employee document so all profile tabs can render available details
      const empDocRes = await API.get(`/api/resource/Employee/${encodeURIComponent(empId)}`);
      const empDoc = empDocRes.data?.data;
      if (empDoc) {
        setMyEmpData(empDoc);
      }
    } catch (e) {
      console.error("Failed to fetch my employee data", e);
    } finally {
      setLoadingMyEmp(false);
    }
  };

  const fetchMySalarySlips = async () => {
    try {
      setLoadingSlips(true);
      // 1. Get logged in user email if we don't have it
      let userId = myEmpData?.user_id;
      if (!userId) {
        const userRes = await API.get('/api/method/frappe.auth.get_logged_user');
        userId = userRes.data.message;
      }
      if (!userId) {
        setLoadingSlips(false);
        return;
      }

      // 2. Fetch Salary Slips by employee user_id
      // We need to find the employee name first to filter slips, or just join.
      // Easiest is to use the employee ID from myEmpData
      let empId = myEmpData?.name;
      if (!empId) {
        const empRes = await API.get(`/api/resource/Employee?fields=["name"]&filters=[["user_id","=","${userId}"]]`);
        if (empRes.data?.data?.length > 0) {
          empId = empRes.data.data[0].name;
        }
      }

      if (empId) {
        const slipsRes = await API.get(`/api/resource/Salary Slip?fields=["name","posting_date","start_date","end_date","net_pay","currency","status"]&filters=[["employee","=","${empId}"]]&order_by=posting_date desc`);
        setSalarySlips(slipsRes.data?.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch salary slips", e);
    } finally {
      setLoadingSlips(false);
    }
  };


  useEffect(() => {
    // Views that need employee data
    const viewsNeedingEmpData = [
      'links-my-ctc',
      'links-my-investment-declaration',
      'links-my-tax-report',
      'links-my-annual-salary',
      'links-my-to-do',
      'corp-info-holidays',
      'links-my-leave-report',
      'links-my-attendance-report',
      'links-my-activity-update',
      // Home dashboard (for employee)
      'ess-dashboard',
      // My Attendance views
      'myattendance-daily',
      'myattendance-monthly',
      'myattendance-yearly',
      'myattendance-leave-ledger',
      'myattendance-extra-work-comp-offs',
      // Profile views
      'profile-personal',
      'profile-company',
      'profile-family',
      'profile-work-experience',
      'profile-skill-additional-info',
      'profile-skill-additional-info-',
      'profile-qualification',
      'profile-photo',
      'profile-documents',
      'profile-bank-account-details',
      // Report views
      'reports-late-come-report',
      'reports-early-go-report',
      'reports-working-hr-present-count-report',
      'reports-leave-availed-register',
      'reports-productivity-report',
      'reports-leave-yearly-register',
      'reports-employee-reports',
      // Salary views
      'salary-salary-slip',
      'salary-tax-report',
      'salary-annual-salary',
      'salary-form16',
      'salary-3a',
      'salary-parity-report',
      'salary-12a',
      'salary-pf-challan',
      'salary-salary-mis',
      // Corp Info views
      'corpinfo-employees-directory',
      'corpinfo-holidays',
      'corpinfo-professional-tax',
      'corpinfo-income-tax',
      'corpinfo-change-home-image',
    ];

    if (viewsNeedingEmpData.includes(activeView) && !myEmpData) {
      fetchMyEmpDetails();
    }
    if (activeView === 'links-my-salary-slip' && salarySlips.length === 0) {
      fetchMySalarySlips();
    }
  }, [activeView, myEmpData]);


  const [reportOpen, setReportOpen] = useState(false);
  const employeeExportData = {
    title: 'Employee Reports',
    tableName: 'Employee',
    columns: [
      { title: 'ecode' },
      { title: 'name' },
      { title: 'company' },
      { title: 'department' },
      { title: 'eType' },
      { title: 'gender' },
      { title: 'status' },
      { title: 'workingFor' },
      { title: 'location' },
      { title: 'dob' },
      { title: 'doj' },
      { title: 'exitDate' }
    ]
  };
  return (
    <div className="bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-64 shrink-0 left-0 top-0">
            <div className="card-soft p-0 overflow-hidden">
          {sections.map((s) => {
            const isRestricted = ['teamAttendance', 'hrViews', 'valueAdd', 'onboarding'].includes(s.key);
            const shouldDisable = isRestricted && !isAdmin;
            return (
            <div key={s.key} className="border-b" style={shouldDisable ? { filter: 'blur(1px)', opacity: 0.6 } : {}}>
              <button
                className={`w-full flex items-center justify-between px-3 py-3 text-left ${open[s.key]?'bg-gray-50':''}`}
                disabled={shouldDisable}
                onClick={() => {
                  if (shouldDisable) return;
                  s.children ? setOpen((o) => ({ ...o, [s.key]: !o[s.key] })) : navigate(base);
                }}
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs">{s.icon}</span>
                  <span className="text-gray-800 text-sm font-medium">{s.label}</span>
                </span>
                {s.children && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`transition-transform ${open[s.key]?'rotate-180':''}`}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              {s.children && open[s.key] && !shouldDisable && (
                <div className="px-4 pb-3">
                  {s.children.map((c) => {
                    const k = `${slug(s.key)}-${slug(c)}`;
                    const route = `${base}/${slug(s.key)}/${slug(c)}`;
                    return (
                      <button
                        key={c}
                        className={`block w-full text-left px-2 py-2 text-sm rounded ${activeView===k?'bg-orange-500 text-white':'text-gray-700 hover:bg-gray-50'}`}
                        onClick={() => navigate(route)}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )})}
            </div>
          </aside>
          <div className="flex-1">
            <div className="text-2xl font-semibold text-gray-900 mb-4">{activeView==='ess-dashboard' ? (isAdmin ? 'HR Self Service' : '') : ''}</div>
            
            {(() => {
              const restrictedRoutes = ['teamattendance', 'hrviews', 'valueadd', 'onboarding'];
              if (restrictedRoutes.some(r => activeView.startsWith(r)) && !isAdmin) {
                return (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100 mt-10">
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
                    <p>You need manager or HR permissions to view this section.</p>
                  </div>
                );
              }
              return (
                <>
            {activeView==='ess-dashboard' && !isAdmin && (
              <ESSEmployeeDashboard employeeData={myEmpData} />
            )}
            {activeView==='ess-dashboard' && isAdmin && (
            <div style={{display: activeView==='ess-dashboard' ? 'block':'none'}}>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Today's joinee", value: 0, icon: '👤' },
          { label: 'Last Working Day', value: 0, icon: '📅' },
          { label: 'Confirmation due', value: 0, icon: '✅' },
          { label: 'Plan leave', value: 0, icon: '🗓️' },
          { label: 'Absconding', value: 2, icon: '⚠️' },
          { label: 'Birthday', value: 0, icon: '🎂' },
          { label: 'Work Anniversary', value: 0, icon: '🎉' },
        ].map((c, i) => (
          <div key={i} className="card-soft flex items-center gap-3">
            <div className="text-2xl">{c.icon}</div>
            <div className="flex-1">
              <div className="text-sm text-gray-600">{c.label}</div>
              <div className="text-xl font-semibold text-gray-900">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="card-soft">
          <div className="font-semibold mb-2 text-red-600">Missed Timelines</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['Candidate No Show','Insurance','Compliance due','Confirmation pending'].map((t)=>(
              <div key={t} className="flex justify-between">
                <span className="text-gray-700">{t}</span>
                <span className="text-gray-900 font-medium">NA</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-soft">
          <div className="font-semibold mb-2">ELC Upcoming & Pending Activities</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['Ext F&F','Warning','Training','Open ticket','Background verifications','LWD','Insurance due'].map((t)=>(
              <div key={t} className="flex justify-between">
                <span className="text-gray-700">{t}</span>
                <span className="text-gray-900 font-medium">0</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-soft">
          <div className="font-semibold mb-2">HR OPS Team Activity</div>
          <div className="flex items-center justify-center h-36 text-5xl">🧑‍💼</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="card-soft">
          <div className="font-semibold mb-2">HR pending approvals</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['Ext Regularize','Plan leave','Hiring Offer Pending For Acceptance'].map((t)=>(
              <div key={t} className="flex justify-between">
                <span className="text-gray-700">{t}</span>
                <span className="text-gray-900 font-medium">0</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-soft">
          <div className="font-semibold mb-2">Non Compliance</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['No Bank Account','No Company Email','No Personal Email','No Aadhar','No Permanent Address','No Current Address','No Skills','No Emergency Contact'].map((t,i)=>(
              <div key={i} className="flex justify-between">
                <span className="text-gray-700">{t}</span>
                <span className="text-gray-900 font-medium">0</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-soft">
          <div className="font-semibold mb-2">Hiring Progress</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['Top 3 recruiter list','Top 3 Resourcing Partner','Max CV source for Position','Interviews Planned','Top Open Position'].map((t,i)=>(
              <div key={i} className="flex items-center gap-3">
                <span className="inline-block w-6 h-6 rounded-full bg-blue-100"></span>
                <span className="text-gray-700">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <div className="card-soft">
          <div className="font-semibold mb-2">Recruiter / Agency performance</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['Open positions','Offer pending to release','Offer released','Candidate documentation pending','Health check up pending','Position Closed','Pending Candidate approval by Checker'].map((t)=>(
              <div key={t} className="flex justify-between">
                <span className="text-gray-700">{t}</span>
                <span className="text-gray-900 font-medium">0</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-soft">
          <div className="font-semibold mb-2">Current strength</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            <SimpleDonut data={{ OnProbation: 10, OnNotice: 2 }} colors={donutColors.orange} totalLabel={12} />
            <SimpleDonut data={{ Male: 30, Female: 18 }} colors={donutColors.gender} totalLabel={48} />
            <SimpleDonut data={{ Staff: 35, Worker: 13 }} colors={donutColors.etype} totalLabel={48} />
          </div>
        </div>
            </div>
            </div>
            )}

            {activeView==='links-my-ctc' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My CTC</span></div>
                
                {loadingMyEmp ? (
                  <div className="p-8 text-center text-gray-500">Loading CTC details...</div>
                ) : myEmpData ? (
                  <div className="p-6 bg-white border rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2">CTC Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Employee</div>
                        <div className="font-medium text-gray-900">{myEmpData.employee_name || 'N/A'} ({myEmpData.name})</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Cost to Company (CTC)</div>
                        <div className="text-2xl font-bold text-green-600">
                          {myEmpData.salary_currency || '₹'} {myEmpData.ctc ? Number(myEmpData.ctc).toLocaleString() : '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No CTC details found for your account. Please contact HR.
                  </div>
                )}
              </div>
            )}

            {activeView==='links-my-salary-slip' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My Salary Slip</span></div>
                
                {loadingSlips ? (
                  <div className="p-8 text-center text-gray-500">Loading your salary slips...</div>
                ) : salarySlips.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 font-semibold text-gray-700">Slip ID</th>
                          <th className="px-4 py-3 font-semibold text-gray-700">Posting Date</th>
                          <th className="px-4 py-3 font-semibold text-gray-700">Period</th>
                          <th className="px-4 py-3 font-semibold text-gray-700">Net Pay</th>
                          <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 font-semibold text-gray-700 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salarySlips.map((slip) => (
                          <tr key={slip.name} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-blue-600 font-medium">{slip.name}</td>
                            <td className="px-4 py-3">{slip.posting_date}</td>
                            <td className="px-4 py-3 text-gray-500">{slip.start_date} to {slip.end_date}</td>
                            <td className="px-4 py-3 font-semibold">{slip.currency || '₹'} {Number(slip.net_pay).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${slip.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {slip.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => setSelectedSlipForPreview(slip.name)}
                                className="text-orange-600 hover:text-orange-700 font-medium"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No salary slips found for your account.
                  </div>
                )}
              </div>
            )}
            {activeView==='links-my-investment-declaration' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My Investment Declaration</span></div>
                <ESSInvestmentDeclaration employeeData={myEmpData} />
              </div>
            )}

            {activeView==='links-my-tax-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My Tax Report</span></div>
                <ESSTaxReport employeeData={myEmpData} />
              </div>
            )}

            {activeView==='links-my-annual-salary' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My Annual Salary</span></div>
                <ESSAnnualSalary employeeData={myEmpData} />
              </div>
            )}

            {activeView==='links-my-to-do' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My To Do</span></div>
                <ESSToDo employeeData={myEmpData} />
              </div>
            )}

            {activeView==='links-my-leave-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My Leave Report</span></div>
                <ESSLeaveReport employeeData={myEmpData} />
              </div>
            )}

            {activeView==='links-my-attendance-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My Attendance Report</span></div>
                <ESSAttendanceReport employeeData={myEmpData} />
              </div>
            )}

            {activeView==='corp-info-holidays' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Corp. Info. › <span className="font-medium">Holidays</span></div>
                <ESSHolidayList employeeData={myEmpData} />
              </div>
            )}

            {activeView==='links-my-activity-update' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My Activity Update</span></div>
                <ESSActivityUpdate employeeData={myEmpData} />
              </div>
            )}

            {activeView==='links-asset-allocated' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">Asset Allocated</span></div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 rounded bg-blue-500 text-white text-sm">Pending to Submit</button>
                  <button className="px-4 py-2 rounded bg-orange-400 text-white text-sm">Submitted</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no asset allotted</div>
              </div>
            )}

            {activeView==='links-view-my-process-activities' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">View My Process Activities</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">Process</div>
                    <select className="border rounded px-2 py-2 w-full text-sm"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Search</div>
                    <select className="border rounded px-2 py-2 w-full text-sm"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Search Text</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end"><button className="px-4 py-2 bg-orange-500 text-white rounded text-sm">Search</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-blue-500 text-white text-sm">Assigned To Owner</button>
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Completed</button>
                  <button className="px-3 py-2 rounded border text-sm">All</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no details.</div>
              </div>
            )}

            {activeView==='links-my-form16' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My Form16</span></div>
                <div className="text-gray-600 text-sm">No data found.</div>
              </div>
            )}

            {activeView==='links-remarks' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">Remarks</span></div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 rounded bg-orange-400 text-white text-sm">Remarks</button>
                  <button className="px-4 py-2 rounded bg-red-500 text-white text-sm">Warning</button>
                  <button className="px-4 py-2 rounded border text-sm">⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">No data found.</div>
              </div>
            )}

            {activeView==='profile-personal' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Personal</span></div>
                <ESSProfilePersonal employeeData={myEmpData} />
              </div>
            )}
            {activeView==='profile-company' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Company</span></div>
                <ESSProfileCompany employeeData={myEmpData} />
              </div>
            )}
            {activeView==='profile-family' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Family</span></div>
                <ESSProfileFamily employeeData={myEmpData} />
              </div>
            )}
            {activeView==='profile-work-experience' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Work Experience</span></div>
                <ESSProfileWorkExperience employeeData={myEmpData} />
              </div>
            )}

            {(activeView==='profile-skill-additional-info' || activeView==='profile-skill-additional-info-') && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Skill & Additional Info.</span></div>
                <ESSProfileSkillAdditional employeeData={myEmpData} />
              </div>
            )}

            {activeView==='profile-qualification' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Qualification</span></div>
                <ESSProfileQualification employeeData={myEmpData} />
              </div>
            )}

            {activeView==='profile-photo' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Photo</span></div>
                <ESSProfilePhoto employeeData={myEmpData} />
              </div>
            )}

            {activeView==='profile-documents' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Documents</span></div>
                <ESSProfileDocuments employeeData={myEmpData} />
              </div>
            )}

            {activeView==='profile-bank-account-details' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Bank Account Details</span></div>
                <ESSProfileBank employeeData={myEmpData} />
              </div>
            )}
            {activeView==='myattendance-daily' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Attendance › <span className="font-medium">Daily</span></div>
                <ESSAttendanceDaily employeeData={myEmpData} />
              </div>
            )}

            {activeView==='myattendance-monthly' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Attendance › <span className="font-medium">Monthly</span></div>
                <ESSAttendanceMonthly employeeData={myEmpData} />
              </div>
            )}

            {activeView==='myattendance-yearly' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Attendance › <span className="font-medium">Yearly</span></div>
                <ESSAttendanceYearly employeeData={myEmpData} />
              </div>
            )}

            {activeView==='myattendance-leave-ledger' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Attendance › <span className="font-medium">Leave Ledger</span></div>
                <ESSAttendanceLeaveLedger employeeData={myEmpData} />
              </div>
            )}

            {activeView==='myattendance-extra-work-comp-offs' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Attendance › <span className="font-medium">Extra work & Comp offs</span></div>
                <ESSAttendanceExtraWork employeeData={myEmpData} />
              </div>
            )}

            {activeView==='teamattendance-punches' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Team Attendance › <span className="font-medium">Punches</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">Employee</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600">Note: employee drop-down will refresh on date selection</div>
                <div className="mt-8 text-gray-600 text-sm">There are no details.</div>
              </div>
            )}

            {activeView==='teamattendance-monthly' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Team Attendance › <span className="font-medium">Monthly</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Month</div>
                    <input type="month" className="border rounded px-2 py-2 w-full text-sm" defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`} />
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="teamMonthlyScope" defaultChecked /> My Reportees</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="teamMonthlyScope" /> All Employees</label>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Employee</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div className="flex items-end gap-2 md:col-span-2">
                    <div className="flex-1 max-w-xs">
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600">Note: employee drop-down will refresh on month selection</div>
                <div className="mt-8 text-gray-600 text-sm">There are no details.</div>
              </div>
            )}

            {activeView==='teamattendance-attendance-mis' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Team Attendance › <span className="font-medium">Attendance MIS</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">From Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div className="flex items-end gap-3">
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                    <button className="px-3 py-2 border rounded text-sm">⬇</button>
                  </div>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no details.</div>
              </div>
            )}

            {activeView==='teamattendance-yearly' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Team Attendance › <span className="font-medium">Yearly</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Year</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow">{Array.from({length:5}).map((_,i)=>{const y=new Date().getFullYear()-i;return <option key={y}>{y}</option>;})}</select>
                  </div>
                  <div>
                    <div className="text-sm">Employee</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>()</option></select>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600">Note: employee drop-down will refresh on year selection</div>
                <div className="mt-8 text-gray-600 text-sm">There are no details.</div>
              </div>
            )}

            {activeView==='teamattendance-leave-ledger' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Team Attendance › <span className="font-medium">Leave Ledger</span></div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
                  <div>
                    <div className="text-sm">Employee</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Ecode</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Leave Type</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Year</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow">{Array.from({length:5}).map((_,i)=>{const y=new Date().getFullYear()-i;return <option key={y}>{y}</option>;})}</select>
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no details.</div>
              </div>
            )}

            {activeView==='teamattendance-day-s-status' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Team Attendance › <span className="font-medium">Day's Status</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>BOMBAIM</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                  </div>
                </div>
                <div className="mt-6 text-sm">
                  <span className="mr-8">No. of Punches: <span className="font-medium">0</span></span>
                  <span>No. of employee who have punched: <span className="font-medium">0</span></span>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-100 border-b">
                        <th className="px-3 py-2 text-left text-sm">Sr.</th>
                        <th className="px-3 py-2 text-left text-sm">Ecode</th>
                        <th className="px-3 py-2 text-left text-sm">Device Ecode</th>
                        <th className="px-3 py-2 text-left text-sm">Name</th>
                        <th className="px-3 py-2 text-left text-sm">Designation</th>
                        <th className="px-3 py-2 text-left text-sm">Department</th>
                        <th className="px-3 py-2 text-left text-sm">Work Location</th>
                        <th className="px-3 py-2 text-left text-sm">Shift</th>
                        <th className="px-3 py-2 text-left text-sm">Punch Time</th>
                        <th className="px-3 py-2 text-left text-sm">Punch Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-8 text-center text-sm" colSpan={10}>No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='teamattendance-leave-mis' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Team Attendance › <span className="font-medium">Leave MIS</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>BOMBAIM</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Year</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow">{Array.from({length:5}).map((_,i)=>{const y=new Date().getFullYear()-i;return <option key={y}>{y}</option>;})}</select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Breakup Data</div>
                      <div className="flex items-center gap-4 text-sm">
                        <label className="flex items-center gap-2"><input type="radio" name="leaveMisBreakup" defaultChecked /> Dept.-wise</label>
                        <label className="flex items-center gap-2"><input type="radio" name="leaveMisBreakup" /> Location-wise</label>
                      </div>
                    </div>
                    <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                  </div>
                <div className="mt-8 flex items-center justify-center">
                  <div className="w-[600px] h-[320px] border rounded bg-white flex items-end gap-2 p-6">
                    {[0,0,0,0,0,0,16,64,1,1,0,0].map((h,i)=>(
                      <div key={i} className="flex flex-col items-center">
                        <div style={{height:`${Math.min(h,80)*3}px`}} className="w-6 bg-red-500"></div>
                        <div className="text-[10px] mt-1">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}


            {activeView==='request-attendance-regularise' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Attendance Regularise</span></div>
                <ESSAttendanceRegularise employeeData={myEmpData} />
              </div>
            )}

            {activeView==='request-leave-od-wfh' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Leave/OD/WFH</span></div>
                <ESSLeaveApplication employeeData={myEmpData} />
              </div>
            )}

            {activeView==='request-helpdesk' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">HelpDesk</span></div>
                <ESSHelpDesk employeeData={myEmpData} />
              </div>
            )}




            {activeView==='hrviews-expense-claim' && (
              <div className="card-soft">
                <div className="text-sm mb-4">HR Views › <span className="font-medium">Expense Claim</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">From Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()-3, 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">Search On</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Search Text</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending (0)</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected (0)</button>
                  <button className="px-3 py-2 rounded bg-gray-500 text-white text-sm">Request Cancelled (0)</button>
                  <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Revise (0)</button>
                  <button className="px-3 py-2 rounded bg-blue-500 text-white text-sm">Paid/Recovered (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">ALL (0) ⟳</button>
                </div>
                <div className="mt-3 text-xs text-gray-600">Note: The above from and to date filter applied on "UpdatedOn" field</div>
                <div className="mt-3 flex gap-2">
                  <button className="px-3 py-2 border rounded text-sm flex items-center gap-2"><span>Summary</span><span className="inline-block w-6 h-6 bg-green-600 text-white grid place-items-center">X</span></button>
                  <button className="px-3 py-2 border rounded text-sm flex items-center gap-2"><span>Details</span><span className="inline-block w-6 h-6 bg-green-600 text-white grid place-items-center">X</span></button>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-100 border-b">
                        <th className="px-3 py-2 text-left text-sm">Sr. No.</th>
                        <th className="px-3 py-2 text-left text-sm">Applied On</th>
                        <th className="px-3 py-2 text-left text-sm">ECode</th>
                        <th className="px-3 py-2 text-left text-sm">Employee</th>
                        <th className="px-3 py-2 text-left text-sm">Claim Id</th>
                        <th className="px-3 py-2 text-left text-sm">Claim For</th>
                        <th className="px-3 py-2 text-left text-sm">Claim Amount</th>
                        <th className="px-3 py-2 text-left text-sm">Verified Amt.</th>
                        <th className="px-3 py-2 text-left text-sm">Req. Ref.</th>
                        <th className="px-3 py-2 text-left text-sm">Updated On</th>
                        <th className="px-3 py-2 text-left text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-8 text-center text-sm" colSpan={11}>No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='hrviews-helpdesk' && (
              <div className="card-soft">
                <div className="text-sm mb-4">HR Views › <span className="font-medium">HelpDesk</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">From Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()-3, 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">Search On</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>All</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Type</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Search Text</div>
                    <input className="border rounded px-2 py-2 w-full text-sm bg-gray-100" disabled />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">My Pending</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Responded By Me</button>
                  <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm">ALL Pending</button>
                  <button className="px-3 py-2 rounded bg-gray-500 text-white text-sm">Responded By ALL</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no pending approvals for selected filters. Please click on above 🔍 to view all request.</div>
              </div>
            )}

            {activeView==='hrviews-expense-requisition' && (
              <div className="card-soft">
                <div className="text-sm mb-4">HR Views › <span className="font-medium">Expense Requisition</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">From Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()-3, 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">Search On</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Search Text</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Mgr./Fin. Mgr. (0)</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved Mgr./Fin. Mgr. (0)</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected (0)</button>
                  <button className="px-3 py-2 rounded bg-gray-500 text-white text-sm">Paid (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">ALL (0) ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
              </div>
            )}

            {activeView==='hrviews-confirmation-register' && (
              <div className="card-soft">
                <div className="text-sm mb-4">HR Views › <span className="font-medium">Confirmation Register</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">From</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()-3, 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">Search On</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Search Text</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending (0)</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Revised</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Reviewed (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">All (0) ⟳</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Not Submitted (0)</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no pending approval for selected filters. Please click on 🔍 to view all request.</div>
              </div>
            )}



            {activeView==='request-work-on-holiday' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Work on Holiday</span></div>
                <ESSWorkOnHoliday employeeData={myEmpData} />
              </div>
            )}

            {activeView==='request-resignation-note' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Resignation Note</span></div>
                <ESSResignationNote employeeData={myEmpData} />
              </div>
            )}

            {activeView==='request-leave-encashment' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Leave Encashment</span></div>
                <ESSLeaveEncashment employeeData={myEmpData} />
              </div>
            )}

            {activeView==='request-confirmation-review-entry' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Confirmation Review Entry</span></div>
                <ESSConfirmationReview employeeData={myEmpData} />
              </div>
            )}
            {activeView==='request-proxyattendanceregularise' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Proxy Attendance Regularise</span></div>
                <ESSProxyAttendance employeeData={myEmpData} />
              </div>
            )}

            {activeView==='reports-late-come-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Reports › <span className="font-medium">Late Come Report</span></div>
                <ESSLateComeReport employeeData={myEmpData} />
              </div>
            )}

            {activeView==='reports-early-go-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Reports › <span className="font-medium">Early Go Report</span></div>
                <ESSEarlyGoReport employeeData={myEmpData} />
              </div>
            )}

            {activeView==='reports-working-hr-present-count-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Reports › <span className="font-medium">Working Hr/Present Count Report</span></div>
                <ESSWorkingHrReport employeeData={myEmpData} />
              </div>
            )}

            {activeView==='reports-leave-availed-register' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Reports › <span className="font-medium">Leave Availed Register</span></div>
                <ESSLeaveAvailedRegister employeeData={myEmpData} />
              </div>
            )}

            {activeView==='reports-productivity-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Reports › <span className="font-medium">Productivity Report</span></div>
                <ESSProductivityReport employeeData={myEmpData} />
              </div>
            )}

            {activeView==='reports-leave-yearly-register' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Reports › <span className="font-medium">Leave Yearly Register</span></div>
                <ESSLeaveYearlyRegister employeeData={myEmpData} />
              </div>
            )}

            {activeView==='reports-employee-reports' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Reports › <span className="font-medium">Employee Reports</span></div>
                <ESSEmployeeReports employeeData={myEmpData} />
              </div>
            )}

            {activeView==='salary-salary-slip' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary › <span className="font-medium">Salary Slip</span></div>
                <ESSSalarySlipListView employeeData={myEmpData} />
              </div>
            )}
            
            {activeView==='salary-tax-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary › <span className="font-medium">Tax Report</span></div>
                <ESSTaxReport employeeData={myEmpData} />
              </div>
            )}

            {activeView==='salary-annual-salary' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary › <span className="font-medium">Annual Salary</span></div>
                <ESSAnnualSalary employeeData={myEmpData} />
              </div>
            )}
            
            {activeView==='salary-form16' && <ESSGenericReport employeeData={myEmpData} reportName="Form 16" />}
            {activeView==='salary-3a' && <ESSGenericReport employeeData={myEmpData} reportName="PF 3A Report" />}
            {activeView==='salary-parity-report' && <ESSGenericReport employeeData={myEmpData} reportName="Salary Parity" />}
            {activeView==='salary-12a' && <ESSGenericReport employeeData={myEmpData} reportName="Form 12A" />}
            {activeView==='salary-pf-challan' && <ESSGenericReport employeeData={myEmpData} reportName="PF Challan" />}
            {activeView==='salary-salary-mis' && <ESSGenericReport employeeData={myEmpData} reportName="Salary MIS" />}

            {activeView==='corpinfo-employees-directory' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Corp. Info. › <span className="font-medium">Employees Directory</span></div>
                <ESSEmployeeReports employeeData={myEmpData} />
              </div>
            )}
            
            {activeView==='corpinfo-holidays' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Corp. Info. › <span className="font-medium">Holidays</span></div>
                <ESSHolidayList employeeData={myEmpData} />
              </div>
            )}

            {activeView==='corpinfo-professional-tax' && <ESSGenericReport employeeData={myEmpData} reportName="Professional Tax Computation" />}
            {activeView==='corpinfo-income-tax' && <ESSGenericReport employeeData={myEmpData} reportName="Income Tax Computation" />}
            
            {activeView==='corpinfo-change-home-image' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Corp. Info. › <span className="font-medium">Change Home Image</span></div>
                <ESSChangeHomeImage employeeData={myEmpData} />
              </div>
            )}
            </>
           );
          })()}
          </div>
        </div>
      </div>

      <SalarySlipPreviewModal 
        isOpen={!!selectedSlipForPreview} 
        onClose={() => setSelectedSlipForPreview(null)} 
        slipName={selectedSlipForPreview} 
      />
    </div>
  );
};


export default EmployeeSelfService;