import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

const BookingPolicy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl font-bold text-center mb-8">
        {t('bookingPolicy', 'Booking Policy')}
      </h1>

      <div className="max-w-3xl mx-auto">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('bookingProcess', 'Booking Process')}</h2>
              <p className="text-gray-600 mb-4">
                {t('bookingProcessDesc', 'Our booking process is designed to be simple and secure. All bookings are confirmed instantly upon successful payment. You will receive a confirmation email with your booking details.')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('paymentPolicy', 'Payment Policy')}</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>{t('paymentPolicy1', 'Full payment is required to confirm your booking')}</li>
                <li>{t('paymentPolicy2', 'We accept major credit cards and secure online payment methods')}</li>
                <li>{t('paymentPolicy3', 'All prices are displayed in your chosen currency')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('cancellationPolicy', 'Cancellation Policy')}</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>{t('cancellationPolicy1', 'Free cancellation up to 24 hours after booking')}</li>
                <li>{t('cancellationPolicy2', 'Cancellations made 72 hours before departure: 80% refund')}</li>
                <li>{t('cancellationPolicy3', 'Cancellations made 48 hours before departure: 50% refund')}</li>
                <li>{t('cancellationPolicy4', 'Cancellations made less than 48 hours before departure: no refund')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('modifications', 'Modifications')}</h2>
              <p className="text-gray-600 mb-4">
                {t('modificationsDesc', 'Changes to existing bookings are subject to availability and may incur additional charges. Please contact our support team for assistance with modifications.')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('refunds', 'Refunds')}</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>{t('refundPolicy1', 'Refunds are processed within 5-10 business days')}</li>
                <li>{t('refundPolicy2', 'Refund amount depends on the cancellation timing')}</li>
                <li>{t('refundPolicy3', 'Processing fees are non-refundable')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            {t('policyQuestions', 'Have questions about our booking policy?')}
          </p>
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

export default BookingPolicy;
