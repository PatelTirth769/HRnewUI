import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EventPlanner.css';

// Mock data for events
const mockEvents = [
  { id: 1, eventName: 'Annual Day Celebration', eventDate: '2024-12-15', company: 'BOMBAIM', active: true },
  { id: 2, eventName: 'Diwali Festival', eventDate: '2024-11-01', company: 'BOMBAIM', active: true },
  { id: 3, eventName: 'Team Building Activity', eventDate: '2024-10-20', company: 'BOMBAIM', active: false },
  { id: 4, eventName: 'New Year Party', eventDate: '2025-01-01', company: 'BOMBAIM', active: true },
  { id: 5, eventName: 'Independence Day', eventDate: '2024-08-15', company: 'BOMBAIM', active: true },
];

const EventPlanner = () => {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState('BOMBAIM');
  const [events, setEvents] = useState(mockEvents);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter events based on selected company
  const filteredEvents = events.filter(event => event.company === selectedCompany);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
    setCurrentPage(1); // Reset to first page when company changes
  };

  const handleNewEvent = () => {
    navigate('/add-event');
  };

  const handleEditEvent = (id) => {
    navigate(`/edit-event/${id}`);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="event-planner-container">
      <div className="event-planner-header">
        <h2>Event Planner</h2>
      </div>

      <div className="breadcrumb">
        <span>Master</span> &gt; <span>Event Planner</span>
      </div>

      <div className="search-section">
        <div className="company-selector">
          <label htmlFor="company-select">Select Company:</label>
          <select 
            id="company-select"
            value={selectedCompany} 
            onChange={handleCompanyChange}
            className="company-select-dropdown"
          >
            <option value="BOMBAIM">BOMBAIM</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <button className="new-button" onClick={handleNewEvent}>
          New
        </button>
      </div>

      <div className="events-table-container">
        <table className="events-table">
          <thead>
            <tr>
              <th>SR.NO</th>
              <th>EVENT NAME</th>
              <th>EVENT DATE</th>
              <th>COMPANY</th>
              <th>ACTIVE</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {currentEvents.map((event, index) => (
              <tr key={event.id}>
                <td>{indexOfFirstItem + index + 1}</td>
                <td>{event.eventName}</td>
                <td>{new Date(event.eventDate).toLocaleDateString()}</td>
                <td>{event.company}</td>
                <td>
                  <span className={`status ${event.active ? 'active' : 'inactive'}`}>
                    {event.active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <button 
                    className="edit-button"
                    onClick={() => handleEditEvent(event.id)}
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

export default EventPlanner;