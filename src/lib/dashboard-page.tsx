import { useEffect, useState } from 'react';
import { Building2, Smartphone, AlertTriangle, Users, TrendingUp, TrendingDown, Activity, Clock, ShieldCheck } from 'lucide-react';
import { supabase } from './supabase';
import { Card, CardHeader, Badge, PageLoader } from './ui';
import { LineChart, BarChart, DonutChart, Sparkline } from './charts';
import { cn, timeAgo, avg } from './utils';
import type { Alert, Device, Organization, Profile } from './types';

interface DashboardData {
  orgs: Organization[];
  devices: Device[];
  alerts: Alert[];
  profiles: Profile[];
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      const [orgs, devices, alerts, profiles] = await Promise.all([
        supabase.from('organizations').select('*').then((r) => r.data ?? []),
        supabase.from('devices').select('*').then((r) => r.data ?? []),
        supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(50).then((r) => r.data ?? []),
        supabase.from('profiles').select('*').then((r) => r.data ?? []),
      ]);
      setData({ orgs, devices, alerts, profiles } as DashboardData);
    })();

    // Real-time subscriptions
    const alertChannel = supabase
      .channel('dashboard-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(50).then((r) => {
          setData((prev) => (prev ? { ...prev, alerts: r.data ?? [] } : prev));
        });
      })
      .subscribe();

    const deviceChannel = supabase
      .channel('dashboard-devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        supabase.from('devices').select('*').then((r) => {
          setData((prev) => (prev ? { ...prev, devices: r.data ?? [] } : prev));
        });
      })
      .subscribe();

    // Simulate live updates
    const interval = setInterval(() => setTick((t) => t + 1), 5000);

    return () => {
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(deviceChannel);
      clearInterval(interval);
    };
  }, []);

  if (!data) return <PageLoader />;

  const activeOrgs = data.orgs.filter((o) => o.status === 'active').length;
  const onlineDevices = data.devices.filter((d) => d.connectivity === 'online').length;
  const openAlerts = data.alerts.filter((a) => a.status === 'open').length;
  const totalUsers = data.profiles.length;
  const avgBattery = Math.round(avg(data.devices.map((d) => d.battery_level)));

  const kpis = [
    { label: 'Active Organizations', value: activeOrgs, total: data.orgs.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+2 this month', trendUp: true, spark: [5, 6, 6, 7, 7, 8, activeOrgs] },
    { label: 'Online Devices', value: onlineDevices, total: data.devices.length, icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `${Math.round((onlineDevices / data.devices.length) * 100)}% uptime`, trendUp: true, spark: [12, 14, 13, 15, 16, 15, onlineDevices] },
    { label: 'Open Alerts', value: openAlerts, total: data.alerts.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', trend: openAlerts > 3 ? 'Needs attention' : 'Under control', trendUp: openAlerts <= 3, spark: [8, 5, 7, 4, 6, 3, openAlerts] },
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50', trend: '+12 this week', trendUp: true, spark: [10, 12, 15, 16, 18, 19, totalUsers] },
  ];

  // Alert trend over last 7 days
  const alertTrend = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const dayStr = day.toISOString().slice(0, 10);
    const count = data.alerts.filter((a) => a.created_at.slice(0, 10) === dayStr).length;
    return { label: day.toLocaleDateString('en-US', { weekday: 'short' }), value: count };
  });

  // Alerts by type
  const alertTypes = ['sos', 'fall', 'geofence', 'low_battery', 'tamper', 'panic', 'impact'];
  const alertByType = alertTypes.map((t) => ({
    label: t.replace('_', ' '),
    value: data.alerts.filter((a) => a.type === t).length,
    color: { sos: '#ef4444', fall: '#f97316', geofence: '#eab308', low_battery: '#3b82f6', tamper: '#a855f7', panic: '#ec4899', impact: '#06b6d4' }[t] ?? '#64748b',
  })).filter((d) => d.value > 0);

  // Device status distribution
  const deviceStatusData = [
    { label: 'Online', value: data.devices.filter((d) => d.connectivity === 'online').length, color: '#10b981' },
    { label: 'Degraded', value: data.devices.filter((d) => d.connectivity === 'degraded').length, color: '#f59e0b' },
    { label: 'Offline', value: data.devices.filter((d) => d.connectivity === 'offline').length, color: '#ef4444' },
  ];

  // Org distribution by industry
  const industryData: Record<string, number> = {};
  data.orgs.forEach((o) => {
    const ind = o.industry ?? 'Unknown';
    industryData[ind] = (industryData[ind] ?? 0) + 1;
  });
  const industryBars = Object.entries(industryData).map(([label, value]) => ({ label, value }));

  const recentAlerts = data.alerts.slice(0, 6);
  const severityColors = { low: 'slate', medium: 'amber', high: 'red', critical: 'red' } as const;
  const typeIcons: Record<string, string> = { sos: 'SOS', fall: 'FALL', geofence: 'GEO', low_battery: 'BAT', tamper: 'TMP', panic: 'PNC', impact: 'IMP' };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', kpi.bg)}>
                    <Icon className={cn('h-5 w-5', kpi.color)} />
                  </div>
                  {kpi.spark && <Sparkline data={kpi.spark} color={kpi.color.replace('text-', '#').replace('-600', '')} width={64} height={28} />}
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{kpi.value}</p>
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs">
                  {kpi.trendUp ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
                  <span className={kpi.trendUp ? 'text-emerald-600' : 'text-red-600'}>{kpi.trend}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Alert Activity" subtitle="Last 7 days" action={<Badge color="red"><Activity className="h-3 w-3" /> Live</Badge>} />
          <div className="p-6">
            <LineChart data={alertTrend} height={220} color="#ef4444" fill="rgba(239,68,68,0.08)" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Device Status" subtitle="Fleet connectivity" />
          <div className="flex items-center justify-center p-6">
            <DonutChart data={deviceStatusData} centerValue={data.devices.length.toString()} centerLabel="Total" />
          </div>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Alerts by Type" subtitle="Distribution across all orgs" />
          <div className="p-6">
            <BarChart data={alertByType} height={200} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Organizations by Industry" subtitle="Tenant distribution" />
          <div className="p-6">
            <BarChart data={industryBars} height={200} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Fleet Health" subtitle="Key metrics" />
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm text-slate-600">Avg Battery</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{avgBattery}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${avgBattery}%` }} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-slate-600">Uptime (24h)</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{Math.round((onlineDevices / data.devices.length) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${(onlineDevices / data.devices.length) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm text-slate-600">Avg Response</span>
              </div>
              <span className="text-lg font-bold text-slate-900">4.2m</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: '72%' }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent alerts */}
      <Card>
        <CardHeader title="Recent Alerts" subtitle="Live alert stream" action={<Badge color="red"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> {openAlerts} Open</Badge>} />
        <div className="divide-y divide-slate-50">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors">
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold',
                alert.severity === 'critical' ? 'bg-red-100 text-red-700' : alert.severity === 'high' ? 'bg-orange-100 text-orange-700' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600',
              )}>
                {typeIcons[alert.type] ?? alert.type.slice(0, 3).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{alert.message}</p>
                <p className="text-xs text-slate-400">{timeAgo(alert.created_at)}</p>
              </div>
              <Badge color={severityColors[alert.severity]}>{alert.severity}</Badge>
              <Badge color={alert.status === 'open' ? 'red' : alert.status === 'acknowledged' ? 'amber' : 'green'}>{alert.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
