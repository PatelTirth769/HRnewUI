import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import './EmployeeMaster.css';
import { Select, Input, Row, Col, Space, Button } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const EmployeeMaster = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('empCode');

  const [companies, setCompanies] = useState([]);

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

  const fetchCompanies = async () => {
    try {
      const response = await API.get('/api/resource/Company?fields=["name"]&limit_page_length=None');
      const companyList = response.data.data.map(c => c.name);
      setCompanies(companyList);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchCompanies();
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
    const getValue = (val) => val ? val.toString().toLowerCase() : '';

    switch (searchType) {
      case 'empCode':
        return getValue(employee.empCode).includes(term);
      case 'empName':
        return getValue(employee.empName).includes(term);
      case 'department':
        return getValue(employee.department).includes(term);
      case 'designation':
        return getValue(employee.designation).includes(term);
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
          <Row gutter={16} align="bottom">
            <Col span={8}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Company:</label>
              <Select
                value={selectedCompany}
                onChange={(value) => setSelectedCompany(value)}
                style={{ width: '100%' }}
                options={[
                  { value: 'All', label: 'All Companies' },
                  ...companies.map(c => ({ value: c, label: c }))
                ]}
              />
            </Col>

            <Col span={8}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Search On:</label>
              <Select
                value={searchType}
                onChange={(value) => setSearchType(value)}
                style={{ width: '100%' }}
                options={searchOptions}
              />
            </Col>

            <Col span={8}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>&nbsp;</label>
              <Input
                placeholder="Enter search term..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
            </Col>
          </Row>
        </div>

        <div className="action-section">
          <Space>
            <button className="btn btn-primary" onClick={handleAddNew}>
              New
            </button>
            <button className="btn btn-secondary" onClick={handleViewReport}>
              View Report
            </button>
            <button className="btn btn-info" onClick={fetchEmployees} title="Refresh List">
              Refresh
            </button>
          </Space>
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
                          <Space size="middle">
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(employee.id)}
                            />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDelete(employee.id)}
                            />
                          </Space>
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
