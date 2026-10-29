import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductIcon from './ProductIcon.jsx';
import { yen, num } from '../lib/format.js';

export default function ProductCard({ p }) {
  const { t } = useTranslation();
  const name = t(`product.items.${p.slug}.name`);
  return (
    <article className="grid gap-6 border-b-4 border-navy-900 py-8 md:grid-cols-[minmax(0,1fr)_220px] md:gap-x-12">
      <div className="flex items-start gap-5">
        <div className="grid h-32 w-32 shrink-0 place-items-center">
          <ProductIcon slug={p.slug} size={128} className="h-32 w-32 object-contain" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-snug md:text-2xl">{name}</h3>
          <dl className="mt-3 space-y-0.5 text-xs leading-5 text-slate-800 md:text-sm">
            <div><strong>{t('home.products.pair')}：</strong>{p.pair}</div>
            <div><strong>{t('home.products.timeframe')}：</strong>{t(`product.tf.${p.timeframe}`)}</div>
            <div><strong>{t('home.products.pf')}：</strong>{num(p.profitFactor)}</div>
            <div><strong>{t('home.products.win')}：</strong>{p.winRate.toFixed(2)}%</div>
          </dl>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-2 md:items-stretch">
        <p className="text-sm text-slate-600">{t('home.products.priceLabel')} <span className="text-lg font-bold text-red-600">{t('home.products.from', { price: yen(p.price) })}</span></p>
        <Link to={`/products/${p.slug}`} className="rounded-sm bg-brand py-2.5 text-center text-sm font-bold text-white transition hover:bg-brand-dark">{t('home.products.details')}</Link>
        <Link to={`/products/${p.slug}#backtest`} className="rounded-sm bg-navy-900 py-2.5 text-center text-sm font-bold text-white transition hover:bg-navy-700">{t('home.products.backtest')}</Link>
      </div>
      <p className="text-sm leading-7 text-slate-700 md:col-span-2">{t(`product.items.${p.slug}.desc`)}</p>
    </article>
  );
}
