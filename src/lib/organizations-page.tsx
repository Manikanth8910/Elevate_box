import { useEffect, useState } from 'react';
import { Building2, Plus, Search, MoreVertical, Edit2, Ban, CheckCircle2, MapPin, Mail, Phone, Globe } from 'lucide-react';
import { supabase } from './supabase';
import { Card, Button, Badge, Modal, Input, Select, PageLoader, EmptyState } from './ui';
import { useToast } from './toast';
import { formatDate, cn } from './utils';
import type { Organization, Device, Profile, SubscriptionTier, OrganizationStatus } from './types';

const statusColors: Record<OrganizationStatus, 'green' | 'slate' | 'red'> = {
  active: 'green',
  inactive: 'slate',
  suspended: 'red',
};

const tierColors: Record<SubscriptionTier, 'cyan' | 'blue' | 'purple'> = {
  starter: 'cyan',
  pro: 'blue',
  enterprise: 'purple',
};

export function OrganizationsPage() {
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deactivatingOrg, setDeactivatingOrg] = useState<Organization | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const loadData = async () => {
    const [orgData, devData, profData] = await Promise.all([
      supabase.from('organizations').select('*').order('created_at', { ascending: false }).then((r) => r.data ?? []),
      supabase.from('devices').select('*').then((r) => r.data ?? []),
      supabase.from('profiles').select('*').then((r) => r.data ?? []),
    ]);
    setOrgs(orgData as Organization[]);
    setDevices(devData as Device[]);
    setProfiles(profData as Profile[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = orgs.filter((o) => {
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase()) || (o.industry ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOrgDeviceCount = (orgId: string) => devices.filter((d) => d.organization_id === orgId).length;
  const getOrgUserCount = (orgId: string) => profiles.filter((p) => p.organization_id === orgId).length;

  const handleDeactivate = async () => {
    if (!deactivatingOrg) return;
    const newStatus = deactivatingOrg.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('organizations').update({ status: newStatus }).eq('id', deactivatingOrg.id);
    if (error) {
      toast('Failed to update organization', 'error');
      return;
    }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: newStatus === 'inactive' ? 'DEACTIVATE_ORGANIZATION' : 'ACTIVATE_ORGANIZATION',
      entity_type: 'organization',
      entity_id: deactivatingOrg.id,
      details: { name: deactivatingOrg.name, new_status: newStatus },
    });
    toast(`Organization ${newStatus === 'inactive' ? 'deactivated' : 'activated'} successfully`, 'success');
    setDeactivatingOrg(null);
    loadData();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </Select>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Create Organization
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Organizations', value: orgs.length, color: 'text-slate-900' },
          { label: 'Active', value: orgs.filter((o) => o.status === 'active').length, color: 'text-emerald-600' },
          { label: 'Suspended', value: orgs.filter((o) => o.status === 'suspended').length, color: 'text-red-600' },
          { label: 'Inactive', value: orgs.filter((o) => o.status === 'inactive').length, color: 'text-slate-500' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-bold {s.color}">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={Building2} title="No organizations found" description="Try adjusting your search or create a new organization." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">Organization</th>
                  <th className="px-6 py-3">Industry</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Devices</th>
                  <th className="px-6 py-3">Users</th>
                  <th className="px-6 py-3">Tier</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((org) => (
                  <tr key={org.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                          <p className="text-xs text-slate-400">{org.contact_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{org.industry ?? '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {org.city ?? '—'}, {org.country ?? '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">{getOrgDeviceCount(org.id)}</span>
                      <span className="text-xs text-slate-400">/{org.max_devices}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">{getOrgUserCount(org.id)}</span>
                      <span className="text-xs text-slate-400">/{org.max_users}</span>
                    </td>
                    <td className="px-6 py-4"><Badge color={tierColors[org.subscription_tier]}>{org.subscription_tier}</Badge></td>
                    <td className="px-6 py-4"><Badge color={statusColors[org.status]}>{org.status}</Badge></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(org.created_at)}</td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === org.id ? null : org.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpen === org.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-6 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl animate-scale-in">
                            <button onClick={() => { setEditingOrg(org); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button onClick={() => { setDeactivatingOrg(org); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              {org.status === 'active' ? <><Ban className="h-3.5 w-3.5" /> Deactivate</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Activate</>}
                            </button>
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

      {showCreate && <CreateOrgModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadData(); }} />}
      {editingOrg && <EditOrgModal org={editingOrg} onClose={() => setEditingOrg(null)} onSaved={() => { setEditingOrg(null); loadData(); }} />}
      {deactivatingOrg && (
        <Modal open onClose={() => setDeactivatingOrg(null)} title={`${deactivatingOrg.status === 'active' ? 'Deactivate' : 'Activate'} Organization`} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {deactivatingOrg.status === 'active'
                ? `Are you sure you want to deactivate "${deactivatingOrg.name}"? This will suspend all device monitoring and alert routing for this organization.`
                : `Are you sure you want to reactivate "${deactivatingOrg.name}"?`}
            </p>
            {deactivatingOrg.status === 'active' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-800">Active Alerts Check</p>
                <p className="mt-1 text-xs text-amber-700">
                  {devices.filter((d) => d.organization_id === deactivatingOrg.id).length} devices will stop reporting.
                  Ensure no critical alerts are open before proceeding.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeactivatingOrg(null)}>Cancel</Button>
              <Button variant={deactivatingOrg.status === 'active' ? 'danger' : 'primary'} onClick={handleDeactivate}>
                {deactivatingOrg.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CreateOrgModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '', industry: '', country: '', city: '', address: '',
    contact_email: '', contact_phone: '', subscription_tier: 'enterprise' as SubscriptionTier,
    admin_name: '', admin_email: '', admin_phone: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.contact_email) {
      toast('Organization name and contact email are required', 'error');
      return;
    }
    setSaving(true);
    const { data: org, error } = await supabase.from('organizations').insert({
      name: form.name,
      industry: form.industry || null,
      country: form.country || null,
      city: form.city || null,
      address: form.address || null,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone || null,
      subscription_tier: form.subscription_tier,
    }).select().single();

    if (error || !org) {
      toast('Failed to create organization', 'error');
      setSaving(false);
      return;
    }

    if (form.admin_name && form.admin_email) {
      await supabase.from('profiles').insert({
        organization_id: org.id,
        full_name: form.admin_name,
        email: form.admin_email,
        phone: form.admin_phone || null,
        role: 'company_admin',
        status: 'invited',
      });
    }

    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'CREATE_ORGANIZATION',
      entity_type: 'organization',
      entity_id: org.id,
      details: { name: form.name, industry: form.industry, admin: form.admin_name },
    });

    toast('Organization created and invitation sent', 'success');
    setSaving(false);
    onCreated();
  };

  return (
    <Modal open onClose={onClose} title="Create Organization" size="lg">
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Organization Details</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Organization Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corp" />
            <Input label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Mining" />
            <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Australia" />
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Perth" />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St" className="col-span-2" />
            <Input label="Contact Email *" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="admin@acme.com" />
            <Input label="Contact Phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+61 4 1234 5678" />
            <Select label="Subscription Tier" value={form.subscription_tier} onChange={(e) => setForm({ ...form, subscription_tier: e.target.value as SubscriptionTier })}>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Company Admin (First User)</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Admin Name" value={form.admin_name} onChange={(e) => setForm({ ...form, admin_name: e.target.value })} placeholder="John Doe" />
            <Input label="Admin Email" type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} placeholder="john@acme.com" />
            <Input label="Admin Phone" value={form.admin_phone} onChange={(e) => setForm({ ...form, admin_phone: e.target.value })} placeholder="+61 4 1234 5678" />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Creating...' : 'Create & Send Invitation'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditOrgModal({ org, onClose, onSaved }: { org: Organization; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: org.name, industry: org.industry ?? '', country: org.country ?? '', city: org.city ?? '',
    address: org.address ?? '', contact_email: org.contact_email ?? '', contact_phone: org.contact_phone ?? '',
    subscription_tier: org.subscription_tier, max_devices: org.max_devices, max_users: org.max_users,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('organizations').update({
      name: form.name,
      industry: form.industry || null,
      country: form.country || null,
      city: form.city || null,
      address: form.address || null,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone || null,
      subscription_tier: form.subscription_tier,
      max_devices: form.max_devices,
      max_users: form.max_users,
    }).eq('id', org.id);

    if (error) {
      toast('Failed to update organization', 'error');
      setSaving(false);
      return;
    }

    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'UPDATE_ORGANIZATION',
      entity_type: 'organization',
      entity_id: org.id,
      details: { name: form.name, fields_updated: ['name', 'industry', 'contact'] },
    });

    toast('Organization updated successfully', 'success');
    setSaving(false);
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${org.name}`} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Organization Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-2" />
          <Input label="Contact Email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          <Input label="Contact Phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          <Select label="Subscription Tier" value={form.subscription_tier} onChange={(e) => setForm({ ...form, subscription_tier: e.target.value as SubscriptionTier })}>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </Select>
          <Input label="Max Devices" type="number" value={form.max_devices} onChange={(e) => setForm({ ...form, max_devices: parseInt(e.target.value) || 0 })} />
          <Input label="Max Users" type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </Modal>
  );
}
