import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, XCircle, Clock, AlertTriangle, Shield, Filter } from 'lucide-react';
import { supabase } from './supabase';
import { Card, CardHeader, Badge, Button, Select, PageLoader, EmptyState } from './ui';
import { useToast } from './toast';
import { cn, timeAgo, formatDateTime } from './utils';
import type { Alert, Device, Organization, AlertStatus, AlertSeverity, AlertType } from './types';

const severityColors: Record<AlertSeverity, 'slate' | 'amber' | 'red' | 'red'> = {
  low: 'slate',
  medium: 'amber',
  high: 'red',
  critical: 'red',
};

const statusColors: Record<AlertStatus, 'red' | 'amber' | 'green' | 'slate'> = {
  open: 'red',
  acknowledged: 'amber',
  resolved: 'green',
  cancelled: 'slate',
};

const typeColors: Record<AlertType, string> = {
  sos: 'bg-red-100 text-red-700',
  fall: 'bg-orange-100 text-orange-700',
  geofence: 'bg-yellow-100 text-yellow-700',
  low_battery: 'bg-blue-100 text-blue-700',
  tamper: 'bg-violet-100 text-violet-700',
  panic: 'bg-pink-100 text-pink-700',
  impact: 'bg-cyan-100 text-cyan-700',
};

export function AlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const loadData = async () => {
    const [alertData, devData, orgData] = await Promise.all([
      supabase.from('alerts').select('*').order('created_at', { ascending: false }).then((r) => r.data ?? []),
      supabase.from('devices').select('*').then((r) => r.data ?? []),
      supabase.from('organizations').select('*').then((r) => r.data ?? []),
    ]);
    setAlerts(alertData as Alert[]);
    setDevices(devData as Device[]);
    setOrgs(orgData as Organization[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('alerts-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = alerts.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const getDevice = (id: string) => devices.find((d) => d.id === id);
  const getOrgName = (id: string | null) => orgs.find((o) => o.id === id)?.name ?? '—';

  const handleAcknowledge = async (alert: Alert) => {
    const { error } = await supabase.from('alerts').update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
    }).eq('id', alert.id);
    if (error) { toast('Failed to acknowledge alert', 'error'); return; }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'ACKNOWLEDGE_ALERT',
      entity_type: 'alert',
      entity_id: alert.id,
      details: { alert_type: alert.type, severity: alert.severity },
    });
    toast('Alert acknowledged', 'success');
    setSelectedAlert(null);
    loadData();
  };

  const handleCancel = async (alert: Alert) => {
    const { error } = await supabase.from('alerts').update({
      status: 'cancelled',
      resolved_at: new Date().toISOString(),
    }).eq('id', alert.id);
    if (error) { toast('Failed to cancel alert', 'error'); return; }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'CANCEL_ALERT',
      entity_type: 'alert',
      entity_id: alert.id,
      details: { alert_type: alert.type },
    });
    toast('Alert cancelled', 'success');
    setSelectedAlert(null);
    loadData();
  };

  const handleResolve = async (alert: Alert) => {
    const { error } = await supabase.from('alerts').update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    }).eq('id', alert.id);
    if (error) { toast('Failed to resolve alert', 'error'); return; }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'RESOLVE_ALERT',
      entity_type: 'alert',
      entity_id: alert.id,
      details: { alert_type: alert.type },
    });
    toast('Alert resolved', 'success');
    setSelectedAlert(null);
    loadData();
  };

  if (loading) return <PageLoader />;

  const openCount = alerts.filter((a) => a.status === 'open').length;
  const ackCount = alerts.filter((a) => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50"><AlertTriangle className="h-4 w-4 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{openCount}</p><p className="text-xs text-slate-500">Open</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50"><Clock className="h-4 w-4 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{ackCount}</p><p className="text-xs text-slate-500">Acknowledged</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{resolvedCount}</p><p className="text-xs text-slate-500">Resolved</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100"><Shield className="h-4 w-4 text-red-700" /></div>
            <div><p className="text-2xl font-bold text-red-600">{criticalCount}</p><p className="text-xs text-slate-500">Critical Open</p></div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="w-36">
          <option value="all">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={Bell} title="No alerts found" description="All clear! No alerts match your filters." />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((alert) => {
              const device = getDevice(alert.device_id);
              const isSOS = alert.type === 'sos';
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer',
                    isSOS && alert.status === 'open' && 'bg-red-50/50',
                  )}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold', typeColors[alert.type])}>
                    {alert.type === 'sos' ? 'SOS' : alert.type.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{alert.message}</p>
                      {isSOS && alert.status === 'open' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {device?.uid ?? 'Unknown device'} · {getOrgName(alert.organization_id)} · {timeAgo(alert.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={severityColors[alert.severity]}>{alert.severity}</Badge>
                    <Badge color={statusColors[alert.status]}>{alert.status}</Badge>
                  </div>
                  {alert.status === 'open' && (
                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert); }}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Ack
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedAlert(null)} />
          <Card className="relative w-full max-w-lg animate-scale-in">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold', typeColors[selectedAlert.type])}>
                    {selectedAlert.type === 'sos' ? 'SOS' : selectedAlert.type.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 capitalize">{selectedAlert.type.replace('_', ' ')} Alert</h2>
                    <p className="text-xs text-slate-400">{formatDateTime(selectedAlert.created_at)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Alert Message</p>
                <p className="mt-1 text-sm text-slate-700">{selectedAlert.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Device</p>
                  <p className="text-sm font-semibold text-slate-900">{getDevice(selectedAlert.device_id)?.uid ?? '—'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Organization</p>
                  <p className="text-sm font-semibold text-slate-900">{getOrgName(selectedAlert.organization_id)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Severity</p>
                  <Badge color={severityColors[selectedAlert.severity]}>{selectedAlert.severity}</Badge>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Status</p>
                  <Badge color={statusColors[selectedAlert.status]}>{selectedAlert.status}</Badge>
                </div>
              </div>
              {selectedAlert.latitude && selectedAlert.longitude && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="text-sm font-mono text-slate-700">{selectedAlert.latitude.toFixed(4)}, {selectedAlert.longitude.toFixed(4)}</p>
                </div>
              )}
              {selectedAlert.acknowledged_at && (
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-xs text-amber-600">Acknowledged at {formatDateTime(selectedAlert.acknowledged_at)}</p>
                </div>
              )}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                {selectedAlert.status === 'open' && (
                  <>
                    <Button variant="outline" onClick={() => handleCancel(selectedAlert)}><XCircle className="h-4 w-4" /> Cancel</Button>
                    <Button onClick={() => handleAcknowledge(selectedAlert)}><CheckCircle2 className="h-4 w-4" /> Acknowledge</Button>
                  </>
                )}
                {selectedAlert.status === 'acknowledged' && (
                  <>
                    <Button variant="outline" onClick={() => handleCancel(selectedAlert)}><XCircle className="h-4 w-4" /> Cancel</Button>
                    <Button onClick={() => handleResolve(selectedAlert)}><CheckCircle2 className="h-4 w-4" /> Resolve</Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
