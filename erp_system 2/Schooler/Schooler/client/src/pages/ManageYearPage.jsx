import { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ManageYearForm from '../components/ManageYearForm';
import ManageYearTable from '../components/ManageYearTable';
import UploadExcelModal from '../components/UploadExcelModal';
import { getYears } from '../services/manageYearService';

const ManageYearPage = () => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchYears = async () => {
    setLoading(true);
    try {
      const data = await getYears();
      setYears(data);
    } catch (error) {
      toast.error('Failed to fetch years');
      console.error('Error fetching years:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleEdit = (year) => {
    setEditData(year);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Year / Manage Stream</h1>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <FaPlus className="mr-2" /> Upload Excel
        </button>
      </div>

      <ManageYearForm 
        onSuccess={fetchYears} 
        editData={editData} 
        setEditData={setEditData} 
      />

      <ManageYearTable 
        years={years} 
        loading={loading} 
        onEdit={handleEdit} 
        onRefresh={fetchYears} 
      />

      <UploadExcelModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={fetchYears} 
      />
    </div>
  );
};

export default ManageYearPage;