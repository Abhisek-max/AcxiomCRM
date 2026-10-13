import { useEffect, useState } from 'react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import { api } from '../services/api';

const roles = ['Admin', 'Manager', 'SalesExecutive'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setError(''); try { setUsers((await api('/admin/users')).users); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const update = async (id, path, body) => { try { await api(`/admin/users/${id}/${path}`, { method: 'PATCH', body: JSON.stringify(body) }); await load(); } catch (err) { setError(err.message); } };
  return <PageContainer><section aria-labelledby="page-title"><p className="text-sm font-semibold text-brand-600">Administration</p><h1 id="page-title" className="mt-1 text-3xl font-bold tracking-tight">User management</h1><p className="mt-2 text-sm text-slate-600">Manage roles and account access for your workspace.</p>{error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<div className="mt-7 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead><tr><th className="px-5 py-3.5">User</th><th className="px-5 py-3.5">Role</th><th className="px-5 py-3.5">Access</th></tr></thead><tbody>{loading ? <tr><td className="px-5 py-10 text-center text-slate-500" colSpan="3">Loading users…</td></tr> : users.map((user) => <tr className="border-t border-slate-100 transition-colors hover:bg-slate-50" key={user.id}><td className="px-5 py-4"><div className="font-medium text-slate-900">{user.firstName} {user.lastName}</div><div className="mt-0.5 text-slate-500">{user.email}</div></td><td className="px-5 py-4"><select aria-label={`Role for ${user.email}`} className="rounded-lg border bg-white px-3 py-2 text-sm" value={user.role} onChange={(event) => update(user.id, 'role', { role: event.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></td><td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{user.isActive ? 'Active' : 'Inactive'}</span><Button variant="secondary" onClick={() => update(user.id, 'status', { isActive: !user.isActive })}>{user.isActive ? 'Deactivate' : 'Activate'}</Button></div></td></tr>)}</tbody></table></div></section></PageContainer>;
}
