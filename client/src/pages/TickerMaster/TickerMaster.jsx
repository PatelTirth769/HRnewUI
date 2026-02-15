import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TickerMaster.css';

const TickerMaster = () => {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState('');

  const companies = [
    'BOMBAIM',
    'Company 2',
    'Company 3'
  ];

  const handleNewClick = () => {
    navigate('/add-ticker');
  };

  const handleEditClick = (ticker) => {
    navigate(`/edit-ticker/${ticker.id}`, { state: { ticker } });
  };

  const handleSearch = () => {
    // Search functionality will be implemented here
    console.log('Searching with company:', selectedCompany);
  };

  return (
    <div className="ticker-master-container">
      <div className="header-container">
        <h1 className="header-title">TICKER MASTER</h1>
        <div className="header-breadcrumbs">
          <span>HOME</span> &gt; <span>MASTER</span> &gt; <span>TICKER MASTER</span>
        </div>
      </div>

      <div className="search-container">
        <div className="search-row">
          <label>Company Name:</label>
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">Select Company</option>
            {companies.map((company, index) => (
              <option key={index} value={company}>{company}</option>
            ))}
          </select>
          <button className="search-button" onClick={handleSearch}>Search</button>
        </div>
      </div>

      <button className="control-button new-button" onClick={handleNewClick}>New</button>

      <div className="table-container">
        <table className="ticker-table">
          <thead>
            <tr>
              <th>SR.NO</th>
              <th>COMPANY NAME</th>
              <th>TICKER MESSAGE</th>
              <th>ACTIVE</th>
            </tr>
          </thead>
          <tbody>
            {/* Ticker data will be mapped here */}
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>No data available</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TickerMaster;