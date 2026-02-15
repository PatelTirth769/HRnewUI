import React from 'react';

const Header = ({ onNew, onBulkUpload, onSearch }) => {
  return (
    <div>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#">HOME</a></li>
          <li className="breadcrumb-item"><a href="#">ORG SET UP</a></li>
          <li className="breadcrumb-item active" aria-current="page">CITY MASTER</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-start mb-3">
        <button className="btn btn-new me-2" onClick={onNew}>New</button>
        <button className="btn btn-bulk-upload" onClick={onBulkUpload}>Bulk Upload</button>
      </div>

      <div className="card search-container">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label htmlFor="country" className="form-label">Country</label>
              <select id="country" className="form-select">
                <option>India</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="searchOn" className="form-label">Search On</label>
              <select id="searchOn" className="form-select">
                <option value="">Select</option>
                <option value="state">State</option>
                <option value="city">City</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="searchText" className="form-label">Search Text</label>
              <input type="text" id="searchText" className="form-control" />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-search me-2" onClick={() => onSearch(document.getElementById('searchOn').value, document.getElementById('searchText').value)}><i className="fas fa-search"></i></button>
              <button className="btn btn-excel"><i className="fas fa-file-excel"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;