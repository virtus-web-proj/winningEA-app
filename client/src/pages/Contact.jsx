import { useTranslation } from 'react-i18next';
import PageHero from '../components/PageHero.jsx';
import ContactForm from '../components/ContactForm.jsx';

export default function Contact() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero title={t('contact.title')} compact />
      <section className="container-gs py-14 text-center md:py-20">
        <p className="text-sm">{t('contact.lead')}</p>
        <div className="text-left"><ContactForm /></div>
      </section>
    </>
  );
}
