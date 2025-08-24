import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQs: React.FC = () => {
  const { t } = useTranslation();

  const faqs = {
    booking: [
      {
        question: t('howToBook', 'How do I book a flight?'),
        answer: t('howToBookAnswer', 'You can book a flight by using our search feature, selecting your preferred flight, and following the booking process. Make sure you have your passenger details and payment information ready.')
      },
      {
        question: t('cancelBooking', 'Can I cancel my booking?'),
        answer: t('cancelBookingAnswer', 'Yes, you can cancel your booking according to our cancellation policy. The refund amount will depend on how far in advance you cancel and the type of ticket you purchased.')
      }
    ],
    payment: [
      {
        question: t('paymentMethods', 'What payment methods do you accept?'),
        answer: t('paymentMethodsAnswer', 'We accept major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers.')
      },
      {
        question: t('refundProcess', 'How long does the refund process take?'),
        answer: t('refundProcessAnswer', 'Refunds typically take 5-10 business days to process, depending on your payment method and bank.')
      }
    ],
    account: [
      {
        question: t('createAccount', 'How do I create an account?'),
        answer: t('createAccountAnswer', 'Click on the "Register" button in the top right corner and fill in your details. You\'ll receive a confirmation email to verify your account.')
      },
      {
        question: t('forgotPassword', 'I forgot my password. What should I do?'),
        answer: t('forgotPasswordAnswer', 'Click on the "Forgot Password" link on the login page. You\'ll receive an email with instructions to reset your password.')
      }
    ]
  };

  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl font-bold text-center mb-8">
        {t('frequentlyAskedQuestions', 'Frequently Asked Questions')}
      </h1>

      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4" id="booking">
            {t('bookingFAQs', 'Booking FAQs')}
          </h2>
          <Accordion type="single" collapsible className="mb-6">
            {faqs.booking.map((faq, index) => (
              <AccordionItem value={`booking-${index}`} key={index}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <h2 className="text-xl font-bold mb-4" id="payment">
            {t('paymentFAQs', 'Payment FAQs')}
          </h2>
          <Accordion type="single" collapsible className="mb-6">
            {faqs.payment.map((faq, index) => (
              <AccordionItem value={`payment-${index}`} key={index}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <h2 className="text-xl font-bold mb-4" id="account">
            {t('accountFAQs', 'Account FAQs')}
          </h2>
          <Accordion type="single" collapsible>
            {faqs.account.map((faq, index) => (
              <AccordionItem value={`account-${index}`} key={index}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">
            {t('cantFindAnswer', 'Can\'t find the answer you\'re looking for?')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('contactSupportTeam', 'Contact our support team for further assistance')}
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

export default FAQs;
