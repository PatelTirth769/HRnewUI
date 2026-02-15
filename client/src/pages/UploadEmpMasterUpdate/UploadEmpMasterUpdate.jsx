import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UploadEmpMasterUpdate.css';

const UploadEmpMasterUpdate = () => {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState('BOMBAIM');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadHistory, setUploadHistory] = useState([
    {
      id: 1,
      fileName: 'Employee_Master_Update_2024_01.xlsx',
      company: 'BOMBAIM',
      uploadedBy: 'Admin User',
      uploadDate: '2024-01-15',
      status: 'Completed',
      recordsProcessed: 150,
      recordsSuccess: 145,
      recordsFailed: 5
    },
    {
      id: 2,
      fileName: 'Employee_Bulk_Update_Dec.xlsx',
      company: 'BOMBAIM',
      uploadedBy: 'HR Manager',
      uploadDate: '2024-01-10',
      status: 'Completed',
      recordsProcessed: 89,
      recordsSuccess: 89,
      recordsFailed: 0
    },
    {
      id: 3,
      fileName: 'New_Joiners_Update.xlsx',
      company: 'BOMBAIM',
      uploadedBy: 'System Admin',
      uploadDate: '2024-01-05',
      status: 'Failed',
      recordsProcessed: 25,
      recordsSuccess: 0,
      recordsFailed: 25
    }
  ]);

  const companies = ['BOMBAIM', 'DELHI', 'KOLKATA', 'CHENNAI', 'PUNE'];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Please select a valid Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate upload completion
    setTimeout(() => {
      setIsUploading(false);
      const newUpload = {
        id: uploadHistory.length + 1,
        fileName: selectedFile.name,
        company: selectedCompany,
        uploadedBy: 'Current User',
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'Completed',
        recordsProcessed: Math.floor(Math.random() * 200) + 50,
        recordsSuccess: Math.floor(Math.random() * 180) + 40,
        recordsFailed: Math.floor(Math.random() * 20)
      };
      setUploadHistory([newUpload, ...uploadHistory]);
      setSelectedFile(null);
      alert('File uploaded successfully!');
    }, 3000);
  };

  const handleDownloadTemplate = () => {
    // Simulate template download
    const templateData = [
      ['Employee Code', 'Employee Name', 'Department', 'Designation', 'Email', 'Phone', 'Date of Joining', 'Salary', 'Status'],
      ['EMP001', 'John Doe', 'IT', 'Software Engineer', 'john@company.com', '9876543210', '2024-01-01', '50000', 'Active'],
      ['EMP002', 'Jane Smith', 'HR', 'HR Manager', 'jane@company.com', '9876543211', '2024-01-15', '60000', 'Active']
    ];
    
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Employee_Master_Update_Template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'status-completed';
      case 'Failed':
        return 'status-failed';
      case 'In Progress':
        return 'status-progress';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="upload-emp-master-update-container">
      <div className="page-header">
        <h1>Upload Employee Master Update</h1>
        <nav className="breadcrumb">
          <span>Master</span> &gt; <span>Upload Emp Master Update</span>
        </nav>
      </div>

      <div className="upload-section">
        <div className="upload-card">
          <div className="upload-header">
            <h2>Upload Employee Master Data</h2>
            <p>Select company and upload Excel file with employee updates</p>
          </div>

          <div className="upload-form">
            <div className="form-group">
              <label htmlFor="company">Company *</label>
              <select
                id="company"
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
              <label htmlFor="file">Select Excel File *</label>
              <div className="file-input-container">
                <input
                  type="file"
                  id="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="file-input"
                  disabled={isUploading}
                />
                <div className="file-input-display">
                  {selectedFile ? selectedFile.name : 'No file selected'}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => document.getElementById('file').click()}
                  disabled={isUploading}
                >
                  Browse
                </button>
              </div>
            </div>

            <div className="form-group">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload File'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDownloadTemplate}
                style={{ marginLeft: '10px' }}
              >
                Download Template
              </button>
            </div>

            {isUploading && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="upload-instructions">
          <h3>Upload Instructions:</h3>
          <ul>
            <li>File must be in Excel format (.xlsx or .xls)</li>
            <li>First row should contain column headers</li>
            <li>Required columns: Employee Code, Employee Name, Department, Designation</li>
            <li>Maximum file size: 10MB</li>
            <li>Maximum 1000 records per file</li>
          </ul>
        </div>
      </div>

      <div className="upload-history-section">
        <div className="section-header">
          <h2>Upload History</h2>
          <span className="record-count">{uploadHistory.length} uploads</span>
        </div>

        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Company</th>
                <th>Uploaded By</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Total Records</th>
                <th>Success</th>
                <th>Failed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploadHistory.map((upload) => (
                <tr key={upload.id}>
                  <td className="file-name">{upload.fileName}</td>
                  <td>{upload.company}</td>
                  <td>{upload.uploadedBy}</td>
                  <td>{upload.uploadDate}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(upload.status)}`}>
                      {upload.status}
                    </span>
                  </td>
                  <td className="text-center">{upload.recordsProcessed}</td>
                  <td className="text-center success-count">{upload.recordsSuccess}</td>
                  <td className="text-center error-count">{upload.recordsFailed}</td>
                  <td>
                    <button className="btn btn-sm btn-info">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UploadEmpMasterUpdate;