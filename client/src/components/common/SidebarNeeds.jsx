import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NeedsItem = ({ label, to, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors ${
      active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
    }`}
  >
    <span className="text-sm">{icon}</span>
    <span className="text-left flex-1">{label}</span>
  </button>
);

export default function SidebarNeeds() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openPosition, setOpenPosition] = useState(false);
  const [openIndiaPayroll, setOpenIndiaPayroll] = useState(false);
  const [openNepalPayroll, setOpenNepalPayroll] = useState(false);
  const [openBangladeshPayroll, setOpenBangladeshPayroll] = useState(false);
  const [openSriLankaPayroll, setOpenSriLankaPayroll] = useState(false);

  const items = [
    // Position group is now a dropdown; its children are defined below
    { label: 'Manpower Budget', to: '/needs/manpower-budget', icon: '💲' },
    { label: 'Talent Register', to: '/needs/talent-register', icon: '🧑‍💻' },
    { label: 'Manage CV', to: '/needs/manage-cv', icon: '🗂️' },
    { label: 'Search CV', to: '/needs/search-cv', icon: '🔍' },
    { label: 'TR Tracker', to: '/needs/tr-tracker', icon: '📍' },
    { label: 'Upload Candidate Master', to: '/needs/upload-candidate-master', icon: '⤴️' },
    { label: 'Talent Acquisition', to: '/needs/talent-acquisition', icon: '👥' },
    { label: 'Talent Acquisition Approval', to: '/needs/talent-acquisition-approval', icon: '✅' },
    { label: 'Talent Acquisition Manager Approval', to: '/needs/talent-acquisition-manager-approval', icon: '🧑‍💼' },
    { label: 'HR View Talent Acquisitions', to: '/needs/hr-view-talent-acquisitions', icon: '👁️' },
  ];

  return (
    <aside className="hidden md:block w-64 shrink-0 border-r bg-white">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">Needs</h2>
          <span className="text-gray-400 text-xs">minimal</span>
        </div>

        <div className="space-y-2">

          {/* Position dropdown */}
          <div>
            <button
              onClick={() => setOpenPosition((v) => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-md border transition-colors ${
                openPosition ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <span className="text-base">📦</span>
              <span className="text-left flex-1">Position</span>
              <span className="text-xs">{openPosition ? '▾' : '▸'}</span>
            </button>

            {openPosition && (
              <div className="mt-2 space-y-2 pl-8">
                <NeedsItem
                  label="Vendor"
                  to="/needs/vendor"
                  icon="👤"
                  active={location.pathname === '/needs/vendor'}
                  onClick={() => navigate('/needs/vendor')}
                />
                <NeedsItem
                  label="CV Status"
                  to="/needs/cv-status"
                  icon="📄"
                  active={location.pathname === '/needs/cv-status'}
                  onClick={() => navigate('/needs/cv-status')}
                />
                <NeedsItem
                  label="Miscellaneous"
                  to="/needs/miscellaneous"
                  icon="⋯"
                  active={location.pathname === '/needs/miscellaneous'}
                  onClick={() => navigate('/needs/miscellaneous')}
                />
              </div>
            )}
          </div>

          {/* India Payroll dropdown moved under Needs (below Position) */}
          <div>
            <button
              onClick={() => setOpenIndiaPayroll(v => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-md border transition-colors ${
                openIndiaPayroll ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <span className="text-base">🇮🇳</span>
              <span className="text-left flex-1">India Payroll</span>
              <span className="text-xs">{openIndiaPayroll ? '▾' : '▸'}</span>
            </button>
            {openIndiaPayroll && (
              <div className="mt-2 space-y-1 pl-8">
                <div className="text-xs text-gray-500 mb-1">Master</div>
                <NeedsItem label="Payroll Config" to="/payroll/india/config" icon="⚙️" active={location.pathname === '/payroll/india/config'} onClick={() => navigate('/payroll/india/config')} />
                <NeedsItem label="Salary heads" to="/payroll/india/salary-heads" icon="⚙️" active={location.pathname === '/payroll/india/salary-heads'} onClick={() => navigate('/payroll/india/salary-heads')} />
                <NeedsItem label="Statutory Settings" to="/payroll/india/statutory-settings" icon="⚙️" active={location.pathname === '/payroll/india/statutory-settings'} onClick={() => navigate('/payroll/india/statutory-settings')} />
                <NeedsItem label="Prepare Payroll" to="/payroll/india/prepare" icon="⚙️" active={location.pathname === '/payroll/india/prepare'} onClick={() => navigate('/payroll/india/prepare')} />
                <NeedsItem label="Run Payroll" to="/payroll/india/run" icon="⚙️" active={location.pathname === '/payroll/india/run'} onClick={() => navigate('/payroll/india/run')} />
                <NeedsItem label="Post Payroll" to="/payroll/india/post" icon="⚙️" active={location.pathname === '/payroll/india/post'} onClick={() => navigate('/payroll/india/post')} />
                <NeedsItem label="Dashboard" to="/payroll/india/dashboard" icon="⚙️" active={location.pathname === '/payroll/india/dashboard'} onClick={() => navigate('/payroll/india/dashboard')} />
                <NeedsItem label="Upload" to="/payroll/india/upload" icon="⤴️" active={location.pathname === '/payroll/india/upload'} onClick={() => navigate('/payroll/india/upload')} />
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setOpenNepalPayroll(v => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-md border transition-colors ${
                openNepalPayroll ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <span className="text-base">🇳🇵</span>
              <span className="text-left flex-1">Nepal Payroll</span>
              <span className="text-xs">{openNepalPayroll ? '▾' : '▸'}</span>
            </button>
            {openNepalPayroll && (
              <div className="mt-2 space-y-1 pl-8">
                <div className="text-xs text-gray-500 mb-1">Master</div>
                <NeedsItem label="Payroll Config" to="/payroll/nepal/config" icon="⚙️" active={location.pathname === '/payroll/nepal/config'} onClick={() => navigate('/payroll/nepal/config')} />
                <NeedsItem label="Salary heads" to="/payroll/nepal/salary-heads" icon="⚙️" active={location.pathname === '/payroll/nepal/salary-heads'} onClick={() => navigate('/payroll/nepal/salary-heads')} />
                <NeedsItem label="Statutory Settings" to="/payroll/nepal/statutory-settings" icon="⚙️" active={location.pathname === '/payroll/nepal/statutory-settings'} onClick={() => navigate('/payroll/nepal/statutory-settings')} />
                <NeedsItem label="Prepare Payroll" to="/payroll/nepal/prepare" icon="⚙️" active={location.pathname === '/payroll/nepal/prepare'} onClick={() => navigate('/payroll/nepal/prepare')} />
                <NeedsItem label="Run Payroll" to="/payroll/nepal/run" icon="⚙️" active={location.pathname === '/payroll/nepal/run'} onClick={() => navigate('/payroll/nepal/run')} />
                <NeedsItem label="Post Payroll" to="/payroll/nepal/post" icon="⚙️" active={location.pathname === '/payroll/nepal/post'} onClick={() => navigate('/payroll/nepal/post')} />
                <NeedsItem label="Dashboard" to="/payroll/nepal/dashboard" icon="⚙️" active={location.pathname === '/payroll/nepal/dashboard'} onClick={() => navigate('/payroll/nepal/dashboard')} />
                <NeedsItem label="Upload" to="/payroll/nepal/upload" icon="⤴️" active={location.pathname === '/payroll/nepal/upload'} onClick={() => navigate('/payroll/nepal/upload')} />
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setOpenBangladeshPayroll(v => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-md border transition-colors ${
                openBangladeshPayroll ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <span className="text-base">🇧🇩</span>
              <span className="text-left flex-1">Bangladesh Payroll</span>
              <span className="text-xs">{openBangladeshPayroll ? '▾' : '▸'}</span>
            </button>
            {openBangladeshPayroll && (
              <div className="mt-2 space-y-1 pl-8">
                <div className="text-xs text-gray-500 mb-1">Master</div>
                <NeedsItem label="Payroll Config" to="/payroll/bangladesh/config" icon="⚙️" active={location.pathname === '/payroll/bangladesh/config'} onClick={() => navigate('/payroll/bangladesh/config')} />
                <NeedsItem label="Salary heads" to="/payroll/bangladesh/salary-heads" icon="⚙️" active={location.pathname === '/payroll/bangladesh/salary-heads'} onClick={() => navigate('/payroll/bangladesh/salary-heads')} />
                <NeedsItem label="Statutory Settings" to="/payroll/bangladesh/statutory-settings" icon="⚙️" active={location.pathname === '/payroll/bangladesh/statutory-settings'} onClick={() => navigate('/payroll/bangladesh/statutory-settings')} />
                <NeedsItem label="Prepare Payroll" to="/payroll/bangladesh/prepare" icon="⚙️" active={location.pathname === '/payroll/bangladesh/prepare'} onClick={() => navigate('/payroll/bangladesh/prepare')} />
                <NeedsItem label="Run Payroll" to="/payroll/bangladesh/run" icon="⚙️" active={location.pathname === '/payroll/bangladesh/run'} onClick={() => navigate('/payroll/bangladesh/run')} />
                <NeedsItem label="Post Payroll" to="/payroll/bangladesh/post" icon="⚙️" active={location.pathname === '/payroll/bangladesh/post'} onClick={() => navigate('/payroll/bangladesh/post')} />
                <NeedsItem label="Dashboard" to="/payroll/bangladesh/dashboard" icon="⚙️" active={location.pathname === '/payroll/bangladesh/dashboard'} onClick={() => navigate('/payroll/bangladesh/dashboard')} />
                <NeedsItem label="Upload" to="/payroll/bangladesh/upload" icon="⤴️" active={location.pathname === '/payroll/bangladesh/upload'} onClick={() => navigate('/payroll/bangladesh/upload')} />
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setOpenSriLankaPayroll(v => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-md border transition-colors ${
                openSriLankaPayroll ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <span className="text-base">🇱🇰</span>
              <span className="text-left flex-1">Sri Lanka Payroll</span>
              <span className="text-xs">{openSriLankaPayroll ? '▾' : '▸'}</span>
            </button>
            {openSriLankaPayroll && (
              <div className="mt-2 space-y-1 pl-8">
                <div className="text-xs text-gray-500 mb-1">Master</div>
                <NeedsItem label="Payroll Config" to="/payroll/srilanka/config" icon="⚙️" active={location.pathname === '/payroll/srilanka/config'} onClick={() => navigate('/payroll/srilanka/config')} />
                <NeedsItem label="Salary heads" to="/payroll/srilanka/salary-heads" icon="⚙️" active={location.pathname === '/payroll/srilanka/salary-heads'} onClick={() => navigate('/payroll/srilanka/salary-heads')} />
                <NeedsItem label="Statutory Settings" to="/payroll/srilanka/statutory-settings" icon="⚙️" active={location.pathname === '/payroll/srilanka/statutory-settings'} onClick={() => navigate('/payroll/srilanka/statutory-settings')} />
                <NeedsItem label="Prepare Payroll" to="/payroll/srilanka/prepare" icon="⚙️" active={location.pathname === '/payroll/srilanka/prepare'} onClick={() => navigate('/payroll/srilanka/prepare')} />
                <NeedsItem label="Run Payroll" to="/payroll/srilanka/run" icon="⚙️" active={location.pathname === '/payroll/srilanka/run'} onClick={() => navigate('/payroll/srilanka/run')} />
                <NeedsItem label="Post Payroll" to="/payroll/srilanka/post" icon="⚙️" active={location.pathname === '/payroll/srilanka/post'} onClick={() => navigate('/payroll/srilanka/post')} />
                <NeedsItem label="Dashboard" to="/payroll/srilanka/dashboard" icon="⚙️" active={location.pathname === '/payroll/srilanka/dashboard'} onClick={() => navigate('/payroll/srilanka/dashboard')} />
                <NeedsItem label="Upload" to="/payroll/srilanka/upload" icon="⤴️" active={location.pathname === '/payroll/srilanka/upload'} onClick={() => navigate('/payroll/srilanka/upload')} />
              </div>
            )}
          </div>

          {/* Rest items */}
          {items.map((item) => (
            <NeedsItem
              key={item.to}
              label={item.label}
              to={item.to}
              icon={item.icon}
              active={location.pathname === item.to}
              onClick={() => navigate(item.to)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}