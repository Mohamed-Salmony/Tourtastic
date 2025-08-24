import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

const CookiePolicy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('cookiePolicy')}</h1>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-4">{t('whatAreCookies')}</h2>
          <p className="mb-4">{t('cookiesExplanation')}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-4">{t('howWeUseCookies')}</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('cookieUse1')}</li>
            <li>{t('cookieUse2')}</li>
            <li>{t('cookieUse3')}</li>
            <li>{t('cookieUse4')}</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-4">{t('typesOfCookies')}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">{t('essentialCookies')}</h3>
              <p>{t('essentialCookiesDesc')}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{t('analyticalCookies')}</h3>
              <p>{t('analyticalCookiesDesc')}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{t('functionalCookies')}</h3>
              <p>{t('functionalCookiesDesc')}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{t('marketingCookies')}</h3>
              <p>{t('marketingCookiesDesc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-4">{t('managingCookies')}</h2>
          <p className="mb-4">{t('managingCookiesDesc')}</p>
          <p>{t('browserSettings')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-4">{t('questions')}</h2>
          <p>{t('cookieQuestionsContact')}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookiePolicy;
