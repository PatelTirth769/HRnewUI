import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QualificationNew = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({ name: '', description: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = () => {
    console.log('Saving new qualification:', formState);
    navigate('/master/qualification-master');
  };

  const handleCancel = () => {
    navigate('/master/qualification-master');
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4">HOME {'>'} ORG SET UP {'>'} QUALIFICATION MASTER</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Qualification Name <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input type="text" name="description" value={formState.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button onClick={handleSave} className="bg-orange-500 text-white px-4 py-2 rounded-md">Save</button>
          <button onClick={handleCancel} className="bg-gray-500 text-white px-4 py-2 rounded-md">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default QualificationNew;