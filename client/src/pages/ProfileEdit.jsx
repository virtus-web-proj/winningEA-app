import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHero from '../components/PageHero.jsx';
import { Avatar } from './Profile.jsx';

function toAvatar(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = 256; const c = document.createElement('canvas'); c.width = c.height = s;
      const m = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function Field({ label, required, children, className = '' }) {
  return <label className={`block text-sm font-bold ${className}`}><span>{label}{required && <em className="ml-1 not-italic text-red-600">*</em>}</span>{children}</label>;
}

function Input({ value, onChange, ...props }) {
  return <input className="field mt-2 font-normal" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} />;
}

function Select({ value, onChange, options, placeholder, ...props }) {
  return <select className="field mt-2 font-normal" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props}>
    <option value="">{placeholder}</option>
    {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
  </select>;
}

export default function ProfileEdit() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [f, setF] = useState({
    familyName: user.familyName || '', givenName: user.givenName || '', familyKana: user.familyKana || '', givenKana: user.givenKana || '',
    birthYear: user.birthYear || '', birthMonth: user.birthMonth || '', birthDay: user.birthDay || '', gender: user.gender || '',
    email: user.email || '', emailConfirm: user.email || '', postalCode: user.postalCode || '', prefecture: user.prefecture || '',
    city: user.city || '', addressLine: user.addressLine || '', building: user.building || '', phone: user.phone || '',
    occupation: user.occupation || '', income: user.income || '', investmentPurpose: user.investmentPurpose || '', fxExperience: user.fxExperience || '',
    termsAccepted: false, avatar: undefined,
  });
  const [msg, setMsg] = useState({ ok: false, err: '' });
  const [busy, setBusy] = useState(false);
  const file = useRef(null);
  const set = (key) => (value) => setF((x) => ({ ...x, [key]: value }));
  const preview = { ...user, avatar: f.avatar === undefined ? user.avatar : f.avatar, name: `${f.familyName} ${f.givenName}`.trim() };
  const years = useMemo(() => Array.from({ length: new Date().getFullYear() - 1919 }, (_, i) => String(new Date().getFullYear() - i)), []);
  const months = Array.from({ length: 12 }, (_, i) => [String(i + 1), `${i + 1}`]);
  const days = Array.from({ length: 31 }, (_, i) => [String(i + 1), `${i + 1}`]);
  const genderOptions = [['male', t('profile.male')], ['female', t('profile.female')]];
  const prefectures = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'].map((x) => [x, x]);
  const occupationOptions = ['publicServant','executive','employee','selfEmployed','homemaker','partTime','student','other'].map((x) => [x, t(`profile.options.occupation.${x}`)]);
  const incomeOptions = ['under400','400to600','600to1000','over1000'].map((x) => [x, t(`profile.options.income.${x}`)]);
  const purposeOptions = ['assetBuilding','profitFocus','other'].map((x) => [x, t(`profile.options.purpose.${x}`)]);
  const fxOptions = ['under6m','under1y','oneTo3y','over3y','none'].map((x) => [x, t(`profile.options.fx.${x}`)]);

  async function pick(e) {
    const file0 = e.target.files?.[0];
    if (!file0) return;
    try { const avatar = await toAvatar(file0); setF((x) => ({ ...x, avatar })); }
    catch { setMsg({ ok: false, err: 'avatar_invalid' }); }
  }

  async function save(e) {
    e.preventDefault(); setBusy(true); setMsg({ ok: false, err: '' });
    try {
      const body = { ...f, profileForm: true };
      if (f.avatar === undefined) delete body.avatar;
      const d = await api('/me', { method: 'PUT', body });
      setUser(d.user); setF((x) => ({ ...x, avatar: undefined })); setMsg({ ok: true, err: '' });
    } catch (err) { setMsg({ ok: false, err: err.code }); }
    setBusy(false);
  }

  return <>
    <PageHero title={t('profile.edit')} compact align="left" />
    <section className="container-gs max-w-4xl py-12 md:py-16">
      <form onSubmit={save} className="space-y-14">
        <div className="flex flex-col items-center gap-3">
          <Avatar user={preview} size={72} />
          <p className="text-xs text-slate-500">{t('profile.memberNo')} {user.memberNo}</p>
          <div className="space-x-3 text-sm"><button type="button" className="font-bold text-brand underline" onClick={() => file.current.click()}>{t('profile.avatarPick')}</button>{preview.avatar && <button type="button" className="text-slate-500 underline" onClick={() => setF({ ...f, avatar: null })}>{t('profile.avatarRemove')}</button>}<input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} /></div>
        </div>

        <section><h2 className="section-title">{t('profile.customerInfo')}</h2><div className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
          <Field label={t('profile.familyName')} required><Input value={f.familyName} onChange={set('familyName')} required /></Field>
          <Field label={t('profile.givenName')} required><Input value={f.givenName} onChange={set('givenName')} required /></Field>
          <Field label={t('profile.familyKana')} required><Input value={f.familyKana} onChange={set('familyKana')} required /></Field>
          <Field label={t('profile.givenKana')} required><Input value={f.givenKana} onChange={set('givenKana')} required /></Field>
          <Field label={t('profile.birthDate')} required className="md:col-span-2"><div className="grid grid-cols-3 gap-3"><Select value={f.birthYear} onChange={set('birthYear')} options={years.map((x) => [x, x])} placeholder={t('profile.year')} required /><Select value={f.birthMonth} onChange={set('birthMonth')} options={months} placeholder={t('profile.month')} required /><Select value={f.birthDay} onChange={set('birthDay')} options={days} placeholder={t('profile.day')} required /></div></Field>
          <Field label={t('profile.gender')} required className="md:col-span-2"><div className="mt-3 flex gap-3">{genderOptions.map(([value, label]) => <label key={value} className="flex min-w-28 cursor-pointer items-center justify-center gap-2 border border-slate-300 px-5 py-3 font-normal"><input type="radio" name="gender" value={value} checked={f.gender === value} onChange={() => set('gender')(value)} required />{label}</label>)}</div></Field>
          <Field label={t('profile.email')} required><Input type="email" value={f.email} onChange={set('email')} required /></Field>
          <Field label={t('profile.emailConfirm')} required><Input type="email" value={f.emailConfirm} onChange={set('emailConfirm')} required /></Field>
        </div></section>

        <section><h2 className="section-title">{t('profile.addressInfo')}</h2><div className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
          <Field label={t('profile.postalCode')} required><Input value={f.postalCode} onChange={set('postalCode')} required placeholder="1234567" /></Field>
          <Field label={t('profile.prefecture')} required><Select value={f.prefecture} onChange={set('prefecture')} options={prefectures} placeholder={t('profile.select')} required /></Field>
          <Field label={t('profile.city')} required><Input value={f.city} onChange={set('city')} required /></Field>
          <Field label={t('profile.addressLine')} required><Input value={f.addressLine} onChange={set('addressLine')} required /></Field>
          <Field label={t('profile.building')}><Input value={f.building} onChange={set('building')} /></Field>
          <Field label={t('profile.phone')} required><Input type="tel" value={f.phone} onChange={set('phone')} required placeholder="09012345678" /></Field>
        </div></section>

        <section><h2 className="section-title">{t('profile.financeInfo')}</h2><div className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
          <Field label={t('profile.occupation')}><Select value={f.occupation} onChange={set('occupation')} options={occupationOptions} placeholder={t('profile.select')} /></Field>
          <Field label={t('profile.income')}><Select value={f.income} onChange={set('income')} options={incomeOptions} placeholder={t('profile.select')} /></Field>
          <Field label={t('profile.investmentPurpose')}><Select value={f.investmentPurpose} onChange={set('investmentPurpose')} options={purposeOptions} placeholder={t('profile.select')} /></Field>
          <Field label={t('profile.fxExperience')}><Select value={f.fxExperience} onChange={set('fxExperience')} options={fxOptions} placeholder={t('profile.select')} /></Field>
        </div></section>

        <div className="mx-auto max-w-xl"><label className="flex cursor-pointer items-center justify-center gap-3 rounded-md bg-slate-600 px-5 py-4 text-center text-white"><input type="checkbox" className="h-5 w-5" checked={f.termsAccepted} onChange={(e) => set('termsAccepted')(e.target.checked)} required />{t('profile.termsAgree')}</label>
          <div role="status" aria-live="polite" className="mt-5">{msg.err && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{t(`errors.${msg.err}`, t('errors.generic'))}</p>}{msg.ok && <p className="rounded-md bg-brand-soft px-4 py-3 text-sm text-navy-900">{t('profile.saved')}</p>}</div>
          <button className="btn-brand mt-6 w-full py-4 text-lg" disabled={busy}>{busy ? t('common.saving') : t('profile.submit')}</button><Link to="/profile" className="mx-auto mt-5 block w-fit text-sm text-slate-500 underline">{t('profile.back')}</Link>
        </div>
      </form>
    </section>
  </>;
}
