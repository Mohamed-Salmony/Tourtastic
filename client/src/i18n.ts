
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Async loading of translations
const loadTranslations = async (lng: string) => {
  try {
    const translations = await import(`./locales/${lng}.json`);
    return translations.default;
  } catch (error) {
    console.warn(`Failed to load translations for ${lng}`, error);
    const fallback = await import('./locales/en.json');
    return fallback.default;
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {}, // Start with empty resources
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
      useSuspense: false // Disable suspense for better performance
    }
  });

// Load both English and Arabic translations on init
const loadInitialTranslations = async () => {
  const initLang = localStorage.getItem('locale') || 'en';
  const languages = ['en', 'ar'];
  
  await Promise.all(languages.map(async (lang) => {
    const translations = await loadTranslations(lang);
    i18n.addResourceBundle(lang, 'translation', translations);
  }));
}

loadInitialTranslations();

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

// Listen for language changes
i18n.on('languageChanged', async (lng: string) => {
  setDocumentDirection(lng);
  localStorage.setItem('locale', lng);
  
  // Load translations for new language if not already loaded
  if (!i18n.hasResourceBundle(lng, 'translation')) {
    const translations = await loadTranslations(lng);
    i18n.addResourceBundle(lng, 'translation', translations);
  }
});

export default i18n;
