import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddEvent.css';

const AddEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    company: 'BOMBAIM',
    eventName: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    description: '',
    active: true
  });

  useEffect(() => {
    if (isEditMode) {
      // In a real app, you would fetch the event data here
      // For now, using mock data for editing
      setFormData({
        company: 'BOMBAIM',
        eventName: 'Annual Day Celebration',
        eventDate: '2024-12-15',
        eventTime: '18:00',
        venue: 'Main Auditorium',
        description: 'Annual day celebration for all employees',
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
    console.log('Event form submitted:', formData);
    navigate('/event-planner');
  };

  const handleCancel = () => {
    navigate('/event-planner');
  };

  return (
    <div className="add-event-container">
      <div className="add-event-header">
        <h2>{isEditMode ? 'Edit Event' : 'Add New Event'}</h2>
      </div>

      <div className="breadcrumb">
        <span>Master</span> &gt; <span>Event Planner</span> &gt; <span>{isEditMode ? 'Edit' : 'Add New'}</span>
      </div>

      <form className="add-event-form" onSubmit={handleSubmit}>
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
          <label htmlFor="eventName">Event Name</label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            value={formData.eventName}
            onChange={handleInputChange}
            placeholder="Enter event name"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="eventDate">Event Date</label>
            <input
              type="date"
              id="eventDate"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="eventTime">Event Time</label>
            <input
              type="time"
              id="eventTime"
              name="eventTime"
              value={formData.eventTime}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="venue">Venue</label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            placeholder="Enter venue"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter event description"
            rows="4"
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

export default AddEvent;