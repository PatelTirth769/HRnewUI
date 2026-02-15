import React, { useState } from 'react';

const CompanyList = ({ onNewCompany, onCompanySelect }) => {
  const [companies] = useState([
    {
      id: 1,
      code: 'COMP001',
      name: 'Tech Solutions Pvt Ltd',
      address: '123 Business Park, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      phone: '022-12345678',
      email: 'info@techsolutions.com',
      status: 'Active'
    },
    {
      id: 2,
      code: 'COMP002',
      name: 'Global Enterprises',
      address: '456 Corporate Tower, Delhi',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      phone: '011-87654321',
      email: 'contact@globalent.com',
      status: 'Active'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b bg-gray-50 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
              <p className="text-gray-600 mt-1">Manage your company master data</p>
            </div>
            <button
              onClick={onNewCompany}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md flex items-center font-medium"
            >
              <span className="mr-2 text-lg">+</span>
              Add New Company
            </button>
          </div>
        </div>
      
        <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Company Code</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Company Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Address</th>
                <th className="border border-gray-300 px-4 py-2 text-left">City</th>
                <th className="border border-gray-300 px-4 py-2 text-left">State</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Country</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Phone</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr 
                  key={company.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onCompanySelect(company)}
                >
                  <td className="border border-gray-300 px-4 py-2 font-medium">{company.code}</td>
                  <td className="border border-gray-300 px-4 py-2 font-medium text-blue-600 hover:text-blue-800">
                    {company.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{company.address}</td>
                  <td className="border border-gray-300 px-4 py-2">{company.city}</td>
                  <td className="border border-gray-300 px-4 py-2">{company.state}</td>
                  <td className="border border-gray-300 px-4 py-2">{company.country}</td>
                  <td className="border border-gray-300 px-4 py-2">{company.phone}</td>
                  <td className="border border-gray-300 px-4 py-2">{company.email}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      company.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
};

export default CompanyList;