import React, { useState } from 'react';
import './CountryMaster.css';
import { countryData } from '../../data/countryData';

const CountryMaster = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = countryData.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(countryData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="country-master-container">
      <div className="header-container">
        <h1 className="header-title">COUNTRY MASTER</h1>
        <div className="header-breadcrumbs">
          <span>HOME</span> &gt; <span>ORG SET UP</span> &gt; <span>COUNTRY MASTER</span>
        </div>
      </div>

      <div className="controls-container">
        <button className="control-button bulk-upload">Bulk Upload</button>
        <button className="control-button history">History</button>
        <div className="search-container">
          <label htmlFor="search-on">Search On:</label>
          <select id="search-on" className="search-dropdown">
            <option>All</option>
          </select>
          <label htmlFor="search-text">Search Text:</label>
          <input type="text" id="search-text" className="search-input" />
          <button className="control-button search">Search</button>
          <button className="control-button excel-export"></button>
        </div>
      </div>

      <div className="currency-info">
        <span>Base Currency: <strong>INR</strong></span>
        <span>Country: <strong>India</strong></span>
      </div>

      <div className="table-container">
        <table className="country-table">
          <thead>
            <tr>
              <th>COUNTRY NAME</th>
              <th>CURRENCY CODE</th>
              <th>CONVERSION RATE</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((country, index) => (
              <tr key={index}>
                <td>{country.name}</td>
                <td>{country.currencyCode}</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        {[...Array(totalPages).keys()].map(number => (
          <button key={number + 1} onClick={() => paginate(number + 1)} className="pagination-button">
            {number + 1}
          </button>
        ))}
      </div>

      <div className="footer-info">
        <span>Updated On: <strong>27-Mar-2010</strong></span>
        <span>Updated By: <strong>admin</strong></span>
      </div>
    </div>
  );
};

export default CountryMaster;