import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/admin/stats').then(setS).catch((e) => setErr(e.code)); }, []);
  const cards = s && [
    ['members', s.members, '/admin/users', false],
    ['suspended', s.suspended, '/admin/users', false],
    ['pending', s.pendingOrders, '/admin/orders', s.pendingOrders > 0],
    ['paid', s.paidOrders, '/admin/orders', false],
    ['messages', s.newMessages, '/admin/messages', s.newMessages > 0],
  ];
  return (
    <>
      {err && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t(`errors.${err}`, t('errors.generic'))}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(cards || []).map(([k, n, to, hot]) => (
          <Link key={k} to={to} className={`group rounded-lg border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md ${hot ? 'border-brand' : 'border-slate-200'}`}>
            <p className="text-sm text-slate-500">{t(`admin.dash.${k}`)}</p>
            <p className={`mt-2 font-display text-4xl font-bold tabular-nums ${hot ? 'text-brand' : 'text-navy-900'}`}>{n.toLocaleString()}</p>
            <p className="mt-3 text-xs font-bold text-brand opacity-0 transition group-hover:opacity-100">{t('admin.dash.go')} →</p>
          </Link>
        ))}
      </div>
    </>
  );
}
