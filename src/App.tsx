import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { AppShell, type PageId } from './lib/app-shell';
import { LoginPage } from './lib/login-page';
import { DashboardPage } from './lib/dashboard-page';
import { OrganizationsPage } from './lib/organizations-page';
import { AdminsPage } from './lib/admins-page';
import { HierarchyPage } from './lib/hierarchy-page';
import { DevicesPage } from './lib/devices-page';
import { DeviceHealthPage } from './lib/device-health-page';
import { LiveMapPage } from './lib/live-map-page';
import { AlertsPage } from './lib/alerts-page';
import { AnalyticsPage } from './lib/analytics-page';
import { ReportsPage } from './lib/reports-page';
import { AuditLogsPage } from './lib/audit-logs-page';
import { SettingsPage } from './lib/settings-page';
import { DeveloperApprovalPage } from './lib/developer-approval-page';
import { NotificationsPage } from './lib/notifications-page';
import { ProfilePage } from './lib/profile-page';
import { supabase } from './lib/supabase';
import { PageLoader } from './lib/ui';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<PageId>('dashboard');
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    const fetchAlerts = async () => {
      const { count } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      setAlertCount(count ?? 0);
    };
    fetchAlerts();

    const channel = supabase
      .channel('app-alert-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, fetchAlerts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  if (loading) return <PageLoader />;

  if (!session) return <LoginPage />;

  const pages: Record<PageId, React.ReactNode> = {
    dashboard: <DashboardPage />,
    organizations: <OrganizationsPage />,
    admins: <AdminsPage />,
    hierarchy: <HierarchyPage />,
    devices: <DevicesPage />,
    'device-health': <DeviceHealthPage />,
    'live-map': <LiveMapPage />,
    alerts: <AlertsPage />,
    analytics: <AnalyticsPage />,
    reports: <ReportsPage />,
    'audit-logs': <AuditLogsPage />,
    settings: <SettingsPage />,
    'developer-approval': <DeveloperApprovalPage />,
    notifications: <NotificationsPage />,
    profile: <ProfilePage />,
  };

  return (
    <AppShell currentPage={page} onNavigate={setPage} alertCount={alertCount}>
      {pages[page]}
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
