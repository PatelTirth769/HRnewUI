import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const { isDarkMode, themeColor } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`max-w-md w-full p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isDarkMode ? `bg-${themeColor}-600` : `bg-${themeColor}-500`} mb-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Login to Logixica</h2>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <Link to="/forgot-password" className={`text-sm ${isDarkMode ? `text-${themeColor}-400 hover:text-${themeColor}-300` : `text-${themeColor}-600 hover:text-${themeColor}-500`}`}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
              placeholder="••••••••"
              required
            />
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
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>

          <div className="mt-6 text-center">
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              Don't have an account?{' '}
              <Link to="/register" className={`font-medium ${isDarkMode ? `text-${themeColor}-400 hover:text-${themeColor}-300` : `text-${themeColor}-600 hover:text-${themeColor}-500`}`}>
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;