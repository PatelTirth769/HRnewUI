import React, { useState } from 'react';

const StateTable = ({ states, onEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = states.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(states.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="card mt-3">
      <div className="card-body">
        <table className="table table-bordered table-hover">
          <thead style={{ backgroundColor: '#f8d7da' }}>
            <tr>
              <th scope="col">SR.NO</th>
              <th scope="col">STATE</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((state, index) => (
              <tr key={state.id} onClick={() => onEdit(state)} style={{ cursor: 'pointer' }}>
                <td>{indexOfFirstItem + index + 1}</td>
                <td>{state.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, states.length)} of {states.length} entries
          </div>
          <nav>
            <ul className="pagination mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <a className="page-link" href="#" onClick={() => handlePageChange(currentPage - 1)}>Previous</a>
              </li>
              {[...Array(totalPages).keys()].map((number) => (
                <li key={number + 1} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                  <a onClick={() => handlePageChange(number + 1)} className="page-link" href="#">
                    {number + 1}
                  </a>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <a className="page-link" href="#" onClick={() => handlePageChange(currentPage + 1)}>Next</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default StateTable;