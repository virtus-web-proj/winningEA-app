import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'ja' ? 'en' : 'ja');
  const staff = user?.permissions?.length > 0;
  const links = user
    ? [{ to: '/', label: t('nav.home'), end: true }, ...(staff ? [{ to: '/admin', label: t('nav.admin') }] : []), { to: '/profile', label: t('nav.profile') }, { action: logout, label: t('nav.logout') }, { to: '/terms', label: t('nav.terms') }]
    : [{ to: '/', label: t('nav.home'), end: true }, { to: '/register', label: t('nav.register') }, { to: '/login', label: t('nav.login') }, { to: '/terms', label: t('nav.terms') }];

  const linkCls = ({ isActive }) =>
    `relative py-1 text-sm font-bold text-white/90 transition hover:text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand-light after:transition ${isActive ? 'after:scale-x-100' : 'hover:after:scale-x-100'}`;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || open ? 'bg-navy-950/85 shadow-lg backdrop-blur-md' : 'bg-navy-950/30'}`}>
      <div className={`container-gs flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20 md:h-24'}`}>
        <Link to="/" aria-label="Winning EA" onClick={() => setOpen(false)}>
          <img src="/images/winningEAlogo.png" alt="Winning EA" className={`w-auto transition-all duration-300 ${scrolled ? 'h-8 md:h-9' : 'h-9 md:h-12'}`} />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {links.map((l) =>
            l.to ? (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>{l.label}</NavLink>
            ) : (
              <button key={l.label} onClick={l.action} className={linkCls({ isActive: false })}>{l.label}</button>
            ),
          )}
          <button onClick={toggleLang} className="flex items-center gap-1.5 rounded-full border border-white/40 px-3.5 py-1.5 text-xs font-bold text-white transition hover:border-brand-light hover:bg-white/10" aria-label="Switch language">
            <Globe className="h-4 w-4" />{t('nav.language')}
          </button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button onClick={toggleLang} className="flex items-center gap-1 rounded-full border border-white/40 px-3 py-1.5 text-xs font-bold text-white" aria-label="Switch language">
            <Globe className="h-4 w-4" />{t('nav.language')}
          </button>
          <button onClick={() => setOpen((o) => !o)} className="grid h-10 w-10 place-items-center text-white" aria-label={t('nav.menu')} aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="container-gs flex flex-col gap-1 pb-5 md:hidden" aria-label="Mobile">
          {links.map((l) =>
            l.to ? (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className="border-b border-white/10 py-3 font-bold text-white">{l.label}</NavLink>
            ) : (
              <button key={l.label} onClick={() => { l.action(); setOpen(false); }} className="border-b border-white/10 py-3 text-left font-bold text-white">{l.label}</button>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
