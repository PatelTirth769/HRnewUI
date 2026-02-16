import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import './AddEmployee.css';

const AddEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 'id' will be the ERPNext 'name' (e.g. HR-EMP-00001)
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    // ERPNext fields mapping
    first_name: '',
    last_name: '',
    company: 'Preeshe Consultancy Services',
    department: '',
    designation: '',
    gender: '',
    date_of_birth: '',
    date_of_joining: '',
    status: 'Active',
    company_email: '',
    personal_email: '',
    cell_number: '',
    current_address: '',
    permanent_address: '',
    // Additional fields can be mapped as needed, keeping some UI specific state if strictly necessary
    marital_status: '',
    blood_group: '',
    emergency_phone_number: '',
    relation: ''
  });

  const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Admin'];
  const designations = ['Software Engineer', 'Senior Software Engineer', 'Team Lead', 'Manager', 'HR Manager', 'Accountant', 'Marketing Executive', 'Sales Executive'];
  const companies = ['Preeshe Consultancy Services', 'BOMBAIM', 'DCSAMAI', 'Kolkata_Frontend'];
  const genders = ['Male', 'Female', 'Other'];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  // const countries = ['India', 'USA', 'UK', 'Canada', 'Australia'];

  useEffect(() => {
    if (isEdit) {
      fetchEmployeeDetails();
    }
  }, [isEdit, id]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/resource/Employee/${id}`);
      const data = response.data.data;

      // Map Response to State
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        company: data.company || '',
        department: data.department || '',
        designation: data.designation || '',
        gender: data.gender || '',
        date_of_birth: data.date_of_birth || '',
        date_of_joining: data.date_of_joining || '',
        status: data.status || 'Active',
        company_email: data.company_email || '',
        personal_email: data.personal_email || '',
        cell_number: data.cell_number || '',
        current_address: data.current_address || '',
        permanent_address: data.permanent_address || '',
        marital_status: data.marital_status || '',
        blood_group: data.blood_group || '',
        emergency_phone_number: data.emergency_phone_number || '',
        relation: data.relation || ''
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching employee details:", err);
      setError("Failed to fetch employee details.");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare payload
    // Only send fields that ERPNext expects.
    // We can just send formData if we matched the keys correctly.
    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      company: formData.company,
      department: formData.department,
      designation: formData.designation,
      gender: formData.gender,
      date_of_birth: formData.date_of_birth,
      date_of_joining: formData.date_of_joining,
      status: formData.status,
      company_email: formData.company_email,
      personal_email: formData.personal_email,
      cell_number: formData.cell_number,
      current_address: formData.current_address,
      permanent_address: formData.permanent_address,
      marital_status: formData.marital_status,
      blood_group: formData.blood_group,
      emergency_phone_number: formData.emergency_phone_number,
      relation: formData.relation
    };

    try {
      if (isEdit) {
        await API.put(`/api/resource/Employee/${id}`, payload);
        alert("Employee updated successfully!");
      } else {
        await API.post('/api/resource/Employee', payload);
        alert("Employee created successfully!");
      }
      navigate('/employee-master');
    } catch (err) {
      console.error("Error saving employee:", err);
      // ERPNext error handling
      const message = err.response?.data?.exception || err.response?.data?.message || err.message;
      setError(`Failed to save employee: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/employee-master');
  };

  if (loading && isEdit && !formData.first_name) {
    return <div className="p-4 text-center">Loading employee details...</div>;
  }

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
        {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

        <div className="form-sections">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>First Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="form-control"
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
                <label>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Designation</label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select Designation</option>
                  {designations.map(desig => (
                    <option key={desig} value={desig}>{desig}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Company Email</label>
                <input
                  type="email"
                  name="company_email"
                  value={formData.company_email}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mobile No</label>
                <input
                  type="tel"
                  name="cell_number"
                  value={formData.cell_number}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Personal Email</label>
                <input
                  type="email"
                  name="personal_email"
                  value={formData.personal_email}
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
                  <option value="Suspended">Suspended</option>
                  <option value="Left">Left</option>
                </select>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth <span className="required">*</span></label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Joining <span className="required">*</span></label>
                <input
                  type="date"
                  name="date_of_joining"
                  value={formData.date_of_joining}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender <span className="required">*</span></label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="form-control"
                  required
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
                  name="marital_status"
                  value={formData.marital_status}
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
                  name="blood_group"
                  value={formData.blood_group}
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
                <label>Current Address</label>
                <textarea
                  name="current_address"
                  value={formData.current_address}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                />
              </div>
              <div className="form-group full-width">
                <label>Permanent Address</label>
                <textarea
                  name="permanent_address"
                  value={formData.permanent_address}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="form-section">
            <h3>Emergency Contact</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Emergency Mobile</label>
                <input
                  type="tel"
                  name="emergency_phone_number"
                  value={formData.emergency_phone_number}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Relation</label>
                <input
                  type="text"
                  name="relation"
                  value={formData.relation}
                  onChange={handleInputChange}
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Update' : 'Save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;