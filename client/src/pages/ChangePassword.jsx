import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';
import PageHero from '../components/PageHero.jsx';
import Recaptcha from '../components/Recaptcha.jsx';

export default function ChangePassword() {
  const { t } = useTranslation();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', recaptchaToken: '' });
  const [msg, setMsg] = useState({ ok: false, err: '' });
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg({ ok: false, err: '' });
    try { await api('/me/password', { method: 'PUT', body: f }); setMsg({ ok: true, err: '' }); setF({ currentPassword: '', newPassword: '' }); }
    catch (err) { setMsg({ ok: false, err: err.code }); }
    setBusy(false);
  }

  return (
    <>
      <PageHero title={t('profile.password')} compact align="left" />
      <section className="container-gs max-w-lg py-14 md:py-20">
        <form onSubmit={save} className="space-y-5">
          <label className="block text-sm font-bold">{t('profile.current')}<input className="field mt-1 font-normal" type="password" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} required /></label>
          <label className="block text-sm font-bold">{t('profile.new')}<input className="field mt-1 font-normal" type="password" autoComplete="new-password" minLength={8} value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} required /></label>
          <Recaptcha onChange={(value) => setF((x) => ({ ...x, recaptchaToken: value }))} />
          <div role="status" aria-live="polite">
            {msg.err && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t(`errors.${msg.err}`, t('errors.generic'))}</p>}
            {msg.ok && <p className="rounded-md bg-brand-soft px-4 py-3 text-sm text-navy-900">{t('profile.pwSaved')}</p>}
          </div>
          <div className="flex items-center gap-4"><button className="btn-brand" disabled={busy}>{busy ? t('common.saving') : t('common.save')}</button><Link to="/profile" className="text-sm text-slate-500 underline">{t('profile.back')}</Link></div>
        </form>
      </section>
    </>
  );
}
