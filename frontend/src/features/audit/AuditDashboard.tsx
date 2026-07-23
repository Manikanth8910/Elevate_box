import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api.client';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '@document-approval/shared';

export const AuditDashboard = () => {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (hasPermission(Permission.VIEW_USERS)) { // Proxy for Admin check
      ApiClient.get<{ logs: any[] }>('/system/audit')
        .then((res) => setLogs(res.logs))
        .catch(console.error);
    }
  }, [hasPermission]);

  if (!hasPermission(Permission.VIEW_USERS)) return <div className="p-8 text-red-500">Access Denied</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Audit Log</h1>
      <p className="text-gray-500 text-sm">Immutable records of all system state changes.</p>
      
      <div className="overflow-x-auto bg-white shadow rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actor ID</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Entity</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                  {new Date(log.timestamp).toISOString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {log.action}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {log.actorId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.entityType} ({log.entityId.slice(0, 8)}...)
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
