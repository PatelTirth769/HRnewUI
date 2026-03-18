import { Routes, Route, Navigate } from 'react-router-dom';
import MastersSection from './MastersSection';
import MappingSection from './Mapping';

const OutcomeBoard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/outcome-board/mapping" replace />} />
        <Route path="/masters" element={<MastersSection />} />
        <Route path="/masters/department" element={<MastersSection section="department" />} />
        <Route path="/masters/vision" element={<MastersSection section="vision" />} />
        <Route path="/masters/mission" element={<MastersSection section="mission" />} />
        <Route path="/masters/po" element={<MastersSection section="po" />} />
        <Route path="/masters/co" element={<MastersSection section="co" />} />
        <Route path="/mapping" element={<MappingSection />} />
        <Route path="/attainment" element={<ComingSoon title="Attainment" />} />
        <Route path="/r-path" element={<ComingSoon title="R-Path" />} />
      </Routes>
    </div>
  );
};

// Placeholder component for future sections
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
    <p className="text-gray-600 text-lg">This feature is coming soon!</p>
  </div>
);

export default OutcomeBoard;