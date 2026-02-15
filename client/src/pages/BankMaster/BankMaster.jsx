import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { banks } from '../../data/banks';
import './BankMaster.css';

const BankMaster = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const handleNewClick = () => {
    navigate('/add-bank');
  };

  const handleEditClick = (bank) => {
    navigate(`/edit-bank/${bank.id}`, { state: { bank } });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = banks.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="bank-master-container">
      <div className="header-container">
        <h1 className="header-title">BANK MASTER</h1>
        <div className="header-breadcrumbs">
          <span>HOME</span> &gt; <span>ORG SET UP</span> &gt; <span>BANK MASTER</span>
        </div>
      </div>

      <button className="control-button new-button" onClick={handleNewClick}>New</button>

      <div className="table-container">
        <table className="bank-table">
          <thead>
            <tr>
              <th>SR.NO</th>
              <th>BANK NAME</th>
              <th>ACTIVE</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((bank, index) => (
              <tr key={bank.id} onClick={() => handleEditClick(bank)}>
                <td>{indexOfFirstItem + index + 1}</td>
                <td>{bank.name}</td>
                <td>{bank.active.toString().toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {Array.from({ length: Math.ceil(banks.length / itemsPerPage) }, (_, i) => (
          <button key={i + 1} onClick={() => paginate(i + 1)}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BankMaster;