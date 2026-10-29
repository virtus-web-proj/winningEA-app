import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTween } from '../lib/useTween.js';
import { yen, num } from '../lib/format.js';
import PageHero from '../components/PageHero.jsx';
import ProductIcon from '../components/ProductIcon.jsx';
import NotFound from './NotFound.jsx';

export default function Product() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [missing, setMissing] = useState(false);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null); setMissing(false); setPicked([]);
    api(`/products/${slug}`, { auth: false }).then(setData).catch((e) => (e.status === 404 ? setMissing(true) : setError(e.code)));
  }, [slug]);

  const total = useMemo(() => {
    if (!data) return 0;
    return data.product.price + data.options.filter((o) => picked.includes(o.id)).reduce((s, o) => s + o.price, 0);
  }, [data, picked]);
  const shown = useTween(total);

  if (missing) return <NotFound />;
  const p = data?.product;
  const toggle = (id) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function buy() {
    if (!user) { navigate('/login', { state: { from: `/products/${slug}` } }); return; }
    setBusy(true); setError('');
    try {
      const r = await api('/orders', { method: 'POST', body: { slug, options: picked } });
      sessionStorage.setItem(`gs_order_${slug}`, JSON.stringify(r));
      navigate(`/products/${slug}/buy`, { state: r });
    } catch (e) {
      setError(e.code);
      setBusy(false);
    }
  }

  const specs = p && [
    [t('product.spec.pair'), p.pair],
    [t('product.spec.timeframe'), t(`product.tf.${p.timeframe}`)],
    [t('product.spec.win'), `${p.winRate.toFixed(2)}%`],
    [t('product.spec.dd'), p.maxDrawdown == null ? '-%' : `${p.maxDrawdown}%`],
    [t('product.spec.pf'), num(p.profitFactor)],
    [t('product.spec.payoff'), num(p.payoffRatio)],
    [t('product.spec.pips'), `${num(p.totalPips)}Pips`],
  ];

  return (
    <>
      <PageHero title={p ? t(`product.items.${slug}.name`) : ''} />
      {!p ? (
        <div className="grid min-h-[40vh] place-items-center text-sm text-slate-500">{error ? t(`errors.${error}`, t('errors.generic')) : t('common.loading')}</div>
      ) : (
        <>
          <section className="bg-cream py-14 md:py-20">
            <div className="container-gs flex flex-col items-center text-center">
              <div className="grid h-32 w-32 place-items-center border-4 border-navy-900 bg-white p-3"><ProductIcon slug={slug} size={96} className="h-24 w-24 object-contain" /></div>
              <p className="mt-5 text-xs font-bold">{t('product.provider')}</p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700">{t(`product.items.${slug}.desc`)}</p>
            </div>
          </section>

          <section className="container-gs max-w-5xl py-14 md:py-16">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead><tr>{specs.map(([h]) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody><tr>{specs.map(([h, v]) => <td key={h} className="td">{v}</td>)}</tr></tbody>
              </table>
            </div>

            <div id="backtest" className="scroll-mt-28 pt-16">
              <h2 className="text-center text-xl font-bold md:text-2xl">{t('product.backtest')}</h2>
              <div className="mt-6 border border-slate-300">
                <iframe title={t('product.backtest')} src={`/backtests/${slug}.html`} className="block h-[28rem] w-full bg-white" loading="lazy" />
              </div>
              <p className="mt-2 text-right text-xs">
                <a href={`/backtests/${slug}.html`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline"><ExternalLink className="h-3.5 w-3.5" />{t('product.backtestOpen')}</a>
              </p>
            </div>
          </section>

          <section className="bg-slate-100 py-14 md:py-20">
            <div className="container-gs max-w-5xl">
              <h2 className="text-center text-xl font-bold md:text-2xl">{t('product.buyTitle')}</h2>
              <div className="mt-8 border border-slate-300 bg-white p-5 md:p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="grid place-items-center border border-slate-300 p-8 text-center">
                    <p className="text-2xl text-slate-700 md:text-[1.7rem]">{t('product.price')} <strong className="text-red-600">{yen(p.price)}{t('common.taxIn')}</strong></p>
                    <p className="mt-3 text-sm text-slate-600">{t('product.bankOnly')}</p>
                  </div>
                  <table className="w-full border-collapse text-sm">
                    <thead><tr><th className="th">{t('product.optionCol')}</th><th className="th w-24">{t('product.useCol')}</th></tr></thead>
                    <tbody>
                      {data.options.map((o) => (
                        <tr key={o.id}>
                          <td className="td"><label htmlFor={`opt-${o.id}`} className="cursor-pointer">{t(`product.opt.${o.id}.name`)}({yen(o.price)})</label></td>
                          <td className="td"><input id={`opt-${o.id}`} type="checkbox" checked={picked.includes(o.id)} onChange={() => toggle(o.id)} className="h-4 w-4 accent-brand" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-2xl md:text-[1.7rem]">{t('product.pay')} <strong className="tabular-nums text-red-600">{yen(shown)}{t('common.taxIn')}</strong></p>
                  {error && <p className="mt-3 text-sm text-red-600">{t(`errors.${error}`, t('errors.generic'))}</p>}
                  <button onClick={buy} disabled={busy} className="btn-brand mt-5 px-16">{busy ? t('product.buying') : t('product.buy')}</button>
                  {!user && <p className="mt-3 text-xs text-slate-500">{t('auth.loginRequired')} <Link to="/login" state={{ from: `/products/${slug}` }} className="text-brand underline">{t('auth.goLogin')}</Link></p>}
                </div>
              </div>

              <h2 className="mt-16 text-center text-xl font-bold md:text-2xl">{t('product.optionsTitle')}</h2>
              <p className="mt-4 text-center text-sm">{t('product.optionsLead')}</p>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead><tr><th className="th">{t('product.optionsHead.option')}</th><th className="th">{t('product.optionsHead.content')}</th><th className="th">{t('product.optionsHead.price')}</th></tr></thead>
                  <tbody>
                    {data.options.map((o) => (
                      <tr key={o.id}>
                        <td className="td">{t(`product.opt.${o.id}.name`)}</td>
                        <td className="td">{t(`product.opt.${o.id}.desc`)}</td>
                        <td className="td whitespace-nowrap">{yen(o.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
