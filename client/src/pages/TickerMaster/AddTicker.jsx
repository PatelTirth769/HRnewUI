import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddTicker.css';

const AddTicker = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    company: 'BOMBAIM',
    message: '',
    active: true
  });

  useEffect(() => {
    if (isEditMode) {
      // In a real app, you would fetch the ticker data here
      // For now, using mock data
      setFormData({
        company: 'BOMBAIM',
        message: 'Sample ticker message for editing',
        active: true
      });
    }
  }, [id, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
    navigate('/ticker-master');
  };

  const handleCancel = () => {
    navigate('/ticker-master');
  };

  return (
    <div className="add-ticker-container">
      <div className="add-ticker-header">
        <h2>{isEditMode ? 'Edit Ticker' : 'Add New Ticker'}</h2>
      </div>

      <div className="breadcrumb">
        <span>Master</span> &gt; <span>Ticker Message</span> &gt; <span>{isEditMode ? 'Edit' : 'Add New'}</span>
      </div>

      <form className="add-ticker-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="company">Company</label>
          <select
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            required
          >
            <option value="BOMBAIM">BOMBAIM</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Enter ticker message"
            rows="4"
            required
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleInputChange}
            />
            Active
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-button">
            {isEditMode ? 'Update' : 'Save'}
          </button>
          <button type="button" className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTicker;