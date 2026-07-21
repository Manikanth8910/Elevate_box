import { useEffect, useState } from 'react';
import { Users, Plus, Search, MoreVertical, Edit2, Ban, KeyRound, Mail, Phone, Shield } from 'lucide-react';
import { supabase } from './supabase';
import { Card, Button, Badge, Modal, Input, Select, PageLoader, EmptyState } from './ui';
import { useToast } from './toast';
import { formatDate, timeAgo, cn } from './utils';
import type { Profile, Organization, UserRole, ProfileStatus } from './types';

const roleColors: Record<UserRole, 'purple' | 'blue' | 'cyan' | 'amber' | 'slate' | 'green'> = {
  super_admin: 'purple',
  company_admin: 'blue',
  ehs: 'cyan',
  supervisor: 'amber',
  worker: 'slate',
  developer: 'green',
};

const statusColors: Record<ProfileStatus, 'green' | 'slate' | 'amber'> = {
  active: 'green',
  disabled: 'slate',
  invited: 'amber',
};

export function AdminsPage() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [resetProfile, setResetProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const loadData = async () => {
    const [profData, orgData] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).then((r) => r.data ?? []),
      supabase.from('organizations').select('*').then((r) => r.data ?? []),
    ]);
    setProfiles(profData as Profile[]);
    setOrgs(orgData as Organization[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = profiles.filter((p) => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchesOrg = orgFilter === 'all' || p.organization_id === orgFilter;
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesOrg && matchesRole;
  });

  const getOrgName = (orgId: string | null) => orgs.find((o) => o.id === orgId)?.name ?? '—';

  const handleToggleStatus = async (profile: Profile) => {
    const newStatus = profile.status === 'active' ? 'disabled' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', profile.id);
    if (error) { toast('Failed to update status', 'error'); return; }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: newStatus === 'disabled' ? 'DISABLE_USER' : 'ENABLE_USER',
      entity_type: 'profile',
      entity_id: profile.id,
      details: { user: profile.full_name, new_status: newStatus },
    });
    toast(`User ${newStatus === 'disabled' ? 'disabled' : 'enabled'}`, 'success');
    setMenuOpen(null);
    loadData();
  };

  const handleResetPassword = async () => {
    if (!resetProfile) return;
    const { error } = await supabase.auth.resetPasswordForEmail(resetProfile.email);
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'RESET_PASSWORD',
      entity_type: 'profile',
      entity_id: resetProfile.id,
      details: { user: resetProfile.full_name, email: resetProfile.email },
    });
    toast(error ? 'Reset link could not be sent' : 'Password reset link sent', error ? 'error' : 'success');
    setResetProfile(null);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} className="w-40">
            <option value="all">All Organizations</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-36">
            <option value="all">All Roles</option>
            <option value="company_admin">Company Admin</option>
            <option value="ehs">EHS</option>
            <option value="supervisor">Supervisor</option>
            <option value="worker">Worker</option>
          </Select>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add Admin</Button>
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description="Try adjusting filters or add a new company admin." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Organization</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {p.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{p.full_name}</p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getOrgName(p.organization_id)}</td>
                    <td className="px-6 py-4"><Badge color={roleColors[p.role]}>{p.role.replace('_', ' ')}</Badge></td>
                    <td className="px-6 py-4"><Badge color={statusColors[p.status]}>{p.status}</Badge></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(p.created_at)}</td>
                    <td className="px-6 py-4 relative">
                      <button onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpen === p.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-6 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl animate-scale-in">
                            <button onClick={() => { setEditingProfile(p); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button onClick={() => { setResetProfile(p); setMenuOpen(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              <KeyRound className="h-3.5 w-3.5" /> Reset Password
                            </button>
                            <button onClick={() => handleToggleStatus(p)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              <Ban className="h-3.5 w-3.5" /> {p.status === 'active' ? 'Disable' : 'Enable'}
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

      {showCreate && <CreateAdminModal orgs={orgs} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadData(); }} />}
      {editingProfile && <EditAdminModal profile={editingProfile} orgs={orgs} onClose={() => setEditingProfile(null)} onSaved={() => { setEditingProfile(null); loadData(); }} />}
      {resetProfile && (
        <Modal open onClose={() => setResetProfile(null)} title="Reset Password" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">A password reset link will be sent to <span className="font-semibold text-slate-900">{resetProfile.email}</span>.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setResetProfile(null)}>Cancel</Button>
              <Button onClick={handleResetPassword}>Send Reset Link</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CreateAdminModal({ orgs, onClose, onCreated }: { orgs: Organization[]; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', organization_id: '', role: 'company_admin' as UserRole });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.organization_id) {
      toast('Name, email, and organization are required', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').insert({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      organization_id: form.organization_id,
      role: form.role,
      status: 'invited',
    });
    if (error) { toast('Failed to create admin', 'error'); setSaving(false); return; }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'CREATE_COMPANY_ADMIN',
      entity_type: 'profile',
      details: { name: form.full_name, email: form.email, org: orgs.find((o) => o.id === form.organization_id)?.name },
    });
    toast('Admin created and invitation sent', 'success');
    setSaving(false);
    onCreated();
  };

  return (
    <Modal open onClose={onClose} title="Add Company Admin" size="md">
      <div className="space-y-4">
        <Input label="Full Name *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" />
        <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+61 4 1234 5678" />
        <Select label="Organization *" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}>
          <option value="">Select organization</option>
          {orgs.filter((o) => o.status === 'active').map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
        <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
          <option value="company_admin">Company Admin</option>
          <option value="ehs">EHS Officer</option>
          <option value="supervisor">Supervisor</option>
          <option value="worker">Worker</option>
        </Select>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Creating...' : 'Create & Send Invite'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditAdminModal({ profile, orgs, onClose, onSaved }: { profile: Profile; orgs: Organization[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: profile.full_name, email: profile.email, phone: profile.phone ?? '', organization_id: profile.organization_id ?? '', role: profile.role });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      organization_id: form.organization_id || null,
      role: form.role,
    }).eq('id', profile.id);
    if (error) { toast('Failed to update admin', 'error'); setSaving(false); return; }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'UPDATE_PROFILE',
      entity_type: 'profile',
      entity_id: profile.id,
      details: { name: form.full_name, role: form.role },
    });
    toast('Admin updated successfully', 'success');
    setSaving(false);
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${profile.full_name}`} size="md">
      <div className="space-y-4">
        <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Select label="Organization" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}>
          <option value="">No organization</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
        <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
          <option value="company_admin">Company Admin</option>
          <option value="ehs">EHS Officer</option>
          <option value="supervisor">Supervisor</option>
          <option value="worker">Worker</option>
        </Select>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </Modal>
  );
}
