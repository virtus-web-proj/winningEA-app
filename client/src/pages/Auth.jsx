import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import PageHero from '../components/PageHero.jsx';
import Recaptcha from '../components/Recaptcha.jsx';

function Shell({ title, children }) {
  return (
    <>
      <PageHero title={title} compact />
      <section className="container-gs max-w-md py-14 md:py-20">{children}</section>
    </>
  );
}

function useAuthForm(action) {
  const nav = useNavigate();
  const loc = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(e, payload) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await action(payload);
      nav(loc.state?.from || '/profile', { replace: true });
    } catch (err) {
      setError(err.code || 'generic');
      setBusy(false);
    }
  }
  return { error, busy, run };
}

export function Login() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const [f, setF] = useState({ email: '', password: '', recaptchaToken: '' });
  const set = (key) => (value) => setF((x) => ({ ...x, [key]: value }));
  const { error, busy, run } = useAuthForm((p) => login(p.email, p.password, p.recaptchaToken));
  const loc = useLocation();
  if (user) return <Navigate to={loc.state?.from || '/profile'} replace />;
  return (
    <Shell title={t('auth.loginTitle')}>
      <form onSubmit={(e) => run(e, f)} className="space-y-5">
        <input className="field" type="text" required autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder={t('auth.identifier')} aria-label={t('auth.identifier')} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className="field" type="password" required autoComplete="current-password" placeholder={t('auth.password')} aria-label={t('auth.password')} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <Recaptcha onChange={set('recaptchaToken')} />
        {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t(`errors.${error}`, t('errors.generic'))}</p>}
        <button className="btn-brand w-full" disabled={busy}>{t('auth.login')}</button>
        <p className="text-center text-sm"><Link to="/reset-password" className="text-brand underline">{t('auth.forgotPassword')}</Link></p>
        <p className="text-center text-sm">{t('auth.noAccount')} <Link to="/register" state={loc.state} className="text-brand underline">{t('auth.goRegister')}</Link></p>
      </form>
    </Shell>
  );
}

export function Register() {
  const { t } = useTranslation();
  const { user, register } = useAuth();
  const [f, setF] = useState({ username: '', name: '', email: '', password: '', agree: false, recaptchaToken: '' });
  const set = (key) => (value) => setF((x) => ({ ...x, [key]: value }));
  const { error, busy, run } = useAuthForm((p) => register(p));
  const loc = useLocation();
  if (user) return <Navigate to={loc.state?.from || '/profile'} replace />;
  return (
    <Shell title={t('auth.registerTitle')}>
      <form onSubmit={(e) => run(e, f)} className="space-y-5">
        <input className="field" required autoComplete="name" placeholder={t('auth.name')} aria-label={t('auth.name')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="field" required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,31}" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder={t('auth.username')} aria-label={t('auth.username')} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        <input className="field" type="email" required autoComplete="email" placeholder={t('auth.email')} aria-label={t('auth.email')} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className="field" type="password" required minLength={8} autoComplete="new-password" placeholder={`${t('auth.password')}（${t('auth.passwordHint')}）`} aria-label={t('auth.password')} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} />
          <span>{t('auth.agree')} <Link to="/terms" target="_blank" className="text-brand underline">{t('auth.agreeLink')}</Link></span>
        </label>
        <Recaptcha onChange={set('recaptchaToken')} />
        {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t(`errors.${error}`, t('errors.generic'))}</p>}
        <button className="btn-brand w-full" disabled={busy}>{t('auth.register')}</button>
        <p className="text-center text-sm">{t('auth.hasAccount')} <Link to="/login" state={loc.state} className="text-brand underline">{t('auth.goLogin')}</Link></p>
      </form>
    </Shell>
  );
}
