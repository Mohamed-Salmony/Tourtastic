import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const PaymentSuccess: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20">
        <CheckCircle className="h-24 w-24 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold mb-4">{t('paymentSuccessful', 'Payment Successful!')}</h1>
        <p className="text-gray-600 max-w-md text-center mb-8">
          {t('paymentSuccessMessage', 'Your payment has been processed successfully. Thank you for choosing Tourtastic!')}
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/profile">
              {t('viewBookings', 'View Bookings')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              {t('backToHome', 'Back to Home')}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess; 