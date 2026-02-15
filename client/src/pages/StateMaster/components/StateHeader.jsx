import React from 'react';

const StateHeader = ({ onNew }) => {
  return (
    <div>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#">HOME</a></li>
          <li className="breadcrumb-item"><a href="#">ORG SET UP</a></li>
          <li className="breadcrumb-item active" aria-current="page">STATE MASTER</li>
        </ol>
      </nav>
      <div className="card">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-auto">
              <button className="btn btn-warning text-white" onClick={onNew}>
                New <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="col-auto">
              <div className="row align-items-center">
                <div className="col-auto">
                  <label htmlFor="country" className="col-form-label">Country</label>
                </div>
                <div className="col-auto">
                  <select className="form-control" id="country">
                    <option>India</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StateHeader;