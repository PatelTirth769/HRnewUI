import React from 'react';
import { useNavigate } from 'react-router-dom';

const QualificationMaster = () => {
  const navigate = useNavigate();

  const qualifications = [
    { id: 1, name: 'HSC' },
    { id: 2, name: 'SSC' },
    { id: 3, name: 'Graduate' },
    { id: 4, name: 'Post Graduate' },
    { id: 5, name: 'Diploma' },
    { id: 6, name: 'BSC' },
    { id: 7, name: 'STD 4TH' },
    { id: 8, name: 'MASTERS OF FASHION MANAGEMENT' },
    { id: 9, name: 'MASTERS IN DESIGN' },
    { id: 10, name: 'MADHYAMIK' },
    { id: 11, name: 'BACHELORS IN APPLIED SCIENCE' },
    { id: 12, name: 'STD 8TH' },
    { id: 13, name: 'BACHELORS IN DESIGN' },
    { id: 14, name: 'BBA' },
    { id: 15, name: 'UNDER GRADUATE' },
    { id: 16, name: 'M.COM' },
    { id: 17, name: 'SSC IT' },
    { id: 18, name: 'DIPLOMA IN FASHION' },
    { id: 19, name: 'STD 5TH' },
  ];

  const handleNew = () => {
    navigate('/master/qualification-master/new');
  };

  const handleRowClick = (qualification) => {
    navigate(`/master/qualification-master/edit/${qualification.id}`);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4">HOME {'>'} ORG SET UP {'>'} QUALIFICATION MASTER</h1>
        
        <button onClick={handleNew} className="bg-orange-500 text-white px-4 py-2 rounded-md mb-4">New +</button>

        <table className="min-w-full bg-white border">
          <thead className="bg-orange-200">
            <tr>
              <th className="py-2 px-4 border-b">SR.NO</th>
              <th className="py-2 px-4 border-b text-left">QUALIFICATION</th>
            </tr>
          </thead>
          <tbody>
            {qualifications.map((qual, index) => (
              <tr key={qual.id} onClick={() => handleRowClick(qual)} className="cursor-pointer hover:bg-gray-100">
                <td className="py-2 px-4 border-b text-center">{index + 1}</td>
                <td className="py-2 px-4 border-b">{qual.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-sm text-gray-600 mt-2">
          1 to {qualifications.length} of {qualifications.length} entries
        </div>
      </div>
    </div>
  );
};

export default QualificationMaster;