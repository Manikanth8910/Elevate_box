import { useEffect, useState } from 'react';
import { BarChart3, Clock, Activity, TrendingUp, AlertTriangle, Download } from 'lucide-react';
import { supabase } from './supabase';
import { Card, CardHeader, Badge, Button, Select, PageLoader } from './ui';
import { LineChart, BarChart, DonutChart } from './charts';
import { cn, avg, formatDuration } from './utils';
import type { Alert, Device, Organization } from './types';

export function AnalyticsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    (async () => {
      const [alertData, devData, orgData] = await Promise.all([
        supabase.from('alerts').select('*').order('created_at', { ascending: false }).then((r) => r.data ?? []),
        supabase.from('devices').select('*').then((r) => r.data ?? []),
        supabase.from('organizations').select('*').then((r) => r.data ?? []),
      ]);
      setAlerts(alertData as Alert[]);
      setDevices(devData as Device[]);
      setOrgs(orgData as Organization[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoader />;

  const days = parseInt(dateRange);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const rangeAlerts = alerts.filter((a) => new Date(a.created_at) >= cutoff);

  // MTTA (Mean Time to Acknowledge)
  const ackAlerts = rangeAlerts.filter((a) => a.acknowledged_at);
  const mtta = ackAlerts.length > 0
    ? avg(ackAlerts.map((a) => (new Date(a.acknowledged_at!).getTime() - new Date(a.created_at).getTime()) / 60000))
    : 0;

  // MTTR (Mean Time to Resolve)
  const resolvedAlerts = rangeAlerts.filter((a) => a.resolved_at);
  const mttr = resolvedAlerts.length > 0
    ? avg(resolvedAlerts.map((a) => (new Date(a.resolved_at!).getTime() - new Date(a.created_at).getTime()) / 60000))
    : 0;

  // SOS trend
  const sosTrend = Array.from({ length: days > 30 ? 30 : days }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (days > 30 ? 29 - i : days - 1 - i));
    const dayStr = day.toISOString().slice(0, 10);
    const count = rangeAlerts.filter((a) => a.type === 'sos' && a.created_at.slice(0, 10) === dayStr).length;
    return { label: day.toLocaleDateString('en-US', { day: 'numeric', month: days > 30 ? undefined : 'short' }), value: count };
  });

  // Alerts by type
  const alertTypes = ['sos', 'fall', 'geofence', 'low_battery', 'tamper', 'panic', 'impact'];
  const byType = alertTypes.map((t) => ({
    label: t.replace('_', ' '),
    value: rangeAlerts.filter((a) => a.type === t).length,
    color: { sos: '#ef4444', fall: '#f97316', geofence: '#eab308', low_battery: '#3b82f6', tamper: '#a855f7', panic: '#ec4899', impact: '#06b6d4' }[t],
  })).filter((d) => d.value > 0);

  // Alerts by org
  const byOrg = orgs.map((o) => ({
    label: o.name.split(' ')[0],
    value: rangeAlerts.filter((a) => a.organization_id === o.id).length,
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

  // Severity distribution
  const severityData = [
    { label: 'Critical', value: rangeAlerts.filter((a) => a.severity === 'critical').length, color: '#ef4444' },
    { label: 'High', value: rangeAlerts.filter((a) => a.severity === 'high').length, color: '#f97316' },
    { label: 'Medium', value: rangeAlerts.filter((a) => a.severity === 'medium').length, color: '#f59e0b' },
    { label: 'Low', value: rangeAlerts.filter((a) => a.severity === 'low').length, color: '#64748b' },
  ].filter((d) => d.value > 0);

  // Fleet stats
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.connectivity === 'online').length;
  const avgBattery = Math.round(avg(devices.map((d) => d.battery_level)));
  const uptime = Math.round((onlineDevices / totalDevices) * 100);

  // Daily alert volume
  const dailyVolume = Array.from({ length: days > 30 ? 30 : days }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (days > 30 ? 29 - i : days - 1 - i));
    const dayStr = day.toISOString().slice(0, 10);
    return { label: day.toLocaleDateString('en-US', { day: 'numeric' }), value: rangeAlerts.filter((a) => a.created_at.slice(0, 10) === dayStr).length };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="w-40">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
          <Badge color="blue">{rangeAlerts.length} alerts in range</Badge>
        </div>
        <Button variant="outline"><Download className="h-4 w-4" /> Export Analytics</Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-3xl font-bold text-slate-900">{formatDuration(Math.round(mtta))}</p><p className="text-sm text-slate-500">MTTA</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50"><Clock className="h-5 w-5 text-blue-600" /></div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Mean time to acknowledge</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-3xl font-bold text-slate-900">{formatDuration(Math.round(mttr))}</p><p className="text-sm text-slate-500">MTTR</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50"><Activity className="h-5 w-5 text-emerald-600" /></div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Mean time to resolve</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-3xl font-bold text-slate-900">{rangeAlerts.filter((a) => a.type === 'sos').length}</p><p className="text-sm text-slate-500">SOS Events</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
          </div>
          <p className="mt-2 text-xs text-slate-400">In selected period</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div><p className="text-3xl font-bold text-slate-900">{uptime}%</p><p className="text-sm text-slate-500">Fleet Uptime</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50"><TrendingUp className="h-5 w-5 text-cyan-600" /></div>
          </div>
          <p className="mt-2 text-xs text-slate-400">{onlineDevices}/{totalDevices} devices online</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="SOS Trends" subtitle="SOS alerts over time" />
          <div className="p-6"><LineChart data={sosTrend} height={240} color="#ef4444" fill="rgba(239,68,68,0.08)" /></div>
        </Card>
        <Card>
          <CardHeader title="Severity Distribution" subtitle="Alert breakdown" />
          <div className="flex items-center justify-center p-6"><DonutChart data={severityData} centerValue={rangeAlerts.length.toString()} centerLabel="Alerts" /></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Alerts by Type" subtitle="All alert categories" />
          <div className="p-6"><BarChart data={byType} height={220} /></div>
        </Card>
        <Card>
          <CardHeader title="Alerts by Organization" subtitle="Top organizations" />
          <div className="p-6"><BarChart data={byOrg} height={220} /></div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Daily Alert Volume" subtitle="Total alerts per day" />
        <div className="p-6"><LineChart data={dailyVolume} height={240} color="#0ea5e9" fill="rgba(14,165,233,0.08)" /></div>
      </Card>

      {/* Fleet stats */}
      <Card>
        <CardHeader title="Fleet Statistics" subtitle="Device fleet overview" />
        <div className="grid grid-cols-2 gap-4 p-6 lg:grid-cols-4">
          {[
            { label: 'Total Devices', value: totalDevices, color: 'text-slate-900' },
            { label: 'Online', value: onlineDevices, color: 'text-emerald-600' },
            { label: 'Avg Battery', value: `${avgBattery}%`, color: 'text-amber-600' },
            { label: 'Needs Attention', value: devices.filter((d) => d.connectivity !== 'online' || d.battery_level < 25).length, color: 'text-red-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-slate-50 p-4">
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
