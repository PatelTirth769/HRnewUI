import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Welcome to HR Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your HR processes with our comprehensive solution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-blue-600 text-4xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Company Management</h3>
            <p className="text-gray-600 mb-4">Manage company details and organizational structure</p>
            <Link to="/companies" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Go to Companies
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-green-600 text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2 no-underline">Dashboard</h3>
            <p className="text-gray-600 mb-4">View analytics and key metrics at a glance</p>
            <Link to="/dashboard" className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Go to Dashboard
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-purple-600 text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Settings</h3>
            <p className="text-gray-600 mb-4">Configure system settings and preferences</p>
            <Link to="/settings" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Go to Settings
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-orange-600 text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Reports</h3>
            <p className="text-gray-600 mb-4">Generate detailed reports and analytics</p>
            <Link to="/reports" className="inline-block bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors">
              Go to Reports
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-red-600 text-4xl mb-4">🏛️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Departments</h3>
            <p className="text-gray-600 mb-4">Manage departments and organizational units</p>
            <Link to="/master/departments" className="inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
              Go to Departments
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-indigo-600 text-4xl mb-4">📞</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Contact</h3>
            <p className="text-gray-600 mb-4">Get in touch with our support team</p>
            <Link to="/contact" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
              Go to Contact
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/about" className="inline-block bg-gray-800 text-white px-6 py-3 rounded-md hover:bg-gray-900 transition-colors">
            Learn More About Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;