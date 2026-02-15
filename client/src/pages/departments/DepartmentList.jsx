import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DepartmentList = () => {
  const navigate = useNavigate();
  
  const [departments] = useState([
    {
      id: 1,
      name: 'BOMBAIM',
      code: 'BOM',
      description: 'Bombay Regional Office',
      location: 'Mumbai',
      employees: 45,
      status: 'Active',
      createdDate: '2023-01-15'
    },
    {
      id: 2,
      name: 'DELHI',
      code: 'DEL',
      description: 'Delhi Regional Office',
      location: 'New Delhi',
      employees: 38,
      status: 'Active',
      createdDate: '2023-02-20'
    },
    {
      id: 3,
      name: 'CHENNAI',
      code: 'CHE',
      description: 'Chennai Regional Office',
      location: 'Chennai',
      employees: 32,
      status: 'Active',
      createdDate: '2023-03-10'
    },
    {
      id: 4,
      name: 'KOLKATA',
      code: 'KOL',
      description: 'Kolkata Regional Office',
      location: 'Kolkata',
      employees: 28,
      status: 'Inactive',
      createdDate: '2023-04-05'
    },
    {
      id: 5,
      name: 'PUNE',
      code: 'PUN',
      description: 'Pune Branch Office',
      location: 'Pune',
      employees: 22,
      status: 'Active',
      createdDate: '2023-05-12'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || dept.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDepartmentClick = (department) => {
    navigate(`/master/departments/${department.id}`, { state: { department } });
  };

  const handleAddNew = () => {
    navigate('/master/departments/new');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Department Management</h1>
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add New Department
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, code, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Department Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDepartments.map((department) => (
                <div
                  key={department.id}
                  onClick={() => handleDepartmentClick(department)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{department.name}</h3>
                      <p className="text-sm text-gray-500">{department.code}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      department.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {department.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{department.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{department.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Employees:</span>
                      <span className="font-medium">{department.employees}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium">{department.createdDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredDepartments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No departments found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentList;
