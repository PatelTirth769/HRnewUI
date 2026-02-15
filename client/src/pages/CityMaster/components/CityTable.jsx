import React, { useState } from 'react';

const CityTable = ({ cities, onEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Changed to 10 for better pagination demo

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = cities.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(cities.length / itemsPerPage);

  return (
    <div className="card mt-3">
      <div className="card-body">
        <table className="table table-striped table-hover">
          <thead className="table-header">
            <tr>
              <th scope="col">SR.</th>
              <th scope="col">STATE</th>
              <th scope="col">CITY</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((city, index) => (
              <tr key={city.id} onClick={() => onEdit(city)} style={{ cursor: 'pointer' }}>
                <td>{indexOfFirstItem + index + 1}</td>
                <td>{city.state}</td>
                <td>{city.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card-footer d-flex justify-content-between align-items-center">
        <div>
          <span>Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, cities.length)} of {cities.length} entries</span>
        </div>
        <nav>
          <ul className="pagination mb-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
            </li>
            {[...Array(totalPages).keys()].map((number) => (
              <li key={number + 1} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(number + 1)}>{number + 1}</button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default CityTable;