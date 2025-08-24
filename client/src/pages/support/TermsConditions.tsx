import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

const TermsConditions: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl font-bold text-center mb-8">
        {t('termsConditions', 'Terms & Conditions')}
      </h1>

      <div className="max-w-3xl mx-auto">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('acceptance', 'Acceptance of Terms')}</h2>
              <p className="text-gray-600">
                {t('acceptanceDesc', 'By accessing and using our services, you agree to be bound by these terms and conditions. If you do not agree with any part of these terms, you may not use our services.')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('userObligations', 'User Obligations')}</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>{t('userObligation1', 'Provide accurate and complete information')}</li>
                <li>{t('userObligation2', 'Maintain the security of your account')}</li>
                <li>{t('userObligation3', 'Comply with all applicable laws and regulations')}</li>
                <li>{t('userObligation4', 'Not misuse or attempt to manipulate our services')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('bookingTerms', 'Booking Terms')}</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>{t('bookingTerm1', 'All bookings are subject to availability')}</li>
                <li>{t('bookingTerm2', 'Prices may change without prior notice')}</li>
                <li>{t('bookingTerm3', 'Booking confirmation is subject to payment')}</li>
                <li>{t('bookingTerm4', 'Cancellations are subject to our cancellation policy')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('liability', 'Limitation of Liability')}</h2>
              <p className="text-gray-600">
                {t('liabilityDesc', 'We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of our services or any travel arrangements made through our platform.')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('intellectualProperty', 'Intellectual Property')}</h2>
              <p className="text-gray-600">
                {t('intellectualPropertyDesc', 'All content on our platform is protected by intellectual property rights and may not be used without our express permission.')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('modifications', 'Modifications to Terms')}</h2>
              <p className="text-gray-600">
                {t('modificationsDesc', 'We reserve the right to modify these terms at any time. Continued use of our services after such modifications constitutes acceptance of the updated terms.')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/support/247-support"
            className="text-tourtastic-blue hover:underline"
          >
            {t('contactSupport', 'Contact Support')} →
          </a>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
