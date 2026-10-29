import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ja from './ja.json';
import en from './en.json';

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('gs_lang') : null;

i18n.use(initReactI18next).init({
  resources: { ja: { translation: ja }, en: { translation: en } },
  lng: saved === 'en' ? 'en' : 'ja',
  fallbackLng: 'ja',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try { localStorage.setItem('gs_lang', lng); } catch { /* ignore */ }
});
document.documentElement.lang = i18n.language;

export default i18n;
