import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Search, X } from 'lucide-react';
import { api, downloadFile } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fmtDate } from '../../lib/format.js';
import { Badge, Pager, Tabs, actionBtn, td, th, useDebounced } from '../../components/admin.jsx';

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const { user: me } = useAuth();
  const can = (p) => me.permissions.includes(p);
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ users: [], total: 0, pageSize: 20 });
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState(null);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page, ...(dq && { q: dq }), ...(status && { status }) });
    api(`/admin/users?${qs}`).then((d) => { setData(d); setErr(''); }).catch((e) => setErr(e.code));
  }, [page, dq, status]);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [dq, status]);

  const act = async (fn) => { try { await fn(); setErr(''); load(); } catch (e) { setErr(e.code); } };
  const label = (u) => ({ name: u.name, no: u.memberNo });

  const toggleStatus = (u) => {
    const to = u.status === 'active' ? 'suspended' : 'active';
    if (!window.confirm(t(to === 'suspended' ? 'admin.users.confirmSuspend' : 'admin.users.confirmReactivate', label(u)))) return;
    act(() => api(`/admin/users/${u.id}`, { method: 'PATCH', body: { status: to } }));
  };
  const remove = (u) => {
    if (!window.confirm(t('admin.users.confirmDelete', label(u)))) return;
    act(() => api(`/admin/users/${u.id}`, { method: 'DELETE' }));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="field pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.users.search')} aria-label={t('admin.users.search')} />
        </div>
        <Tabs value={status} onChange={setStatus} items={[['', t('admin.users.all')], ['active', t('admin.users.active')], ['suspended', t('admin.users.suspended')]]} />
        {can('users:export') && (
          <button className={`${actionBtn} flex items-center gap-1.5 py-2`} onClick={() => act(() => downloadFile(`/admin/users.csv?${new URLSearchParams({ ...(dq && { q: dq }), ...(status && { status }) })}`, 'members.csv'))}>
            <Download className="h-4 w-4" />{t('admin.users.export')}
          </button>
        )}
      </div>

      {err && <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t(`errors.${err}`, t('errors.generic'))}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead><tr>{['colNo', 'colName', 'colEmail', 'colJoined', 'colOrders', 'colStatus'].map((k) => <th key={k} className={th}>{t(`admin.users.${k}`)}</th>)}<th className={th} /></tr></thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className={`${td} font-mono text-xs`}>{u.memberNo}</td>
                <td className={td}>{u.name} {u.role !== 'member' && <Badge tone="blue">{t(`admin.users.role.${u.role}`)}</Badge>}</td>
                <td className={td}>{u.email}</td>
                <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(u.createdAt, i18n.language)}</td>
                <td className={`${td} tabular-nums`}>{u.orderCount}</td>
                <td className={td}><Badge tone={u.status === 'active' ? 'green' : 'red'}>{t(`admin.users.${u.status}`)}</Badge></td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  {can('users:write') ? <button className={actionBtn} onClick={() => setEdit(u)}>{t('admin.users.edit')}</button> : <span className="text-xs text-slate-400">{t('admin.users.readOnly')}</span>}
                </td>
              </tr>
            ))}
            {!data.users.length && <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-400">{t('admin.users.none')}</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />

      {edit && (
        <EditDialog
          user={edit}
          canDelete={can('users:delete')}
          onClose={() => setEdit(null)}
          onSaved={() => { setEdit(null); load(); }}
          onToggle={() => { const u = edit; setEdit(null); toggleStatus(u); }}
          onDelete={() => { const u = edit; setEdit(null); remove(u); }}
        />
      )}
    </div>
  );
}

function EditDialog({ user, canDelete, onClose, onSaved, onToggle, onDelete }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ name: user.name, email: user.email });
  const [err, setErr] = useState('');
  const [temp, setTemp] = useState('');
  const [copied, setCopied] = useState(false);
  const protectedAcct = user.role !== 'member';

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  async function save(e) {
    e.preventDefault();
    try { await api(`/admin/users/${user.id}`, { method: 'PATCH', body: f }); onSaved(); } catch (x) { setErr(x.code); }
  }
  async function reset() {
    if (!window.confirm(t('admin.users.confirmReset', { name: user.name, no: user.memberNo }))) return;
    try { const d = await api(`/admin/users/${user.id}/reset-password`, { method: 'POST' }); setTemp(d.temporaryPassword); setErr(''); } catch (x) { setErr(x.code); }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-navy-950/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div><h2 className="text-lg font-bold">{user.name}</h2><p className="font-mono text-xs text-slate-500">{user.memberNo}</p></div>
          <button onClick={onClose} aria-label={t('admin.users.close')} className="text-slate-400 hover:text-slate-700"><X /></button>
        </div>
        <form onSubmit={save} className="mt-5 space-y-4">
          <label className="block text-sm font-bold">{t('admin.users.colName')}<input className="field mt-1 font-normal" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label>
          <label className="block text-sm font-bold">{t('admin.users.colEmail')}<input type="email" className="field mt-1 font-normal" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></label>
          {err && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{t(`errors.${err}`, t('errors.generic'))}</p>}
          {temp && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
              <p className="font-bold">{t('admin.users.tempTitle')}</p>
              <div className="mt-2 flex items-center gap-2"><code className="select-all rounded bg-white px-2 py-1 font-mono text-base">{temp}</code>
                <button type="button" className={actionBtn} onClick={() => { navigator.clipboard?.writeText(temp); setCopied(true); }}>{copied ? t('admin.users.copied') : t('admin.users.copy')}</button></div>
              <p className="mt-2 text-xs text-slate-600">{t('admin.users.tempHelp')}</p>
            </div>
          )}
          <button className="btn-brand w-full py-2.5">{t('admin.users.save')}</button>
        </form>
        {!protectedAcct && (
          <div className="mt-5 grid gap-2 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <button type="button" className={`${actionBtn} py-2`} onClick={onToggle}>{t(user.status === 'active' ? 'admin.users.suspend' : 'admin.users.reactivate')}</button>
            <button type="button" className={`${actionBtn} py-2`} onClick={reset}>{t('admin.users.resetPw')}</button>
            {canDelete && <button type="button" className="rounded border border-red-300 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 sm:col-span-2" onClick={onDelete}>{t('admin.users.delete')}</button>}
          </div>
        )}
      </div>
    </div>
  );
}
