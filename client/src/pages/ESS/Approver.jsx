import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../services/api';

const Approver = () => {
  const sections = [
    { key: 'approvals', icon: '✔️', label: 'Approvals', children: [
      'Attendance Regularisation', 'Leave/OD/WFH', 'HelpDesk', 'Work On Holiday', 'Resignations', 'Confirmation Review', 'HOD Attendance Regularisation', 'Proxy Leave Application'
    ] },
    { key: 'hrApprovals', icon: '🧑‍💼', label: 'HR Approvals', children: [
      'Attendance Regularisation', 'Resignations', 'HR Confirmation Review', 'Work On Holiday'
    ] },
    { key: 'financeApproval', icon: '₹', label: 'Finance Approval', children: [
      'Expense Requisition', 'Expense Claim'
    ] },
    { key: 'claimApproval', icon: '✔️', label: 'Claim Approval', children: [
      'Expense Claim', 'Reimbursement', 'Expense Requisition'
    ] }
  ];

  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const navigate = useNavigate();
  const location = useLocation();
  const base = '/approver';
  const activeView = (() => {
    const p = location.pathname.replace(base + '/', '');
    if (p === location.pathname || p === '') return 'approvals-attendance-regularisation';
    return p;
  })();

  const [open, setOpen] = useState({ approvals: true });

  return (
    <div className="bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-64 shrink-0 left-0 top-0">
            <div className="card-soft p-0 overflow-hidden">
              {sections.map((s) => (
                <div key={s.key} className="border-b">
                  <button
                    className={`w-full flex items-center justify-between px-3 py-3 text-left ${open[s.key] ? 'bg-gray-50' : ''}`}
                    onClick={() => setOpen((o) => ({ ...o, [s.key]: !o[s.key] }))}
                  >
                    <span className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs">{s.icon}</span>
                      <span className="text-gray-800 text-sm font-medium">{s.label}</span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`transition-transform ${open[s.key] ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {open[s.key] && (
                    <div className="px-4 pb-3">
                      {s.children.map((c) => {
                        const k = `${s.key}-${slug(c)}`;
                        return (
                          <button
                            key={c}
                            className={`block w-full text-left px-2 py-2 text-sm rounded ${activeView === k ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => navigate(`${base}/${k}`)}
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
            <div className="text-2xl font-semibold text-gray-900 mb-4">Approver</div>
            
            <div className="space-y-6">
              {/* Approvals Section */}
              {activeView === 'approvals-attendance-regularisation' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Approvals › <span className="font-medium">Attendance Regularisation</span></div>
                  <div className="flex items-end gap-3">
                    <div>
                      <div className="text-sm">Select month</div>
                      <input type="month" className="border rounded px-2 py-2 w-[160px] text-sm" defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`} />
                    </div>
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval (0)</button>
                    <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                    <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected (0)</button>
                    <button className="px-3 py-2 rounded border text-sm">All (0) ⟳</button>
                  </div>
                  <div className="mt-8 text-gray-600 text-sm">There are no pending approvals for selected month.</div>
                </div>
              )}

              {activeView === 'approvals-leave-od-wfh' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Approvals › <span className="font-medium">Leave/OD/WFH</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <div className="text-sm">From Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().slice(0, 10)} />
                    </div>
                    <div>
                      <div className="text-sm">To Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0, 10)} />
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
                    <button className="px-3 py-2 rounded border text-sm">All (0) ⟳</button>
                  </div>
                  <div className="mt-8 text-gray-600 text-sm">There are no pending approvals for selected filters.</div>
                </div>
              )}

              {activeView === 'approvals-helpdesk' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Approvals › <span className="font-medium">HelpDesk</span></div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">My Pending</button>
                    <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Responded By Me</button>
                    <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm">ALL Pending</button>
                    <button className="px-3 py-2 rounded bg-gray-500 text-white text-sm">Responded By ALL</button>
                  </div>
                  <div className="mt-8 text-gray-600 text-sm">There are no pending approvals for selected filters.</div>
                </div>
              )}

              {activeView === 'approvals-work-on-holiday' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Approvals › <span className="font-medium">Work On Holiday</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <div className="text-sm">From Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().slice(0, 10)} />
                    </div>
                    <div>
                      <div className="text-sm">To Date</div>
                      <input type="date" className="border rounded px-2 py-2 w-full text-sm" defaultValue={new Date().toISOString().slice(0, 10)} />
                    </div>
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval (0)</button>
                    <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                    <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected (0)</button>
                    <button className="px-3 py-2 rounded border text-sm">All (0) ⟳</button>
                  </div>
                  <div className="mt-8 text-gray-600 text-sm">There are no pending approvals for selected filters.</div>
                </div>
              )}

              {activeView === 'approvals-resignations' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Approvals › <span className="font-medium">Resignations</span></div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval (0)</button>
                    <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                    <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected (0)</button>
                    <button className="px-3 py-2 rounded border text-sm">ALL (0) ⟳</button>
                  </div>
                  <div className="mt-8 text-gray-600 text-sm">There are no resignation requests for selected filters.</div>
                </div>
              )}

              {activeView === 'approvals-confirmation-review' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Approvals › <span className="font-medium">Confirmation Review</span></div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="px-3 py-2 rounded bg-orange-400 text-white text-sm">Pending Approval (0)</button>
                    <button className="px-3 py-2 rounded bg-green-500 text-white text-sm">Approved (0)</button>
                    <button className="px-3 py-2 rounded bg-red-500 text-white text-sm">Rejected (0)</button>
                    <button className="px-3 py-2 rounded border text-sm">ALL (0) ⟳</button>
                  </div>
                  <div className="mt-8 text-gray-600 text-sm">There are no confirmation review request for selected filters.</div>
                </div>
              )}

              {activeView === 'approvals-hod-attendance-regularisation' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Approvals › <span className="font-medium">HOD Attendance Regularisation</span></div>
                  <div className="flex items-end gap-3">
                    <div>
                      <div className="text-sm">Select month</div>
                      <input type="month" className="border rounded px-2 py-2 w-[160px] text-sm" defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`} />
                    </div>
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                  </div>
                  <div className="mt-4 text-gray-600 text-sm">There are no pending HOD approvals for selected month.</div>
                </div>
              )}

              {activeView === 'approvals-proxy-leave-application' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Approvals › <span className="font-medium">Proxy Leave Application</span></div>
                  <div className="mt-4 text-gray-600 text-sm">No proxy leave application requests.</div>
                </div>
              )}

              {/* HR Approvals Section */}
              {activeView === 'hrapprovals-attendance-regularisation' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">HR Approvals › <span className="font-medium">Attendance Regularisation</span></div>
                  <div className="flex items-end gap-3">
                    <div>
                      <div className="text-sm">Select month</div>
                      <input type="month" className="border rounded px-2 py-2 w-[160px] text-sm" defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`} />
                    </div>
                    <button className="px-3 py-2 bg-orange-500 text-white rounded text-sm">🔎</button>
                  </div>
                  <div className="mt-8 text-gray-600 text-sm">There are no pending HR approvals for selected month.</div>
                </div>
              )}

              {activeView === 'hrapprovals-resignations' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">HR Approvals › <span className="font-medium">Resignations</span></div>
                  <div className="mt-4 text-gray-600 text-sm">There are no resignation requests for selected filters.</div>
                </div>
              )}

              {activeView === 'hrapprovals-hr-confirmation-review' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">HR Approvals › <span className="font-medium">HR Confirmation Review</span></div>
                  <div className="mt-4 text-gray-600 text-sm">There are no HR confirmation review request for selected filters.</div>
                </div>
              )}

              {activeView === 'hrapprovals-work-on-holiday' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">HR Approvals › <span className="font-medium">Work On Holiday</span></div>
                  <div className="mt-4 text-gray-600 text-sm">There are no Work On Holiday request for selected filters.</div>
                </div>
              )}

              {/* Finance Approval Section */}
              {activeView === 'financeapproval-expense-requisition' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Finance Approval › <span className="font-medium">Expense Requisition</span></div>
                  <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
                </div>
              )}

              {activeView === 'financeapproval-expense-claim' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Finance Approval › <span className="font-medium">Expense Claim</span></div>
                  <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
                </div>
              )}

              {/* Claim Approval Section */}
              {activeView === 'claimapproval-expense-claim' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Claim Approval › <span className="font-medium">Expense Claim</span></div>
                  <div className="mt-8 text-gray-600 text-sm">There are no expense claim requests.</div>
                </div>
              )}

              {activeView === 'claimapproval-reimbursement' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Claim Approval › <span className="font-medium">Reimbursement</span></div>
                  <div className="mt-8 text-gray-600 text-sm">There are no reimbursement requests.</div>
                </div>
              )}

              {activeView === 'claimapproval-expense-requisition' && (
                <div className="card-soft">
                  <div className="text-sm mb-4">Claim Approval › <span className="font-medium">Expense Requisition</span></div>
                  <div className="mt-8 text-gray-600 text-sm">There are no request for selected filters.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .card-soft { background: white; border-radius: 12px; border: 1px solid #f1f5f9; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
        .select-arrow { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; background-size: 16px; padding-right: 32px; }
      `}} />
    </div>
  );
};

export default Approver;
