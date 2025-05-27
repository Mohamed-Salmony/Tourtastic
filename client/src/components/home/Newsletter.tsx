
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Newsletter: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Thank you for subscribing to our newsletter!');
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section className="py-16 bg-tourtastic-blue">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">{t('subscribeNewsletter')}</h2>
          <p className="text-white/80 mb-8">
            {t('stayUpdated')}
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <Input
              type="email"
              placeholder={t('yourEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-white/90 focus:bg-white"
            />
            <Button 
              type="submit" 
              className="bg-black hover:bg-gray-800 text-white transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('subscribing') : t('subscribe')}
            </Button>
          </form>
          
          <p className="text-white/70 text-sm mt-4">
            {t('privacyRespect')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
