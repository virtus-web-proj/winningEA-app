import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { api } from '../lib/api.js';
import HeroCandles from '../components/HeroCandles.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ContactForm from '../components/ContactForm.jsx';
import Reveal from '../components/Reveal.jsx';

const photo = (file, fallback) => ({ backgroundImage: `url(/images/${file}), ${fallback}`, backgroundSize: 'cover', backgroundPosition: 'center' });

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api('/products', { auth: false }).then((d) => setProducts(d.products)).catch(() => setFailed(true));
  }, []);

  const steps = t('home.steps.items', { returnObjects: true });

  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden bg-navy-900 pt-24 text-white" style={photo('hero-background.jpg', 'linear-gradient(135deg,#00053f 0%,#001d8a 60%,#0369c9 100%)')}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/90 via-navy-900/60 to-navy-900/10" />
        <HeroCandles className="absolute inset-x-0 bottom-0 -z-10 h-3/5 w-full opacity-30" />
        <div className="container-gs">
          <div className="max-w-3xl">
            <p className="animate-rise text-xl font-bold md:text-3xl" style={{ animationDelay: '100ms' }}>{t('home.hero.l1')}</p>
            <h1 className="animate-rise font-display text-[5.5rem] font-bold leading-none !text-white sm:text-[8rem] md:text-[10rem]" style={{ animationDelay: '250ms' }}>
              <span className="bg-gradient-to-br from-white via-brand-light to-brand bg-clip-text text-transparent">{t('home.hero.l2a')}</span>
              <span className="ml-1 align-baseline text-2xl font-bold !text-white md:text-4xl">{t('home.hero.l2b')}</span>
            </h1>
            <p className="animate-rise text-xl font-bold md:text-3xl" style={{ animationDelay: '400ms' }}>{t('home.hero.l3')}</p>
          </div>
        </div>
        <a href="#about" className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center text-xs font-bold text-white/90">
          {t('home.hero.scroll')}
          <ChevronDown className="mt-1 animate-bob" />
        </a>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-light" />
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-white text-slate-900">
        <div className="container-gs grid items-center gap-8 py-14 md:grid-cols-[.85fr_1.15fr] md:gap-14 md:py-20">
          <div className="flex justify-center">
            <img src="/images/about.png" alt="Winning EA automated trading technology" className="w-full max-w-md object-contain" />
          </div>
          <div className="md:pr-8">
          <Reveal>
            <h2 className="text-2xl font-bold text-slate-950 md:text-3xl">{t('home.about.title')}</h2>
            <div className="mt-6 space-y-5 text-sm leading-8 text-slate-800 md:text-base">
              <p>{t('home.about.p1')}</p><p>{t('home.about.p2')}</p><p>{t('home.about.p3')}</p>
            </div>
          </Reveal>
          </div>
        </div>
      </section>

      {/* WHAT */}
      <section className="bg-navy-900 text-white">
        <div className="container-gs grid items-center gap-8 py-14 md:grid-cols-[1.15fr_.85fr] md:gap-14 md:py-20">
          <div className="md:pl-8">
          <Reveal>
            <h2 className="text-2xl font-bold !text-white md:text-3xl">{t('home.what.title')}</h2>
            <div className="mt-6 space-y-5 text-sm leading-8 text-white/95 md:text-base">
              <p>{t('home.what.p1')}</p><p>{t('home.what.p2')}</p><p>{t('home.what.p3')}</p>
            </div>
          </Reveal>
          </div>
          <div className="flex justify-center">
            <img src="/images/systemTrade.png" alt="System trading software on a laptop" className="w-full max-w-md object-contain" />
          </div>
        </div>
      </section>

      {/* MT4 */}
      <section className="bg-sky-50 py-14 md:py-16">
        <div className="container-gs grid items-center gap-8 md:grid-cols-[.85fr_1.15fr] md:gap-14">
          <div className="flex justify-center">
            <img src="/images/mt4-winningea.png" alt="MetaTrader 4" className="w-full max-w-sm object-contain" />
          </div>
          <div className="md:pr-8">
            <h2 className="text-2xl font-bold leading-tight md:text-3xl">{t('home.mt4.title')}</h2>
            <p className="mt-6 max-w-2xl text-sm leading-8 md:text-base">{t('home.mt4.body')}</p>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container-gs">
          <h2 className="text-center text-2xl font-bold md:text-3xl">{t('home.products.title')}</h2>

          <div className="mt-10 pb-8 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <h3 className="text-xl font-bold md:text-2xl">{t('home.products.customTitle')}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{t('home.products.customDesc')}</p>
              <p className="text-sm leading-7 text-slate-700">{t('home.products.customNote')}</p>
            </div>
            <div className="mt-5 shrink-0 sm:mt-0 sm:w-56">
              <p className="text-sm text-slate-600">{t('home.products.priceLabel')} <span className="text-lg font-bold text-red-600">{t('home.products.customPrice')}</span></p>
              <Link to="/custom-tool" className="mt-2 block rounded-sm bg-brand px-10 py-2.5 text-center text-sm font-bold text-white transition hover:bg-brand-dark">{t('home.products.buy')}</Link>
            </div>
          </div>

          {failed && <p className="mt-10 text-center text-sm text-red-600">{t('errors.network')}</p>}
          <div className="mt-0 border-t-4 border-navy-900">
            {(products || Array.from({ length: 6 })).map((p, i) =>
              p ? (
                <Reveal key={p.slug} delay={(i % 2) * 90}><ProductCard p={p} /></Reveal>
              ) : (
                <div key={i} className="h-56 animate-pulse bg-white" />
              ),
            )}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section
        className="relative isolate overflow-hidden py-16 text-white md:py-24"
        style={{
          backgroundImage: 'linear-gradient(rgba(4, 7, 48, .62), rgba(4, 7, 48, .78)), url(/images/MT4-section-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container-gs">
          <h2 className="text-center text-xl font-bold !text-white md:text-2xl">{t('home.steps.title')}</h2>
          <ol className="mx-auto mt-12 max-w-4xl space-y-6">
            {steps.map((s, i) => (
              <Reveal as="li" key={i} delay={i * 70} className="flex items-center gap-5">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-sky-300 text-xs font-bold text-white shadow-lg ring-4 ring-sky-100/25 md:h-[4.5rem] md:w-[4.5rem]">STEP{i + 1}</span>
                <div>
                  <h3 className="text-base font-bold !text-white md:text-lg">{s.t}</h3>
                  <p className="mt-1 text-xs leading-6 text-white/95 md:text-sm">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* CONTACT */}
      <section className="bg-white py-16 md:py-24">
        <div className="container-gs text-center">
          <h2 className="text-2xl font-bold md:text-3xl">{t('home.contact.title')}</h2>
          <p className="mt-4 text-sm">{t('home.contact.lead')}</p>
          <div className="text-left"><ContactForm /></div>
        </div>
      </section>
    </>
  );
}
