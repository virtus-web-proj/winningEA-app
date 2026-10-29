export const yen = (n) => `¥${Number(n).toLocaleString('en-US')}`;
export const num = (n, max = 2) => Number(n).toLocaleString('en-US', { maximumFractionDigits: max });

// SQLite timestamps are UTC ("YYYY-MM-DD HH:MM:SS").
export const fmtDate = (s, lng = 'ja') => {
  if (!s) return '';
  const d = new Date(`${s.replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString(lng === 'ja' ? 'ja-JP' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
};
