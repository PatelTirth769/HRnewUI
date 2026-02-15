import React, { useState, useEffect } from 'react';
import { states } from '../data';

const CityForm = ({ selectedCity, onSave, onCancel }) => {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (selectedCity) {
      setCity(selectedCity.name || '');
      setState(selectedCity.state || '');
    } else {
      setCity('');
      setState('');
    }
  }, [selectedCity]);

  const handleSave = () => {
    onSave({ ...selectedCity, name: city, state });
  };

  return (
    <div>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#">HOME</a></li>
          <li className="breadcrumb-item"><a href="#">ORG SET UP</a></li>
          <li className="breadcrumb-item active" aria-current="page">CITY MASTER</li>
        </ol>
      </nav>

      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label htmlFor="country" className="form-label">Country</label>
              <select id="country" className="form-select">
                <option>India</option>
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="state" className="form-label">State</label>
              <select id="state" className="form-select" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="city" className="form-label">City</label>
              <input type="text" id="city" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-primary me-2" onClick={handleSave}>Save</button>
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityForm;