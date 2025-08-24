import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl font-bold text-center mb-8">
        {t('privacyPolicy', 'Privacy Policy')}
      </h1>

      <div className="max-w-3xl mx-auto">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('informationCollection', 'Information We Collect')}</h2>
              <p className="text-gray-600 mb-4">
                {t('informationCollectionDesc', 'We collect information that you provide directly to us, including:')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>{t('personalInfo', 'Personal information (name, email, phone number)')}</li>
                <li>{t('paymentInfo', 'Payment information')}</li>
                <li>{t('bookingInfo', 'Booking details and preferences')}</li>
                <li>{t('communicationInfo', 'Communications with our support team')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('informationUse', 'How We Use Your Information')}</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>{t('useBooking', 'Process your bookings and payments')}</li>
                <li>{t('useSupport', 'Provide customer support')}</li>
                <li>{t('useUpdates', 'Send important updates about your bookings')}</li>
                <li>{t('useMarketing', 'Send marketing communications (with your consent)')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('informationSharing', 'Information Sharing')}</h2>
              <p className="text-gray-600 mb-4">
                {t('informationSharingDesc', 'We may share your information with:')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>{t('sharePartners', 'Travel partners to fulfill your booking')}</li>
                <li>{t('shareService', 'Service providers who assist our operations')}</li>
                <li>{t('shareLegal', 'Legal authorities when required by law')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('dataSecurity', 'Data Security')}</h2>
              <p className="text-gray-600">
                {t('dataSecurityDesc', 'We implement appropriate security measures to protect your personal information from unauthorized access, disclosure, or misuse.')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('yourRights', 'Your Rights')}</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>{t('rightAccess', 'Access your personal information')}</li>
                <li>{t('rightCorrect', 'Correct inaccurate information')}</li>
                <li>{t('rightDelete', 'Request deletion of your information')}</li>
                <li>{t('rightObject', 'Object to certain data processing')}</li>
              </ul>
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

export default PrivacyPolicy;
