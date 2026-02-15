import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EntityMaster = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entity, setEntity] = useState('');

  const entityTypes = ['E-Category', 'Entity_3', 'Entity_4', 'Entity_5', 'Sub Department'];

  const data = {
    'E-Category': [
      { id: 1, name: 'Backend' },
      { id: 2, name: 'Front End' },
      { id: 3, name: 'Support Staff' },
    ],
    'Sub Department': [
      { id: 4, name: 'Administration' },
      { id: 5, name: 'Payroll' },
      { id: 6, name: 'Recruitment' },
      { id: 7, name: 'Training & Development' },
    ],
  };

  const tableData = company === 'BOMBAIM' && entityType ? data[entityType] : [];

  const handleAddNew = () => {
    // Logic for adding a new entity
    console.log('Adding new entity:', { company, entityType, entity });
  };

  const handleRowClick = (item) => {
    navigate(`/master/entity-master/edit/${item.id}`);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4">HOME {'>'} ORG SET UP {'>'} ENTITY MASTER</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <select value={company} onChange={e => setCompany(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              <option value="">-Select-</option>
              <option value="BOMBAIM">BOMBAIM</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Entity Type</label>
            <select value={entityType} onChange={e => setEntityType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              <option value="">Select...</option>
              {entityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Entity</label>
            <input type="text" value={entity} onChange={e => setEntity(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
        </div>

        <button onClick={handleAddNew} className="bg-orange-500 text-white px-4 py-2 rounded-md mb-4">Add New +</button>

        {tableData && tableData.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Entity Type ({entityType})</h2>
            <table className="min-w-full bg-white border">
              <thead className="bg-orange-200">
                <tr>
                  <th className="py-2 px-4 border-b">SR.</th>
                  <th className="py-2 px-4 border-b">DATA NAME</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item, index) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)} className="cursor-pointer hover:bg-gray-100">
                    <td className="py-2 px-4 border-b text-center">{index + 1}</td>
                    <td className="py-2 px-4 border-b">{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-sm text-gray-600 mt-2">
              1 to {tableData.length} of {tableData.length} entries
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityMaster;