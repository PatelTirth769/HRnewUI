import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  // Get theme settings from context
  const { 
    themeColor, 
    isDarkMode, 
    sidebarColor, 
    fontSize, 
    updateTheme, 
    resetTheme 
  } = useTheme();
  
  // Available theme colors
  const themeColors = [
    { name: 'Blue', value: 'blue' },
    { name: 'Purple', value: 'purple' },
    { name: 'Green', value: 'green' },
    { name: 'Red', value: 'red' },
    { name: 'Orange', value: 'orange' },
    { name: 'Cyan', value: 'cyan' }
  ];
  
  // Available sidebar colors
  const sidebarColors = [
    { name: 'Gray', value: 'gray' },
    { name: 'Dark Blue', value: 'blue' },
    { name: 'Dark Purple', value: 'purple' },
    { name: 'Dark Green', value: 'green' },
    { name: 'Dark Red', value: 'red' }
  ];
  
  // Font size options
  const fontSizes = [
    { name: 'Small', value: 'small' },
    { name: 'Medium', value: 'medium' },
    { name: 'Large', value: 'large' }
  ];
  
  // Note: Theme settings are now managed by ThemeContext
  // The context handles saving to localStorage and applying to document

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Customize your dashboard experience</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Theme Settings</h2>
          
          {/* Dark/Light Mode Toggle */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-white mb-3">Appearance Mode</h3>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => updateTheme('isDarkMode', true)}
                className={`px-4 py-2 rounded-md flex items-center ${isDarkMode ? `bg-${themeColor}-600 text-white` : 'bg-gray-700 text-gray-300'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Dark
              </button>
              <button 
                onClick={() => updateTheme('isDarkMode', false)}
                className={`px-4 py-2 rounded-md flex items-center ${!isDarkMode ? `bg-${themeColor}-600 text-white` : 'bg-gray-700 text-gray-300'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Light
              </button>
            </div>
          </div>
          
          {/* Theme Color Selection */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-white mb-3">Theme Color</h3>
            <div className="grid grid-cols-3 gap-2">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateTheme('themeColor', color.value)}
                  className={`p-2 rounded-md text-sm ${themeColor === color.value ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: `var(--color-${color.value}-600)` }}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sidebar Color */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-white mb-3">Sidebar Color</h3>
            <div className="grid grid-cols-3 gap-2">
              {sidebarColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateTheme('sidebarColor', color.value)}
                  className={`p-2 rounded-md text-sm ${sidebarColor === color.value ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: `var(--color-${color.value}-800)` }}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Display Settings */}
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Display Settings</h2>
          
          {/* Font Size */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-white mb-3">Font Size</h3>
            <div className="flex items-center space-x-4">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => updateTheme('fontSize', size.value)}
                  className={`px-4 py-2 rounded-md ${fontSize === size.value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Reset Button */}
          <div className="mt-8">
            <button
              onClick={resetTheme}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview Section */}
      <div className="mt-8 bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-12 h-12 rounded-lg bg-${themeColor}-600 flex items-center justify-center`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Theme Preview</h3>
              <p className="text-gray-400 text-sm">This is how your theme will look</p>
            </div>
          </div>
          <div className="flex space-x-2 mb-4">
            <button className={`px-3 py-1 rounded-md bg-${themeColor}-600 text-white text-sm`}>Primary Button</button>
            <button className="px-3 py-1 rounded-md bg-gray-700 text-gray-300 text-sm">Secondary Button</button>
          </div>
          <div className="h-4 w-full bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full bg-${themeColor}-600`} style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;