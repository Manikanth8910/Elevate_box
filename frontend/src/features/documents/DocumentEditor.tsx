import React, { useState } from 'react';
import { ApiClient } from '../../services/api.client';
import { useNavigate } from 'react-router-dom';

export const DocumentEditor = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  const handleSave = async () => {
    setSaving(true);
    try {
      const doc = await ApiClient.post<{ id: string }>('/documents', { title, body });
      navigate(`/documents/${doc.id}`);
    } catch (err) {
      console.error('Failed to save document', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow mt-8 rounded">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Create Draft</h1>
        <div className="flex gap-2 text-sm text-gray-500">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>~{readingTime} min read</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Document Title</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            placeholder="Enter title here..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Content</label>
          <textarea
            rows={15}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
            placeholder="Start writing..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 border text-gray-700 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || title.length < 5 || body.length < 20}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  );
};
