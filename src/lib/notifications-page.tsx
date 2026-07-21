import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from './supabase';
import { Card, CardHeader, Badge, Button, PageLoader, EmptyState } from './ui';
import { useToast } from './toast';
import { cn, timeAgo } from './utils';
import { useAuth } from './auth';
import type { Notification, NotificationType } from './types';

const typeIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
  alert: AlertCircle,
};

const typeColors: Record<NotificationType, string> = {
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  error: 'bg-red-100 text-red-600',
  alert: 'bg-red-100 text-red-600',
};

export function NotificationsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  // Simulated notifications for demo when no user notifications exist
  const displayNotifications = notifications.length > 0 ? notifications : [
    { id: 'demo-1', user_id: null, title: 'SOS Alert Triggered', message: 'Worker Emma Wilson triggered an SOS at Mine Shaft 3', type: 'alert' as NotificationType, read: false, link: '/alerts', created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
    { id: 'demo-2', user_id: null, title: 'New Organization Created', message: 'Pacifica Offshore has been added to the platform', type: 'success' as NotificationType, read: false, link: '/organizations', created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-3', user_id: null, title: 'Device Battery Low', message: 'Gas detector DEV-HELIOS-003 battery at 15%', type: 'warning' as NotificationType, read: false, link: '/device-health', created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString() },
    { id: 'demo-4', user_id: null, title: 'Developer Access Request', message: 'David Kim requested API access for read:devices,read:alerts', type: 'info' as NotificationType, read: true, link: '/developer-approval', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'demo-5', user_id: null, title: 'Report Generated', message: 'Monthly Safety Summary - June 2026 is ready for download', type: 'info' as NotificationType, read: true, link: '/reports', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const handleMarkAllRead = async () => {
    if (user) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast('All notifications marked as read', 'success');
  };

  const handleDelete = async (id: string) => {
    if (user) {
      await supabase.from('notifications').delete().eq('id', id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast('Notification deleted', 'success');
  };

  if (loading) return <PageLoader />;

  const unreadCount = displayNotifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Notification Center</h2>
          <p className="text-xs text-slate-400">{unreadCount} unread of {displayNotifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}><CheckCheck className="h-4 w-4" /> Mark All Read</Button>
        )}
      </div>

      <Card>
        {displayNotifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="divide-y divide-slate-50">
            {displayNotifications.map((n) => {
              const Icon = typeIcons[n.type];
              return (
                <div key={n.id} className={cn('flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group', !n.read && 'bg-blue-50/30')}>
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', typeColors[n.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <button onClick={() => handleDelete(n.id)} className="rounded-lg p-1.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
