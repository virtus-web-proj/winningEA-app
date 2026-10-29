import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-navy-900 text-white">
      <div className="container-gs py-14 md:py-20">
        <p className="max-w-5xl text-[13px] font-medium leading-7 text-white/95 md:text-sm">{t('footer.disclaimer')}</p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-2 text-xs text-white/90">
          <span>© {new Date().getFullYear()}</span>
          <img src="/images/winningEAlogo.png" alt="Winning EA" className="h-6 w-auto" />
          <span>{t('footer.rights')}</span>
        </div>
      </div>
    </footer>
  );
}
