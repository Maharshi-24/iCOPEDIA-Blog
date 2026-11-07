import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  Activity, BarChart3, Bell, Building2, Globe, LayoutDashboard, LogOut, Mail, Menu, Newspaper, Smartphone, UserCheck, Users, Video, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminAuthProvider, useAdminAuth } from './auth';
import Login from './Login';
import { Loading } from './shared';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import LoginAccess from './pages/LoginAccess';
import Notifications from './pages/Notifications';
import EmailPage from './pages/Email';
import Versions from './pages/Versions';
import UsersPage from './pages/Users';
import Companies from './pages/Companies';
import Organizations from './pages/Organizations';
import Videos from './pages/Videos';
import News from './pages/News';
import ActivityLog from './pages/Activity';

const NAV = [
  { to: '', label: 'Overview', icon: LayoutDashboard, element: <Overview /> },
  { to: 'analytics', label: 'Usage analytics', icon: BarChart3, element: <Analytics /> },
  { to: 'login-access', label: 'Login access', icon: UserCheck, element: <LoginAccess /> },
  { to: 'notifications', label: 'Notifications', icon: Bell, element: <Notifications /> },
  { to: 'email', label: 'Email', icon: Mail, element: <EmailPage /> },
  { to: 'versions', label: 'App versions', icon: Smartphone, element: <Versions /> },
  { to: 'users', label: 'Users & roles', icon: Users, element: <UsersPage /> },
  { to: 'companies', label: 'Companies', icon: Building2, element: <Companies /> },
  { to: 'organizations', label: 'Domains', icon: Globe, element: <Organizations /> },
  { to: 'videos', label: 'Tutorial videos', icon: Video, element: <Videos /> },
  { to: 'news', label: 'News', icon: Newspaper, element: <News /> },
  { to: 'activity', label: 'Change history', icon: Activity, element: <ActivityLog /> },
];

export default function AdminApp() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'iCOPEDIA Admin';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      meta.remove();
    };
  }, []);

  return (
    <AdminAuthProvider>
      <Gate />
    </AdminAuthProvider>
  );
}

function Gate() {
  const { loading, session, isAdmin } = useAdminAuth();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loading /></div>;
  }
  if (!session || !isAdmin) return <Login notAdmin={!!session && !isAdmin} />;
  return <Shell />;
}

function Shell() {
  const { profile, signOut } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to === '' ? '/admin' : `/admin/${to}`} end={to === ''}
          className={({ isActive }) => cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          )}>
          <Icon className="h-4 w-4" /> {label}
        </NavLink>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-slate-200 pt-4">
      <div className="truncate px-3 text-sm font-medium text-slate-900">{profile?.full_name || 'Admin'}</div>
      <div className="truncate px-3 text-xs text-slate-500">{profile?.phone_no}</div>
      <button onClick={signOut}
        className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-3">
      <img src="/icopedia-logo.png" alt="" className="h-8 w-8 rounded-md object-contain" />
      <div className="text-sm font-semibold text-slate-900">iCOPEDIA Admin</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col justify-between border-r border-slate-200 bg-white p-4 lg:flex">
        <div className="space-y-6">{brand}{nav}</div>
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        {brand}
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-md p-1.5 hover:bg-slate-100">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col justify-between bg-white p-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                {brand}
                <button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {nav}
            </div>
            {footer}
          </div>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:ml-60 lg:px-10 lg:py-8">
        {/* The mail client is a three-pane app and needs the full width. */}
        <div className={cn('mx-auto', location.pathname.startsWith('/admin/email') ? 'max-w-[1600px]' : 'max-w-6xl')}>
          <Routes>
            {NAV.map(({ to, element }) => (
              <Route key={to} index={to === ''} path={to === '' ? undefined : to} element={element} />
            ))}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
