import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '@document-approval/shared';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, hasPermission, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              {user.role}
            </span>
            <span className="text-gray-700">{user.email}</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hasPermission(Permission.CREATE_DRAFT) && (
            <div className="p-4 border rounded shadow-sm">
              <h2 className="font-semibold text-lg">My Drafts</h2>
              <p className="text-sm text-gray-500 mt-2">Create and edit your documents.</p>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                Create New Document
              </button>
            </div>
          )}

          {hasPermission(Permission.VIEW_REVIEW_QUEUE) && (
            <div className="p-4 border rounded shadow-sm">
              <h2 className="font-semibold text-lg">Review Queue</h2>
              <p className="text-sm text-gray-500 mt-2">Documents awaiting your approval.</p>
              <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                Open Queue
              </button>
            </div>
          )}

          {hasPermission(Permission.VIEW_ALL_DOCS) && (
            <div className="p-4 border rounded shadow-sm">
              <h2 className="font-semibold text-lg">System Administration</h2>
              <p className="text-sm text-gray-500 mt-2">Manage all documents and users.</p>
              <button className="mt-4 bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900">
                Go to Admin Panel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
