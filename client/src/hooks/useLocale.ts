import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export const useLocale = () => {
  const { i18n, t } = useTranslation();
  const [currentLocale, setCurrentLocale] = useState(i18n.language);

  useEffect(() => {
    // Keep local state in sync with i18n language
    setCurrentLocale(i18n.language);
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLocale = async () => {
    const nextLocale = currentLocale === 'en' ? 'ar' : 'en';
    
    // Change language and ensure translations are loaded
    await i18n.changeLanguage(nextLocale);
    
    // Update localStorage
    localStorage.setItem('locale', nextLocale);
    
    // Update document direction and language
    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLocale;
    
    // Update state
    setCurrentLocale(nextLocale);
    
    // Force a re-render of all components
    window.dispatchEvent(new Event('languageChanged'));
  };

  return {
    currentLocale,
    isRTL: currentLocale === 'ar',
    toggleLocale,
    currentLanguageText: t('language')
  };
};

export default useLocale;
