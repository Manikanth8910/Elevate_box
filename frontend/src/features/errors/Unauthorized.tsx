import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-red-600">403</h1>
      <h2 className="text-2xl font-semibold mt-4 text-gray-900">Access Denied</h2>
      <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
      <button 
        onClick={() => navigate('/dashboard')}
        className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Return to Dashboard
      </button>
    </div>
  );
};
