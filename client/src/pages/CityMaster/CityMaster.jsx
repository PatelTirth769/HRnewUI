import React, { useState } from 'react';
import Header from './components/Header';
import CityTable from './components/CityTable';
import CityForm from './components/CityForm';
import { cities as initialCities, states } from './data';
import './CityMaster.css';

const CityMaster = () => {
  const [view, setView] = useState('table'); // table, new, edit
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState(initialCities);

  const handleSearch = (searchOn, searchText) => {
    const filteredCities = initialCities.filter((city) => {
      if (searchOn === 'state') {
        return city.state.toLowerCase().includes(searchText.toLowerCase());
      } else if (searchOn === 'city') {
        return city.name.toLowerCase().includes(searchText.toLowerCase());
      }
      return true;
    });
    setCities(filteredCities);
  };

  const handleNew = () => {
    setSelectedCity(null);
    setView('new');
  };

  const handleEdit = (city) => {
    setSelectedCity(city);
    setView('edit');
  };

  const handleSave = (city) => {
    if (selectedCity) {
      // Update existing city
      const updatedCities = cities.map((c) => (c.id === city.id ? city : c));
      setCities(updatedCities);
    } else {
      // Add new city
      const newCity = { ...city, id: cities.length + 1 };
      setCities([...cities, newCity]);
    }
    setView('table');
  };

  const handleCancel = () => {
    setView('table');
  };

  return (
    <div className="city-master-container">
      {view === 'table' && (
        <>
          <Header onNew={handleNew} onSearch={handleSearch} />
          <CityTable cities={cities} onEdit={handleEdit} />
        </>
      )}
      {(view === 'new' || view === 'edit') && (
        <CityForm selectedCity={selectedCity} onSave={handleSave} onCancel={handleCancel} />
      )}
    </div>
  );
};

export default CityMaster;