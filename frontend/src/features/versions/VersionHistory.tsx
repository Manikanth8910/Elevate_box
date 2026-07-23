import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api.client';
import { useParams, useNavigate } from 'react-router-dom';

export const VersionHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    ApiClient.get<any[]>(`/documents/${id}/versions`)
      .then(setVersions)
      .catch(console.error);
  }, [id]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Version History</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <ul className="space-y-4">
          {versions.map((version, idx) => (
            <li key={version.id} className="p-4 border rounded hover:bg-gray-50 flex justify-between items-center">
              <div>
                <p className="text-lg font-bold text-gray-900">Version {version.versionNumber}</p>
                <p className="text-sm text-gray-500">{new Date(version.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/documents/${id}/versions/${version.versionNumber}`)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200"
                >
                  View
                </button>
                {idx < versions.length - 1 && (
                  <button 
                    onClick={() => navigate(`/documents/${id}/compare?v1=${version.versionNumber}&v2=${versions[0].versionNumber}`)}
                    className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded font-medium hover:bg-indigo-200"
                  >
                    Compare to Latest
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
