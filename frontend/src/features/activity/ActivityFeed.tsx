import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api.client';

export const ActivityFeed = () => {
  const [feed, setFeed] = useState<any[]>([]);

  useEffect(() => {
    ApiClient.get<{ feed: any[] }>('/system/activity')
      .then((res) => setFeed(res.feed))
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Global Activity Feed</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <ul className="space-y-8">
          {feed.map((item) => (
            <li key={item.id} className="relative flex gap-4">
              <div className="absolute left-4 top-10 -bottom-8 w-px bg-gray-200"></div>
              
              <div className="relative z-10 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white flex-shrink-0">
                <span className="text-indigo-600 text-xs font-bold">
                  {item.actor.firstName[0]}
                </span>
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-medium text-gray-900">
                    {item.actor.firstName} {item.actor.lastName} 
                    <span className="font-normal text-gray-500 ml-1">
                      {item.action.toLowerCase()} {item.document ? `"${item.document.title}"` : 'a document'}
                    </span>
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </li>
          ))}
          {feed.length === 0 && (
            <div className="text-center text-gray-500">No recent activity.</div>
          )}
        </ul>
      </div>
    </div>
  );
};
