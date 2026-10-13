import { useEffect, useRef, useState } from 'react';
import Button from '../components/Button';

const links = [
  ['dashboard', 'Dashboard'], ['customers', 'Customers'], ['leads', 'Leads'],
  ['opportunities', 'Opportunities'], ['follow-ups', 'Follow-ups'], ['activities', 'Activities'],
];
export default function AppLayout({ children, onLogout, user, activeRoute }) {
  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const cancelButtonRef = useRef(null);
  const visibleLinks = user.role === 'Admin' ? [...links, ['admin', 'Admin users']] : links;
  const closeLogoutModal = () => { if (!loggingOut) { setConfirmingLogout(false); setLogoutError(''); } };
  const confirmLogout = async () => { if (loggingOut) return; setLoggingOut(true); setLogoutError(''); try { await onLogout(); } catch (error) { setLogoutError(error.message || 'Unable to sign out. Please try again.'); setLoggingOut(false); } };
  useEffect(() => { if (!confirmingLogout) return undefined; const onKeyDown = (event) => { if (event.key === 'Escape') closeLogoutModal(); }; window.addEventListener('keydown', onKeyDown); cancelButtonRef.current?.focus(); return () => window.removeEventListener('keydown', onKeyDown); }, [confirmingLogout, loggingOut]);
  return <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
    <aside className={`${open ? 'block' : 'hidden'} border-b border-slate-800 bg-slate-950 p-4 text-slate-100 lg:block lg:border-b-0 lg:border-r`} aria-label="Primary navigation">
      <a href="#dashboard" className="mb-8 block px-3 pt-2 text-xl font-bold tracking-tight">Acxiom<span className="text-blue-400">CRM</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Sales workspace</span></a>
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p><nav className="space-y-1">{visibleLinks.map(([route, label]) => <a key={route} href={`#${route}`} onClick={() => setOpen(false)} aria-current={activeRoute === route ? 'page' : undefined} className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeRoute === route ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}>{label}</a>)}</nav>
    </aside>
    <div className="min-w-0"><header className="flex min-h-[4.5rem] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8"><Button variant="secondary" className="lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open}>Menu</Button><span className="hidden text-sm font-medium text-slate-500 sm:block">Sales workspace</span><div className="flex items-center gap-3"><span className="hidden text-right text-sm sm:block"><span className="block font-medium text-slate-800">{user.firstName} {user.lastName}</span><span className="text-xs text-slate-500">{user.role}</span></span><Button variant="secondary" onClick={() => { setLogoutError(''); setConfirmingLogout(true); }}>Sign out</Button></div></header>{children}</div>
    {confirmingLogout && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeLogoutModal(); }}><section role="dialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 id="logout-title" className="text-lg font-bold text-slate-900">Sign out?</h2><p id="logout-description" className="mt-2 text-sm text-slate-600">Are you sure you want to sign out?</p>{logoutError && <p role="alert" className="mt-3 text-sm text-red-700">{logoutError}</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button ref={cancelButtonRef} variant="secondary" onClick={closeLogoutModal} disabled={loggingOut}>Cancel</Button><Button onClick={confirmLogout} disabled={loggingOut}>{loggingOut ? 'Signing out…' : 'Confirm Sign Out'}</Button></div></section></div>}
  </div>;
}
