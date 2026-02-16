import React from 'react';
import { Spin } from 'antd';

const CompanyList = ({ companies, onNewCompany, onCompanySelect, loading }) => {
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
          {loading ? (
            <div className="flex justify-center py-10">
              <Spin size="large" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Company Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Abbr</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Domain</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Country</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Currency</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr
                      key={company.name}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onCompanySelect(company)}
                    >
                      <td className="border border-gray-300 px-4 py-2 font-medium text-blue-600 hover:text-blue-800">
                        {company.company_name || company.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{company.abbr}</td>
                      <td className="border border-gray-300 px-4 py-2">{company.domain}</td>
                      <td className="border border-gray-300 px-4 py-2">{company.country}</td>
                      <td className="border border-gray-300 px-4 py-2">{company.default_currency}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details →
                        </span>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-gray-500">
                        No companies found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyList;