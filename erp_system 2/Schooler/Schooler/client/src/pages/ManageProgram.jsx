import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { getAllPrograms, createProgram, updateProgram, deleteProgram } from '../services/programService';

const ManageProgram = () => {
  const [programs, setPrograms] = useState([]);
  const [isAddMode, setIsAddMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentProgram, setCurrentProgram] = useState({
    programId: '',
    programName: '',
    branchName: '',
    instituteId: '',
    active: true
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const data = await getAllPrograms();
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentProgram({
      ...currentProgram,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setCurrentProgram({
      programId: '',
      programName: '',
      branchName: '',
      instituteId: '',
      active: true
    });
    setIsAddMode(true);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedProgram;
      if (isAddMode) {
        savedProgram = await createProgram(currentProgram);
        // तुरंत नए प्रोग्राम को टेबल में जोड़ें
        setPrograms([...programs, savedProgram]);
      } else {
        savedProgram = await updateProgram(editId, currentProgram);
        // तुरंत टेबल में अपडेट करें
        setPrograms(programs.map(program => program._id === editId ? savedProgram : program));
      }
      resetForm();
    } catch (error) {
      console.error('Error saving program:', error);
    }
  };

  const handleEdit = (program) => {
    setCurrentProgram({
      programId: program.programId,
      programName: program.programName,
      branchName: program.branchName,
      instituteId: program.instituteId,
      active: program.active
    });
    setIsAddMode(false);
    setEditId(program._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('क्या आप वाकई इस प्रोग्राम को हटाना चाहते हैं?')) {
      try {
        await deleteProgram(id);
        fetchPrograms();
      } catch (error) {
        console.error('Error deleting program:', error);
      }
    }
  };

  const filteredPrograms = programs.filter(program => 
    program.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.programId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.branchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Program / Manage Stream</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          onClick={() => window.location.href = '/upload-excel'}
        >
          <span className="mr-2">+</span> Upload Excel
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{isAddMode ? 'Add Program' : 'Edit Program'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2">Program ID</label>
              <input
                type="text"
                name="programId"
                value={currentProgram.programId}
                onChange={handleInputChange}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Enter Program ID"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Program Name</label>
              <input
                type="text"
                name="programName"
                value={currentProgram.programName}
                onChange={handleInputChange}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Enter Program Name"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Branch Name</label>
              <input
                type="text"
                name="branchName"
                value={currentProgram.branchName}
                onChange={handleInputChange}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Enter Branch Name"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Institute ID</label>
              <input
                type="text"
                name="instituteId"
                value={currentProgram.instituteId}
                onChange={handleInputChange}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Enter Institute ID"
                required
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="active"
                checked={currentProgram.active}
                onChange={handleInputChange}
                className="mr-2"
              />
              Active
            </label>
          </div>

          <div className="flex justify-end mt-6 space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Programs</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 border rounded-md px-3 py-2"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">PROGRAM ID</th>
                <th className="py-2 px-4 border-b text-left">PROGRAM NAME</th>
                <th className="py-2 px-4 border-b text-left">BRANCH NAME</th>
                <th className="py-2 px-4 border-b text-left">INSTITUTE ID</th>
                <th className="py-2 px-4 border-b text-left">STATUS</th>
                <th className="py-2 px-4 border-b text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map((program) => (
                <tr key={program._id}>
                  <td className="py-2 px-4 border-b">{program.programId}</td>
                  <td className="py-2 px-4 border-b">{program.programName}</td>
                  <td className="py-2 px-4 border-b">{program.branchName}</td>
                  <td className="py-2 px-4 border-b">{program.instituteId}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${program.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {program.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(program)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(program._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPrograms.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-4 text-center">No programs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageProgram;