import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Network,
  Smartphone,
  HeartPulse,
  MapPin,
  Bell,
  BarChart3,
  FileText,
  ScrollText,
  Settings,
  Code2,
  User,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from './utils';
import { useAuth } from './auth';

export type PageId =
  | 'dashboard'
  | 'organizations'
  | 'admins'
  | 'hierarchy'
  | 'devices'
  | 'device-health'
  | 'live-map'
  | 'alerts'
  | 'analytics'
  | 'reports'
  | 'audit-logs'
  | 'settings'
  | 'developer-approval'
  | 'notifications'
  | 'profile';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'organizations', label: 'Organizations', icon: Building2, group: 'Management' },
  { id: 'admins', label: 'Company Admins', icon: Users, group: 'Management' },
  { id: 'hierarchy', label: 'Hierarchy', icon: Network, group: 'Management' },
  { id: 'devices', label: 'Device Inventory', icon: Smartphone, group: 'Devices' },
  { id: 'device-health', label: 'Device Health', icon: HeartPulse, group: 'Devices' },
  { id: 'live-map', label: 'Live Map', icon: MapPin, group: 'Monitoring' },
  { id: 'alerts', label: 'Alerts', icon: Bell, group: 'Monitoring' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'Insights' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'Insights' },
  { id: 'audit-logs', label: 'Audit Logs', icon: ScrollText, group: 'System' },
  { id: 'settings', label: 'Platform Settings', icon: Settings, group: 'System' },
  { id: 'developer-approval', label: 'Developer Access', icon: Code2, group: 'System' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'System' },
  { id: 'profile', label: 'Profile', icon: User, group: 'System' },
];

export function AppShell({
  currentPage,
  onNavigate,
  children,
  notificationCount,
  alertCount,
}: {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: ReactNode;
  notificationCount?: number;
  alertCount?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, user, signOut } = useAuth();

  const groups = [...new Set(navItems.map((n) => n.group))];

  const handleNav = (page: PageId) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative z-40 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold tracking-tight text-slate-900">Sentinel EHS</p>
              <p className="text-[10px] text-slate-400">Super Admin Console</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((group) => (
            <div key={group} className="mb-4">
              {!collapsed && (
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{group}</p>
              )}
              {navItems
                .filter((n) => n.group === group)
                .map((item) => {
                  const active = currentPage === item.id;
                  const Icon = item.icon;
                  const badge = item.id === 'alerts' ? alertCount : item.id === 'notifications' ? notificationCount : 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={cn(
                        'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        collapsed && 'justify-center',
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {badge ? (
                        <span className={cn('ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold', active ? 'bg-white text-slate-900' : 'bg-red-500 text-white')}>
                          {badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-slate-100 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-900">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-slate-900 capitalize">
                {navItems.find((n) => n.id === currentPage)?.label ?? 'Dashboard'}
              </h1>
              <p className="hidden text-xs text-slate-400 sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNav('alerts')}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {alertCount ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {alertCount}
                </span>
              ) : null}
            </button>

            <div className="h-6 w-px bg-slate-200" />

            <button onClick={() => handleNav('profile')} className="flex items-center gap-2.5 rounded-lg p-1 pr-2 hover:bg-slate-100 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {(profile?.full_name ?? user?.email ?? 'A')[0].toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-slate-900 truncate max-w-32">{profile?.full_name ?? 'Administrator'}</p>
                <p className="text-[10px] text-slate-400">Super Admin</p>
              </div>
            </button>

            <button onClick={signOut} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Sign out">
              <LogOut className="h-4.5 w-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">{children}</div>
        </main>
      </div>

      {/* Mobile close button */}
      {mobileOpen && (
        <button onClick={() => setMobileOpen(false)} className="fixed right-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg lg:hidden">
          <X className="h-5 w-5 text-slate-600" />
        </button>
      )}
    </div>
  );
}
