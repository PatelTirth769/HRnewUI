import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import './EmployeeMaster.css';

const EmployeeMaster = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('empCode');

  // Fetch employees from ERPNext
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/resource/Employee?fields=["*"]&limit_page_length=None');
      // ERPNext returns data in response.data.data
      const data = response.data.data;

      // Map ERPNext fields to our UI structure
      const mappedEmployees = data.map(emp => ({
        id: emp.name, // ERPNext ID
        empCode: emp.name,
        empName: emp.employee_name || `${emp.first_name} ${emp.last_name || ''}`,
        department: emp.department || '-',
        designation: emp.designation || '-',
        company: emp.company || '-',
        email: emp.company_email || emp.personal_email || '-',
        mobile: emp.cell_number || '-',
        status: emp.status || 'Active'
      }));

      setEmployees(mappedEmployees);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees. Please check your connection.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete employee ${id}?`)) {
      try {
        await API.delete(`/api/resource/Employee/${id}`);
        // Refresh list
        fetchEmployees();
      } catch (err) {
        console.error("Error deleting employee:", err);
        alert("Failed to delete employee. It might be linked to other documents.");
      }
    }
  };

  const companies = ['BOMBAIM', 'Preeshe Consultancy Services', 'DCSAMAI', 'Kolkata_Frontend'];
  const searchOptions = [
    { value: 'empCode', label: 'Emp Code' },
    { value: 'empName', label: 'Emp Name' },
    { value: 'department', label: 'Department' },
    { value: 'designation', label: 'Designation' }
  ];

  const itemsPerPage = 10;

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
    // Company Filter
    if (selectedCompany !== 'All' && employee.company !== selectedCompany) {
      return false;
    }

    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    switch (searchType) {
      case 'empCode':
        return employee.empCode.toLowerCase().includes(term);
      case 'empName':
        return employee.empName.toLowerCase().includes(term);
      case 'department':
        return employee.department.toLowerCase().includes(term);
      case 'designation':
        return employee.designation.toLowerCase().includes(term);
      default:
        return true;
    }
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
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
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="search-section">
          <div className="form-row">
            <div className="form-group">
              <label>Company:</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="form-control"
              >
                <option value="All">All Companies</option>
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
          <button className="btn btn-info ml-2" onClick={fetchEmployees} title="Refresh List">
            Refresh
          </button>
        </div>

        <div className="table-section">
          <div className="table-responsive">
            {loading ? (
              <div className="text-center p-4">Loading employees...</div>
            ) : (
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
                  {currentEmployees.length > 0 ? (
                    currentEmployees.map(employee => (
                      <tr key={employee.id}>
                        <td>{employee.empCode}</td>
                        <td>{employee.empName}</td>
                        <td>{employee.department}</td>
                        <td>{employee.designation}</td>
                        <td>{employee.company}</td>
                        <td>{employee.email}</td>
                        <td>{employee.mobile}</td>
                        <td>
                          <span className={`status ${employee.status ? employee.status.toLowerCase() : ''}`}>
                            {employee.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(employee.id)}
                            style={{ marginRight: '5px' }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(employee.id)}
                            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center">No employees found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="pagination-section">
          <div className="pagination-info">
            Showing {filteredEmployees.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
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
              disabled={currentPage === totalPages || totalPages === 0}
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
