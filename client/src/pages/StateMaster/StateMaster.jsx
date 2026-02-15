import React, { useState } from 'react';
import StateHeader from './components/StateHeader';
import StateTable from './components/StateTable';
import StateForm from './components/StateForm';
import { states as initialStates } from './data';
import './StateMaster.css';

const StateMaster = () => {
  const [view, setView] = useState('table'); // table, new, edit
  const [selectedState, setSelectedState] = useState(null);
  const [states, setStates] = useState(initialStates);

  const handleNew = () => {
    setSelectedState(null);
    setView('new');
  };

  const handleEdit = (state) => {
    setSelectedState(state);
    setView('edit');
  };

  const handleSave = (state) => {
    if (selectedState) {
      // Update existing state
      const updatedStates = states.map((s) => (s.id === state.id ? state : s));
      setStates(updatedStates);
    } else {
      // Add new state
      const newState = { ...state, id: states.length + 1 };
      setStates([...states, newState]);
    }
    setView('table');
  };

  const handleCancel = () => {
    setView('table');
  };

  return (
    <div className="state-master-container">
      {view === 'table' && (
        <>
          <StateHeader onNew={handleNew} />
          <StateTable states={states} onEdit={handleEdit} />
        </>
      )}
      {(view === 'new' || view === 'edit') && (
        <StateForm selectedState={selectedState} onSave={handleSave} onCancel={handleCancel} />
      )}
    </div>
  );
};

export default StateMaster;