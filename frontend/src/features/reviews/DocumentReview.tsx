import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiClient } from '../../services/api.client';

export const DocumentReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<any>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [conflictError, setConflictError] = useState('');
  
  const fetchDoc = () => {
    ApiClient.get<any>(`/documents/${id}`)
      .then(setDoc)
      .catch(console.error);
  };

  useEffect(() => {
    fetchDoc();
  }, [id]);

  const handleApprove = async () => {
    try {
      await ApiClient.post(`/documents/${id}/approve`, { version: doc.version });
      navigate('/reviews');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictError('This document has changed since you opened it.');
      }
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) return;
    try {
      await ApiClient.post(`/documents/${id}/reject`, { version: doc.version, comment: rejectComment });
      navigate('/reviews');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictError('This document has changed since you opened it.');
      }
    }
  };

  if (!doc) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      {conflictError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex justify-between items-center">
          <div>
            <p className="text-red-700 font-bold">409 Conflict Detected</p>
            <p className="text-red-600">{conflictError}</p>
          </div>
          <button onClick={fetchDoc} className="bg-red-100 text-red-800 px-4 py-2 rounded font-semibold hover:bg-red-200">
            Reload Latest Version
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow rounded p-6 mb-6 flex justify-between items-center border-t-4 border-blue-600">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review: {doc.title}</h1>
          <p className="text-sm text-gray-500 mt-1">Version {doc.version} • Submitted by {doc.author?.email}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowRejectModal(true)}
            className="px-6 py-2 border-2 border-red-500 text-red-600 rounded font-semibold hover:bg-red-50"
          >
            Reject
          </button>
          <button 
            onClick={handleApprove}
            className="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 shadow-md"
          >
            Approve Document
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded p-8 prose max-w-none border">
        <div dangerouslySetInnerHTML={{ __html: doc.body.replace(/\n/g, '<br/>') }} />
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Document</h2>
            <p className="text-sm text-gray-600 mb-2">Please provide a mandatory reason for rejection.</p>
            <textarea
              className="w-full border rounded p-2 focus:ring-2 focus:ring-red-500 outline-none"
              rows={4}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="e.g., Section 2 needs more clarification..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button 
                onClick={handleReject} 
                disabled={!rejectComment.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
