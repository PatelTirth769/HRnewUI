import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EntityEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState(null);
  const [formState, setFormState] = useState({});

  // Mock data - in a real app, you would fetch this based on the id
  const entities = {
    1: { id: 1, name: 'Backend', type: 'E-Category' },
    2: { id: 2, name: 'Front End', type: 'E-Category' },
    3: { id: 3, name: 'Support Staff', type: 'E-Category' },
    4: { id: 4, name: 'Administration', type: 'Sub Department' },
    5: { id: 5, name: 'Payroll', type: 'Sub Department' },
    6: { id: 6, name: 'Recruitment', type: 'Sub Department' },
    7: { id: 7, name: 'Training & Development', type: 'Sub Department' },
  };

  useEffect(() => {
    const selectedEntity = entities[id];
    if (selectedEntity) {
      setEntity(selectedEntity);
      setFormState(selectedEntity);
    } else {
      navigate('/master/entity-master');
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSave = () => {
    console.log('Saving entity:', formState);
    navigate('/master/entity-master');
  };

  const handleCancel = () => {
    navigate('/master/entity-master');
  };

  if (!entity) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4">Edit Entity</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Entity Name</label>
            <input type="text" name="name" value={formState.name || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Entity Type</label>
            <input type="text" name="type" value={formState.type || ''} onChange={handleChange} disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" />
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

export default EntityEdit;