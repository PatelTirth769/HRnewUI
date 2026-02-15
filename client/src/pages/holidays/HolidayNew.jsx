import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HolidayNew = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    organization: 'BOMBAIM',
    location: '',
    date: '',
    name: '',
    state: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = () => {
    // Logic to save the new holiday
    console.log('Saving new holiday:', formState);
    navigate('/master/holiday-master');
  };

  const handleCancel = () => {
    navigate('/master/holiday-master');
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4">Add New Holiday</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization</label>
            <input type="text" name="organization" value={formState.organization} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input type="text" name="location" value={formState.location} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Holiday Date</label>
            <input type="date" name="date" value={formState.date} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Holiday Name</label>
            <input type="text" name="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input type="text" name="state" value={formState.state} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded-md">Save</button>
          <button onClick={handleCancel} className="bg-gray-500 text-white px-4 py-2 rounded-md">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default HolidayNew;