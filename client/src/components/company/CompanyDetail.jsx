import React from 'react';

const CompanyDetail = ({ company, onEdit, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      <div className="p-6 border-b bg-gray-50 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 text-lg font-medium flex items-center"
            >
              ← Back to Companies
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-600 mt-1">Company Code: {company.code}</p>
            </div>
          </div>
          <button
            onClick={() => onEdit(company)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium"
          >
            Edit Company
          </button>
        </div>
      </div>
      
      <div className="p-6">

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Code</label>
            <p className="mt-1 text-gray-900">{company.code}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <p className="mt-1 text-gray-900">{company.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <p className="mt-1 text-gray-900">{company.address}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <p className="mt-1 text-gray-900">{company.city}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <p className="mt-1 text-gray-900">{company.state}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <p className="mt-1 text-gray-900">{company.country}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="mt-1 text-gray-900">{company.phone}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{company.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <p className="mt-1 text-gray-900">{company.website || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">PAN No.</label>
            <p className="mt-1 text-gray-900">{company.panNo || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">TAN No.</label>
            <p className="mt-1 text-gray-900">{company.tanNo || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">GST No.</label>
            <p className="mt-1 text-gray-900">{company.gstNo || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">CIN No.</label>
            <p className="mt-1 text-gray-900">{company.cinNo || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              company.status === 'Active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {company.status}
            </span>
          </div>
      </div>
    </div>
      </div>
    </div>

      <div className="flex justify-end space-x-4 pt-6 border-t mt-8 p-6 bg-gray-50 rounded-b-lg">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Companies
        </button>
        <button
          onClick={() => onEdit(company)}
          className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
        >
          Edit Company
        </button>
      </div>
    </div>
  );
};

export default CompanyDetail;