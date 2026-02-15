import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      companyName: 'HR Management Solutions',
      timezone: 'UTC+5:30',
      dateFormat: 'DD/MM/YYYY',
      language: 'English',
      currency: 'INR'
    },
    profile: {
      name: 'Admin User',
      email: 'admin@company.com',
      phone: '+91 9876543210',
      role: 'System Administrator'
    },
    security: {
      twoFactorAuth: true,
      passwordExpiry: 90,
      sessionTimeout: 30,
      loginAttempts: 5
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      dailyReports: true
    },
    privacy: {
      dataSharing: false,
      analyticsTracking: true,
      cookieConsent: true
    }
  });

  const [tempSettings, setTempSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (category, key, value) => {
    setTempSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = (category) => {
    setSettings(prev => ({
      ...prev,
      [category]: tempSettings[category]
    }));
    setHasChanges(false);
    alert(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved successfully!`);
  };

  const handleReset = (category) => {
    setTempSettings(prev => ({
      ...prev,
      [category]: settings[category]
    }));
    setHasChanges(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your system preferences and configurations</p>
              </div>
              <Link to="/" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <div className="p-4">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-md mb-2 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8">
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">General Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={tempSettings.general.companyName}
                        onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                      <select
                        value={tempSettings.general.timezone}
                        onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="UTC-8:00">Pacific Time (UTC-8:00)</option>
                        <option value="UTC-5:00">Eastern Time (UTC-5:00)</option>
                        <option value="UTC+0:00">GMT (UTC+0:00)</option>
                        <option value="UTC+5:30">India Standard Time (UTC+5:30)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                      <select
                        value={tempSettings.general.dateFormat}
                        onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <select
                        value={tempSettings.general.language}
                        onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select
                        value={tempSettings.general.currency}
                        onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="GBP">British Pound (GBP)</option>
                        <option value="INR">Indian Rupee (INR)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={() => handleReset('general')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => handleSave('general')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Profile Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={tempSettings.profile.name}
                        onChange={(e) => handleSettingChange('profile', 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={tempSettings.profile.email}
                        onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={tempSettings.profile.phone}
                        onChange={(e) => handleSettingChange('profile', 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <input
                        type="text"
                        value={tempSettings.profile.role}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={() => handleReset('profile')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => handleSave('profile')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Security Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                        <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('security', 'twoFactorAuth', !tempSettings.security.twoFactorAuth)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tempSettings.security.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tempSettings.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password Expiry (days)</label>
                      <input
                        type="number"
                        value={tempSettings.security.passwordExpiry}
                        onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={tempSettings.security.sessionTimeout}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                      <input
                        type="number"
                        value={tempSettings.security.loginAttempts}
                        onChange={(e) => handleSettingChange('security', 'loginAttempts', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={() => handleReset('security')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => handleSave('security')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Notification Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                        <p className="text-xs text-gray-500">Receive notifications via email</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('notifications', 'emailNotifications', !tempSettings.notifications.emailNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tempSettings.notifications.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tempSettings.notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                        <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('notifications', 'smsNotifications', !tempSettings.notifications.smsNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tempSettings.notifications.smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tempSettings.notifications.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                        <p className="text-xs text-gray-500">Receive push notifications</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('notifications', 'pushNotifications', !tempSettings.notifications.pushNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tempSettings.notifications.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tempSettings.notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Daily Reports</label>
                        <p className="text-xs text-gray-500">Receive daily summary reports</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('notifications', 'dailyReports', !tempSettings.notifications.dailyReports)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tempSettings.notifications.dailyReports ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tempSettings.notifications.dailyReports ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={() => handleReset('notifications')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => handleSave('notifications')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Privacy Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Data Sharing</label>
                        <p className="text-xs text-gray-500">Allow sharing data with third parties</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('privacy', 'dataSharing', !tempSettings.privacy.dataSharing)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tempSettings.privacy.dataSharing ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tempSettings.privacy.dataSharing ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Analytics Tracking</label>
                        <p className="text-xs text-gray-500">Allow analytics and usage tracking</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('privacy', 'analyticsTracking', !tempSettings.privacy.analyticsTracking)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tempSettings.privacy.analyticsTracking ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tempSettings.privacy.analyticsTracking ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Cookie Consent</label>
                        <p className="text-xs text-gray-500">Allow use of cookies for better experience</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('privacy', 'cookieConsent', !tempSettings.privacy.cookieConsent)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tempSettings.privacy.cookieConsent ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tempSettings.privacy.cookieConsent ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={() => handleReset('privacy')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => handleSave('privacy')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;