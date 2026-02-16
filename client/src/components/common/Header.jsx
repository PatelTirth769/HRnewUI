import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const Header = () => {
  const navigate = useNavigate();


  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [hoveredELC, setHoveredELC] = useState(false);
  const [hoveredTALV, setHoveredTALV] = useState(false);
  const [hoveredPayroll, setHoveredPayroll] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('ui-theme') || 'corporate');
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themes = ['corporate', 'minimal', 'warm'];
  const themeColors = { corporate: '#1F3C88', minimal: '#5A4FCF', warm: '#008080' };

  useEffect(() => {
    const t = theme === 'corporate' ? '' : theme;
    document.documentElement.setAttribute('data-theme', theme === 'corporate' ? '' : theme);
    localStorage.setItem('ui-theme', theme);
  }, [theme]);

  const menuItems = {
    Master: {
      'Org Set Up': [
        'Company',
        'Department',
        'Designation',
        'Holiday Master',
        'Entity Master',
        'Qualification Master',
        'City Master',
        'State Master',
        'Country Master',
        'Bank Master'
      ],
      // Minimal Needs submenu
      'Needs': [
        'Position',
        'Vendor',
        'CV Status',
        'Miscellaneous',
        'Manpower Budget',
        'Talent Register',
        'Manage CV',
        'Search CV',
        'TR Tracker',
        'Upload Candidate Master',
        'Talent Acquisition',
        'Talent Acquisition Approval',
        'Talent Acquisition Manager Approval',
        'HR View Talent Acquisitions'
      ],
      'Ticker Message': null,
      'Event Planner': null,
      'Policy Upload': null,
      'Employee Master': null,
      'Employee Report View': null,
      'Emp Master Upload': null,
      'Upload Emp Master Update': null,
      'Reporting/Finance Manager Mapping': null,
      'Upload Reporting/Finance Manager Mapping': null,
      'View Emp Master Changes': null,
      'User Master': null,
      'Org Structure': null,
      'Export Docs': null,
      'Work Order Master': null,
      'Bulk Emp Docs upload': null
    },
    'ELC & Letters': {
      'Letter Printing': [
        'Offer Letter',
        'Appointment Letter',
        'Confirmation Letter',
        'Address Proof Letter',
        'Appraisal Letter',
        'Salary Certificate',
        'Transfer Letter',
        'Miscellaneous Letter'
      ],
      'Process Master': null,
      'Employee Process Master': null,
      'Exit Notes/Remarks/Warnings': null,
      'Send Mail': null,
      'Letter Designer': null,
      'Letters Audit Trail': null
    },
    'TA & LV': {
      'Capture Attendance': [
        'Biometric Upload',
        'Import Attendance',
        'Import In Out Time',
        'Client Emp Import Attendance'
      ],
      'Attendance Reports': [
        'Shift Punch Register',
        'Attendance Register',
        'Client Emp Attendance Register',
        'Over Time/Comp-Off',
        'Shift Plan Register',
        'Shift Deviation Register',
        'Absconding Report',
        'OT Summary',
        'Headcount/Occupancy Report'
      ],
      'Attendance Dashboard': null,
      'Attendance Policy': null,
      'Leave Policy Config': null,
      'Employee Leave Master': null,
      'Upload Opening Leave Balance': null,
      'Mobile App Linking': null,
      'Attendance Control': null,
      'Shift Planning Upload': null,
      'Shift Master': null,
      'HR View Leaves & Outdoor': null,
      'Upload Monthly Leave Balance': null
    }
  };

  const payrollCountries = [
    { key: 'india', label: 'India' },
    { key: 'nepal', label: 'Nepal' },
    { key: 'bangladesh', label: 'Bangladesh' },
    { key: 'srilanka', label: 'Sri Lanka' },
  ];
  const payrollMenus = [
    { key: 'config', label: 'Payroll Config' },
    { key: 'salary-heads', label: 'Salary heads' },
    { key: 'statutory-settings', label: 'Statutory Settings' },
    { key: 'prepare', label: 'Upload Menu' },
    { key: 'run', label: 'Run Payroll' },
    { key: 'post', label: 'Post Payroll' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'upload', label: 'Upload' },
  ];

  return (
    <header className="bg-white px-4 py-2 flex justify-between items-center relative shadow-sm">
      <Link to="/home" className="no-underline text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2">
        <img src={logo} alt="Logo" className="h-8 w-auto" />
        Dash Board
      </Link>
      <div className="flex items-center space-x-4 text-sm text-gray-700">
        {/* Master Menu with Hover */}
        <div className="relative">
          <div
            className="cursor-pointer hover:text-blue-600"
            onMouseEnter={() => setHoveredMenu('Master')}
            onMouseLeave={() => setHoveredMenu(null)}
          >
            Master ▼
          </div>
          {hoveredMenu === 'Master' && (
            <div
              className="absolute top-full left-0 bg-white shadow-sm rounded-md py-2 w-56 z-10 border border-gray-200"
              onMouseEnter={() => setHoveredMenu('Master')}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              {Object.entries(menuItems.Master).map(([itemName, subItems]) => (
                <div key={itemName} className="relative group">
                  <div
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center"
                    onClick={() => {
                      if (itemName === 'Ticker Message') {
                        navigate('/ticker-master');
                      } else if (itemName === 'Event Planner') {
                        navigate('/event-planner');
                      } else if (itemName === 'Policy Upload') {
                        navigate('/policy-upload');
                      } else if (itemName === 'Employee Master') {
                        navigate('/employee-master');
                      } else if (itemName === 'Employee Report View') {
                        navigate('/employee-master/report-view');
                      } else if (itemName === 'Upload Emp Master Update') {
                        navigate('/upload-emp-master-update');
                      } else if (itemName === 'Reporting/Finance Manager Mapping') {
                        navigate('/reporting-finance-manager-mapping');
                      }
                    }}
                  >
                    {itemName}
                    {subItems && <span className="text-xs text-gray-400">▶</span>}
                  </div>
                  {subItems && (
                    <div className="absolute left-full top-0 bg-white shadow-sm rounded-md py-2 w-56 z-20 border border-gray-200 hidden group-hover:block">
                      {subItems.map((subItem, subIndex) => (
                        <div
                          key={subIndex}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          onClick={() => {
                            if (subItem === 'Company') {
                              navigate('/companies');
                            } else if (subItem === 'Department') {
                              navigate('/master/departments');
                            } else if (subItem === 'Designation') {
                              navigate('/master/designations');
                            } else if (subItem === 'Holiday Master') {
                              navigate('/master/holiday-master');
                            } else if (subItem === 'Entity Master') {
                              navigate('/master/entity-master');
                            } else if (subItem === 'Qualification Master') {
                              navigate('/master/qualification-master');
                            } else if (subItem === 'City Master') {
                              navigate('/city-master');
                            } else if (subItem === 'State Master') {
                              navigate('/master/state-master');
                            } else if (subItem === 'Country Master') {
                              navigate('/country-master');
                            } else if (subItem === 'Bank Master') {
                              navigate('/bank-master');
                            } else if (subItem === 'Ticker Message') {
                              navigate('/ticker-master');
                            } else if (subItem === 'Position') {
                              navigate('/needs/position');
                            } else if (subItem === 'Vendor') {
                              navigate('/needs/vendor');
                            } else if (subItem === 'CV Status') {
                              navigate('/needs/cv-status');
                            } else if (subItem === 'Miscellaneous') {
                              navigate('/needs/miscellaneous');
                            } else if (subItem === 'Manpower Budget') {
                              navigate('/needs/manpower-budget');
                            } else if (subItem === 'Talent Register') {
                              navigate('/needs/talent-register');
                            } else if (subItem === 'Manage CV') {
                              navigate('/needs/manage-cv');
                            } else if (subItem === 'Search CV') {
                              navigate('/needs/search-cv');
                            } else if (subItem === 'TR Tracker') {
                              navigate('/needs/tr-tracker');
                            } else if (subItem === 'Upload Candidate Master') {
                              navigate('/needs/upload-candidate-master');
                            } else if (subItem === 'Talent Acquisition') {
                              navigate('/needs/talent-acquisition');
                            } else if (subItem === 'Talent Acquisition Approval') {
                              navigate('/needs/talent-acquisition-approval');
                            } else if (subItem === 'Talent Acquisition Manager Approval') {
                              navigate('/needs/talent-acquisition-manager-approval');
                            } else if (subItem === 'HR View Talent Acquisitions') {
                              navigate('/needs/hr-view-talent-acquisitions');
                            }
                          }}
                        >
                          {subItem}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ELC & Letters Menu */}
        <div className="relative">
          <div
            className="cursor-pointer hover:text-blue-600"
            onMouseEnter={() => setHoveredELC(true)}
            onMouseLeave={() => setHoveredELC(false)}
          >
            ELC & Letters ▼
          </div>
          {hoveredELC && (
            <div
              className="absolute top-full left-0 bg-white shadow-sm rounded-md py-2 w-56 z-10 border border-gray-200"
              onMouseEnter={() => setHoveredELC(true)}
              onMouseLeave={() => setHoveredELC(false)}
            >
              {Object.entries(menuItems['ELC & Letters']).map(([itemName, subItems]) => (
                <div key={itemName} className="relative group">
                  <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center">
                    {itemName}
                    {subItems && <span className="text-xs text-gray-400">▶</span>}
                  </div>
                  {subItems && (
                    <div className="absolute left-full top-0 bg-white shadow-sm rounded-md py-2 w-56 z-20 border border-gray-200 hidden group-hover:block">
                      {subItems.map((subItem, subIndex) => (
                        <div key={subIndex} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                          {subItem}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TA & LV Menu */}
        <div className="relative">
          <div
            className="cursor-pointer hover:text-blue-600"
            onMouseEnter={() => setHoveredTALV(true)}
            onMouseLeave={() => setHoveredTALV(false)}
          >
            TA & LV ▼
          </div>
          {hoveredTALV && (
            <div
              className="absolute top-full left-0 bg-white shadow-sm rounded-md py-2 w-56 z-10 border border-gray-200"
              onMouseEnter={() => setHoveredTALV(true)}
              onMouseLeave={() => setHoveredTALV(false)}
            >
              {Object.entries(menuItems['TA & LV']).map(([itemName, subItems]) => (
                <div key={itemName} className="relative group">
                  <div
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center"
                    onClick={() => {
                      if (itemName === 'Attendance Dashboard') {
                        navigate('/talv/attendance-dashboard');
                      } else if (itemName === 'Attendance Policy') {
                        navigate('/talv/attendance-policy');
                      } else if (itemName === 'Leave Policy Config') {
                        navigate('/talv/leave-policy-config');
                      } else if (itemName === 'Employee Leave Master') {
                        navigate('/talv/employee-leave-master');
                      } else if (itemName === 'Upload Opening Leave Balance') {
                        navigate('/talv/upload-opening-leave-balance');
                      } else if (itemName === 'Mobile App Linking') {
                        navigate('/talv/mobile-app-linking');
                      } else if (itemName === 'Attendance Control') {
                        navigate('/talv/attendance-control');
                      } else if (itemName === 'Shift Planning Upload') {
                        navigate('/talv/shift-planning-upload');
                      } else if (itemName === 'Shift Master') {
                        navigate('/talv/shift-master');
                      } else if (itemName === 'HR View Leaves & Outdoor') {
                        navigate('/talv/hr-view-leaves-outdoor');
                      } else if (itemName === 'Upload Monthly Leave Balance') {
                        navigate('/talv/upload-monthly-leave-balance');
                      }
                    }}
                  >
                    {itemName}
                    {subItems && <span className="text-xs text-gray-400">▶</span>}
                  </div>
                  {subItems && (
                    <div className="absolute left-full top-0 bg-white shadow-sm rounded-md py-2 w-56 z-20 border border-gray-200 hidden group-hover:block">
                      {subItems.map((subItem, subIndex) => (
                        <div
                          key={subIndex}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          onClick={() => {
                            if (itemName === 'Capture Attendance') {
                              if (subItem === 'Biometric Upload') navigate('/talv/capture-attendance/biometric-upload');
                              else if (subItem === 'Import Attendance') navigate('/talv/capture-attendance/import-attendance');
                              else if (subItem === 'Import In Out Time') navigate('/talv/capture-attendance/import-in-out-time');
                              else if (subItem === 'Client Emp Import Attendance') navigate('/talv/capture-attendance/client-emp-import-attendance');
                            } else if (itemName === 'Attendance Reports') {
                              if (subItem === 'Shift Punch Register') navigate('/talv/attendance-reports/shift-punch-register');
                              else if (subItem === 'Attendance Register') navigate('/talv/attendance-reports/attendance-register');
                              else if (subItem === 'Client Emp Attendance Register') navigate('/talv/attendance-reports/client-emp-attendance-register');
                              else if (subItem === 'Over Time/Comp-Off') navigate('/talv/attendance-reports/over-time-comp-off');
                              else if (subItem === 'Shift Plan Register') navigate('/talv/attendance-reports/shift-plan-register');
                              else if (subItem === 'Shift Deviation Register') navigate('/talv/attendance-reports/shift-deviation-register');
                              else if (subItem === 'Absconding Report') navigate('/talv/attendance-reports/absconding-report');
                              else if (subItem === 'OT Summary') navigate('/talv/attendance-reports/ot-summary');
                              else if (subItem === 'Headcount/Occupancy Report') navigate('/talv/attendance-reports/headcount-occupancy-report');
                            }
                          }}
                        >
                          {subItem}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payroll Menu */}
        <div className="relative">
          <div
            className="cursor-pointer hover:text-blue-600"
            onMouseEnter={() => setHoveredPayroll(true)}
            onMouseLeave={() => setHoveredPayroll(false)}
          >
            Payroll ▼
          </div>
          {hoveredPayroll && (
            <div
              className="absolute top-full left-0 bg-white shadow-sm rounded-md py-2 w-56 z-10 border border-gray-200"
              onMouseEnter={() => setHoveredPayroll(true)}
              onMouseLeave={() => setHoveredPayroll(false)}
            >
              {payrollCountries.map((c) => (
                <div key={c.key} className="relative group">
                  <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center">
                    {c.label}
                    <span className="text-xs text-gray-400">▶</span>
                  </div>
                  <div className="absolute left-full top-0 bg-white shadow-sm rounded-md py-2 w-56 z-20 border border-gray-200 hidden group-hover:block">
                    {payrollMenus.map((m) => (
                      <div
                        key={m.key}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                        onClick={() => navigate(`/payroll/${c.key}/${m.key}`)}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link to="/dashboard" className="no-underline text-gray-800 cursor-pointer hover:text-blue-600 transition-colors">Dashboard</Link>
        <Link to="/companies" className="no-underline text-gray-800 cursor-pointer hover:text-blue-600 transition-colors">Companies</Link>
        <Link to="/settings" className="no-underline text-gray-800 cursor-pointer hover:text-blue-600 transition-colors">Settings</Link>
        <Link to="/employee-self-service" target="_blank" rel="noopener noreferrer" className="no-underline text-gray-800 cursor-pointer hover:text-blue-600 transition-colors">Employee Self Service</Link>
        <Link to="/reports" className="no-underline text-gray-800 cursor-pointer hover:text-blue-600 transition-colors">Reports</Link>
        <Link to="/about" className="no-underline text-gray-800 cursor-pointer hover:text-blue-600 transition-colors">About</Link>
        <Link to="/contact" className="no-underline text-gray-800 cursor-pointer hover:text-blue-600 transition-colors">Contact</Link>
        <div className="relative">
          <button
            className="flex items-center gap-1 border rounded px-2 py-1 shadow-sm"
            onClick={() => setThemeMenuOpen(v => !v)}
            aria-label="Theme"
          >
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text)' }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {themeMenuOpen && (
            <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-sm p-2 flex gap-2 z-50">
              {themes.map(t => (
                <button
                  key={t}
                  className={`w-5 h-5 rounded-full border ${theme === t ? 'ring-2 ring-gray-300' : ''}`}
                  style={{ backgroundColor: themeColors[t] }}
                  onClick={() => { setTheme(t); setThemeMenuOpen(false); }}
                  aria-label={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


export default Header;