import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield, Cpu, Globe, Database } from 'lucide-react';
import { supabase } from './supabase';
import { Card, CardHeader, Button, Input, Badge, PageLoader } from './ui';
import { useToast } from './toast';
import { cn } from './utils';
import type { PlatformSetting } from './types';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  alerts: Bell,
  security: Shield,
  devices: Cpu,
  realtime: Activity,
  general: Globe,
  reports: Database,
  developer: Cpu,
};

const categoryLabels: Record<string, string> = {
  alerts: 'Alert Configuration',
  security: 'Security Settings',
  devices: 'Device Management',
  realtime: 'Real-time & WebSocket',
  general: 'General Settings',
  reports: 'Report Settings',
  developer: 'Developer Portal',
};

function Activity({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
}

export function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('platform_settings').select('*').order('category, key');
      setSettings((data ?? []) as PlatformSetting[]);
      setLoading(false);
    })();
  }, []);

  const categories = [...new Set(settings.map((s) => s.category))];

  const getValue = (setting: PlatformSetting) => {
    if (editedValues[setting.key] !== undefined) return editedValues[setting.key];
    const v = setting.value;
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return String(v ?? '');
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues({ ...editedValues, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(editedValues)) {
      const setting = settings.find((s) => s.key === key);
      if (!setting) continue;
      const parsedValue = value === 'true' ? true : value === 'false' ? false : value;
      await supabase.from('platform_settings').update({ value: parsedValue }).eq('id', setting.id);
    }
    await supabase.from('audit_logs').insert({
      actor_name: 'Super Admin',
      action: 'UPDATE_PLATFORM_SETTINGS',
      entity_type: 'platform_settings',
      details: { updated_keys: Object.keys(editedValues) },
    });
    toast('Settings saved successfully', 'success');
    setEditedValues({});
    setSaving(false);
    const { data } = await supabase.from('platform_settings').select('*').order('category, key');
    setSettings((data ?? []) as PlatformSetting[]);
  };

  if (loading) return <PageLoader />;

  const hasChanges = Object.keys(editedValues).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Platform Configuration</h2>
          <p className="text-xs text-slate-400">Manage global settings across the platform</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
          {hasChanges && <Badge color="amber" className="ml-1">{Object.keys(editedValues).length}</Badge>}
        </Button>
      </div>

      {categories.map((cat) => {
        const Icon = categoryIcons[cat] ?? SettingsIcon;
        const catSettings = settings.filter((s) => s.category === cat);
        return (
          <Card key={cat}>
            <CardHeader title={categoryLabels[cat] ?? cat} subtitle={`${catSettings.length} settings`} action={
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100"><Icon className="h-4 w-4 text-slate-600" /></div>
            } />
            <div className="divide-y divide-slate-50">
              {catSettings.map((s) => {
                const isBoolean = s.value === true || s.value === false || s.value === 'true' || s.value === 'false';
                const isEdited = editedValues[s.key] !== undefined;
                return (
                  <div key={s.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{s.key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                        {isEdited && <Badge color="amber">Modified</Badge>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">{s.category}</p>
                    </div>
                    <div className="w-64">
                      {isBoolean ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleChange(s.key, getValue(s) === 'true' ? 'false' : 'true')}
                            className={cn(
                              'relative h-6 w-11 rounded-full transition-colors',
                              getValue(s) === 'true' ? 'bg-emerald-500' : 'bg-slate-300',
                            )}
                          >
                            <span className={cn(
                              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                              getValue(s) === 'true' ? 'translate-x-5' : 'translate-x-0.5',
                            )} />
                          </button>
                          <span className="text-xs font-medium text-slate-600">{getValue(s) === 'true' ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      ) : (
                        <Input
                          value={getValue(s)}
                          onChange={(e) => handleChange(s.key, e.target.value)}
                          className="w-full"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
