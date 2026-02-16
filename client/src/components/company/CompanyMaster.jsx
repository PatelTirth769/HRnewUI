import React, { useState, useEffect } from 'react';
import CompanyList from './CompanyList';
import CompanyForm from './CompanyForm';
import CompanyDetail from './CompanyDetail';
import api from '../../services/api';
import { notification, Spin } from 'antd';

const CompanyMaster = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Companies
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/resource/Company?fields=["*"]&limit_page_length=None');
      console.log("Fetch Companies Response:", response.data);
      if (response.data && response.data.data) {
        setCompanies(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      notification.error({ message: "Failed to fetch companies" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

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

  const handleSaveCompany = async (formData) => {
    setLoading(true);
    try {
      if (selectedCompany) {
        // Update Existing Company
        await api.put(`/api/resource/Company/${selectedCompany.name}`, formData);
        notification.success({ message: "Company updated successfully" });
      } else {
        // Create New Company
        await api.post('/api/resource/Company', formData);
        notification.success({ message: "Company created successfully" });
      }
      fetchCompanies(); // Refresh list
      setCurrentView('list');
      setSelectedCompany(null);
    } catch (error) {
      console.error("Error saving company:", error);
      notification.error({
        message: "Failed to save company",
        description: error.response?.data?.exception || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyName) => {
    if (!window.confirm(`Are you sure you want to delete ${companyName}?`)) return;

    setLoading(true);
    try {
      await api.delete(`/api/resource/Company/${companyName}`);
      notification.success({ message: "Company deleted successfully" });
      fetchCompanies(); // Refresh list
      if (selectedCompany && selectedCompany.name === companyName) {
        setCurrentView('list');
        setSelectedCompany(null);
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      notification.error({
        message: "Failed to delete company",
        description: error.response?.data?.exception || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedCompany(null);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedCompany(null);
  };

  if (loading && companies.length === 0 && currentView === 'list') {
    return <div className="p-6 flex justify-center"><Spin size="large" /></div>;
  }

  return (
    <div className="p-6">
      {currentView === 'list' && (
        <CompanyList
          companies={companies}
          onNewCompany={handleNewCompany}
          onCompanySelect={handleCompanySelect}
          loading={loading}
        />
      )}

      {currentView === 'form' && (
        <CompanyForm
          initialData={selectedCompany}
          onSave={handleSaveCompany}
          onCancel={handleCancel}
          loading={loading}
        />
      )}

      {currentView === 'detail' && selectedCompany && (
        <CompanyDetail
          company={selectedCompany}
          onEdit={handleEditCompany}
          onBack={handleBackToList}
          onDelete={handleDeleteCompany}
        />
      )}
    </div>
  );
};

export default CompanyMaster;