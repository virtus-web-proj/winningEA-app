import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { api } from '../../lib/api.js';
import { fmtDate, yen } from '../../lib/format.js';
import { Badge, Pager, Tabs, actionBtn, td, th, useDebounced } from '../../components/admin.jsx';

const TONE = { awaiting_payment: 'amber', paid: 'green', cancelled: 'slate' };

export default function AdminOrders() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [status, setStatus] = useState('awaiting_payment');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ orders: [], total: 0, pageSize: 20 });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page, ...(dq && { q: dq }), ...(status && { status }) });
    api(`/admin/orders?${qs}`).then((d) => { setData(d); setErr(''); }).catch((e) => setErr(e.code));
  }, [page, dq, status]);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [dq, status]);

  async function setOrder(o, to) {
    if (to === 'paid' && !window.confirm(t('admin.orders.confirmPaid', { id: o.id, no: o.memberNo, total: yen(o.total) }))) return;
    if (to === 'cancelled' && !window.confirm(t('admin.orders.confirmCancel', { id: o.id }))) return;
    setBusy(o.id);
    try { await api(`/admin/orders/${o.id}`, { method: 'PATCH', body: { status: to } }); load(); } catch (e) { setErr(e.code); }
    setBusy(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="field pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.orders.search')} aria-label={t('admin.orders.search')} />
        </div>
        <Tabs value={status} onChange={setStatus} items={[['awaiting_payment', t('admin.orders.status.awaiting_payment')], ['paid', t('admin.orders.status.paid')], ['cancelled', t('admin.orders.status.cancelled')], ['', t('admin.orders.all')]]} />
      </div>
      {err && <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t(`errors.${err}`, t('errors.generic'))}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] text-sm">
          <thead><tr>{['colId', 'colDate', 'colMember', 'colProduct', 'colOptions', 'colTotal', 'colStatus'].map((k) => <th key={k} className={th}>{t(`admin.orders.${k}`)}</th>)}<th className={th} /></tr></thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className={`${td} font-mono text-xs`}>#{o.id}</td>
                <td className={`${td} whitespace-nowrap text-slate-500`}>{fmtDate(o.createdAt, i18n.language)}</td>
                <td className={td}><div className="font-bold">{o.memberName}</div><div className="font-mono text-xs text-slate-500">{o.memberNo}</div><div className="text-xs text-slate-500">{o.memberEmail}</div></td>
                <td className={td}>{t(`product.items.${o.slug}.name`, o.slug)}</td>
                <td className={`${td} text-xs text-slate-600`}>{o.options.length ? o.options.map((id) => t(`product.opt.${id}.name`, id)).join(', ') : '—'}</td>
                <td className={`${td} whitespace-nowrap font-bold tabular-nums`}>{yen(o.total)}</td>
                <td className={td}><Badge tone={TONE[o.status]}>{t(`admin.orders.status.${o.status}`)}</Badge>{o.paidAt && <div className="mt-1 text-[11px] text-slate-400">{t('admin.orders.paidAt')} {fmtDate(o.paidAt, i18n.language)}</div>}</td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  {o.status === 'awaiting_payment' ? (
                    <div className="flex justify-end gap-2">
                      <button disabled={busy === o.id} className="rounded bg-brand px-3 py-1 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-50" onClick={() => setOrder(o, 'paid')}>{t('admin.orders.markPaid')}</button>
                      <button disabled={busy === o.id} className={actionBtn} onClick={() => setOrder(o, 'cancelled')}>{t('admin.orders.cancel')}</button>
                    </div>
                  ) : (
                    <button disabled={busy === o.id} className={actionBtn} onClick={() => setOrder(o, 'awaiting_payment')}>{t('admin.orders.reopen')}</button>
                  )}
                </td>
              </tr>
            ))}
            {!data.orders.length && <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-400">{t('admin.orders.none')}</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
    </div>
  );
}
