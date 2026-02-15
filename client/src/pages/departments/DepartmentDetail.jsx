import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const DepartmentDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Sample department data - in real app, this would come from API
  const [department] = useState({
    id: id,
    name: 'BOMBAIM',
    code: 'BOM',
    description: 'Bombay Regional Office',
    location: 'Mumbai, Maharashtra',
    address: '123, Nariman Point, Mumbai - 400021',
    employees: 45,
    status: 'Active',
    createdDate: '2023-01-15',
    head: 'Mr. Rajesh Kumar',
    contact: '022-23456789',
    email: 'bom@mumbai.company.com',
    budget: '₹2.5 Crores',
    revenue: '₹15.2 Crores'
  });

  const [employeeData] = useState([
    { id: 1, name: 'Rajesh Kumar', designation: 'Department Head', employeeId: 'EMP001', contact: '9876543210' },
    { id: 2, name: 'Priya Sharma', designation: 'Senior Manager', employeeId: 'EMP002', contact: '9876543211' },
    { id: 3, name: 'Amit Patel', designation: 'Manager', employeeId: 'EMP003', contact: '9876543212' },
    { id: 4, name: 'Sneha Desai', designation: 'Assistant Manager', employeeId: 'EMP004', contact: '9876543213' },
    { id: 5, name: 'Vikram Singh', designation: 'Supervisor', employeeId: 'EMP005', contact: '9876543214' }
  ]);

  const handleEdit = () => {
    navigate(`/master/departments/${id}/edit`, { state: { department } });
  };

  const handleBack = () => {
    navigate('/master/departments');
  };

  const handleEmployeeClick = (employee) => {
    // Navigate to employee detail page
    console.log('Employee clicked:', employee);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{department.name}</h1>
                <p className="text-gray-600">{department.description}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit Department
                </button>
                <button
                  onClick={handleBack}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  ← Back to List
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Department Information */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Department Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Department Code</label>
                      <p className="text-lg font-semibold text-gray-800">{department.code}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Status</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        department.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {department.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Location</label>
                      <p className="text-gray-800">{department.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-800">{department.address}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Department Head</label>
                      <p className="text-gray-800">{department.head}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Contact Number</label>
                      <p className="text-gray-800">{department.contact}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-800">{department.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Created Date</label>
                      <p className="text-gray-800">{department.createdDate}</p>
                    </div>
                  </div>
                </div>

                {/* Employee Table */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Employee List ({department.employees} employees)</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employeeData.map((employee) => (
                          <tr key={employee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {employee.employeeId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.designation}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.contact}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEmployeeClick(employee)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() => navigate(`/employees/${employee.id}/edit`)}
                                className="text-green-600 hover:text-green-900"
                              >
                                ✏️ Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Financial Information</h2>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-600">Annual Budget</label>
                      <p className="text-2xl font-bold text-green-600">{department.budget}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-600">Annual Revenue</label>
                      <p className="text-2xl font-bold text-blue-600">{department.revenue}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-600">Profit Margin</label>
                      <p className="text-2xl font-bold text-purple-600">83.3%</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/employees/new')}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    >
                      + Add Employee
                    </button>
                    <button
                      onClick={() => navigate('/reports/department')}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      📊 View Reports
                    </button>
                    <button
                      onClick={() => navigate('/master/departments')}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      📋 All Departments
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetail;
