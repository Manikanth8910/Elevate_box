import { useEffect, useState, useRef } from 'react';
import { MapPin, AlertTriangle, Crosshair, Layers, Maximize2 } from 'lucide-react';
import { supabase } from './supabase';
import { Card, Badge, PageLoader } from './ui';
import { cn } from './utils';
import type { Device, Alert, Organization } from './types';

export function LiveMapPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showSOSOnly, setShowSOSOnly] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    (async () => {
      const [devData, alertData, orgData] = await Promise.all([
        supabase.from('devices').select('*').then((r) => r.data ?? []),
        supabase.from('alerts').select('*').eq('status', 'open').order('created_at', { ascending: false }).then((r) => r.data ?? []),
        supabase.from('organizations').select('*').then((r) => r.data ?? []),
      ]);
      setDevices(devData as Device[]);
      setAlerts(alertData as Alert[]);
      setOrgs(orgData as Organization[]);
      setLoading(false);
    })();

    // Simulate live location updates
    const interval = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => {
          if (!d.latitude || !d.longitude || d.connectivity !== 'online') return d;
          return {
            ...d,
            latitude: d.latitude + (Math.random() - 0.5) * 0.001,
            longitude: d.longitude + (Math.random() - 0.5) * 0.001,
          };
        }),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <PageLoader />;

  const locatedDevices = devices.filter((d) => d.latitude && d.longitude);
  const displayedDevices = showSOSOnly
    ? locatedDevices.filter((d) => alerts.some((a) => a.device_id === d.id && a.type === 'sos'))
    : locatedDevices;

  // World map bounds
  const minLat = -50, maxLat = 70, minLng = -130, maxLng = 150;
  const width = 1000, height = 500;

  const projectX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * width;
  const projectY = (lat: number) => height - ((lat - minLat) / (maxLat - minLat)) * height;

  const getDeviceAlerts = (deviceId: string) => alerts.filter((a) => a.device_id === deviceId);
  const getOrgName = (orgId: string | null) => orgs.find((o) => o.id === orgId)?.name ?? 'Unassigned';

  const sosDevices = locatedDevices.filter((d) => alerts.some((a) => a.device_id === d.id && a.type === 'sos'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge color="green"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking</Badge>
          <span className="text-sm text-slate-500">{displayedDevices.length} devices on map</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSOSOnly(!showSOSOnly)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              showSOSOnly ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            <AlertTriangle className="h-4 w-4" /> SOS Only ({sosDevices.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Map */}
        <Card className="lg:col-span-3 overflow-hidden">
          <div className="relative bg-slate-900" style={{ aspectRatio: '2 / 1' }}>
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
                </pattern>
                <radialGradient id="sosGlow">
                  <stop offset="0%" stopColor="rgba(239,68,68,0.4)" />
                  <stop offset="100%" stopColor="rgba(239,68,68,0)" />
                </radialGradient>
              </defs>
              <rect width={width} height={height} fill="#0f172a" />
              <rect width={width} height={height} fill="url(#grid)" />

              {/* Continent shapes (simplified) */}
              {[
                { cx: 200, cy: 180, rx: 120, ry: 80, fill: 'rgba(30,41,59,0.6)' },
                { cx: 480, cy: 150, rx: 100, ry: 70, fill: 'rgba(30,41,59,0.6)' },
                { cx: 550, cy: 280, rx: 80, ry: 100, fill: 'rgba(30,41,59,0.6)' },
                { cx: 780, cy: 200, rx: 130, ry: 90, fill: 'rgba(30,41,59,0.6)' },
                { cx: 820, cy: 350, rx: 70, ry: 50, fill: 'rgba(30,41,59,0.6)' },
              ].map((c, i) => (
                <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={c.fill} stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
              ))}

              {/* Device markers */}
              {displayedDevices.map((d) => {
                const x = projectX(d.longitude!);
                const y = projectY(d.latitude!);
                const deviceAlerts = getDeviceAlerts(d.id);
                const hasSOS = deviceAlerts.some((a) => a.type === 'sos');
                const hasAlert = deviceAlerts.length > 0;
                const isSelected = selectedDevice?.id === d.id;

                return (
                  <g key={d.id} onClick={() => setSelectedDevice(d)} className="cursor-pointer">
                    {hasSOS && (
                      <>
                        <circle cx={x} cy={y} r="20" fill="url(#sosGlow)" className="animate-pulse" />
                        <circle cx={x} cy={y} r="8" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-pulse-ring" style={{ transformOrigin: `${x}px ${y}px` }} />
                      </>
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 7 : 5}
                      fill={hasSOS ? '#ef4444' : hasAlert ? '#f59e0b' : d.connectivity === 'online' ? '#10b981' : '#64748b'}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      className="transition-all"
                    />
                    {isSelected && (
                      <circle cx={x} cy={y} r="12" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 3" />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend overlay */}
            <div className="absolute bottom-4 left-4 rounded-xl bg-slate-900/80 backdrop-blur px-4 py-3 text-xs text-slate-300">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Online</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Alert</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" /> SOS</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> Offline</div>
              </div>
            </div>

            {/* Stats overlay */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="rounded-xl bg-slate-900/80 backdrop-blur px-3 py-2 text-xs text-slate-300">
                <span className="font-semibold text-white">{displayedDevices.length}</span> tracked
              </div>
              {sosDevices.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl bg-red-500/20 backdrop-blur px-3 py-2 text-xs text-red-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="font-semibold">{sosDevices.length} SOS active</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {selectedDevice ? (
            <Card>
              <div className="border-b border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Device Details</h3>
                  <button onClick={() => setSelectedDevice(null)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-xs text-slate-400">Device UID</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedDevice.uid}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Name / Model</p>
                  <p className="text-sm text-slate-700">{selectedDevice.name ?? '—'} · {selectedDevice.model ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Organization</p>
                  <p className="text-sm text-slate-700">{getOrgName(selectedDevice.organization_id)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-xs text-slate-400">Battery</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedDevice.battery_level}%</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{selectedDevice.connectivity}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Coordinates</p>
                  <p className="text-sm font-mono text-slate-700">{selectedDevice.latitude?.toFixed(4)}, {selectedDevice.longitude?.toFixed(4)}</p>
                </div>
                {getDeviceAlerts(selectedDevice.id).length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-700">Active Alerts ({getDeviceAlerts(selectedDevice.id).length})</p>
                    {getDeviceAlerts(selectedDevice.id).map((a) => (
                      <div key={a.id} className={cn('rounded-lg border p-2', a.type === 'sos' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50')}>
                        <div className="flex items-center justify-between">
                          <Badge color={a.type === 'sos' ? 'red' : 'amber'}>{a.type}</Badge>
                          <span className="text-xs text-slate-400">{a.severity}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{a.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <Crosshair className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">Click a marker to view device details</p>
            </Card>
          )}

          {/* SOS alerts list */}
          {sosDevices.length > 0 && (
            <Card>
              <div className="border-b border-slate-100 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-slate-900">SOS Alerts</h3>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {sosDevices.map((d) => {
                  const sosAlert = alerts.find((a) => a.device_id === d.id && a.type === 'sos');
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDevice(d)}
                      className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="relative">
                        <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                        <span className="relative flex h-3 w-3 rounded-full bg-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{d.uid}</p>
                        <p className="text-xs text-slate-400 truncate">{sosAlert?.message}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
