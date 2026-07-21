import { useState } from 'react';
import { User, Mail, Phone, Save, Shield, Calendar, Building2 } from 'lucide-react';
import { useAuth } from './auth';
import { Card, CardHeader, Button, Input, Badge } from './ui';
import { useToast } from './toast';
import { supabase } from './supabase';
import { formatDate } from './utils';

export function ProfilePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    email: profile?.email ?? user?.email ?? '',
    phone: profile?.phone ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (profile) {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
      }).eq('id', profile.id);
      if (error) { toast('Failed to update profile', 'error'); setSaving(false); return; }
    }
    await supabase.from('audit_logs').insert({
      actor_name: form.full_name || 'Super Admin',
      action: 'UPDATE_PROFILE',
      entity_type: 'profile',
      entity_id: profile?.id,
      details: { fields: ['full_name', 'email', 'phone'] },
    });
    toast('Profile updated successfully', 'success');
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white">
              {(form.full_name || user?.email || 'A')[0].toUpperCase()}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{form.full_name || 'Administrator'}</h2>
            <p className="text-sm text-slate-400">{form.email}</p>
            <Badge color="purple" className="mt-2"><Shield className="h-3 w-3" /> Super Admin</Badge>

            <div className="mt-6 w-full space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Joined</span>
                <span className="ml-auto font-medium text-slate-700">{profile ? formatDate(profile.created_at) : '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Organization</span>
                <span className="ml-auto font-medium text-slate-700">Platform</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">Access Level</span>
                <span className="ml-auto font-medium text-slate-700">Full Access</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardHeader title="Edit Profile" subtitle="Update your personal information" />
          <div className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-slate-400" />
              <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400" />
              <Input label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-slate-400" />
              <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" className="flex-1" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Security</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Password</p>
                  <p className="text-xs text-slate-400">Last changed 30 days ago</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => user?.email && supabase.auth.resetPasswordForEmail(user.email)}>Change Password</Button>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
