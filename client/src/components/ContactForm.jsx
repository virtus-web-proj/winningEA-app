import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Recaptcha from './Recaptcha.jsx';

export default function ContactForm() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', message: '', recaptchaToken: '' });
  const [state, setState] = useState({ busy: false, done: false, error: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setCaptcha = (value) => setForm((f) => ({ ...f, recaptchaToken: value }));

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, done: false, error: '' });
    try {
      await api('/contact', { method: 'POST', body: form });
      setState({ busy: false, done: true, error: '' });
      setForm((f) => ({ ...f, message: '' }));
    } catch (err) {
      setState({ busy: false, done: false, error: err.code });
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-2xl space-y-5" noValidate>
      <input className="field" placeholder={t('contact.name')} aria-label={t('contact.name')} value={form.name} onChange={set('name')} autoComplete="name" />
      <input className="field" type="email" placeholder={t('contact.email')} aria-label={t('contact.email')} value={form.email} onChange={set('email')} autoComplete="email" />
      <textarea className="field min-h-36 resize-y" placeholder={t('contact.message')} aria-label={t('contact.message')} value={form.message} onChange={set('message')} />
      <Recaptcha onChange={setCaptcha} />
      <div role="status" aria-live="polite">
        {state.error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t(`errors.${state.error}`, t('errors.generic'))}</p>}
        {state.done && (
          <p className="flex items-center gap-2 rounded-md bg-brand-soft px-4 py-3 text-sm text-navy-900"><CheckCircle2 className="h-5 w-5 text-brand" />{t('contact.done')}</p>
        )}
      </div>
      <div className="text-center">
        <button className="btn-brand" disabled={state.busy}>{state.busy ? t('common.sending') : t('common.send')}</button>
      </div>
    </form>
  );
}
