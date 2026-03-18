import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student', // Default role
    department: '',
    securityPin: '',
  });

  const [errors, setErrors] = useState({});
  const { register, loading } = useAuth();
  const { isDarkMode, themeColor } = useTheme();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Validate department for teacher, faculty, and hod roles
    if (['teacher', 'faculty', 'hod'].includes(formData.role) && !formData.department.trim()) {
      newErrors.department = 'Department is required for this role';
    }
    
    // Validate security pin for admin and hod roles
    if (['admin', 'hod'].includes(formData.role) && !formData.securityPin.trim()) {
      newErrors.securityPin = 'Security PIN is required for this role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = formData;
      await register(userData);
    }
  };

  // Determine if security pin field should be shown
  const showSecurityPin = ['admin', 'hod'].includes(formData.role);
  
  // Determine if department field should be shown
  const showDepartment = ['teacher', 'faculty', 'hod'].includes(formData.role);

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`max-w-md w-full p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isDarkMode ? `bg-${themeColor}-600` : `bg-${themeColor}-500`} mb-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Create an Account</h2>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Join Logixica ERP System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
              placeholder="John Doe"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
              placeholder="your.email@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`mt-1 w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="faculty">Faculty</option>
              <option value="hod">Head of Department (HOD)</option>
              <option value="admin">Administrator</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
          </div>

          {/* Department Field (conditional) */}
          {showDepartment && (
            <div>
              <label htmlFor="department" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
                placeholder="e.g., Computer Science"
              />
              {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department}</p>}
            </div>
          )}

          {/* Security PIN Field (conditional) */}
          {showSecurityPin && (
            <div>
              <label htmlFor="securityPin" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Security PIN
              </label>
              <input
                id="securityPin"
                name="securityPin"
                type="password"
                value={formData.securityPin}
                onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
                placeholder="Enter security PIN"
              />
              {errors.securityPin && <p className="mt-1 text-sm text-red-500">{errors.securityPin}</p>}
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formData.role === 'admin' ? 'Admin' : 'HOD'} security PIN is required for this role.
              </p>
            </div>
          )}

          {/* Password Field */}
          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`mt-1 w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`mt-1 w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>

          {/* Role-specific information */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Registration Information:</h3>
            <ul className={`text-xs list-disc pl-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {formData.role === 'admin' && (
                <li>Admin accounts require a security PIN and are automatically approved.</li>
              )}
              {formData.role === 'hod' && (
                <li>HOD accounts require a security PIN and department information.</li>
              )}
              {['teacher', 'faculty'].includes(formData.role) && (
                <li>Your account will require approval from an Admin or HOD before you can log in.</li>
              )}
              {formData.role === 'student' && (
                <li>Student accounts are automatically approved upon registration.</li>
              )}
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white bg-${themeColor}-600 hover:bg-${themeColor}-700 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 focus:ring-offset-2 transition duration-150 ease-in-out ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>

          <div className="text-center">
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              Already have an account?{' '}
              <Link to="/login" className={`font-medium ${isDarkMode ? `text-${themeColor}-400 hover:text-${themeColor}-300` : `text-${themeColor}-600 hover:text-${themeColor}-500`}`}>
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;