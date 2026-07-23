import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Permission } from '@document-approval/shared';

export const ReviewerDashboard = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  if (!hasPermission(Permission.VIEW_REVIEW_QUEUE)) {
    return <div className="p-8 text-red-500">Access Denied</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reviewer Workspace</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-500">Approved Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-l-4 border-red-500">
          <p className="text-sm font-medium text-gray-500">Rejected Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">2</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-l-4 border-purple-500">
          <p className="text-sm font-medium text-gray-500">Avg. Review Time</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">14m</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <button 
          onClick={() => navigate('/reviews')}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 shadow-sm"
        >
          Open Review Queue
        </button>
      </div>
    </div>
  );
};
