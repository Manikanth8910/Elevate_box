import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api.client';
import { useNavigate } from 'react-router-dom';

export const ReviewQueue = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    ApiClient.get<{ documents: any[] }>('/reviews')
      .then((res) => setDocuments(res.documents))
      .catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <div className="text-sm text-gray-500">
          Showing {documents.length} pending reviews
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr 
                key={doc.id} 
                onClick={() => navigate(`/reviews/${doc.id}`)}
                className="hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">HIGH</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.author?.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.readingTime} min</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(doc.submittedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No documents waiting for review. You're all caught up!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
