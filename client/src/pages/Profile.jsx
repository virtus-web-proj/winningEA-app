import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import PageHero from '../components/PageHero.jsx';

export function Avatar({ user, size = 96 }) {
  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
  return user.avatar ? (
    <img src={user.avatar} alt="" className="rounded-full object-cover ring-4 ring-brand-soft" style={{ width: size, height: size }} />
  ) : (
    <div className="grid place-items-center rounded-full bg-gradient-to-br from-brand to-navy-700 font-display font-bold text-white ring-4 ring-brand-soft" style={{ width: size, height: size, fontSize: size / 2.4 }}>{initial}</div>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const link = 'group flex items-center gap-3 border-b border-slate-300 py-2 text-lg text-slate-600 transition hover:border-brand hover:text-brand';
  return (
    <>
      <PageHero title={t('profile.title')} align="left" />
      <section className="container-gs max-w-4xl py-14 md:py-20">
        <div className="flex w-fit flex-col items-center gap-3">
          <Avatar user={user} />
          <p className="text-sm text-slate-500">{t('profile.memberNo')} {user.memberNo}</p>
        </div>
        <div className="mt-12 space-y-6">
          <Link to="/profile/edit" className={`${link} w-fit`}><ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />{t('profile.edit')}</Link><br />
          <Link to="/profile/password" className={`${link} w-fit`}><ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />{t('profile.password')}</Link>
        </div>
      </section>
    </>
  );
}
