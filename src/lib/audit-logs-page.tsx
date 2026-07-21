import { useEffect, useState } from 'react';
import { ScrollText, Search, Download, User, Activity } from 'lucide-react';
import { supabase } from './supabase';
import { Card, CardHeader, Badge, Button, Select, Input, PageLoader, EmptyState } from './ui';
import { useToast } from './toast';
import { formatDateTime, downloadFile } from './utils';
import type { AuditLog } from './types';

const actionColors: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'purple'> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  DEACTIVATE: 'red',
  ACTIVATE: 'green',
  ALLOCATE: 'blue',
  DEALLOCATE: 'amber',
  REGISTER: 'green',
  ACKNOWLEDGE: 'amber',
  CANCEL: 'red',
  RESOLVE: 'green',
  RESET: 'amber',
  DISABLE: 'red',
  ENABLE: 'green',
  ESCALATE: 'red',
  GENERATE: 'blue',
  APPROVE: 'green',
  REJECT: 'red',
  SYSTEM: 'slate',
};

function getActionColor(action: string): 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'purple' {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.includes(key)) return color;
  }
  return 'slate';
}

export function AuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      setLogs((data ?? []) as AuditLog[]);
      setLoading(false);
    })();
  }, []);

  const actions = [...new Set(logs.map((l) => l.action))];
  const entities = [...new Set(logs.map((l) => l.entity_type).filter(Boolean))] as string[];

  const filtered = logs.filter((l) => {
    const matchesSearch = !search ||
      (l.actor_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.details ? JSON.stringify(l.details).toLowerCase().includes(search.toLowerCase()) : false);
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || l.entity_type === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const handleExport = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Details'];
    const rows = filtered.map((l) => [
      formatDateTime(l.created_at),
      l.actor_name ?? '—',
      l.action,
      l.entity_type ?? '—',
      l.entity_id ?? '—',
      l.ip_address ?? '—',
      l.details ? JSON.stringify(l.details) : '—',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    downloadFile('audit_logs.csv', csv, 'text/csv');
    toast('Audit logs exported', 'success');
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search by actor, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-44">
            <option value="all">All Actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="w-36">
            <option value="all">All Entities</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Audit Trail" subtitle={`${filtered.length} records`} action={<Badge color="slate"><Activity className="h-3 w-3" /> Immutable</Badge>} />
        {filtered.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audit logs found" description="Try adjusting your search or filters." />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  {log.actor_name === 'System' ? <Activity className="h-4 w-4 text-slate-500" /> : <User className="h-4 w-4 text-slate-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{log.actor_name ?? 'Unknown'}</p>
                    <Badge color={getActionColor(log.action)}>{log.action}</Badge>
                    {log.entity_type && <span className="text-xs text-slate-400">on {log.entity_type}</span>}
                  </div>
                  {log.details && (
                    <pre className="mt-1 text-xs text-slate-500 overflow-x-auto">{JSON.stringify(log.details)}</pre>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span>{formatDateTime(log.created_at)}</span>
                    {log.ip_address && <span>· {log.ip_address}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
