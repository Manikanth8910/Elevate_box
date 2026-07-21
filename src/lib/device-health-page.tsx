import { useEffect, useState } from 'react';
import { HeartPulse, Battery, Wifi, Cpu, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from './supabase';
import { Card, CardHeader, Badge, PageLoader } from './ui';
import { LineChart, BarChart, DonutChart, ProgressRing } from './charts';
import { cn, avg, timeAgo } from './utils';
import type { Device, Organization } from './types';

export function DeviceHealthPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [devData, orgData] = await Promise.all([
        supabase.from('devices').select('*').then((r) => r.data ?? []),
        supabase.from('organizations').select('*').then((r) => r.data ?? []),
      ]);
      setDevices(devData as Device[]);
      setOrgs(orgData as Organization[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoader />;

  const total = devices.length;
  const online = devices.filter((d) => d.connectivity === 'online');
  const degraded = devices.filter((d) => d.connectivity === 'degraded');
  const offline = devices.filter((d) => d.connectivity === 'offline');
  const avgBattery = Math.round(avg(devices.map((d) => d.battery_level)));
  const lowBattery = devices.filter((d) => d.battery_level < 25);
  const needsMaintenance = devices.filter((d) => d.status === 'maintenance' || d.connectivity === 'offline');

  // Battery distribution
  const batteryBuckets = [
    { label: '0-20%', value: devices.filter((d) => d.battery_level <= 20).length, color: 'bg-red-500' },
    { label: '21-50%', value: devices.filter((d) => d.battery_level > 20 && d.battery_level <= 50).length, color: 'bg-amber-500' },
    { label: '51-80%', value: devices.filter((d) => d.battery_level > 50 && d.battery_level <= 80).length, color: 'bg-blue-500' },
    { label: '81-100%', value: devices.filter((d) => d.battery_level > 80).length, color: 'bg-emerald-500' },
  ];

  // Firmware distribution
  const firmwareVersions: Record<string, number> = {};
  devices.forEach((d) => {
    const fw = d.firmware_version ?? 'Unknown';
    firmwareVersions[fw] = (firmwareVersions[fw] ?? 0) + 1;
  });
  const firmwareData = Object.entries(firmwareVersions).map(([label, value], i) => ({
    label,
    value,
    color: ['bg-slate-800', 'bg-slate-600', 'bg-slate-400', 'bg-slate-300'][i % 4],
  }));

  // Connectivity donut
  const connectivityData = [
    { label: 'Online', value: online.length, color: '#10b981' },
    { label: 'Degraded', value: degraded.length, color: '#f59e0b' },
    { label: 'Offline', value: offline.length, color: '#ef4444' },
  ];

  // Simulated uptime trend
  const uptimeTrend = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    return { label: day.toLocaleDateString('en-US', { weekday: 'short' }), value: 90 + Math.floor(Math.random() * 10) };
  });

  const getOrgName = (orgId: string | null) => orgs.find((o) => o.id === orgId)?.name ?? 'Unassigned';

  return (
    <div className="space-y-6">
      {/* Fleet stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">{total}</p>
              <p className="text-sm text-slate-500">Total Fleet</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <HeartPulse className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-emerald-600">{Math.round((online.length / total) * 100)}%</p>
              <p className="text-sm text-slate-500">Uptime</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-amber-600">{avgBattery}%</p>
              <p className="text-sm text-slate-500">Avg Battery</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Battery className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-red-600">{needsMaintenance.length}</p>
              <p className="text-sm text-slate-500">Need Attention</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Uptime Trend" subtitle="Last 7 days fleet uptime" action={<Badge color="green"><Activity className="h-3 w-3" /> Live</Badge>} />
          <div className="p-6">
            <LineChart data={uptimeTrend} height={220} color="#10b981" fill="rgba(16,185,129,0.08)" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Connectivity" subtitle="Fleet status" />
          <div className="flex items-center justify-center p-6">
            <DonutChart data={connectivityData} centerValue={total.toString()} centerLabel="Devices" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Battery Distribution" subtitle="Fleet battery health" />
          <div className="p-6">
            <BarChart data={batteryBuckets} height={200} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Firmware Versions" subtitle="Firmware distribution" />
          <div className="p-6">
            <BarChart data={firmwareData} height={200} />
          </div>
        </Card>
      </div>

      {/* Device health list */}
      <Card>
        <CardHeader title="Device Health Monitor" subtitle="Real-time device status" action={<Badge color="green"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Monitoring</Badge>} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3">Device</th>
                <th className="px-6 py-3">Organization</th>
                <th className="px-6 py-3">Battery</th>
                <th className="px-6 py-3">Connectivity</th>
                <th className="px-6 py-3">Firmware</th>
                <th className="px-6 py-3">Last Seen</th>
                <th className="px-6 py-3">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {devices.map((d) => {
                const health = d.connectivity === 'online' && d.battery_level > 50 ? 'healthy' : d.connectivity === 'offline' || d.battery_level < 20 ? 'critical' : 'warning';
                return (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{d.uid}</p>
                      <p className="text-xs text-slate-400">{d.name ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getOrgName(d.organization_id)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Battery className={cn('h-4 w-4', d.battery_level > 50 ? 'text-emerald-500' : d.battery_level > 20 ? 'text-amber-500' : 'text-red-500')} />
                        <span className="text-sm font-medium text-slate-700">{d.battery_level}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Wifi className={cn('h-3.5 w-3.5', d.connectivity === 'online' ? 'text-emerald-500' : d.connectivity === 'degraded' ? 'text-amber-500' : 'text-slate-300')} />
                        <span className="text-sm text-slate-600">{d.connectivity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm text-slate-600">{d.firmware_version ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{d.last_seen_at ? timeAgo(d.last_seen_at) : '—'}</td>
                    <td className="px-6 py-4">
                      <Badge color={health === 'healthy' ? 'green' : health === 'warning' ? 'amber' : 'red'}>
                        {health === 'healthy' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {health}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
