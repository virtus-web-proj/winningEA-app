import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHero from '../components/PageHero.jsx';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero title="404" compact />
      <section className="container-gs py-20 text-center">
        <h2 className="text-xl font-bold">{t('notFound.title')}</h2>
        <p className="mt-3 text-sm">{t('notFound.body')}</p>
        <Link to="/" className="btn-brand mt-8">{t('notFound.home')}</Link>
      </section>
    </>
  );
}
