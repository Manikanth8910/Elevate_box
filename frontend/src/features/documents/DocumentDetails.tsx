import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiClient } from '../../services/api.client';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '@document-approval/shared';

export const DocumentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.get<any>(`/documents/${id}`)
      .then(setDoc)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const submitDocument = async () => {
    try {
      await ApiClient.post(`/documents/${id}/submit`, {});
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!doc) return <div className="p-8 text-red-600">Document not found</div>;

  const steps = ['DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED'];
  const currentStepIndex = steps.indexOf(doc.status);

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="bg-white shadow rounded p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{doc.title}</h1>
            <p className="text-sm text-gray-500 mt-1">By {doc.author?.email}</p>
          </div>
          <div className="flex gap-2">
            {doc.status === 'DRAFT' && hasPermission(Permission.EDIT_OWN_DRAFT) && (
              <button onClick={() => navigate(`/documents/${id}/edit`)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium">Edit</button>
            )}
            {doc.status === 'DRAFT' && hasPermission(Permission.SUBMIT_DRAFT) && (
              <button onClick={submitDocument} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium">Submit for Review</button>
            )}
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-8 flex items-center justify-between px-12">
          {steps.map((step, index) => {
            let color = 'bg-gray-200 text-gray-500';
            if (index < currentStepIndex) color = 'bg-green-500 text-white';
            else if (index === currentStepIndex) {
              color = doc.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white';
            }
            return (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${color}`}>
                  {index + 1}
                </div>
                <span className="text-xs font-medium mt-2 text-gray-600">{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body & Meta */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white shadow rounded p-8 prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: doc.body.replace(/\n/g, '<br/>') }} />
        </div>
        
        <div className="col-span-1 space-y-6">
          <div className="bg-white shadow rounded p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Metadata</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between"><span>Version</span> <span className="font-mono">v{doc.version}</span></div>
              <div className="flex justify-between"><span>Words</span> <span>{doc.wordCount}</span></div>
              <div className="flex justify-between"><span>Reading Time</span> <span>{doc.readingTime} min</span></div>
              <div className="flex justify-between"><span>Last Edited</span> <span>{new Date(doc.lastEditedAt).toLocaleDateString()}</span></div>
            </div>
          </div>

          <div className="bg-white shadow rounded p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {doc.workflowHistory?.map((entry: any) => (
                <div key={entry.id} className="text-sm">
                  <span className="text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  <p className="text-gray-900 mt-1">Transitioned to <span className="font-semibold">{entry.toStatus}</span></p>
                  {entry.reason && <p className="text-gray-500 italic mt-1">"{entry.reason}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
