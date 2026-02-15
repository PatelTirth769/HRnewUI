import React, { useState } from 'react';
import CompanyList from './CompanyList';
import CompanyForm from './CompanyForm';
import CompanyDetail from './CompanyDetail';

const CompanyMaster = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedCompany, setSelectedCompany] = useState(null);

  const handleNewCompany = () => {
    setSelectedCompany(null);
    setCurrentView('form');
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setCurrentView('detail');
  };

  const handleEditCompany = (company) => {
    setSelectedCompany(company);
    setCurrentView('form');
  };

  const handleSaveCompany = (formData) => {
    console.log('Saving company:', formData);
    // Here you would typically make an API call to save the company
    setCurrentView('list');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedCompany(null);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedCompany(null);
  };

  return (
    <div className="p-6">
      {currentView === 'list' && (
        <CompanyList
          onNewCompany={handleNewCompany}
          onCompanySelect={handleCompanySelect}
        />
      )}
      
      {currentView === 'form' && (
        <CompanyForm
          onSave={handleSaveCompany}
          onCancel={handleCancel}
        />
      )}
      
      {currentView === 'detail' && selectedCompany && (
        <CompanyDetail
          company={selectedCompany}
          onEdit={handleEditCompany}
          onBack={handleBackToList}
        />
      )}
    </div>
  );
};

export default CompanyMaster;