import React, { useState, useEffect } from 'react';

const StateForm = ({ selectedState, onSave, onCancel }) => {
  const [state, setState] = useState({ name: '' });

  useEffect(() => {
    if (selectedState) {
      setState(selectedState);
    } else {
      setState({ name: '' });
    }
  }, [selectedState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState({ ...state, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(state);
  };

  return (
    <>
      <div className="row">
        <div className="col-md-12">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="#">ORG SET UP</a></li>
              <li className="breadcrumb-item"><a href="#">STATE MASTER</a></li>
              <li className="breadcrumb-item active" aria-current="page">{selectedState ? 'EDIT' : 'NEW'}</li>
            </ol>
          </nav>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="country" className="form-label">Country</label>
                  <select className="form-select" id="country" name="country" disabled>
                    <option value="India">India</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">State Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={state.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <button type="submit" className="btn btn-primary me-2">Save</button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default StateForm;