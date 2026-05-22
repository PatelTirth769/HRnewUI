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
  const { isAdmin, isInventory, isAccounts, isStudent, isInstructor, isGuardian } = useUserRole();
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
            {isAdmin ? (
              <>
                <div onClick={() => onModuleClick('education')} className="cursor-pointer hover:text-blue-600 transition-colors truncate font-semibold">Education</div>
                <div key="more-dropdown" className="nav-dropdown-group">
                  <div className="nav-dropdown-trigger cursor-pointer font-semibold hover:text-blue-600 transition-colors">
                    More
                  </div>
                  <div className="nav-dropdown-content">
                    <div className="nav-dropdown-item" onClick={(e) => { e.stopPropagation(); onModuleClick('transport'); }}>
                      Transport Management
                    </div>
                    <div className="nav-dropdown-item" onClick={(e) => { e.stopPropagation(); onModuleClick('enquiry'); }}>
                      Enquiry Module
                    </div>
                    <div className="nav-dropdown-item" onClick={(e) => { e.stopPropagation(); onModuleClick('homework'); }}>
                      Work
                    </div>
                    <div className="nav-dropdown-item" onClick={(e) => { e.stopPropagation(); onModuleClick('importLogs'); }}>
                      Import Logs
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {(isStudent || isInstructor || isGuardian) && <div onClick={() => onModuleClick('education')} className="cursor-pointer hover:text-blue-600 transition-colors truncate font-semibold">Education</div>}
                <Link 
                  to={isStudent ? "/student-dashboard" : isInstructor ? "/instructor-dashboard" : isGuardian ? "/guardian-dashboard" : "/employee-self-service"} 
                  target={(isStudent || isInstructor || isGuardian) ? "_self" : "_blank"} 
                  rel="noopener noreferrer" 
                  className="no-underline text-gray-800 cursor-pointer hover:text-blue-600 transition-colors truncate font-semibold"
                >
                  {(isStudent || isInstructor || isGuardian) ? "Dashboard" : "Self Service"}
                </Link>
                {isInventory && (
                  <div onClick={() => onModuleClick('assets')} className="cursor-pointer hover:text-blue-600 transition-colors truncate">Assets</div>
                )}
                {isAccounts && (
                  <>
                    <div onClick={() => onModuleClick('erpPayroll')} className="cursor-pointer hover:text-blue-600 transition-colors truncate">Payroll</div>
                    <div onClick={() => onModuleClick('accounting')} className="cursor-pointer hover:text-blue-600 transition-colors truncate">Accounting</div>
                  </>
                )}
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
