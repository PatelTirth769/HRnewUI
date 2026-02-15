import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EmployeeMaster.css';

const EmployeeMaster = () => {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState('BOMBAIM');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('empCode');

  // Mock employee data
  const employees = [
    {
      id: 1,
      empCode: 'EMP001',
      empName: 'John Doe',
      department: 'IT',
      designation: 'Software Engineer',
      company: 'BOMBAIM',
      email: 'john.doe@bombaim.com',
      mobile: '9876543210',
      status: 'Active'
    },
    {
      id: 2,
      empCode: 'EMP002',
      empName: 'Jane Smith',
      department: 'HR',
      designation: 'HR Manager',
      company: 'BOMBAIM',
      email: 'jane.smith@bombaim.com',
      mobile: '9876543211',
      status: 'Active'
    },
    {
      id: 3,
      empCode: 'EMP003',
      empName: 'Robert Johnson',
      department: 'Finance',
      designation: 'Accountant',
      company: 'BOMBAIM',
      email: 'robert.johnson@bombaim.com',
      mobile: '9876543212',
      status: 'Inactive'
    },
    {
      id: 4,
      empCode: 'EMP004',
      empName: 'Maria Garcia',
      department: 'Marketing',
      designation: 'Marketing Executive',
      company: 'BOMBAIM',
      email: 'maria.garcia@bombaim.com',
      mobile: '9876543213',
      status: 'Active'
    },
    {
      id: 5,
      empCode: 'EMP005',
      empName: 'David Wilson',
      department: 'Operations',
      designation: 'Operations Manager',
      company: 'BOMBAIM',
      email: 'david.wilson@bombaim.com',
      mobile: '9876543214',
      status: 'Active'
    }
  ];

  const companies = ['BOMBAIM', 'Company A', 'Company B', 'Company C'];
  const searchOptions = [
    { value: 'empCode', label: 'Emp Code' },
    { value: 'empName', label: 'Emp Name' },
    { value: 'department', label: 'Department' },
    { value: 'designation', label: 'Designation' }
  ];

  const itemsPerPage = 10;
  const totalPages = Math.ceil(employees.length / itemsPerPage);

  const handleEdit = (id) => {
    navigate(`/edit-employee/${id}`);
  };

  const handleAddNew = () => {
    navigate('/add-employee');
  };

  const handleViewReport = () => {
    navigate('/employee-master/report-view');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const filteredEmployees = employees.filter(employee => {
    if (!searchTerm) return true;
    
    switch (searchType) {
      case 'empCode':
        return employee.empCode.toLowerCase().includes(searchTerm.toLowerCase());
      case 'empName':
        return employee.empName.toLowerCase().includes(searchTerm.toLowerCase());
      case 'department':
        return employee.department.toLowerCase().includes(searchTerm.toLowerCase());
      case 'designation':
        return employee.designation.toLowerCase().includes(searchTerm.toLowerCase());
      default:
        return true;
    }
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="employee-master-container">
      <div className="employee-master-header">
        <h2>Employee Master</h2>
        <nav className="breadcrumb">
          <span>Master</span> &gt; <span className="active">Employee Master</span>
        </nav>
      </div>

      <div className="employee-master-content">
        <div className="search-section">
          <div className="form-row">
            <div className="form-group">
              <label>Company:</label>
              <select 
                value={selectedCompany} 
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="form-control"
              >
                {companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Search On:</label>
              <select 
                value={searchType} 
                onChange={(e) => setSearchType(e.target.value)}
                className="form-control"
              >
                {searchOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>&nbsp;</label>
              <input
                type="text"
                placeholder="Enter search term..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
          </div>
        </div>

        <div className="action-section">
          <button className="btn btn-primary" onClick={handleAddNew}>
            New
          </button>
          <button className="btn btn-secondary ml-2" onClick={handleViewReport}>
            View Report
          </button>
        </div>

        <div className="table-section">
          <div className="table-responsive">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Emp Code</th>
                  <th>Emp Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.map(employee => (
                  <tr key={employee.id}>
                    <td>{employee.empCode}</td>
                    <td>{employee.empName}</td>
                    <td>{employee.department}</td>
                    <td>{employee.designation}</td>
                    <td>{employee.company}</td>
                    <td>{employee.email}</td>
                    <td>{employee.mobile}</td>
                    <td>
                      <span className={`status ${employee.status.toLowerCase()}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(employee.id)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pagination-section">
          <div className="pagination-info">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeMaster;
