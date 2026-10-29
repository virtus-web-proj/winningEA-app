import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHero from '../components/PageHero.jsx';

export default function CustomTool() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero title={t('custom.title')} />
      <section className="container-gs max-w-3xl py-16 text-center md:py-24">
        <h2 className="text-2xl font-bold md:text-3xl">{t('custom.heading')}</h2>
        <div className="mx-auto mt-8 border border-navy-900 px-6 py-10 text-sm leading-8 text-slate-600">
          <p>{t('custom.body1')}</p>
          <p className="mt-3">{t('custom.body2')}</p>
        </div>
        <Link to="/contact" className="btn-navy mx-auto mt-16 flex w-full max-w-xl py-3 text-lg">{t('common.contactCta')}</Link>
      </section>
    </>
  );
}
