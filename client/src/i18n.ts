
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations synchronously to avoid race conditions during initial render
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations }
    },
    lng: localStorage.getItem('locale') || 'en',
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'locale',
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false // Suspense disabled; resources loaded synchronously
    }
  });

// Set the document direction based on the language
i18n.on('languageChanged', (lng) => {
  document.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  document.documentElement.classList.remove('ltr', 'rtl');
  document.documentElement.classList.add(lng === 'ar' ? 'rtl' : 'ltr');
});
const setDocumentDirection = (language: string) => {
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
};

// Set initial direction
setDocumentDirection(i18n.language);

// Update document direction and persist selection when language changes
i18n.on('languageChanged', (lng: string) => {
  setDocumentDirection(lng);
  localStorage.setItem('locale', lng);
});

export default i18n;
