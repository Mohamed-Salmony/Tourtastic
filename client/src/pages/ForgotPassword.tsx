import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
      toast({
        title: t('success', 'Success'),
        description: t('resetLinkSent', 'A password reset link has been sent to your email if it exists in our system.'),
      });
    } catch (error) {
      toast({
        title: t('error', 'Error'),
        description: t('resetLinkError', 'Failed to send reset link. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="py-16 container-custom">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">{t('forgotPassword', 'Forgot Password')}</h1>
          <p className="text-gray-600 mb-6">
            {t('forgotPasswordIntro', 'Enter your email address and we will send you a link to reset your password.')}
          </p>

          {isSuccess ? (
            <div className="text-center">
              <p className="text-green-600 mb-4">{t('resetLinkSent', 'A password reset link has been sent to your email if it exists in our system.')}</p>
              <Button asChild>
                <Link to="/login">
                  {t('backToLogin', 'Back to Login')}
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Input
                  type="email"
                  placeholder={t('email', 'Email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('sending', 'Sending...') : t('sendResetLink', 'Send Reset Link')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword; 