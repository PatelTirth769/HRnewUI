import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AddBank.css';

const AddBank = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEdit = location.state?.bank;

  const [bankName, setBankName] = useState('');
  const [template, setTemplate] = useState('');
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const { name, template, active } = location.state.bank;
      setBankName(name);
      setTemplate(template || '');
      setActive(active);
    }
  }, [isEdit, location.state]);

  const handleSave = () => {
    // Logic to save the bank details
    navigate('/bank-master');
  };

  const handleCancel = () => {
    navigate('/bank-master');
  };

  return (
    <div className="add-bank-container">
      <div className="header-container">
        <h1 className="header-title">BANK MASTER</h1>
        <div className="header-breadcrumbs">
          <span>HOME</span> &gt; <span>ORG SET UP</span> &gt; <span>BANK MASTER</span>
        </div>
      </div>

      <div className="form-container">
        <div className="form-row">
          <label>Bank Name*</label>
          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Template</label>
          <select value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="">Select...</option>
            <option value="ICICI BANK">ICICI BANK</option>
          </select>
        </div>
        <div className="form-row">
          <label>Active</label>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        </div>
      </div>

      <div className="mapping-container">
        <h2>Company Bank Mapping</h2>
        <div className="table-container">
          <table className="mapping-table">
            <thead>
              <tr>
                <th>SR.NO</th>
                <th>COMPANY NAME</th>
                <th>ACCOUNT NO</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>
                  <select>
                    <option>BOMBAIM</option>
                  </select>
                </td>
                <td><input type="text" /></td>
                <td>
                  <button className="icon-button">💾</button>
                  <button className="icon-button">❌</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="button-container">
        <button className="save-button" onClick={handleSave}>Save</button>
        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default AddBank;