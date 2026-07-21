import { useEffect, useState } from 'react';
import { Code2, Check, X, Clock, Mail, Building2, Key } from 'lucide-react';
import { supabase } from './supabase';
import { Card, CardHeader, Badge, Button, PageLoader, EmptyState } from './ui';
import { useToast } from './toast';
import { formatDate, timeAgo } from './utils';
import type { DeveloperRequest, DeveloperRequestStatus } from './types';

const statusColors: Record<DeveloperRequestStatus, 'amber' | 'green' | 'red'> = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
};

export function DeveloperApprovalPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<DeveloperRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { data } = await supabase.from('developer_requests').select('*').order('created_at', { ascending: false });
    setRequests((data ?? []) as DeveloperRequest[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (req: DeveloperRequest) => {
    const { error } = await supabase.from('developer_requests').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.id);
    if (error) { toast('Failed to approve request', 'error'); return; }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'APPROVE_DEVELOPER',
      entity_type: 'developer_request',
      entity_id: req.id,
      details: { developer: req.developer_name, scopes: req.scopes },
    });
    toast('Developer access approved', 'success');
    loadData();
  };

  const handleReject = async (req: DeveloperRequest) => {
    const { error } = await supabase.from('developer_requests').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.id);
    if (error) { toast('Failed to reject request', 'error'); return; }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'REJECT_DEVELOPER',
      entity_type: 'developer_request',
      entity_id: req.id,
      details: { developer: req.developer_name },
    });
    toast('Developer request rejected', 'success');
    loadData();
  };

  if (loading) return <PageLoader />;

  const pending = requests.filter((r) => r.status === 'pending');
  const approved = requests.filter((r) => r.status === 'approved');
  const rejected = requests.filter((r) => r.status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50"><Clock className="h-4 w-4 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{pending.length}</p><p className="text-xs text-slate-500">Pending</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50"><Check className="h-4 w-4 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{approved.length}</p><p className="text-xs text-slate-500">Approved</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50"><X className="h-4 w-4 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{rejected.length}</p><p className="text-xs text-slate-500">Rejected</p></div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Developer Access Requests" subtitle="API access approval queue" action={<Badge color="blue"><Code2 className="h-3 w-3" /> API Portal</Badge>} />
        {requests.length === 0 ? (
          <EmptyState icon={Code2} title="No requests" description="No developer access requests at this time." />
        ) : (
          <div className="divide-y divide-slate-50">
            {requests.map((req) => (
              <div key={req.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Code2 className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{req.developer_name}</p>
                        <Badge color={statusColors[req.status]}>{req.status}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {req.developer_email}</span>
                        {req.organization && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {req.organization}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(req.created_at)}</span>
                      </div>
                      {req.purpose && <p className="mt-2 text-sm text-slate-600">{req.purpose}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {req.scopes.split(',').map((scope) => (
                          <span key={scope} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                            <Key className="h-3 w-3" /> {scope.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleReject(req)}><X className="h-3.5 w-3.5" /> Reject</Button>
                      <Button size="sm" onClick={() => handleApprove(req)}><Check className="h-3.5 w-3.5" /> Approve</Button>
                    </div>
                  )}
                  {req.reviewed_at && (
                    <p className="text-xs text-slate-400 shrink-0">Reviewed {formatDate(req.reviewed_at)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
