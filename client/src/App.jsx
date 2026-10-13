import { useEffect, useState } from 'react';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import CrmPage from './pages/CrmPage';
import AdminUsersPage from './pages/AdminUsersPage';
import { api } from './services/api';

const routes = new Set(['dashboard', 'customers', 'leads', 'opportunities', 'follow-ups', 'activities', 'admin']);
const currentRoute = () => {
  const route = window.location.hash.replace(/^#/, '') || 'dashboard';
  return routes.has(route) ? route : 'dashboard';
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState(window.location.hash === '#register');
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const onHashChange = () => {
      setRegister(window.location.hash === '#register');
      setRoute(currentRoute());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    api('/auth/me').then((data) => setUser(data.user)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="grid min-h-screen place-items-center">Restoring session…</main>;
  if (!user) return <><AuthPage mode={register ? 'register' : 'login'} onSuccess={async (form) => {
    const data = await api(register ? '/auth/register' : '/auth/login', { method: 'POST', body: JSON.stringify(form) });
    setUser(data.user);
    window.location.hash = '#dashboard';
  }}/><button className="fixed bottom-4 left-1/2 -translate-x-1/2 text-sm text-brand-600" onClick={() => { window.location.hash = register ? '#login' : '#register'; }}>{register ? 'Already have an account? Sign in' : 'Need an account? Register'}</button></>;

  const page = route === 'dashboard' ? <DashboardPage user={user} />
    : route === 'admin' ? <AdminUsersPage />
    : <CrmPage module={route} />;

  return <AppLayout user={user} activeRoute={route} onLogout={async () => { await api('/auth/logout', { method: 'POST' }); setUser(null); window.location.hash = '#login'; }}>{page}</AppLayout>;
}
