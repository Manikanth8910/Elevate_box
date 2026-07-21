import { useEffect, useState } from 'react';
import { Smartphone, Plus, Search, QrCode, MoreVertical, Send, Battery, Wifi, MapPin } from 'lucide-react';
import { supabase } from './supabase';
import { Card, Button, Badge, Modal, Input, Select, PageLoader, EmptyState } from './ui';
import { useToast } from './toast';
import { cn, timeAgo, formatDate } from './utils';
import type { Device, Organization, DeviceConnectivity, DeviceStatus } from './types';

const connectivityColors: Record<DeviceConnectivity, 'green' | 'amber' | 'red'> = {
  online: 'green',
  degraded: 'amber',
  offline: 'red',
};

const statusColors: Record<DeviceStatus, 'blue' | 'green' | 'amber' | 'slate'> = {
  available: 'slate',
  allocated: 'blue',
  maintenance: 'amber',
  retired: 'slate',
};

export function DevicesPage() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRegister, setShowRegister] = useState(false);
  const [allocatingDevice, setAllocatingDevice] = useState<Device | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const loadData = async () => {
    const [devData, orgData] = await Promise.all([
      supabase.from('devices').select('*').order('registered_at', { ascending: false }).then((r) => r.data ?? []),
      supabase.from('organizations').select('*').then((r) => r.data ?? []),
    ]);
    setDevices(devData as Device[]);
    setOrgs(orgData as Organization[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = devices.filter((d) => {
    const matchesSearch = d.uid.toLowerCase().includes(search.toLowerCase()) || (d.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOrgName = (orgId: string | null) => orgs.find((o) => o.id === orgId)?.name ?? 'Unassigned';

  const batteryColor = (level: number) => level > 50 ? 'text-emerald-600' : level > 20 ? 'text-amber-600' : 'text-red-600';
  const batteryBg = (level: number) => level > 50 ? 'bg-emerald-500' : level > 20 ? 'bg-amber-500' : 'bg-red-500';

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search by UID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="allocated">Allocated</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </Select>
          <Button onClick={() => setShowRegister(true)}><Plus className="h-4 w-4" /> Register Device</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Total Devices', value: devices.length, color: 'text-slate-900' },
          { label: 'Available', value: devices.filter((d) => d.status === 'available').length, color: 'text-slate-600' },
          { label: 'Allocated', value: devices.filter((d) => d.status === 'allocated').length, color: 'text-blue-600' },
          { label: 'Online', value: devices.filter((d) => d.connectivity === 'online').length, color: 'text-emerald-600' },
          { label: 'Needs Attention', value: devices.filter((d) => d.connectivity !== 'online' || d.battery_level < 25).length, color: 'text-red-600' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={Smartphone} title="No devices found" description="Register a new device or adjust your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">Device</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Battery</th>
                  <th className="px-6 py-3">Connectivity</th>
                  <th className="px-6 py-3">Organization</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Seen</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                          <Smartphone className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{d.uid}</p>
                          <p className="text-xs text-slate-400">{d.name ?? 'Unnamed'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{d.model ?? '—'}</p>
                      <p className="text-xs text-slate-400">FW {d.firmware_version ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={cn('h-full rounded-full', batteryBg(d.battery_level))} style={{ width: `${d.battery_level}%` }} />
                        </div>
                        <span className={cn('text-xs font-semibold', batteryColor(d.battery_level))}>{d.battery_level}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Wifi className={cn('h-3.5 w-3.5', d.connectivity === 'online' ? 'text-emerald-500' : d.connectivity === 'degraded' ? 'text-amber-500' : 'text-slate-300')} />
                        <Badge color={connectivityColors[d.connectivity]}>{d.connectivity}</Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getOrgName(d.organization_id)}</td>
                    <td className="px-6 py-4"><Badge color={statusColors[d.status]}>{d.status}</Badge></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{d.last_seen_at ? timeAgo(d.last_seen_at) : '—'}</td>
                    <td className="px-6 py-4 relative">
                      <button onClick={() => setMenuOpen(menuOpen === d.id ? null : d.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpen === d.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-6 top-12 z-20 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-xl animate-scale-in">
                            {d.status === 'available' && (
                              <button onClick={() => { setAllocatingDevice(d); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                <Send className="h-3.5 w-3.5" /> Allocate
                              </button>
                            )}
                            {d.organization_id && (
                              <button onClick={async () => {
                                await supabase.from('devices').update({ organization_id: null, status: 'available' }).eq('id', d.id);
                                await supabase.from('audit_logs').insert({ actor_name: 'Super Admin', action: 'DEALLOCATE_DEVICE', entity_type: 'device', entity_id: d.id, details: { uid: d.uid } });
                                toast('Device deallocated', 'success');
                                setMenuOpen(null);
                                loadData();
                              }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                <Send className="h-3.5 w-3.5 rotate-180" /> Deallocate
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showRegister && <RegisterDeviceModal onClose={() => setShowRegister(false)} onRegistered={() => { setShowRegister(false); loadData(); }} />}
      {allocatingDevice && <AllocateDeviceModal device={allocatingDevice} orgs={orgs.filter((o) => o.status === 'active')} onClose={() => setAllocatingDevice(null)} onAllocated={() => { setAllocatingDevice(null); loadData(); }} />}
    </div>
  );
}

function RegisterDeviceModal({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ uid: '', name: '', model: '', firmware_version: '' });
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      const uid = `DEV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      setForm((f) => ({ ...f, uid }));
      setScanning(false);
      toast('QR code scanned: ' + uid, 'success');
    }, 1200);
  };

  const handleSubmit = async () => {
    if (!form.uid) { toast('Device UID is required', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('devices').insert({
      uid: form.uid,
      name: form.name || null,
      model: form.model || null,
      firmware_version: form.firmware_version || null,
      status: 'available',
      connectivity: 'online',
      battery_level: 100,
    });
    if (error) { toast('Failed to register device: ' + error.message, 'error'); setSaving(false); return; }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'REGISTER_DEVICE',
      entity_type: 'device',
      details: { uid: form.uid, model: form.model },
    });
    toast('Device registered successfully', 'success');
    setSaving(false);
    onRegistered();
  };

  return (
    <Modal open onClose={onClose} title="Register Device" size="md">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Scan QR / Barcode</p>
              <p className="text-xs text-slate-400">Or enter UID manually below</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning}>
              <QrCode className="h-4 w-4" /> {scanning ? 'Scanning...' : 'Scan'}
            </Button>
          </div>
          {scanning && (
            <div className="mt-3 flex items-center justify-center py-6">
              <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin" />
            </div>
          )}
        </div>
        <Input label="Device UID *" value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })} placeholder="DEV-XXXX-001" />
        <Input label="Device Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Wearable Sensor W1" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="SafeWatch Pro X3" />
          <Input label="Firmware Version" value={form.firmware_version} onChange={(e) => setForm({ ...form, firmware_version: e.target.value })} placeholder="2.4.1" />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Registering...' : 'Register Device'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function AllocateDeviceModal({ device, orgs, onClose, onAllocated }: { device: Device; orgs: Organization[]; onClose: () => void; onAllocated: () => void }) {
  const { toast } = useToast();
  const [orgId, setOrgId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAllocate = async () => {
    if (!orgId) { toast('Select an organization', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('devices').update({ organization_id: orgId, status: 'allocated' }).eq('id', device.id);
    if (error) { toast('Failed to allocate device', 'error'); setSaving(false); return; }
    await supabase.from('device_allocations').insert({ device_id: device.id, organization_id: orgId });
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'ALLOCATE_DEVICE',
      entity_type: 'device',
      entity_id: device.id,
      details: { uid: device.uid, org: orgs.find((o) => o.id === orgId)?.name },
    });
    toast('Device allocated successfully', 'success');
    setSaving(false);
    onAllocated();
  };

  return (
    <Modal open onClose={onClose} title={`Allocate ${device.uid}`} size="sm">
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-400">Device</p>
          <p className="text-sm font-semibold text-slate-900">{device.uid} — {device.name ?? 'Unnamed'}</p>
          <p className="text-xs text-slate-500">{device.model ?? 'Unknown model'}</p>
        </div>
        <Select label="Assign to Organization *" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
          <option value="">Select organization</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAllocate} disabled={saving}>{saving ? 'Allocating...' : 'Allocate Device'}</Button>
        </div>
      </div>
    </Modal>
  );
}
