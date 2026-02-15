import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './AddPolicy.css';

const AddPolicy = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    company: 'BOMBAIM',
    docName: '',
    role: '',
    description: '',
    file: null,
    active: true
  });

  useEffect(() => {
    if (isEdit) {
      // Mock data for editing
      setFormData({
        company: 'BOMBAIM',
        docName: 'Employee Handbook 2024',
        role: 'HR Manager',
        description: 'Comprehensive employee handbook for 2024',
        file: null,
        active: true
      });
    }
  }, [isEdit, id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      file: e.target.files[0]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    navigate('/policy-upload');
  };

  const handleCancel = () => {
    navigate('/policy-upload');
  };

  return (
    <div className="add-policy-container">
      <div className="header-container">
        <h1 className="page-title">{isEdit ? 'Edit Policy' : 'Add New Policy'}</h1>
        <nav className="breadcrumb">
          <Link to="/home" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator"> &gt; </span>
          <Link to="/policy-upload" className="breadcrumb-link">Policy Upload</Link>
          <span className="breadcrumb-separator"> &gt; </span>
          <span className="breadcrumb-current">{isEdit ? 'Edit' : 'Add New'}</span>
        </nav>
      </div>

      <form className="policy-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="company">Company:</label>
            <select
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="form-select"
              required
            >
              <option value="BOMBAIM">BOMBAIM</option>
              <option value="Other Company">Other Company</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="docName">Document Name:</label>
            <input
              type="text"
              id="docName"
              name="docName"
              value={formData.docName}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="role">Role:</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="form-select"
              required
            >
              <option value="">Select Role</option>
              <option value="All Employees">All Employees</option>
              <option value="HR Manager">HR Manager</option>
              <option value="IT Department">IT Department</option>
              <option value="Managers">Managers</option>
              <option value="All Staff">All Staff</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="file">Upload File:</label>
            <input
              type="file"
              id="file"
              name="file"
              onChange={handleFileChange}
              className="form-file-input"
              accept=".pdf,.doc,.docx,.txt"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              rows="4"
              placeholder="Enter policy description..."
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="form-checkbox"
              />
              <span className="checkbox-text">Active</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">
            {isEdit ? 'Update' : 'Save'}
          </button>
          <button type="button" onClick={handleCancel} className="cancel-button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPolicy;