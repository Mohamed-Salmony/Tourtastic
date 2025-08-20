
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Footer from './Footer';
import { useLocale } from '@/hooks/useLocale';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isRTL } = useLocale();
  const { i18n } = useTranslation();

  // Update the document direction when language changes
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRTL, i18n.language]);

  return (
    <div 
      className={`flex flex-col min-h-screen ${isRTL ? 'rtl' : 'ltr'}`}
      style={{
        direction: isRTL ? 'rtl' : 'ltr',
        textAlign: isRTL ? 'right' : 'left'
      }}
    >
      <Header />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
