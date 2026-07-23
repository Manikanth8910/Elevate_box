import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api.client';
import { useParams, useSearchParams } from 'react-router-dom';

export const VersionCompare = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const v1 = searchParams.get('v1');
  const v2 = searchParams.get('v2');
  
  const [diff, setDiff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.get<any>(`/documents/${id}/compare?v1=${v1}&v2=${v2}`)
      .then(res => setDiff(res.diff))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, v1, v2]);

  if (loading) return <div className="p-8">Loading comparison...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Comparing Version {v1} to {v2}</h1>
      
      <div className="bg-white shadow rounded p-8 prose max-w-none font-mono text-sm leading-relaxed border">
        {diff.map((part, index) => {
          let color = 'text-gray-800';
          let bg = '';
          
          if (part.added) {
            color = 'text-green-800';
            bg = 'bg-green-100';
          } else if (part.removed) {
            color = 'text-red-800';
            bg = 'bg-red-100 line-through opacity-75';
          }

          return (
            <span key={index} className={`${color} ${bg} px-1 rounded`}>
              {part.value}
            </span>
          );
        })}
      </div>
    </div>
  );
};
