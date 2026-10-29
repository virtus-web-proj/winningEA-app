import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHero from '../components/PageHero.jsx';
import ProductIcon from '../components/ProductIcon.jsx';
import { yen } from '../lib/format.js';

export default function Buy() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const loc = useLocation();
  const [order] = useState(() => {
    if (loc.state?.order) return loc.state;
    try { return JSON.parse(sessionStorage.getItem(`gs_order_${slug}`)); } catch { return null; }
  });
  useEffect(() => { window.scrollTo(0, 0); }, []);

  if (!order || order.order.slug !== slug) return <Navigate to={`/products/${slug}`} replace />;
  const { bank, memberNo, order: o } = order;
  const rows = [
    [t('buy.bankName'), bank.name], [t('buy.branch'), bank.branch], [t('buy.type'), bank.type], [t('buy.number'), bank.number], [t('buy.holder'), bank.holder],
  ];

  return (
    <>
      <PageHero title={t(`product.items.${slug}.name`)} />
      <section className="bg-cream py-14 md:py-20">
        <div className="container-gs flex flex-col items-center text-center">
          <div className="grid h-32 w-32 place-items-center border-4 border-navy-900 bg-white p-3"><ProductIcon slug={slug} size={96} className="h-24 w-24 object-contain" /></div>
          <p className="mt-5 text-xs font-bold">{t('product.provider')}</p>
          <p className="mt-4 max-w-3xl text-sm leading-7">{t(`product.items.${slug}.desc`)}</p>
        </div>
      </section>

      <section className="container-gs max-w-5xl py-14 md:py-20">
        <h2 className="text-center text-xl font-bold md:text-2xl">{t('buy.heading')}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="grid place-items-center border border-slate-300 p-8 text-center">
            <div>
              <p className="text-2xl md:text-[1.7rem]">{t('buy.pay')} <strong className="text-red-600">{yen(o.total)}{t('common.taxIn')}</strong></p>
              <p className="mt-3 text-xs leading-6 text-slate-600">{t('buy.l1')}<br />{t('buy.l2')}<br />{t('buy.l3')}<br />{t('buy.example', { memberNo })}</p>
              <p className="mt-3 text-xs text-slate-400">{t('buy.orderNo')} #{o.id}</p>
            </div>
          </div>
          <table className="h-fit w-full border-collapse text-sm">
            <thead><tr><th colSpan={2} className="th">{t('buy.bankTitle')}</th></tr></thead>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}><th className="w-2/5 border border-slate-300 px-3 py-2.5 text-left font-normal text-slate-700">{k}</th><td className="border border-slate-300 px-3 py-2.5">{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-16 text-center text-xl font-bold md:text-2xl">{t('buy.afterTitle')}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-7">{t('buy.after1')}<br />{t('buy.after2')}<br />{t('buy.after3')}</p>
        <Link to="/contact" className="btn-navy mx-auto mt-12 flex w-full max-w-xl py-3 text-lg">{t('common.contactCta')}</Link>
      </section>
    </>
  );
}
