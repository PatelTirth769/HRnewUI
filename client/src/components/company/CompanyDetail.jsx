import React from 'react';

const CompanyDetail = ({ company, onEdit, onBack, onDelete }) => {
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
                <h1 className="text-3xl font-bold text-gray-900">{company.company_name || company.name}</h1>
                <p className="text-gray-600 mt-1">Abbr: {company.abbr}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(company)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium"
              >
                Edit Company
              </button>
              <button
                onClick={() => onDelete(company.name)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <p className="mt-1 text-gray-900">{company.company_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Abbreviation</label>
                <p className="mt-1 text-gray-900">{company.abbr}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                <p className="mt-1 text-gray-900">{company.default_currency}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <p className="mt-1 text-gray-900">{company.country}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Domain</label>
                <p className="mt-1 text-gray-900">{company.domain}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Is Group</label>
                <p className="mt-1 text-gray-900">{company.is_group ? 'Yes' : 'No'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Company</label>
                <p className="mt-1 text-gray-900">{company.parent_company || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;