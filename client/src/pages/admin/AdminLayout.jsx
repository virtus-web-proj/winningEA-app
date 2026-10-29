import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, ReceiptText, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge } from '../../components/admin.jsx';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const has = (p) => user.permissions.includes(p);
  const tabs = [
    { to: '/admin', end: true, icon: LayoutDashboard, label: t('admin.nav.dashboard'), show: true },
    { to: '/admin/users', icon: Users, label: t('admin.nav.users'), show: has('users:read') },
    { to: '/admin/orders', icon: ReceiptText, label: t('admin.nav.orders'), show: has('orders:read') },
    { to: '/admin/messages', icon: Mail, label: t('admin.nav.messages'), show: has('messages:read') },
  ].filter((x) => x.show);
  return (
    <div className="min-h-[70vh] bg-slate-50 pb-16 pt-24 md:pt-28">
      <div className="container-gs">
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
          <Badge tone="blue">{t(`admin.users.role.${user.role}`)}</Badge>
        </div>
        <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Admin">
          {tabs.map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition ${isActive ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-navy-900'}`}>
              <Icon className="h-4 w-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6"><Outlet /></div>
      </div>
    </div>
  );
}
