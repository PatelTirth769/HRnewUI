import { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const ThemeContext = createContext();

// Default theme settings
const defaultTheme = {
  themeColor: 'blue',
  isDarkMode: true,
  sidebarColor: 'gray',
  fontSize: 'medium'
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Initialize state with default values
  const [themeSettings, setThemeSettings] = useState(defaultTheme);
  
  // Load saved settings from localStorage on initial render
  useEffect(() => {
    const savedSettings = localStorage.getItem('theme-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setThemeSettings({
          ...defaultTheme,
          ...parsedSettings
        });
      } catch (error) {
        console.error('Error parsing theme settings:', error);
      }
    }
  }, []);
  
  // Update theme when settings change
  useEffect(() => {
    // Apply theme settings to document
    document.documentElement.setAttribute('data-theme-color', themeSettings.themeColor);
    document.documentElement.setAttribute('data-theme-mode', themeSettings.isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-sidebar-color', themeSettings.sidebarColor);
    document.documentElement.setAttribute('data-font-size', themeSettings.fontSize);
    
    // Add or remove dark mode class
    if (themeSettings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save settings to localStorage
    localStorage.setItem('theme-settings', JSON.stringify(themeSettings));
  }, [themeSettings]);
  
  // Update individual theme settings
  const updateTheme = (setting, value) => {
    setThemeSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Reset to default settings
  const resetTheme = () => {
    setThemeSettings(defaultTheme);
  };
  
  // Context value
  const value = {
    ...themeSettings,
    updateTheme,
    resetTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;