import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ReportingFinanceManagerMapping.css';

const AddReportingFinanceMapping = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    company: 'BOMBAIM',
    employeeCode: '',
    employeeName: '',
    department: '',
    designation: '',
    reportingManager: '',
    financeManager: '',
    mappingType: 'Both',
    effectiveDate: '',
    endDate: '',
    status: 'Active',
    remarks: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for dropdowns
  const companies = ['BOMBAIM', 'DELHI', 'KOLKATA', 'CHENNAI', 'PUNE'];
  const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales'];
  const designations = ['Software Engineer', 'Senior Software Engineer', 'Team Lead', 'Manager', 'Senior Manager', 'Executive', 'Senior Executive'];
  const managers = ['Suresh Sharma', 'Anita Desai', 'Vikas Agarwal', 'Priya Patel', 'Rahul Mehta', 'Ravi Kant'];
  const mappingTypes = ['Reporting', 'Finance', 'Both'];
  const statuses = ['Active', 'Inactive'];

  useEffect(() => {
    if (isEdit) {
      // Mock data for editing
      const mockEditData = {
        company: 'BOMBAIM',
        employeeCode: 'EMP001',
        employeeName: 'Rajesh Kumar',
        department: 'IT',
        designation: 'Senior Software Engineer',
        reportingManager: 'Suresh Sharma',
        financeManager: 'Priya Patel',
        mappingType: 'Both',
        effectiveDate: '2024-01-01',
        endDate: '',
        status: 'Active',
        remarks: 'Regular mapping update'
      };
      setFormData(mockEditData);
    }
  }, [isEdit, id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.employeeCode) {
      newErrors.employeeCode = 'Employee Code is required';
    }
    
    if (!formData.employeeName) {
      newErrors.employeeName = 'Employee Name is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.designation) {
      newErrors.designation = 'Designation is required';
    }
    
    if (!formData.reportingManager) {
      newErrors.reportingManager = 'Reporting Manager is required';
    }
    
    if (!formData.financeManager) {
      newErrors.financeManager = 'Finance Manager is required';
    }
    
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Effective Date is required';
    }
    
    if (formData.endDate && formData.effectiveDate > formData.endDate) {
      newErrors.endDate = 'End Date must be after Effective Date';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert(isEdit ? 'Mapping updated successfully!' : 'Mapping created successfully!');
      navigate('/reporting-finance-manager-mapping');
    }, 2000);
  };

  const handleCancel = () => {
    navigate('/reporting-finance-manager-mapping');
  };

  const handleReset = () => {
    setFormData({
      company: 'BOMBAIM',
      employeeCode: '',
      employeeName: '',
      department: '',
      designation: '',
      reportingManager: '',
      financeManager: '',
      mappingType: 'Both',
      effectiveDate: '',
      endDate: '',
      status: 'Active',
      remarks: ''
    });
    setErrors({});
  };

  return (
    <div className="add-reporting-finance-mapping-container">
      <div className="page-header">
        <h1>{isEdit ? 'Edit Reporting/Finance Manager Mapping' : 'Add Reporting/Finance Manager Mapping'}</h1>
        <nav className="breadcrumb">
          <span>Master</span> &gt; 
          <span onClick={() => navigate('/reporting-finance-manager-mapping')} className="breadcrumb-link">
            Reporting/Finance Manager Mapping
          </span> &gt; 
          <span>{isEdit ? 'Edit' : 'Add New'}</span>
        </nav>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="mapping-form">
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="company">Company *</label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className={`form-control ${errors.company ? 'error' : ''}`}
                  disabled={isEdit}
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
                {errors.company && <span className="error-message">{errors.company}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="employeeCode">Employee Code *</label>
                <input
                  type="text"
                  id="employeeCode"
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={handleInputChange}
                  placeholder="Enter Employee Code"
                  className={`form-control ${errors.employeeCode ? 'error' : ''}`}
                  disabled={isEdit}
                />
                {errors.employeeCode && <span className="error-message">{errors.employeeCode}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="employeeName">Employee Name *</label>
                <input
                  type="text"
                  id="employeeName"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  placeholder="Enter Employee Name"
                  className={`form-control ${errors.employeeName ? 'error' : ''}`}
                />
                {errors.employeeName && <span className="error-message">{errors.employeeName}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">Department *</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`form-control ${errors.department ? 'error' : ''}`}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && <span className="error-message">{errors.department}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="designation">Designation *</label>
                <select
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className={`form-control ${errors.designation ? 'error' : ''}`}
                >
                  <option value="">Select Designation</option>
                  {designations.map(desg => (
                    <option key={desg} value={desg}>{desg}</option>
                  ))}
                </select>
                {errors.designation && <span className="error-message">{errors.designation}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="mappingType">Mapping Type *</label>
                <select
                  id="mappingType"
                  name="mappingType"
                  value={formData.mappingType}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  {mappingTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Manager Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reportingManager">Reporting Manager *</label>
                <select
                  id="reportingManager"
                  name="reportingManager"
                  value={formData.reportingManager}
                  onChange={handleInputChange}
                  className={`form-control ${errors.reportingManager ? 'error' : ''}`}
                >
                  <option value="">Select Reporting Manager</option>
                  {managers.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
                {errors.reportingManager && <span className="error-message">{errors.reportingManager}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="financeManager">Finance Manager *</label>
                <select
                  id="financeManager"
                  name="financeManager"
                  value={formData.financeManager}
                  onChange={handleInputChange}
                  className={`form-control ${errors.financeManager ? 'error' : ''}`}
                >
                  <option value="">Select Finance Manager</option>
                  {managers.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
                {errors.financeManager && <span className="error-message">{errors.financeManager}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Duration & Status</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="effectiveDate">Effective Date *</label>
                <input
                  type="date"
                  id="effectiveDate"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleInputChange}
                  className={`form-control ${errors.effectiveDate ? 'error' : ''}`}
                />
                {errors.effectiveDate && <span className="error-message">{errors.effectiveDate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`form-control ${errors.endDate ? 'error' : ''}`}
                />
                {errors.endDate && <span className="error-message">{errors.endDate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="remarks">Remarks</label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Enter any additional remarks or notes"
                  className="form-control"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update Mapping' : 'Create Mapping')}
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Reset
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-danger"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReportingFinanceMapping;