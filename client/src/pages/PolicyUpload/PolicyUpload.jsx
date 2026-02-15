import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './PolicyUpload.css';

const PolicyUpload = () => {
  const [selectedCompany, setSelectedCompany] = useState('BOMBAIM');
  const [searchBy, setSearchBy] = useState('Doc Name');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Mock data for policies
  const [policies] = useState([
    {
      id: 1,
      docName: 'Employee Handbook 2024',
      role: 'HR Manager',
      uploadDate: '2024-01-15',
      fileSize: '2.5 MB',
      status: 'Active'
    },
    {
      id: 2,
      docName: 'Leave Policy',
      role: 'All Employees',
      uploadDate: '2024-01-10',
      fileSize: '1.2 MB',
      status: 'Active'
    },
    {
      id: 3,
      docName: 'Code of Conduct',
      role: 'All Staff',
      uploadDate: '2024-01-08',
      fileSize: '800 KB',
      status: 'Active'
    },
    {
      id: 4,
      docName: 'Remote Work Policy',
      role: 'IT Department',
      uploadDate: '2024-01-05',
      fileSize: '950 KB',
      status: 'Active'
    },
    {
      id: 5,
      docName: 'Performance Review Policy',
      role: 'Managers',
      uploadDate: '2024-01-03',
      fileSize: '1.5 MB',
      status: 'Active'
    }
  ]);

  // Filter policies based on search
  const filteredPolicies = policies.filter(policy => {
    if (searchBy === 'Doc Name') {
      return policy.docName.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (searchBy === 'Role') {
      return policy.role.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPolicies = filteredPolicies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleEdit = (id) => {
    // Navigate to edit page
    window.location.href = `/edit-policy/${id}`;
  };

  return (
    <div className="policy-upload-container">
      <div className="header-container">
        <h1 className="page-title">Policy Upload</h1>
        <nav className="breadcrumb">
          <Link to="/home" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator"> &gt; </span>
          <span className="breadcrumb-current">Policy Upload</span>
        </nav>
      </div>

      <div className="search-section">
        <div className="search-row">
          <div className="form-group">
            <label htmlFor="company">Company:</label>
            <select
              id="company"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="company-select"
            >
              <option value="BOMBAIM">BOMBAIM</option>
              <option value="Other Company">Other Company</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="searchBy">Search on:</label>
            <select
              id="searchBy"
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="search-select"
            >
              <option value="Doc Name">Doc Name</option>
              <option value="Role">Role</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="searchTerm">Search:</label>
            <input
              type="text"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Enter ${searchBy}...`}
              className="search-input"
            />
          </div>

          <Link to="/add-policy" className="new-button">
            New
          </Link>
        </div>
      </div>

      <div className="policy-table-container">
        <table className="policy-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Doc Name</th>
              <th>Role</th>
              <th>Upload Date</th>
              <th>File Size</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentPolicies.map((policy, index) => (
              <tr key={policy.id}>
                <td>{indexOfFirstItem + index + 1}</td>
                <td>{policy.docName}</td>
                <td>{policy.role}</td>
                <td>{policy.uploadDate}</td>
                <td>{policy.fileSize}</td>
                <td>
                  <span className={`status-badge ${policy.status.toLowerCase()}`}>
                    {policy.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleEdit(policy.id)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`pagination-button ${currentPage === number ? 'active' : ''}`}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PolicyUpload;