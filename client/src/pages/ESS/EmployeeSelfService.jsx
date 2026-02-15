import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SimpleDonut from '../../components/charts/SimpleDonut';
import EmployeeReportExport from '../../components/report/EmployeeReportExport.jsx';

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
      'My CTC', 'My Salary Slip', 'My Investment Declaration', 'My Tax Report', 'My Annual Salary', 'My To Do', 'My Leave Report', 'My Activity Update', 'Asset Allocated', 'View My Process Activities', 'My Form16', 'Remarks'
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
    { key: 'approvals', icon: '✔️', label: 'Approvals', children: [
      'Attendance Regularisation', 'Leave/OD/WFH', 'HelpDesk', 'Work On Holiday', 'Resignations', 'Confirmation Review', 'HOD Attendance Regularisation', 'Proxy Leave Application'
    ] },
    { key: 'hrApprovals', icon: '🧑‍💼', label: 'HR Approvals', children: [
      'Attendance Regularisation', 'Resignations', 'HR Confirmation Review', 'Work On Holiday'
    ] },
    { key: 'financeApproval', icon: '₹', label: 'Finance Approval', children: [
      'Expense Requisition', 'Expense Claim'
    ] },
    { key: 'myClaims', icon: '📝', label: 'My Claims' },
    { key: 'claimApproval', icon: '✔️', label: 'Claim Approval', children: [
      'Expense Claim', 'Reimbursement', 'Expense Requisition'
    ] },
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
          {sections.map((s) => (
            <div key={s.key} className="border-b">
              <button
                className={`w-full flex items-center justify-between px-3 py-3 text-left ${open[s.key]?'bg-gray-50':''}`}
                onClick={() => s.children ? setOpen((o) => ({ ...o, [s.key]: !o[s.key] })) : navigate(base)}
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
              {s.children && open[s.key] && (
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
          ))}
            </div>
          </aside>
          <div className="flex-1">
            <div className="text-2xl font-semibold text-gray-900 mb-4">{activeView==='ess-dashboard' ? 'HR Self Service' : ''}</div>
            {activeView==='ess-dashboard' && (
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

            {activeView==='links-my-leave-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My Leave Report</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">From Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">Select Format</div>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2"><input type="radio" name="fmt" defaultChecked /> EXCEL</label>
                      <label className="flex items-center gap-2"><input type="radio" name="fmt" /> PDF</label>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm">Sort By</div>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="sort" defaultChecked /> Leave Date</label>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className="text-sm">Leave Type</div>
                    <select multiple className="border rounded px-2 py-2 w-full h-40 text-sm">
                      {['Absent','L.W.P','Casual Leave','Compensatory Off','Extra Working'].map((o)=>(<option key={o}>{o}</option>))}
                    </select>
                  </div>
                  <div className="flex items-start">
                    <button className="px-4 py-2 bg-green-600 text-white rounded text-sm">Export Excel</button>
                  </div>
                </div>
              </div>
            )}

            {activeView==='links-my-activity-update' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Links › <span className="font-medium">My Activity Update</span></div>
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
                  <button className="px-3 py-2 rounded bg-blue-500 text-white text-sm">Assigned</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Completed</button>
                  <button className="px-3 py-2 rounded bg-orange-500 text-white text-sm">Request Cancelled</button>
                  <button className="px-3 py-2 rounded border text-sm">All</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no details.</div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm">Title</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end justify-end">
                    <button className="px-3 py-2 border rounded text-sm">📄 Signed Declaration</button>
                  </div>
                  <div>
                    <div className="text-sm">First Name <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Middle Name</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Last Name <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Gender <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select Gender –</option><option>Male</option><option>Female</option><option>Other</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Date of Birth <span className="text-red-600">*</span></div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Caste</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select Caste –</option></select>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm">Personal Email <span className="text-red-600">*</span></div>
                    <input type="email" className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm">Current Address <span className="text-red-600">*</span></div>
                    <textarea className="border rounded px-2 py-2 w-full text-sm" rows={2}></textarea>
                  </div>
                  <div>
                    <div className="text-sm">Country <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>India</option></select>
                  </div>
                  <div>
                    <div className="text-sm">State <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">City/District <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Pin Code/Post Code/Zip Code</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm">Permanent Address <span className="text-red-600">*</span></div>
                    <textarea className="border rounded px-2 py-2 w-full text-sm" rows={2}></textarea>
                  </div>
                  <div>
                    <div className="text-sm">Alternate No.</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Guardian Name</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Emergency Contact Person <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Emergency No. <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Mobile No. <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Office Mobile No. <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm">Office Landline No. <span className="text-red-600">*</span></div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Ext. No.</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm">Referred By</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Blood Group</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select Blood Group –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">PAN No.</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Aadhaar/UID</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">PAN Aadhaar Link</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option><option>Yes</option><option>No</option></select>
                  </div>
                  <div>
                    <div className="text-sm">PF UAN No.</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Marital Status</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select Status –</option><option>Single</option><option>Married</option><option>Divorced</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Wedding Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Insurance Card No</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Health ID Card No</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm">Medical Condition Detail</div>
                    <textarea className="border rounded px-2 py-2 w-full text-sm" rows={2}></textarea>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button className="px-4 py-2 bg-orange-500 text-white rounded text-sm">Amend</button>
                  <button className="px-4 py-2 border rounded text-sm">Cancel</button>
                </div>
                <div className="mt-6 text-xs text-blue-700 space-y-1">
                  <div>Note:</div>
                  <ul className="list-disc pl-6">
                    <li>Changes are accepted subject to HR review.</li>
                    <li>Fields marked with green star help HR with compliance and safety.</li>
                    <li>If EPF contributed any time, please mention PF UAN number.</li>
                  </ul>
                </div>
              </div>
            )}

            {(activeView==='profile-skill-additional-info' || activeView==='profile-skill-additional-info-') && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Skill & Additional Info.</span></div>
                <div className="rounded border p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm">Nationality</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Religion</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Place Of Birth</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Mother Tongue</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm mb-2">Languages known</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>R,W,S</option></select>
                        <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>R,W</option></select>
                        <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>R,S</option></select>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm">Area of Expertise</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Hobby</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Passport No.</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Passport Validity Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Visa (Country)</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Visa Validity Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Driving License No</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm">Details If Handicap</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm">Misc.</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div className="rounded border p-4 bg-white">
                    <div className="font-medium mb-3">Skill</div>
                    {[1,2,3,4,5].map((i)=>(
                      <div key={i} className="grid grid-cols-12 gap-3 mb-2">
                        <div className="col-span-8">
                          <div className="text-sm">Key Skill {i}</div>
                          <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select Skill {i} –</option></select>
                        </div>
                        <div className="col-span-4">
                          <div className="text-sm">Experience (months)</div>
                          <input type="number" min="0" className="border rounded px-2 py-2 w-full text-sm" defaultValue={0} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded border p-4 bg-white">
                    <div className="font-medium mb-3 text-red-600">Upload Resume</div>
                    <div>
                      <div className="text-sm">Resume</div>
                      <input type="file" accept=".pdf,.doc,.docx,.txt,.rtf" className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button className="px-4 py-2 bg-orange-500 text-white rounded text-sm">Amend</button>
                </div>
              </div>
            )}

            {activeView==='profile-qualification' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Qualification</span></div>
                <div className="rounded border bg-white overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-3 py-2 text-left text-sm">Qualifications</th>
                        <th className="px-3 py-2 text-left text-sm">Specialization</th>
                        <th className="px-3 py-2 text-left text-sm">Institute</th>
                        <th className="px-3 py-2 text-left text-sm">%/CGPA</th>
                        <th className="px-3 py-2 text-left text-sm">YOP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1,2,3,4].map((i)=>(
                        <tr key={i} className="border-b">
                          <td className="px-3 py-2">
                            <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select Qualification –</option></select>
                          </td>
                          <td className="px-3 py-2"><input className="border rounded px-2 py-2 w-full text-sm" /></td>
                          <td className="px-3 py-2"><input className="border rounded px-2 py-2 w-full text-sm" /></td>
                          <td className="px-3 py-2 w-32"><input className="border rounded px-2 py-2 w-full text-sm" /></td>
                          <td className="px-3 py-2 w-24"><input className="border rounded px-2 py-2 w-full text-sm" placeholder="YYYY" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-orange-500 text-white rounded text-sm">Amend</button>
                </div>
                <div className="mt-4 text-xs text-gray-600">Please enter qualifications in ascending order of year of passing.</div>
              </div>
            )}

            {activeView==='profile-photo' && (
              <div className="card-soft flex flex-col items-center">
                <div className="text-sm mb-4 self-start">My Profile › <span className="font-medium">Photo</span></div>
                <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">👤</div>
                <div className="mt-4">
                  <label className="px-4 py-2 bg-blue-600 text-white rounded text-sm cursor-pointer">
                    Change Photo
                    <input type="file" accept=".jpeg,.jpg" className="hidden" />
                  </label>
                </div>
                <div className="mt-6 text-xs text-blue-700 text-center">
                  <div>File size up to 1 MB, JPEG/JPG only.</div>
                  <div>Photo image should be professional self image.</div>
                </div>
              </div>
            )}

            {activeView==='profile-documents' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Documents</span></div>
                <div className="rounded border bg-white overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-3 py-2 text-left text-sm">Sr.No.</th>
                        <th className="px-3 py-2 text-left text-sm">Documents</th>
                        <th className="px-3 py-2 text-left text-sm">Uploaded Files</th>
                        <th className="px-3 py-2 text-left text-sm">Effective From</th>
                        <th className="px-3 py-2 text-left text-sm">Valid Till</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Personal Document - PAN Card',
                        'Personal Document - Aadhaar Card',
                        'Personal Document - Passport',
                        'Education - Certificates',
                        'Signed Non Disclosure Agreement',
                        'Signed Asset Declaration Form',
                        'Signed PF Nomination Form',
                        'Signed PF Declaration Form',
                        'COVID Vaccine Dose 1 Certificate',
                        'COVID Vaccine Dose 2 Certificate',
                      ].map((d,i)=>(
                        <tr key={i} className="border-b">
                          <td className="px-3 py-2 text-sm">{i+1}</td>
                          <td className="px-3 py-2 text-sm">{d}</td>
                          <td className="px-3 py-2 text-sm">file not uploaded.</td>
                          <td className="px-3 py-2"><input type="date" className="border rounded px-2 py-2 w-full text-sm" /></td>
                          <td className="px-3 py-2"><input type="date" className="border rounded px-2 py-2 w-full text-sm" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6">
                  <div className="font-medium mb-2">Letter</div>
                  <div className="rounded border bg-white overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-3 py-2 text-left text-sm">Sr.No.</th>
                          <th className="px-3 py-2 text-left text-sm">Documents</th>
                          <th className="px-3 py-2 text-left text-sm">Uploaded Files</th>
                          <th className="px-3 py-2 text-left text-sm">Effective From</th>
                          <th className="px-3 py-2 text-left text-sm">Valid Till</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-3 py-2 text-sm">–</td>
                          <td className="px-3 py-2 text-sm">–</td>
                          <td className="px-3 py-2 text-sm">–</td>
                          <td className="px-3 py-2 text-sm">–</td>
                          <td className="px-3 py-2 text-sm">–</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-orange-500 text-white rounded text-sm">Amend</button>
                </div>
              </div>
            )}

            {activeView==='profile-bank-account-details' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Profile › <span className="font-medium">Bank Account Details</span></div>
                <div className="text-lg font-semibold mb-4">Salary Bank Account Details:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <div className="text-sm">Name As Per Bank <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Bank Name <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select BankName –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Bank Account No <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Bank Branch <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">IFSC Code <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm">Upload Cancel Cheque <span className="text-red-600">*</span></div>
                    <input type="file" accept=".jpg,.jpeg,.pdf" className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button className="px-4 py-2 bg-orange-500 text-white rounded text-sm">Amend</button>
                  <button className="px-4 py-2 border rounded text-sm">Cancel</button>
                </div>
                <div className="mt-4 text-xs text-blue-700">Note: Maximum file size 500 KB. File types allowed: .jpg, .jpeg, .pdf</div>
              </div>
            )}

            {activeView==='myattendance-daily' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Attendance › <span className="font-medium">Daily</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
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
                <div className="mt-4">
                  <button className="px-4 py-2 rounded bg-orange-500 text-white text-sm" onClick={() => navigate(`${base}/myattendance/monthly`)}>Monthly</button>
                </div>
                <div className="mt-4 border rounded p-4 bg-white">
                  <div className="text-sm font-medium mb-2">Note</div>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li>Pink colour indicates invalid punch.</li>
                    <li>Post the ESS cut-off date, bulk sync punches are stored but not used for EOD marking.</li>
                  </ul>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-100 border-b">
                        <th className="px-3 py-2 text-left text-sm">Date</th>
                        <th className="px-3 py-2 text-left text-sm">Punch Time</th>
                        <th className="px-3 py-2 text-left text-sm">Image Data</th>
                        <th className="px-3 py-2 text-left text-sm">Geo Location</th>
                        <th className="px-3 py-2 text-left text-sm">Latitude Longitude</th>
                        <th className="px-3 py-2 text-left text-sm">Punch Source</th>
                        <th className="px-3 py-2 text-left text-sm">Mac Address</th>
                        <th className="px-3 py-2 text-left text-sm">Company Location</th>
                        <th className="px-3 py-2 text-left text-sm">Distance Travelled : 0 km</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-8 text-center text-sm" colSpan={9}>There are no punches for selected date</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='myattendance-monthly' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Attendance › <span className="font-medium">Monthly</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Month</div>
                    <input type="month" className="border rounded px-2 py-2 w-full text-sm" defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`} />
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
                <div className="mt-8 text-gray-600 text-sm">There are no muster attendance details for selected month.</div>
              </div>
            )}

            {activeView==='myattendance-yearly' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Attendance › <span className="font-medium">Yearly</span></div>
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
                <div className="mt-4 rounded border p-4 bg-orange-50">
                  <div className="font-medium mb-2">Leave Status</div>
                  <div className="text-sm">Please update leave master to get leave balance.</div>
                </div>
                <div className="mt-6 text-gray-600 text-sm">There is no yearly attendance for selected year.</div>
              </div>
            )}

            {activeView==='myattendance-leave-ledger' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Attendance › <span className="font-medium">Leave Ledger</span></div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
                  <div>
                    <div className="text-sm">Employee</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>()</option></select>
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
            )}

            {activeView==='myattendance-extra-work-comp-offs' && (
              <div className="card-soft">
                <div className="text-sm mb-4">My Attendance › <span className="font-medium">Extra work & Comp offs</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Extra Work from Dt</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(Date.now()-90*24*60*60*1000).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">Extra Work to Dt</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div className="flex items-end gap-3">
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                    <button className="px-3 py-2 bg-green-600 text-white rounded text-sm">🟩</button>
                  </div>
                </div>
                <div className="mt-6 text-gray-600 text-sm">No data found for selected filters.</div>
              </div>
            )}

            {activeView==='request-attendance-regularise' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Attendance Regularise</span></div>
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-sm">Select month</div>
                    <input type="month" className="border rounded px-2 py-2 w-[160px] text-sm" defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`} />
                  </div>
                  <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-blue-500 text-white text-sm">Pending to submit</button>
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Submitted</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected/Cancelled</button>
                  <button className="px-3 py-2 rounded bg-gray-400 text-white text-sm">Finalized</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no detail for selected filters.</div>
              </div>
            )}

            {activeView==='request-leave-od-wfh' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Leave/OD/WFH</span></div>
                <div className="flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-500 text-white text-sm">+ New Request</button>
                  <button className="px-3 py-2 rounded border text-sm">Leave Ledger</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded border text-sm">Pending</button>
                  <button className="px-3 py-2 rounded border text-sm">Submitted</button>
                  <button className="px-3 py-2 rounded border text-sm">Approved</button>
                  <button className="px-3 py-2 rounded border text-sm">Rejected</button>
                  <button className="px-3 py-2 rounded border text-sm">Cancelled</button>
                  <button className="px-3 py-2 rounded border text-sm">All ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm flex items-center gap-2">Please click on refresh icon to view all request. <span className="inline-block px-2 py-1 border rounded">⟳</span></div>
              </div>
            )}

            {activeView==='request-helpdesk' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">HelpDesk</span></div>
                <div className="flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-500 text-white text-sm">New Request</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-blue-500 text-white text-sm">Pending to Submit</button>
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Submitted</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Responded</button>
                  <button className="px-3 py-2 rounded border text-sm">All ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm flex items-center gap-2">Please click on refresh icon to view all request. <span className="inline-block px-2 py-1 border rounded">⟳</span></div>
              </div>
            )}

            {activeView==='approvals-attendance-regularisation' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Approvals › <span className="font-medium">Attendance Regularisation</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Shift</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" placeholder="Enter Ecode" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">From Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()-1, 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="attRegDateType" defaultChecked /> Submitted on Date</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="attRegDateType" /> Attendance Date</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Show Subordinate Employee Record</label>
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                    <button className="px-3 py-2 border rounded text-sm">⬆</button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval (0)</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected/Cancelled (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">All (0) ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
              </div>
            )}

            {activeView==='approvals-leave-od-wfh' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Approvals › <span className="font-medium">Leave/OD/WFH</span></div>
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
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Search Text</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded border text-sm">Pending (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">Approved (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">Cancelled (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">Rejected (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">All (0) ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">No data found for selected filters.</div>
              </div>
            )}

            {activeView==='approvals-helpdesk' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Approvals › <span className="font-medium">HelpDesk</span></div>
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
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">My Pending</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Responded By Me</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no pending approvals for selected filters. Please click on above 🔍 to view all request.</div>
              </div>
            )}

            {activeView==='approvals-work-on-holiday' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Approvals › <span className="font-medium">Work On Holiday</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">From</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()-3, 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected</button>
                  <button className="px-3 py-2 rounded bg-purple-300 text-white text-sm">Request Cancelled</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
              </div>
            )}

            {activeView==='approvals-resignations' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Approvals › <span className="font-medium">Resignations</span></div>
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
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected</button>
                  <button className="px-3 py-2 rounded bg-blue-500 text-white text-sm">Cancelled</button>
                  <button className="px-3 py-2 rounded bg-orange-300 text-white text-sm">Revoked</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no pending approval for selected filters. Please click on 🔍 to view all resignation request.</div>
              </div>
            )}

            {activeView==='approvals-confirmation-review' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Approvals › <span className="font-medium">Confirmation Review</span></div>
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
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Revised</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Reviewed</button>
                  <button className="px-3 py-2 rounded border text-sm">All ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no Confirmation / Periodic Performance Review submitted record for selected filters.</div>
              </div>
            )}

            {activeView==='approvals-hod-attendance-regularisation' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Approvals › <span className="font-medium">HOD Attendance Regularisation</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Shift</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" placeholder="Enter Ecode" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">From Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()-1, 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="hodAttRegDateType" defaultChecked /> Submitted on Date</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="hodAttRegDateType" /> Attendance Date</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Show Subordinate Employee Record</label>
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                    <button className="px-3 py-2 border rounded text-sm">⬆</button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval (0)</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected/Cancelled (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">All (0) ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
              </div>
            )}

            {activeView==='approvals-proxy-leave-application' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Approvals › <span className="font-medium">Proxy Leave Application</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <button className="px-3 py-2 rounded bg-orange-500 text-white text-sm">New Request</button>
                  </div>
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
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Search Text</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                  <button className="px-3 py-2 rounded bg-gray-400 text-white text-sm">Request Cancelled (0)</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">All (0) ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">No data found for selected filters.</div>
              </div>
            )}

            {activeView==='hrapprovals-attendance-regularisation' && (
              <div className="card-soft">
                <div className="text-sm mb-4">HR Approvals › <span className="font-medium">Attendance Regularisation</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Shift</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" placeholder="Enter Ecode" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">From Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()-1, 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div className="flex items-end gap-3 flex-wrap">
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="hrAttRegDateType" defaultChecked /> Submitted on Date</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="hrAttRegDateType" /> Attendance Date</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Show Proxy Rows</label>
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                    <button className="px-3 py-2 border rounded text-sm">⬆</button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval (0)</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected/Cancelled (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">All (0) ⟳</button>
                  <button className="px-3 py-2 rounded bg-green-600 text-white text-sm">Approve</button>
                  <button className="px-3 py-2 rounded bg-red-600 text-white text-sm">XReject</button>
                  <button className="px-3 py-2 rounded border text-sm">Note</button>
                </div>
                <div className="mt-4 rounded border p-4 bg-orange-50 text-sm">
                  <div className="font-medium mb-2">Note</div>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>On bulk applications selection choose from the approval/rejection.</li>
                    <li>Check-in/out punches are not altered for present.</li>
                    <li>Decision is unavailable for entries where user has only View Rights.</li>
                    <li>Highlighted employees are marking subordinates employees which are non actionable.</li>
                  </ul>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-100 border-b">
                        <th className="px-3 py-2 text-left text-sm">ECode</th>
                        <th className="px-3 py-2 text-left text-sm">Employee</th>
                        <th className="px-3 py-2 text-left text-sm">Date</th>
                        <th className="px-3 py-2 text-left text-sm">In</th>
                        <th className="px-3 py-2 text-left text-sm">Out</th>
                        <th className="px-3 py-2 text-left text-sm">Shift</th>
                        <th className="px-3 py-2 text-left text-sm">Type</th>
                        <th className="px-3 py-2 text-left text-sm">Emp. Remarks</th>
                        <th className="px-3 py-2 text-left text-sm">Approver Remarks</th>
                        <th className="px-3 py-2 text-left text-sm">Approver Status</th>
                        <th className="px-3 py-2 text-left text-sm">HOD Status</th>
                        <th className="px-3 py-2 text-left text-sm">HR Remarks</th>
                        <th className="px-3 py-2 text-left text-sm">Audit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-8 text-center text-sm" colSpan={13}>No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='hrapprovals-resignations' && (
              <div className="card-soft">
                <div className="text-sm mb-4">HR Approvals › <span className="font-medium">Resignations</span></div>
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
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval</button>
                  <button className="px-3 py-2 rounded bg-gray-400 text-white text-sm">Mgr. Approved</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected</button>
                  <button className="px-3 py-2 rounded bg-blue-500 text-white text-sm">Cancelled</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no pending approval for selected filters. Please click on 🔍 to view all resignation request.</div>
              </div>
            )}

            {activeView==='hrapprovals-hr-confirmation-review' && (
              <div className="card-soft">
                <div className="text-sm mb-4">HR Approvals › <span className="font-medium">HR Confirmation Review</span></div>
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
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Revised</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Reviewed</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no pending approval for selected filters. Please click on 🔍 to view all request.</div>
              </div>
            )}

            {activeView==='hrapprovals-work-on-holiday' && (
              <div className="card-soft">
                <div className="text-sm mb-4">HR Approvals › <span className="font-medium">Work On Holiday</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">From</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()-3, 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected</button>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-100 border-b">
                        <th className="px-3 py-2 text-left text-sm">Sr. No.</th>
                        <th className="px-3 py-2 text-left text-sm">Employee</th>
                        <th className="px-3 py-2 text-left text-sm">Ecode</th>
                        <th className="px-3 py-2 text-left text-sm">Date</th>
                        <th className="px-3 py-2 text-left text-sm">Request Type</th>
                        <th className="px-3 py-2 text-left text-sm">Attendance Plan</th>
                        <th className="px-3 py-2 text-left text-sm">Emp. Remarks</th>
                        <th className="px-3 py-2 text-left text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-8 text-center text-sm" colSpan={8}>No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='financeapproval-expense-requisition' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Finance Approval › <span className="font-medium">Expense Requisition</span></div>
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
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval (0)</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected (0)</button>
                  <button className="px-3 py-2 rounded bg-gray-500 text-white text-sm">Paid (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">ALL (0) ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
              </div>
            )}

            {activeView==='financeapproval-expense-claim' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Finance Approval › <span className="font-medium">Expense Claim</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="expenseClaimDateType" defaultChecked /> Application Date</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="expenseClaimDateType" /> Approve Date</label>
                  </div>
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
                <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
              </div>
            )}

            {activeView==='claimapproval-expense-claim' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Claim Approval › <span className="font-medium">Expense Claim</span></div>
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
                  <button className="px-3 py-2 rounded border text-sm">ALL (0) ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
              </div>
            )}

            {activeView==='claimapproval-reimbursement' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Claim Approval › <span className="font-medium">Reimbursement</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">From date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()-3, 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To date</div>
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
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval (0)</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected (0)</button>
                  <button className="px-3 py-2 rounded bg-gray-500 text-white text-sm">Cancelled (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">All (0) ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no reimbursement requests for selected filters.</div>
              </div>
            )}

            {activeView==='claimapproval-expense-requisition' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Claim Approval › <span className="font-medium">Expense Requisition</span></div>
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
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval (0)</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected (0)</button>
                  <button className="px-3 py-2 rounded border text-sm">ALL (0) ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
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

            {activeView==='reports-late-come-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Report › <span className="font-medium">Late Come Report</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Etype</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Entity</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>All</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">To Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                    </div>
                    <div>
                      <div className="text-sm">Shift</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>All</option></select>
                    </div>
                    <div>
                      <div className="text-sm">From Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div></div>
                    <div>
                      <div className="text-sm">Late By</div>
                      <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="lateBy" defaultChecked /> Policy</label><label className="flex items-center gap-2"><input type="radio" name="lateBy" /> Shift</label></div>
                    </div>
                    <div>
                      <div className="text-sm">Sort By</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>Ecode</option></select>
                      <div className="mt-2 flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="lateComeSort" defaultChecked /> Asc</label><label className="flex items-center gap-2"><input type="radio" name="lateComeSort" /> Desc</label></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-green-600 text-white grid place-items-center">X</span></button>
                  <button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-green-600 text-white grid place-items-center">X</span></button>
                  <button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-red-600 text-white grid place-items-center">PDF</span></button>
                </div>
                <div className="mt-3 text-xs text-blue-700">Note: On "Policy" selection, report will get attendance data only if employee is late by the period greater than grace period allowed as per attendance policy.</div>
              </div>
            )}

            {activeView==='reports-employee-reports' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Report › <span className="font-medium">Employee Reports</span></div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-orange-500 text-white rounded text-sm" onClick={() => setReportOpen(true)}>Open Export</button>
                </div>
                <EmployeeReportExport reportOpen={reportOpen} exportData={employeeExportData} onClose={() => setReportOpen(false)} />
              </div>
            )}

            {activeView==='reports-early-go-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Report › <span className="font-medium">Early Go Report</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Etype</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Entity</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>All</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">To Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                    </div>
                    <div>
                      <div className="text-sm">Shift</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>All</option></select>
                    </div>
                    <div>
                      <div className="text-sm">From Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div></div>
                    <div>
                      <div className="text-sm">Early By</div>
                      <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="earlyBy" defaultChecked /> Policy</label><label className="flex items-center gap-2"><input type="radio" name="earlyBy" /> Shift</label></div>
                    </div>
                    <div>
                      <div className="text-sm">Sort By</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>Ecode</option></select>
                      <div className="mt-2 flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="earlyGoSort" defaultChecked /> Asc</label><label className="flex items-center gap-2"><input type="radio" name="earlyGoSort" /> Desc</label></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-green-600 text-white grid place-items-center">X</span></button>
                  <button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-green-600 text-white grid place-items-center">X</span></button>
                  <button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-red-600 text-white grid place-items-center">PDF</span></button>
                </div>
                <div className="mt-3 text-xs text-blue-700">Note: On "Policy" selection, report will get attendance data only if employee is early by the period less than grace period allowed as per attendance policy.</div>
              </div>
            )}

            {activeView==='reports-working-hr-present-count-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Report › <span className="font-medium">Working Hr/Present Count Report</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Etype</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Entity</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>All</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">To Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                    </div>
                    <div>
                      <div className="text-sm">Shift</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>All</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Select Period</div>
                      <div className="flex items-center gap-3 text-sm flex-wrap">
                        <label className="flex items-center gap-2"><input type="radio" name="wrkPeriod" defaultChecked /> Date Range</label>
                        <label className="flex items-center gap-2"><input type="radio" name="wrkPeriod" /> Weekly</label>
                        <label className="flex items-center gap-2"><input type="radio" name="wrkPeriod" /> Monthly</label>
                        <label className="flex items-center gap-2"><input type="radio" name="wrkPeriod" /> CY</label>
                        <label className="flex items-center gap-2"><input type="radio" name="wrkPeriod" /> FY</label>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm">From Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Whrs</div>
                      <div className="flex items-center gap-2">
                        <select className="border rounded px-2 py-2 text-sm"><option>&gt;</option><option>&lt;</option><option>=</option></select>
                        <input className="border rounded px-2 py-2 w-24 text-sm" placeholder="Min" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm">Sort By</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>Ecode</option></select>
                      <div className="mt-2 flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="wrkSort" defaultChecked /> Asc</label><label className="flex items-center gap-2"><input type="radio" name="wrkSort" /> Desc</label></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-green-600 text-white grid place-items-center">X</span></button>
                  <button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-green-600 text-white grid place-items-center">X</span></button>
                </div>
              </div>
            )}

            {activeView==='reports-leave-availed-register' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Report › <span className="font-medium">Leave Availed Register</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select multiple className="border rounded px-2 py-2 w-full text-sm select-arrow h-32"><option>Accounts (BOMBAIM)</option><option>Buying (BOMBAIM)</option><option>Buying/HR (BOMBAIM)</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Location</div>
                      <select multiple className="border rounded px-2 py-2 w-full text-sm select-arrow h-32"><option>Kolkata Backend (BOMBAIM)</option><option>Kolkata Frontend (BOMBAIM)</option><option>Mum Backend (BOMBAIM)</option></select>
                    </div>
                    <div>
                      <div className="text-sm">From Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)} />
                    </div>
                    <div>
                      <div className="text-sm">To Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                    </div>
                    <div>
                      <div className="text-sm">ECode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm">Select Format</div>
                      <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="leaveRegFormat" defaultChecked /> EXCEL</label><label className="flex items-center gap-2"><input type="radio" name="leaveRegFormat" /> SAP</label><label className="flex items-center gap-2"><input type="radio" name="leaveRegFormat" /> PDF</label></div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm">Leave Type</div>
                      <select multiple className="border rounded px-2 py-2 w-full text-sm h-32"><option>Absent / L.W.P</option><option>Casual Leave</option><option>Compensatory Off</option><option>Extra Working</option></select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 items-end">
                    <div>
                      <div className="text-sm">Sort By</div>
                      <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="leaveRegSort" defaultChecked /> ECode</label><label className="flex items-center gap-2"><input type="radio" name="leaveRegSort" /> Leave Date</label></div>
                      <div className="mt-3"><button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-green-600 text-white grid place-items-center">X</span></button></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView==='reports-productivity-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Reports › <span className="font-medium">Productivity Report</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Entity</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Order</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select multiple className="border rounded px-2 py-2 w-full text-sm select-arrow h-32"><option>Accounts (BOMBAIM)</option><option>Buying (BOMBAIM)</option><option>Buying/HR (BOMBAIM)</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Location</div>
                      <select multiple className="border rounded px-2 py-2 w-full text-sm select-arrow h-32"><option>Kolkata Backend (BOMBAIM)</option><option>Kolkata Frontend (BOMBAIM)</option><option>Mum Backend (BOMBAIM)</option></select>
                    </div>
                    <div>
                      <div className="text-sm">From Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)} />
                    </div>
                    <div>
                      <div className="text-sm">To Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                    </div>
                    <div>
                      <div className="text-sm">ECode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>All</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Sort By</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>Ecode</option></select>
                      <div className="mt-2 flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="prodSort" defaultChecked /> Asc</label><label className="flex items-center gap-2"><input type="radio" name="prodSort" /> Desc</label></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-green-600 text-white grid place-items-center">X</span></button>
                  <button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-orange-500 text-white grid place-items-center">?</span></button>
                </div>
              </div>
            )}

            {activeView==='reports-leave-yearly-register' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Reports › <span className="font-medium">Leave Yearly Register</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Year</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>2025-26</option></select>
                    </div>
                    <div>
                      <div className="text-sm">To Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={`${new Date().getFullYear()}-12-31`} />
                    </div>
                    <div>
                      <div className="text-sm">From Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={`${new Date().getFullYear()}-01-01`} />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-sm">Leave Type</div>
                      <select multiple className="border rounded px-2 py-2 w-full text-sm h-32"><option>Absent / L.W.P</option><option>Casual Leave</option><option>Compensatory Off</option><option>Extra Working</option></select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 items-end">
                    <div>
                      <div className="text-sm">Sort By</div>
                      <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="leaveYearSort" defaultChecked /> ECode</label><label className="flex items-center gap-2"><input type="radio" name="leaveYearSort" /> Leave Date</label></div>
                      <div className="mt-3"><button className="px-3 py-2 border rounded text-sm"><span className="inline-block w-7 h-7 bg-green-600 text-white grid place-items-center">X</span></button></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView==='salary-salary-slip' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary › <span className="font-medium">Salary Slip</span></div>
                <div className="rounded border p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-4 flex items-center gap-6 text-sm">
                      <span>Search</span>
                      <label className="flex items-center gap-2"><input type="radio" name="salarySlipSearch" defaultChecked /> Filter</label>
                      <label className="flex items-center gap-2"><input type="radio" name="salarySlipSearch" /> Upload Ecode List</label>
                      <label className="flex items-center gap-2"><input type="radio" name="salarySlipSearch" /> Upload External Salary Slips</label>
                    </div>
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Etype</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Entity</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Salary slip status</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>Published</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Month</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" placeholder="Oct-2025" />
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                      <div className="text-xs text-gray-500 mt-1">Note: employee drop-down will refresh on month selection</div>
                    </div>
                    <div>
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-6 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" name="salarySlipAction" defaultChecked /> Salary Slip</label>
                  <label className="flex items-center gap-2"><input type="radio" name="salarySlipAction" /> Export to zip</label>
                  <label className="flex items-center gap-2"><input type="radio" name="salarySlipAction" /> Send mail</label>
                  <button className="px-4 py-2 bg-orange-500 text-white rounded text-sm">Export to Zip</button>
                  <span className="text-xs">Note: max. file size allowed for export is 5 MB.</span>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-3 py-2 text-left text-sm">Sr.No.</th>
                        <th className="px-3 py-2 text-left text-sm">Ecode</th>
                        <th className="px-3 py-2 text-left text-sm">Employee</th>
                        <th className="px-3 py-2 text-left text-sm">Department</th>
                        <th className="px-3 py-2 text-left text-sm">Location</th>
                        <th className="px-3 py-2 text-left text-sm">Email</th>
                        <th className="px-3 py-2 text-left text-sm">PDF</th>
                        <th className="px-3 py-2 text-left text-sm">Mailed?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1,2,3,4,5].map((i)=>(
                        <tr key={i} className="border-b">
                          <td className="px-3 py-2">{i}</td>
                          <td className="px-3 py-2">177</td>
                          <td className="px-3 py-2">Employee {i}</td>
                          <td className="px-3 py-2">Support</td>
                          <td className="px-3 py-2">Kolkata Good earth</td>
                          <td className="px-3 py-2">emp{i}@example.com</td>
                          <td className="px-3 py-2">📄</td>
                          <td className="px-3 py-2">□</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='salary-tax-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary › <span className="font-medium">Tax Report</span></div>
                <div className="rounded border p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-4 flex items-center gap-6 text-sm">
                      <span>Search</span>
                      <label className="flex items-center gap-2"><input type="radio" name="taxReportSearch" defaultChecked /> Filter</label>
                      <label className="flex items-center gap-2"><input type="radio" name="taxReportSearch" /> Upload Ecode List</label>
                    </div>
                    <div className="md:col-span-4 flex items-center gap-6 text-sm">
                      <span>Report Type</span>
                      <label className="flex items-center gap-2"><input type="radio" name="taxReportType" defaultChecked /> With Investment</label>
                      <label className="flex items-center gap-2"><input type="radio" name="taxReportType" /> Without Investment</label>
                    </div>
                    <div>
                      <div className="text-sm">Select Month</div>
                      <div className="flex items-center gap-2"><input className="border rounded px-2 py-2 w-full text-sm" placeholder="Oct-2025" /><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                    </div>
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Etype</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–All–</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Entity</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–All–</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–Select–</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-6 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" name="taxReportAction" defaultChecked /> Salary Slip</label>
                  <label className="flex items-center gap-2"><input type="radio" name="taxReportAction" /> Export to zip</label>
                  <label className="flex items-center gap-2"><input type="radio" name="taxReportAction" /> Send mail</label>
                  <button className="px-4 py-2 bg-orange-500 text-white rounded text-sm">Export to Zip</button>
                  <span className="text-xs">Note: max. file size allowed for export is 5 MB.</span>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-3 py-2 text-left text-sm">Sr.No.</th>
                        <th className="px-3 py-2 text-left text-sm">Ecode</th>
                        <th className="px-3 py-2 text-left text-sm">Employee</th>
                        <th className="px-3 py-2 text-left text-sm">Department</th>
                        <th className="px-3 py-2 text-left text-sm">Location</th>
                        <th className="px-3 py-2 text-left text-sm">Company Email</th>
                        <th className="px-3 py-2 text-left text-sm">PDF</th>
                        <th className="px-3 py-2 text-left text-sm">Excel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1,2,3,4,5,6,7,8,9,10].map((i)=>(
                        <tr key={i} className="border-b">
                          <td className="px-3 py-2">{i}</td>
                          <td className="px-3 py-2">{i}</td>
                          <td className="px-3 py-2">Employee {i} ( {i} )</td>
                          <td className="px-3 py-2">Support</td>
                          <td className="px-3 py-2">Kolkata Good earth</td>
                          <td className="px-3 py-2">employee{i}@company.in</td>
                          <td className="px-3 py-2">📄</td>
                          <td className="px-3 py-2">📊</td>
                        </tr>
                      ))}
                  </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm"><button className="px-3 py-1 rounded bg-orange-500 text-white">1</button><button className="px-3 py-1 rounded border">2</button><button className="px-3 py-1 rounded border">3</button><button className="px-3 py-1 rounded border">»</button></div>
              </div>
            )}

            {activeView==='salary-annual-salary' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary Report › <span className="font-medium">Annual Salary</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow" disabled><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow" disabled><option>– ALL –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Etype</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Entity</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>ALL</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Year</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>2025-26</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Employee</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–Select–</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">Note: LF & F notation mean salary linked to F&F</div>
              </div>
            )}

            {activeView==='salary-form16' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary › <span className="font-medium">Form16</span></div>
                <div className="rounded border p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-4 flex items-center gap-6 text-sm">
                      <span>Search</span>
                      <label className="flex items-center gap-2"><input type="radio" name="form16Search" defaultChecked /> Filter</label>
                      <label className="flex items-center gap-2"><input type="radio" name="form16Search" /> Upload Ecode List</label>
                    </div>
                    <div>
                      <div className="text-sm">Printable Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={`${new Date().getFullYear()}-05-31`} />
                    </div>
                    <div>
                      <div className="text-sm">Financial Year</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>2024-2025</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Auth. Signatory</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–Select–</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Search On</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–All–</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Tax Payable</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–Select–</option></select>
                    </div>
                    <div>
                      <div className="text-sm"> </div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                  </div>
                </div>
              </div>
            )}

            {activeView==='salary-3a' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary Report › <span className="font-medium">3A</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">Year</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>2024</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Auth. Signatory</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–Select–</option></select>
                  </div>
                  <div>
                    <div className="text-sm"> </div>
                    <input className="border rounded px-2 py-2 w-full text-sm bg-gray-100" disabled />
                  </div>
                  <div>
                    <div className="text-sm">Search On</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–All–</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Company</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm">Search Text</div>
                    <div className="flex items-center gap-2"><input className="border rounded px-2 py-2 w-full text-sm" /><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                  </div>
                </div>
              </div>
            )}

            {activeView==='salary-parity-report' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary › <span className="font-medium">Parity Report</span></div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div>
                    <div className="text-sm">Company</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Department</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Grade</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Working For</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Work Location</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Filter by</div>
                    <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="parityFilter" defaultChecked /> Grade</label><label className="flex items-center gap-2"><input type="radio" name="parityFilter" /> Position</label><label className="flex items-center gap-2"><input type="radio" name="parityFilter" /> Designation</label></div>
                  </div>
                  <div>
                    <div className="text-sm">Filter by Employee joining status</div>
                    <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="parityJoin" defaultChecked /> Current Employee</label><label className="flex items-center gap-2"><input type="radio" name="parityJoin" /> Candidates in offer + Current Employees</label></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm"><span>No. of Record: 0</span><button className="px-2 py-1 border rounded"><span className="inline-block w-6 h-6 bg-green-600 text-white grid place-items-center">X</span></button></div>
                <div className="mt-2 overflow-x-auto rounded border bg-white">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-3 py-2 text-left text-sm">Ecode</th>
                        <th className="px-3 py-2 text-left text-sm">Employee</th>
                        <th className="px-3 py-2 text-left text-sm">DOJ</th>
                        <th className="px-3 py-2 text-left text-sm">Department</th>
                        <th className="px-3 py-2 text-left text-sm">Position</th>
                        <th className="px-3 py-2 text-left text-sm">Designation</th>
                        <th className="px-3 py-2 text-left text-sm">Location</th>
                        <th className="px-3 py-2 text-left text-sm">Qualification</th>
                        <th className="px-3 py-2 text-left text-sm">Skills</th>
                        <th className="px-3 py-2 text-left text-sm">Total Exp (Yrs/Mth)</th>
                        <th className="px-3 py-2 text-left text-sm">CTC PA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-6 text-center text-sm" colSpan={11}>No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='salary-12a' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary Report › <span className="font-medium">12A</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">Company <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">PF Series <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–Select–</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Salary Month <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" placeholder="Oct-2025" />
                  </div>
                  <div>
                    <div className="text-sm">Etype <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>Apprentice</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Auth. Signatory <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–Select–</option></select>
                  </div>
                  <div className="flex items-end"><button className="px-4 py-2 bg-orange-500 text-white rounded text-sm">View</button></div>
                </div>
              </div>
            )}

            {activeView==='salary-pf-challan' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Report › <span className="font-medium">PF Challan</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">Company <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>BOMBAIM</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Salary Month <span className="text-red-600">*</span></div>
                    <input className="border rounded px-2 py-2 w-full text-sm" placeholder="Oct-2025" />
                  </div>
                  <div>
                    <div className="text-sm">Etype <span className="text-red-600">*</span></div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>Apprentice</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Auth. Signatory <span className="text-red-600">*</span></div>
                    <div className="flex items-center gap-2"><select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>–Select–</option></select><input className="border rounded px-2 py-2 w-full text-sm" /></div>
                  </div>
                  <div className="flex items-end"><button className="px-4 py-2 bg-orange-500 text-white rounded text-sm">View</button></div>
                </div>
              </div>
            )}

            {activeView==='salary-salary-mis' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Salary › <span className="font-medium">Salary MIS Graph</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">Company</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>BOMBAIM</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Financial Year</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>2025-2026</option><option>2024-2025</option></select>
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                {['Net Salary Cost','Employee Count','Budgeted CTC','Budgeted Vs Actual CTC 2025-2026'].map((title,idx)=> (
                  <div key={idx} className="mt-6 rounded border bg-white">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <div className="font-medium text-sm">{title}</div>
                      <div className="flex items-center gap-2"><button className="px-2 py-1 border rounded text-xs">⚙️ Setting</button><button className="px-2 py-1 border rounded text-xs">≡</button></div>
                    </div>
                    <div className="p-6 text-gray-500 text-sm">Graph preview</div>
                    <div className="px-4 pb-4 text-xs text-gray-500">Legend</div>
                  </div>
                ))}
              </div>
            )}

            {activeView==='corpinfo-employees-directory' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Corp. Info. › <span className="font-medium">Employees Directory</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Employee</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Company</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Department</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Designation</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Blood Group</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-sm">Ecode</div>
                      <input className="border rounded px-2 py-2 w-full text-sm" />
                    </div>
                    <div>
                      <div className="text-sm">Working For</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Work Location</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div>
                      <div className="text-sm">Manager</div>
                      <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <a className="text-sm text-blue-600" href="#">Clear Filters</a>
                      <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                      <button className="px-3 py-2 border rounded text-sm">⬆</button>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                    {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((c)=> (
                      <button key={c} className="px-2 py-1 rounded border">{c}</button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto rounded border bg-white">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b bg-orange-100">
                        <th className="px-3 py-2 text-left text-sm">Sr. No.</th>
                        <th className="px-3 py-2 text-left text-sm">Employee Name</th>
                        <th className="px-3 py-2 text-left text-sm">Ecode</th>
                        <th className="px-3 py-2 text-left text-sm">Designation</th>
                        <th className="px-3 py-2 text-left text-sm">Department</th>
                        <th className="px-3 py-2 text-left text-sm">Location</th>
                        <th className="px-3 py-2 text-left text-sm">Office Email</th>
                        <th className="px-3 py-2 text-left text-sm">Blood G.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map((i)=> (
                        <tr key={i} className="border-b">
                          <td className="px-3 py-2">{i}</td>
                          <td className="px-3 py-2">Employee {i}</td>
                          <td className="px-3 py-2">{100+i}</td>
                          <td className="px-3 py-2">Designation</td>
                          <td className="px-3 py-2">Department</td>
                          <td className="px-3 py-2">Location</td>
                          <td className="px-3 py-2">emp{i}@office.com</td>
                          <td className="px-3 py-2">O+</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 flex items-center gap-2"><button className="px-2 py-1 rounded border">1</button><button className="px-2 py-1 rounded border">2</button><button className="px-2 py-1 rounded border">3</button><button className="px-2 py-1 rounded border">»</button></div>
                </div>
              </div>
            )}

            {activeView==='corpinfo-holidays' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Corp. Info. › <span className="font-medium">Holidays</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Company</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>BOMBAIM</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Work Location</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>Kolkata_Frontend</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Year</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>2025</option></select>
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Past Holidays</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Future Holidays</button>
                  <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Optional Holidays</button>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-100 border-b">
                        <th className="px-3 py-2 text-left text-sm">Sr. No.</th>
                        <th className="px-3 py-2 text-left text-sm">Date</th>
                        <th className="px-3 py-2 text-left text-sm">Day</th>
                        <th className="px-3 py-2 text-left text-sm">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1,2,3,4].map((i)=> (
                        <tr key={i} className="border-b">
                          <td className="px-3 py-2">{i}</td>
                          <td className="px-3 py-2">01-Jan-2025</td>
                          <td className="px-3 py-2">Wednesday</td>
                          <td className="px-3 py-2"><span className="px-2 py-1 rounded bg-orange-200 inline-block">Holiday {i}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='corpinfo-professional-tax' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Corp. Info. › <span className="font-medium">Professional Tax</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">Location</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select Location –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Effective Since</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>2011</option></select>
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
              </div>
            )}

            {activeView==='corpinfo-income-tax' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Corp. Info. › <span className="font-medium">Income Tax</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">Type</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>Male</option><option>Female</option><option>Senior Citizen</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Effective Since</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>2025</option></select>
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-orange-100">
                        <th className="px-3 py-2 text-left text-sm">Lower Value</th>
                        <th className="px-3 py-2 text-left text-sm">Upper Value</th>
                        <th className="px-3 py-2 text-left text-sm">ITax %</th>
                        <th className="px-3 py-2 text-left text-sm">Cess</th>
                        <th className="px-3 py-2 text-left text-sm">Surcharge</th>
                        <th className="px-3 py-2 text-left text-sm">Tax Regime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0,400001,800001,1200001,1600001].map((lv,idx)=> (
                        <tr key={idx} className="border-b">
                          <td className="px-3 py-2">{lv}</td>
                          <td className="px-3 py-2">{lv+400000}</td>
                          <td className="px-3 py-2">{idx*5}.00</td>
                          <td className="px-3 py-2">4.00</td>
                          <td className="px-3 py-2">{idx===3?10.00:0.00}</td>
                          <td className="px-3 py-2">{idx<9?'New':'Old'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='corpinfo-change-home-image' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Corp. Info. › <span className="font-medium">Change Home Image</span></div>
                <div className="rounded border bg-white p-6">
                  <div className="border-2 border-dashed rounded w-full h-64 grid place-items-center overflow-hidden">
                    <img alt="preview" src="https://via.placeholder.com/600x300" className="object-cover w-full h-full" />
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <label className="text-sm">Select Image:</label>
                    <input type="file" accept=".jpg" className="border rounded px-2 py-2 text-sm" />
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">Delete</button>
                  </div>
                  <div className="mt-4 text-xs text-gray-700 space-y-1">
                    <div>Note:</div>
                    <div>1. Maximum image file size 100 KB.</div>
                    <div>2. File type allowed to be uploaded is .jpg</div>
                  </div>
                </div>
              </div>
            )}

            {activeView==='request-work-on-holiday' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Work on Holiday</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Employee</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Ecode</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end gap-2">
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                    <button className="px-3 py-2 bg-green-600 text-white rounded text-sm">+ New Request</button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded border text-sm">Pending</button>
                  <button className="px-3 py-2 rounded border text-sm">Submitted</button>
                  <button className="px-3 py-2 rounded border text-sm">Approved</button>
                  <button className="px-3 py-2 rounded border text-sm">Rejected</button>
                  <button className="px-3 py-2 rounded border text-sm">Cancelled</button>
                  <button className="px-3 py-2 rounded border text-sm">All ⟳</button>
                </div>
                <div className="mt-8 text-gray-600 text-sm">No data found.</div>
              </div>
            )}

            {activeView==='request-resignation-note' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Resignation Note</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Employee</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Ecode</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end gap-2">
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                    <button className="px-3 py-2 bg-green-600 text-white rounded text-sm">+ New Request</button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded border text-sm">Pending</button>
                  <button className="px-3 py-2 rounded border text-sm">Submitted</button>
                  <button className="px-3 py-2 rounded border text-sm">Approved</button>
                  <button className="px-3 py-2 rounded border text-sm">Rejected</button>
                  <button className="px-3 py-2 rounded border text-sm">Cancelled</button>
                  <button className="px-3 py-2 rounded border text-sm">All ⟳</button>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-100 border-b">
                        <th className="px-3 py-2 text-left text-sm">Sr.</th>
                        <th className="px-3 py-2 text-left text-sm">Employee</th>
                        <th className="px-3 py-2 text-left text-sm">ECode</th>
                        <th className="px-3 py-2 text-left text-sm">Resignation Date</th>
                        <th className="px-3 py-2 text-left text-sm">Reason</th>
                        <th className="px-3 py-2 text-left text-sm">Status</th>
                        <th className="px-3 py-2 text-left text-sm">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-8 text-center text-sm" colSpan={7}>No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='request-leave-encashment' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Leave Encashment</span></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <div className="text-sm">Employee</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Ecode</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Year</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow">{Array.from({length:5}).map((_,i)=>{const y=new Date().getFullYear()-i;return <option key={y}>{y}</option>;})}</select>
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded border text-sm">Pending</button>
                  <button className="px-3 py-2 rounded border text-sm">Submitted</button>
                  <button className="px-3 py-2 rounded border text-sm">Approved</button>
                  <button className="px-3 py-2 rounded border text-sm">Rejected</button>
                  <button className="px-3 py-2 rounded border text-sm">Cancelled</button>
                  <button className="px-3 py-2 rounded border text-sm">All ⟳</button>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-100 border-b">
                        <th className="px-3 py-2 text-left text-sm">Sr.</th>
                        <th className="px-3 py-2 text-left text-sm">Employee</th>
                        <th className="px-3 py-2 text-left text-sm">ECode</th>
                        <th className="px-3 py-2 text-left text-sm">Encashment Days</th>
                        <th className="px-3 py-2 text-left text-sm">Amount</th>
                        <th className="px-3 py-2 text-left text-sm">Status</th>
                        <th className="px-3 py-2 text-left text-sm">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-8 text-center text-sm" colSpan={7}>No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView==='request-confirmation-review-entry' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">Confirmation Review Entry</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">Employee</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Ecode</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded border text-sm">Pending</button>
                  <button className="px-3 py-2 rounded border text-sm">Submitted</button>
                  <button className="px-3 py-2 rounded border text-sm">Completed</button>
                  <button className="px-3 py-2 rounded border text-sm">All ⟳</button>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-100 border-b">
                        <th className="px-3 py-2 text-left text-sm">Sr.</th>
                        <th className="px-3 py-2 text-left text-sm">Employee</th>
                        <th className="px-3 py-2 text-left text-sm">Department</th>
                        <th className="px-3 py-2 text-left text-sm">Designation</th>
                        <th className="px-3 py-2 text-left text-sm">Status</th>
                        <th className="px-3 py-2 text-left text-sm">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-8 text-center text-sm" colSpan={6}>No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeView==='request-proxyattendanceregularise' && (
              <div className="card-soft">
                <div className="text-sm mb-4">Request › <span className="font-medium">ProxyAttendanceRegularise</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <button className="px-3 py-2 rounded bg-orange-500 text-white text-sm">New Request</button>
                  </div>
                  <div>
                    <div className="text-sm">Employee</div>
                    <select className="border rounded px-2 py-2 w-full text-sm select-arrow"><option>– Select –</option></select>
                  </div>
                  <div>
                    <div className="text-sm">Ecode</div>
                    <input className="border rounded px-2 py-2 w-full text-sm" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <div className="text-sm">From Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <div className="text-sm">To Date</div>
                    <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div className="flex items-end"><button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval</button>
                  <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved</button>
                  <button className="px-3 py-2 rounded border text-sm">ALL</button>
                </div>
                <div className="mt-4 overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-100 border-b">
                        <th className="px-3 py-2 text-left text-sm">Sr.</th>
                        <th className="px-3 py-2 text-left text-sm">Employee</th>
                        <th className="px-3 py-2 text-left text-sm">ECode</th>
                        <th className="px-3 py-2 text-left text-sm">Date</th>
                        <th className="px-3 py-2 text-left text-sm">In Time</th>
                        <th className="px-3 py-2 text-left text-sm">Out Time</th>
                        <th className="px-3 py-2 text-left text-sm">Shift</th>
                        <th className="px-3 py-2 text-left text-sm">Type</th>
                        <th className="px-3 py-2 text-left text-sm">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-8 text-center text-sm" colSpan={9}>No data</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSelfService;