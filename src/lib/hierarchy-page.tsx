import { useEffect, useState } from 'react';
import { Network, ChevronRight, ChevronDown, Building2, Shield, HardHat, User, Mail, Phone } from 'lucide-react';
import { supabase } from './supabase';
import { Card, CardHeader, Badge, Select, PageLoader, EmptyState } from './ui';
import { cn } from './utils';
import type { Profile, Organization, UserRole } from './types';

const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  super_admin: Shield,
  company_admin: Building2,
  ehs: Shield,
  supervisor: HardHat,
  worker: User,
  developer: User,
};

const roleColors: Record<UserRole, 'purple' | 'blue' | 'cyan' | 'amber' | 'slate' | 'green'> = {
  super_admin: 'purple',
  company_admin: 'blue',
  ehs: 'cyan',
  supervisor: 'amber',
  worker: 'slate',
  developer: 'green',
};

export function HierarchyPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const [orgData, profData] = await Promise.all([
        supabase.from('organizations').select('*').order('name').then((r) => r.data ?? []),
        supabase.from('profiles').select('*').then((r) => r.data ?? []),
      ]);
      setOrgs(orgData as Organization[]);
      setProfiles(profData as Profile[]);
      if (orgData.length > 0) setSelectedOrg((orgData[0] as Organization).id);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoader />;

  const orgProfiles = profiles.filter((p) => p.organization_id === selectedOrg);
  const org = orgs.find((o) => o.id === selectedOrg);

  const buildTree = (parentId: string | null): Profile[] => {
    return orgProfiles
      .filter((p) => p.parent_id === parentId)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderNode = (profile: Profile, depth: number): React.ReactNode => {
    const children = buildTree(profile.id);
    const isExpanded = expanded.has(profile.id);
    const Icon = roleIcons[profile.role];
    const isSelected = selectedProfile?.id === profile.id;

    return (
      <div key={profile.id}>
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg py-2 pr-3 transition-colors cursor-pointer hover:bg-slate-50',
            isSelected && 'bg-blue-50',
          )}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          onClick={() => setSelectedProfile(profile)}
        >
          {children.length > 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggle(profile.id); }}
              className="rounded p-0.5 text-slate-400 hover:text-slate-700"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            profile.role === 'company_admin' ? 'bg-blue-100' : profile.role === 'ehs' ? 'bg-cyan-100' : profile.role === 'supervisor' ? 'bg-amber-100' : 'bg-slate-100',
          )}>
            <Icon className={cn(
              'h-4 w-4',
              profile.role === 'company_admin' ? 'text-blue-600' : profile.role === 'ehs' ? 'text-cyan-600' : profile.role === 'supervisor' ? 'text-amber-600' : 'text-slate-500',
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-slate-400 truncate">{profile.email}</p>
          </div>
          <Badge color={roleColors[profile.role]}>{profile.role.replace('_', ' ')}</Badge>
          {children.length > 0 && <span className="text-xs text-slate-400">{children.length}</span>}
        </div>
        {isExpanded && children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  const roots = buildTree(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={selectedOrg} onChange={(e) => { setSelectedOrg(e.target.value); setSelectedProfile(null); setExpanded(new Set()); }} className="w-72">
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
        <div className="flex items-center gap-4 text-xs">
          {(['company_admin', 'ehs', 'supervisor', 'worker'] as UserRole[]).map((r) => {
            const Icon = roleIcons[r];
            return (
              <div key={r} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500 capitalize">{r.replace('_', ' ')}</span>
                <span className="font-semibold text-slate-700">{orgProfiles.filter((p) => p.role === r).length}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={`${org?.name ?? 'Organization'} Hierarchy`} subtitle={`${orgProfiles.length} users total`} />
          <div className="p-3">
            {roots.length === 0 ? (
              <EmptyState icon={Network} title="No hierarchy data" description="This organization has no users yet." />
            ) : (
              <div className="space-y-0.5">
                {roots.map((root) => renderNode(root, 0))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="User Details" subtitle="Selected user info" />
          <div className="p-6">
            {selectedProfile ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">
                    {selectedProfile.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-900">{selectedProfile.full_name}</p>
                  <Badge color={roleColors[selectedProfile.role]} className="mt-1">{selectedProfile.role.replace('_', ' ')}</Badge>
                </div>
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{selectedProfile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{selectedProfile.phone ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{org?.name ?? '—'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{selectedProfile.status}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Direct Reports</p>
                    <p className="text-sm font-semibold text-slate-900">{buildTree(selectedProfile.id).length}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <User className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-400">Select a user to view details</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
