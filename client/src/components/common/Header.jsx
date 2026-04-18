import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserRole } from '../../hooks/useUserRole';
import { getBranding } from '../../config/branding';
import { useAuth } from '../../context/auth';
import { FiLogOut } from 'react-icons/fi';
import { getSystemQueryParam } from '../../services/api';


const employeeHiddenModules = new Set(['master', 'elcLetters', 'approvers']);

const Header = ({ onModuleClick }) => {
  const navigate = useNavigate();
  const { isAdmin, isInventory, isAccounts } = useUserRole();
  const branding = getBranding();
  const [auth, setAuth] = useAuth();

  const [navLoading, setNavLoading] = useState(true);
  const [navData, setNavData] = useState({});

  useEffect(() => {
    fetch(`/local-api/navigation${getSystemQueryParam()}`)
      .then(res => res.json())
      .then(modules => {
        const map = {};
        modules.forEach(mod => { map[mod.moduleKey] = mod; });
        setNavData(map);
      })
      .catch(err => console.error('Failed to load navigation:', err))
      .finally(() => setNavLoading(false));
  }, []);

  const [theme, setTheme] = useState(() => localStorage.getItem('ui-theme') || 'corporate');
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themes = ['corporate', 'minimal', 'warm'];
  const themeColors = { corporate: '#1F3C88', minimal: '#5A4FCF', warm: '#008080' };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'corporate' ? '' : theme);
    localStorage.setItem('ui-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('apiToken');
    localStorage.removeItem('isLogged');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return (
    <header className="bg-white px-4 py-2 flex justify-between items-center relative shadow-sm" >
      <Link
        to={isAdmin ? "/home" : "/employee-self-service"}
        className={`no-underline text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors flex items-center ${branding.showHeaderTitle ? 'gap-2' : ''}`}
      >
        <img src={branding.headerLogo} alt={`${branding.displayName} logo`} className="h-10 w-auto object-contain" />
        {branding.showHeaderTitle ? branding.headerTitle : null}
      </Link>
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs xl:text-sm text-gray-700 justify-end">
        {/* Menu items based on active system */}
        {branding.code === 'ecommerce' ? (
          <>
            <div onClick={() => onModuleClick('selling')} className="cursor-pointer hover:text-blue-600 transition-colors truncate font-semibold">Selling</div>
            <div onClick={() => onModuleClick('buying')} className="cursor-pointer hover:text-blue-600 transition-colors truncate font-semibold">Buying</div>
            <div onClick={() => onModuleClick('stock')} className="cursor-pointer hover:text-blue-600 transition-colors truncate font-semibold">Stock</div>
            <div onClick={() => onModuleClick('assets')} className="cursor-pointer hover:text-blue-600 transition-colors truncate font-semibold">Assets</div>
          </>
        ) : (
          <>
            {/* Dynamic module tabs loaded from database via ser backend */}
            {isAdmin && !navLoading && (() => {
              const HR_GROUP_KEYS = ['hr', 'recruitment', 'performance', 'shiftAttendance', 'leave'];
              const allModules = Object.values(navData).sort((a, b) => (a.order || 0) - (b.order || 0));
              
              let hrFound = false;
              return allModules.reduce((acc, mod) => {
                if (!isAdmin && employeeHiddenModules.has(mod.moduleKey)) return acc;
                if (mod.adminOnly && !isAdmin) return acc;

                // If it's part of the HR group
                if (HR_GROUP_KEYS.includes(mod.moduleKey)) {
                  if (mod.moduleKey === 'hr') {
                    hrFound = true;
                    const subModules = allModules.filter(m => HR_GROUP_KEYS.includes(m.moduleKey));
                    acc.push(
                      <div key="hr-dropdown" className="nav-dropdown-group">
                        <div 
                          className="nav-dropdown-trigger cursor-pointer font-semibold hover:text-blue-600 transition-colors"
                          onClick={() => onModuleClick('hr')}
                        >
                          HR
                        </div>
                        <div className="nav-dropdown-content">
                          {subModules.map(sub => (
                            <div 
                              key={sub.moduleKey} 
                              className="nav-dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                onModuleClick(sub.moduleKey);
                              }}
                            >
                              {sub.title === 'ERP Payroll' ? 'Payroll' : sub.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  // Skip other HR group items as they are now in the dropdown
                  return acc;
                }

                // If it's the Master module
                if (mod.moduleKey === 'master') {
                  acc.push(
                    <div key="master-dropdown" className="nav-dropdown-group">
                      <div 
                        className="nav-dropdown-trigger cursor-pointer font-semibold hover:text-blue-600 transition-colors"
                        onClick={() => onModuleClick('master')}
                      >
                        Master
                      </div>
                      <div className="nav-dropdown-content">
                        <div className="nav-dropdown-item" onClick={(e) => { e.stopPropagation(); onModuleClick('master'); }}>
                          Master Data
                        </div>
                        <div className="nav-dropdown-item" onClick={(e) => { e.stopPropagation(); navigate('/dashboard'); }}>
                          Dashboard
                        </div>
                        <div className="nav-dropdown-item" onClick={(e) => { e.stopPropagation(); navigate('/approver'); }}>
                          Approvers
                        </div>
                        <div className="nav-dropdown-item" onClick={(e) => { e.stopPropagation(); navigate('/reports'); }}>
                          Reports
                        </div>
                      </div>
                    </div>
                  );
                  return acc;
                }

                acc.push(
                  <div
                    key={mod.moduleKey}
                    className="cursor-pointer hover:text-blue-600 truncate transition-colors"
                    onClick={() => onModuleClick(mod.moduleKey)}
                  >
                    {mod.title === 'ERP Payroll' ? 'Payroll' : mod.title}
                  </div>
                );
                return acc;
              }, []);
            })()}

            {isAdmin && <div onClick={() => onModuleClick('education')} className="cursor-pointer hover:text-blue-600 transition-colors truncate">Education</div>}
            {isAdmin && <div onClick={() => onModuleClick('selling')} className="cursor-pointer hover:text-blue-600 transition-colors truncate">Selling</div>}
            {isAdmin && <div onClick={() => onModuleClick('buying')} className="cursor-pointer hover:text-blue-600 transition-colors truncate">Buying</div>}
            {isAdmin && <div onClick={() => onModuleClick('stock')} className="cursor-pointer hover:text-blue-600 transition-colors truncate">Stock</div>}
            <Link to="/employee-self-service" target="_blank" rel="noopener noreferrer" className="no-underline text-gray-800 cursor-pointer hover:text-blue-600 transition-colors truncate">Self Service</Link>
            {!isAdmin && isInventory && (
              <div onClick={() => onModuleClick('assets')} className="cursor-pointer hover:text-blue-600 transition-colors truncate">Assets</div>
            )}
            {!isAdmin && isAccounts && (
              <>
                <div onClick={() => onModuleClick('erpPayroll')} className="cursor-pointer hover:text-blue-600 transition-colors truncate">Payroll</div>
                <div onClick={() => onModuleClick('accounting')} className="cursor-pointer hover:text-blue-600 transition-colors truncate">Accounting</div>
              </>
            )}
          </>
        )}

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

        <div 
          className="cursor-pointer hover:text-red-600 transition-colors flex items-center justify-center p-1" 
          onClick={handleLogout} 
          title="Log Out"
        >
          <FiLogOut size={18} />
        </div>
      </div >
    </header >
  );
};

export default Header;
