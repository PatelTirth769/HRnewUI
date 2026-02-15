import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddEmployee.css';

const AddEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    empCode: '',
    empName: '',
    department: '',
    designation: '',
    company: 'BOMBAIM',
    email: '',
    mobile: '',
    alternateMobile: '',
    dateOfBirth: '',
    dateOfJoining: '',
    gender: '',
    maritalStatus: '',
    bloodGroup: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    emergencyContact: '',
    emergencyRelation: '',
    emergencyMobile: '',
    panNumber: '',
    aadharNumber: '',
    bankName: '',
    bankAccount: '',
    ifscCode: '',
    basicSalary: '',
    allowances: '',
    deductions: '',
    netSalary: '',
    status: 'Active',
    profilePhoto: null,
    resume: null,
    idProof: null
  });

  const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Admin'];
  const designations = ['Software Engineer', 'Senior Software Engineer', 'Team Lead', 'Manager', 'HR Manager', 'Accountant', 'Marketing Executive', 'Sales Executive'];
  const companies = ['BOMBAIM', 'Company A', 'Company B', 'Company C'];
  const genders = ['Male', 'Female', 'Other'];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const countries = ['India', 'USA', 'UK', 'Canada', 'Australia'];

  useEffect(() => {
    if (isEdit) {
      // Mock data for editing
      const mockEmployeeData = {
        empCode: 'EMP001',
        empName: 'John Doe',
        department: 'IT',
        designation: 'Software Engineer',
        company: 'BOMBAIM',
        email: 'john.doe@bombaim.com',
        mobile: '9876543210',
        alternateMobile: '9123456789',
        dateOfBirth: '1990-01-15',
        dateOfJoining: '2020-03-01',
        gender: 'Male',
        maritalStatus: 'Single',
        bloodGroup: 'A+',
        address: '123, Main Street, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400001',
        emergencyContact: 'Mrs. Doe',
        emergencyRelation: 'Mother',
        emergencyMobile: '9123456789',
        panNumber: 'ABCDE1234F',
        aadharNumber: '1234-5678-9012',
        bankName: 'State Bank of India',
        bankAccount: '12345678901',
        ifscCode: 'SBIN0001234',
        basicSalary: '50000',
        allowances: '10000',
        deductions: '5000',
        netSalary: '55000',
        status: 'Active'
      };
      setFormData(mockEmployeeData);
    }
  }, [isEdit]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    navigate('/employee-master');
  };

  const handleCancel = () => {
    navigate('/employee-master');
  };

  const calculateNetSalary = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const net = basic + allowances - deductions;
    setFormData(prev => ({
      ...prev,
      netSalary: net.toString()
    }));
  };

  useEffect(() => {
    calculateNetSalary();
  }, [formData.basicSalary, formData.allowances, formData.deductions]);

  return (
    <div className="add-employee-container">
      <div className="add-employee-header">
        <h2>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h2>
        <nav className="breadcrumb">
          <span>Master</span> &gt; 
          <span className="clickable" onClick={() => navigate('/employee-master')}>Employee Master</span> &gt; 
          <span className="active">{isEdit ? 'Edit Employee' : 'Add Employee'}</span>
        </nav>
      </div>

      <form className="add-employee-form" onSubmit={handleSubmit}>
        <div className="form-sections">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Employee Code <span className="required">*</span></label>
                <input
                  type="text"
                  name="empCode"
                  value={formData.empCode}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Employee Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="empName"
                  value={formData.empName}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Company <span className="required">*</span></label>
                <select
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department <span className="required">*</span></label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Designation <span className="required">*</span></label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Designation</option>
                  {designations.map(desig => (
                    <option key={desig} value={desig}>{desig}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mobile <span className="required">*</span></label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Alternate Mobile</label>
                <input
                  type="tel"
                  name="alternateMobile"
                  value={formData.alternateMobile}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Status <span className="required">*</span></label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Date of Joining</label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select Gender</option>
                  {genders.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Marital Status</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select Status</option>
                  {maritalStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(blood => (
                    <option key={blood} value={blood}>{blood}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3>Address Information</h3>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="form-section">
            <h3>Emergency Contact</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Relation</label>
                <input
                  type="text"
                  name="emergencyRelation"
                  value={formData.emergencyRelation}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Emergency Mobile</label>
                <input
                  type="tel"
                  name="emergencyMobile"
                  value={formData.emergencyMobile}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="form-section">
            <h3>Documents</h3>
            <div className="form-row">
              <div className="form-group">
                <label>PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Aadhar Number</label>
                <input
                  type="text"
                  name="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Profile Photo</label>
                <input
                  type="file"
                  name="profilePhoto"
                  onChange={handleFileChange}
                  className="form-control"
                  accept="image/*"
                />
              </div>
              <div className="form-group">
                <label>Resume</label>
                <input
                  type="file"
                  name="resume"
                  onChange={handleFileChange}
                  className="form-control"
                  accept=".pdf,.doc,.docx"
                />
              </div>
              <div className="form-group">
                <label>ID Proof</label>
                <input
                  type="file"
                  name="idProof"
                  onChange={handleFileChange}
                  className="form-control"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="form-section">
            <h3>Bank Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="form-section">
            <h3>Salary Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Basic Salary</label>
                <input
                  type="number"
                  name="basicSalary"
                  value={formData.basicSalary}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Allowances</label>
                <input
                  type="number"
                  name="allowances"
                  value={formData.allowances}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Deductions</label>
                <input
                  type="number"
                  name="deductions"
                  value={formData.deductions}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Net Salary</label>
                <input
                  type="number"
                  name="netSalary"
                  value={formData.netSalary}
                  readOnly
                  className="form-control"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;