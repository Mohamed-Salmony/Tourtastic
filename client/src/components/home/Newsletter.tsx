
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';

// Email validation regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const Newsletter: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): string => {
    if (!email) {
      return t('emailRequired', 'Email is required');
    }
    if (!EMAIL_REGEX.test(email)) {
      return t('emailInvalid', 'Please enter a valid email address');
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Make API call to backend
      await axios.post('http://localhost:5000/api/newsletter/subscribe', { email });
      
      // Show success message
      toast.success(t('newsletter.success', 'Thank you for subscribing to our newsletter!'));
      setEmail('');
      
    } catch (error) {
      // Handle error cases
      const errorMessage = 
        error instanceof Error ? error.message : t('newsletter.error', 'Failed to subscribe. Please try again.');
      toast.error(errorMessage);
      setError(errorMessage);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 bg-tourtastic-blue">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">{t('subscribeNewsletter')}</h2>
          <p className="text-white/80 mb-8">
            {t('stayUpdated')}
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder={t('yourEmail')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  className={`w-full bg-white/90 focus:bg-white ${error ? 'border-red-500' : ''}`}
                  aria-invalid={!!error}
                  aria-describedby={error ? "email-error" : undefined}
                />
                {error && (
                  <p id="email-error" className="text-red-400 text-sm mt-1 text-start">
                    {error}
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="bg-black hover:bg-gray-800 text-white transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('subscribing') : t('subscribe')}
              </Button>
            </div>
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
