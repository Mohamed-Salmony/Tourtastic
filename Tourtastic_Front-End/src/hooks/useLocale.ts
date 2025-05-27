import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export const useLocale = () => {
  const { i18n } = useTranslation();
  const [currentLocale, setCurrentLocale] = useState(i18n.language);

  useEffect(() => {
    // Keep local state in sync with i18n language
    setCurrentLocale(i18n.language);
  }, [i18n.language]);

  const toggleLocale = () => {
    const nextLocale = currentLocale === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLocale);
    localStorage.setItem('locale', nextLocale);
    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLocale;
    setCurrentLocale(nextLocale);
  };

  return {
    currentLocale,
    isRTL: currentLocale === 'ar',
    toggleLocale
  };
};

export default useLocale;
