import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';

const Home = () => {
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/employee-self-service', { replace: true });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Welcome to SSV Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your processes with our comprehensive solution
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;