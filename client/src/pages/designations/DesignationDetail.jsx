import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const DesignationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  // Mock data for BOMBAIM designation
  const designationData = {
    id: 1,
    name: 'BOMBAIM',
    code: 'BOM-001',
    department: 'Operations',
    level: 'Senior',
    status: 'Active',
    description: 'Bombay Operations Manager - Senior level position responsible for managing operations in the Bombay region',
    responsibilities: [
      'Oversee daily operations in Bombay region',
      'Coordinate with regional teams',
      'Manage operational budgets',
      'Ensure compliance with company policies',
      'Report to senior management'
    ],
    requirements: [
      'Bachelor\'s degree in Business Administration',
      '5+ years of operational management experience',
      'Strong leadership and communication skills',
      'Knowledge of regional market dynamics',
      'Proficiency in MS Office and operational software'
    ],
    createdDate: '2024-01-15',
    lastUpdated: '2024-02-20',
    createdBy: 'System Administrator',
    approvedBy: 'Regional Director'
  };

  // Mock employee data
  const employees = [
    {
      id: 101,
      name: 'Rajesh Kumar',
      employeeId: 'EMP-001',
      email: 'rajesh.kumar@company.com',
      phone: '+91-9876543210',
      joinDate: '2023-03-15',
      experience: '8 years',
      salary: '₹12,00,000',
      location: 'Mumbai',
      status: 'Active',
      performance: 'Excellent'
    },
    {
      id: 102,
      name: 'Priya Sharma',
      employeeId: 'EMP-002',
      email: 'priya.sharma@company.com',
      phone: '+91-9876543211',
      joinDate: '2023-06-20',
      experience: '6 years',
      salary: '₹10,50,000',
      location: 'Mumbai',
      status: 'Active',
      performance: 'Good'
    },
    {
      id: 103,
      name: 'Amit Patel',
      employeeId: 'EMP-003',
      email: 'amit.patel@company.com',
      phone: '+91-9876543212',
      joinDate: '2023-09-10',
      experience: '5 years',
      salary: '₹9,50,000',
      location: 'Pune',
      status: 'Active',
      performance: 'Very Good'
    },
    {
      id: 104,
      name: 'Sneha Desai',
      employeeId: 'EMP-004',
      email: 'sneha.desai@company.com',
      phone: '+91-9876543213',
      joinDate: '2024-01-05',
      experience: '4 years',
      salary: '₹8,50,000',
      location: 'Mumbai',
      status: 'Active',
      performance: 'Good'
    }
  ];

  // Mock financial data
  const financialData = {
    totalBudget: '₹50,00,000',
    utilizedBudget: '₹32,50,000',
    remainingBudget: '₹17,50,000',
    averageSalary: '₹10,12,500',
    totalEmployees: 4,
    budgetUtilization: '65%'
  };

  const handleEmployeeClick = (employee) => {
    navigate(`/employees/${employee.id}`);
  };

  const handleEditEmployee = (e, employee) => {
    e.stopPropagation();
    navigate(`/employees/edit/${employee.id}`);
  };

  const handleBackToList = () => {
    navigate('/master/designations');
  };

  const handleEditDesignation = () => {
    navigate(`/master/designations/edit/${designationData.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <button
                    onClick={handleBackToList}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Back to Designations
                  </button>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">Designation Details</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{designationData.name}</h1>
                <p className="text-gray-600">{designationData.description}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleEditDesignation}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit Designation
                </button>
                <Link to="/" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  ← Home
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 py-4 border-b border-gray-200">
            <div className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📋' },
                { id: 'employees', label: 'Employees', icon: '👥' },
                { id: 'financial', label: 'Financial', icon: '💰' },
                { id: 'history', label: 'History', icon: '📚' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-8 py-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-600 mb-2">Designation Code</h3>
                    <p className="text-2xl font-bold text-blue-800">{designationData.code}</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-green-600 mb-2">Department</h3>
                    <p className="text-2xl font-bold text-green-800">{designationData.department}</p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600 mb-2">Level</h3>
                    <p className="text-2xl font-bold text-purple-800">{designationData.level}</p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-orange-600 mb-2">Status</h3>
                    <p className="text-2xl font-bold text-orange-800">{designationData.status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Responsibilities</h3>
                    <ul className="space-y-2">
                      {designationData.responsibilities.map((responsibility, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-gray-700">{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Requirements</h3>
                    <ul className="space-y-2">
                      {designationData.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span className="text-gray-700">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Designation Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Created Date</p>
                      <p className="font-medium text-gray-800">{designationData.createdDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                      <p className="font-medium text-gray-800">{designationData.lastUpdated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Created By</p>
                      <p className="font-medium text-gray-800">{designationData.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Approved By</p>
                      <p className="font-medium text-gray-800">{designationData.approvedBy}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800">Employees in {designationData.name}</h3>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Total: {employees.length} employees
                  </span>
                </div>

                <div className="grid gap-4">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => handleEmployeeClick(employee)}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{employee.name}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              employee.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {employee.status}
                            </span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              employee.performance === 'Excellent'
                                ? 'bg-yellow-100 text-yellow-800'
                                : employee.performance === 'Very Good'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {employee.performance}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Employee ID</p>
                              <p className="font-medium text-gray-800">{employee.employeeId}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Email</p>
                              <p className="font-medium text-gray-800">{employee.email}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Join Date</p>
                              <p className="font-medium text-gray-800">{employee.joinDate}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Experience</p>
                              <p className="font-medium text-gray-800">{employee.experience}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={(e) => handleEditEmployee(e, employee)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employees/${employee.id}`);
                            }}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                          >
                            👁️ View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-600 mb-2">Total Budget</h3>
                    <p className="text-2xl font-bold text-blue-800">{financialData.totalBudget}</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-green-600 mb-2">Utilized Budget</h3>
                    <p className="text-2xl font-bold text-green-800">{financialData.utilizedBudget}</p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-orange-600 mb-2">Remaining Budget</h3>
                    <p className="text-2xl font-bold text-orange-800">{financialData.remainingBudget}</p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600 mb-2">Average Salary</h3>
                    <p className="text-2xl font-bold text-purple-800">{financialData.averageSalary}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Utilization</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-600 h-4 rounded-full" 
                        style={{ width: financialData.budgetUtilization }}
                      ></div>
                    </div>
                    <span className="text-lg font-semibold text-gray-800">{financialData.budgetUtilization}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Budget utilization for {designationData.name} designation
                  </p>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Designation History</h3>
                <div className="space-y-4">
                  {[
                    { date: '2024-02-20', action: 'Updated', description: 'Salary range updated', by: 'HR Manager' },
                    { date: '2024-01-25', action: 'Created', description: 'Designation created', by: 'System Administrator' }
                  ].map((history, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{history.action} - {history.description}</p>
                        <p className="text-sm text-gray-600">By {history.by}</p>
                      </div>
                      <span className="text-sm text-gray-500">{history.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignationDetail;