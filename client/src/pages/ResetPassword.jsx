import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHero from '../components/PageHero.jsx';
import Recaptcha from '../components/Recaptcha.jsx';
import { api } from '../lib/api.js';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (token) await api('/auth/reset-password', { method: 'POST', auth: false, body: { token, password } });
      else await api('/auth/forgot-password', { method: 'POST', auth: false, body: { email, recaptchaToken } });
      setDone(true);
    } catch (err) { setError(err.code || 'generic'); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHero title={t('auth.resetTitle')} compact />
      <section className="container-gs max-w-md py-14 md:py-20">
        {done ? (
          <div className="space-y-5 text-center">
            <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{t(token ? 'auth.resetDone' : 'auth.resetSent')}</p>
            <Link to="/login" className="btn-brand w-full">{t('auth.goLogin')}</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <p className="text-sm leading-7 text-slate-600">{t(token ? 'auth.resetLead' : 'auth.forgotLead')}</p>
            {token ? <input className="field" type="password" required minLength={8} autoComplete="new-password" placeholder={t('auth.newPassword')} value={password} onChange={(e) => setPassword(e.target.value)} /> : <><input className="field" type="email" required autoComplete="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} /><Recaptcha onChange={setRecaptchaToken} /></>}
            {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t(`errors.${error}`, t('errors.generic'))}</p>}
            <button className="btn-brand w-full" disabled={busy}>{t(token ? 'auth.resetSubmit' : 'auth.sendReset')}</button>
            <p className="text-center text-sm"><Link to="/login" className="text-brand underline">{t('auth.goLogin')}</Link></p>
          </form>
        )}
      </section>
    </>
  );
}
