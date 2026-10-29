import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';
import { fmtDate } from '../../lib/format.js';
import { Badge, Pager, Tabs, actionBtn } from '../../components/admin.jsx';

export default function AdminMessages() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState('new');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ messages: [], total: 0, pageSize: 20 });
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page, ...(status && { status }) });
    api(`/admin/messages?${qs}`).then((d) => { setData(d); setErr(''); }).catch((e) => setErr(e.code));
  }, [page, status]);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [status]);

  async function toggle(m) {
    try { await api(`/admin/messages/${m.id}`, { method: 'PATCH', body: { handled: !m.handled } }); load(); } catch (e) { setErr(e.code); }
  }

  return (
    <div>
      <Tabs value={status} onChange={setStatus} items={[['new', t('admin.messages.new')], ['handled', t('admin.messages.handled')], ['', t('admin.messages.all')]]} />
      {err && <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t(`errors.${err}`, t('errors.generic'))}</p>}
      <ul className="mt-4 space-y-3">
        {data.messages.map((m) => (
          <li key={m.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">{m.name} {m.memberNo && <span className="ml-1 font-mono text-xs font-normal text-slate-500">{t('admin.messages.member')} {m.memberNo}</span>}</p>
                <a href={`mailto:${m.email}`} className="text-sm text-brand hover:underline">{m.email}</a>
              </div>
              <div className="text-right text-xs text-slate-400"><div>{fmtDate(m.createdAt, i18n.language)}</div><Badge tone={m.handled ? 'green' : 'amber'}>{t(m.handled ? 'admin.messages.handled' : 'admin.messages.new')}</Badge></div>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{m.body}</p>
            <div className="mt-4 flex gap-2">
              <a href={`mailto:${m.email}`} className={actionBtn}>{t('admin.messages.reply')}</a>
              <button className={actionBtn} onClick={() => toggle(m)}>{t(m.handled ? 'admin.messages.markNew' : 'admin.messages.markHandled')}</button>
            </div>
          </li>
        ))}
        {!data.messages.length && <li className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-slate-400">{t('admin.messages.none')}</li>}
      </ul>
      <Pager page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
    </div>
  );
}
