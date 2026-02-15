import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const HolidayEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [holiday, setHoliday] = useState(null);
  const [formState, setFormState] = useState({});

  // Mock data - in a real app, you would fetch this based on the id
  const holidays = [
    { id: 1, organization: 'BOMBAIM', location: 'Kolkata_Backend', date: '2025-09-30', name: 'ASTHAMI', state: 'West Bengal' },
    { id: 2, organization: 'BOMBAIM', location: 'Kolkata Good earth', date: '2025-03-14', name: 'BENGALI HOLI DA...', state: 'West Bengal' },
  ];

  useEffect(() => {
    const selectedHoliday = holidays.find(h => h.id === parseInt(id));
    if (selectedHoliday) {
      setHoliday(selectedHoliday);
      setFormState(selectedHoliday);
    } else {
      // Handle case where holiday is not found
      navigate('/master/holiday-master');
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = () => {
    // Logic to save the updated holiday details
    console.log('Saving holiday:', formState);
    navigate('/master/holiday-master');
  };

  const handleCancel = () => {
    navigate('/master/holiday-master');
  };

  if (!holiday) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4">Edit Holiday</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization</label>
            <input type="text" name="organization" value={formState.organization || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input type="text" name="location" value={formState.location || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Holiday Date</label>
            <input type="date" name="date" value={formState.date || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Holiday Name</label>
            <input type="text" name="name" value={formState.name || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input type="text" name="state" value={formState.state || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
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

export default HolidayEdit;