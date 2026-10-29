import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function Pager({ page, total, pageSize, onChange }) {
  const { t } = useTranslation();
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = 'rounded border border-slate-300 px-3 py-1.5 text-sm transition enabled:hover:border-brand enabled:hover:text-brand disabled:opacity-40';
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>{t('admin.pager.of', { from, to, total })}</span>
      <div className="flex gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>{t('admin.pager.prev')}</button>
        <button className={btn} disabled={to >= total} onClick={() => onChange(page + 1)}>{t('admin.pager.next')}</button>
      </div>
    </div>
  );
}

const TONES = { green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', slate: 'bg-slate-100 text-slate-600', blue: 'bg-brand-soft text-brand-dark' };
export const Badge = ({ tone = 'slate', children }) => <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${TONES[tone]}`}>{children}</span>;

export function Tabs({ value, onChange, items }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {items.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${value === v ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>
      ))}
    </div>
  );
}

export const th = 'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500';
export const td = 'border-b border-slate-100 px-3 py-3 align-middle';
export const actionBtn = 'rounded border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:border-brand hover:text-brand disabled:opacity-50';

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return v;
}
