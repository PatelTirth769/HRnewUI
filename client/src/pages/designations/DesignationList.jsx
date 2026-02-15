import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DesignationList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const designations = [
    {
      id: 1,
      name: 'BOMBAIM',
      code: 'BOM-001',
      level: 'Senior',
      department: 'Management',
      description: 'Senior Management Position',
      employees: 5,
      status: 'Active'
    },
    {
      id: 2,
      name: 'SOFTWARE ENGINEER',
      code: 'SE-002',
      level: 'Mid',
      department: 'IT',
      description: 'Software Development Role',
      employees: 12,
      status: 'Active'
    },
    {
      id: 3,
      name: 'PROJECT MANAGER',
      code: 'PM-003',
      level: 'Senior',
      department: 'Management',
      description: 'Project Management Position',
      employees: 8,
      status: 'Active'
    },
    {
      id: 4,
      name: 'HR EXECUTIVE',
      code: 'HR-004',
      level: 'Junior',
      department: 'HR',
      description: 'Human Resources Role',
      employees: 3,
      status: 'Active'
    },
    {
      id: 5,
      name: 'ACCOUNTANT',
      code: 'ACC-005',
      level: 'Mid',
      department: 'Finance',
      description: 'Accounting and Finance Role',
      employees: 6,
      status: 'Active'
    },
    {
      id: 6,
      name: 'SALES EXECUTIVE',
      code: 'SAL-006',
      level: 'Junior',
      department: 'Sales',
      description: 'Sales and Marketing Role',
      employees: 15,
      status: 'Active'
    }
  ];

  const filteredDesignations = designations.filter(designation => {
    const matchesSearch = designation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designation.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         designation.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterLevel === 'all' || designation.level === filterLevel;
    
    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (designation) => {
    navigate(`/master/designations/${designation.id}`, { state: { designation } });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Designations</h1>
                <p className="text-gray-600 mt-1">Manage employee designations and roles</p>
              </div>
              <div className="flex space-x-3">
                <Link
                  to="/master/designations/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <span className="mr-2">+</span>
                  New Designation
                </Link>
                <Link
                  to="/"
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search designations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                Export
              </button>
            </div>
          </div>

          {/* Designation Cards Grid */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDesignations.map((designation) => (
                <div
                  key={designation.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(designation)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {designation.name}
                      </h3>
                      <p className="text-sm text-gray-600">{designation.code}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      designation.level === 'Senior' ? 'bg-purple-100 text-purple-800' :
                      designation.level === 'Mid' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {designation.level}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{designation.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Department:</span>
                      <span className="font-medium">{designation.department}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Employees:</span>
                      <span className="font-medium">{designation.employees}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium ${
                        designation.status === 'Active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {designation.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/master/designations/${designation.id}/edit`, { state: { designation } });
                      }}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(designation);
                      }}
                      className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredDesignations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No designations found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <Link
                  to="/master/designations/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create New Designation
                </Link>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{designations.length}</div>
                <div className="text-sm text-gray-600">Total Designations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {designations.filter(d => d.status === 'Active').length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {designations.filter(d => d.level === 'Senior').length}
                </div>
                <div className="text-sm text-gray-600">Senior Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {designations.reduce((sum, d) => sum + d.employees, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Employees</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignationList;