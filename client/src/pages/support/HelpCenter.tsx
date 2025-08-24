import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, FileText, HelpCircle, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const HelpCenter: React.FC = () => {
  const { t } = useTranslation();

  const categories = [
    {
      icon: <Bookmark className="h-6 w-6" />,
      title: t('bookingHelp', 'Booking Help'),
      description: t('bookingHelpDesc', 'Get help with your bookings, changes, and cancellations'),
      link: '/support/faqs#booking'
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: t('policies', 'Policies'),
      description: t('policiesDesc', 'Learn about our booking, cancellation, and refund policies'),
      link: '/support/booking-policy'
    },
    {
      icon: <HelpCircle className="h-6 w-6" />,
      title: t('generalQuestions', 'General Questions'),
      description: t('generalQuestionsDesc', 'Find answers to common questions about our services'),
      link: '/support/faqs'
    }
  ];

  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl font-bold text-center mb-8">
        {t('helpCenter', 'Help Center')}
      </h1>

      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            className="pl-10"
            placeholder={t('searchHelp', 'Search for help...')}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {categories.map((category, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-tourtastic-light-blue p-4 rounded-full mb-4">
                  {React.cloneElement(category.icon, { className: 'text-tourtastic-blue' })}
                </div>
                <h3 className="font-bold text-lg mb-2">{category.title}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <Button 
                  variant="link" 
                  className="text-tourtastic-blue"
                  onClick={() => window.location.href = category.link}
                >
                  {t('learnMore', 'Learn More')} →
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <h2 className="text-xl font-bold mb-4">
          {t('needMoreHelp', 'Need More Help?')}
        </h2>
        <p className="text-gray-600 mb-4">
          {t('contactSupport', 'Contact our 24/7 support team for personalized assistance')}
        </p>
        <Button 
          variant="default"
          onClick={() => window.location.href = '/support/247-support'}
        >
          {t('contactUs', 'Contact Us')}
        </Button>
      </div>
    </div>
  );
};

export default HelpCenter;
