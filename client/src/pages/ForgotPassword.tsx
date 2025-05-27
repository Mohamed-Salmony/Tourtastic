import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useTranslation } from 'react-i18next';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Layout>
      <div className="py-16 container-custom">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-6 text-center">{t('forgotPassword', 'Forgot Password?')}</h1>
          <p className="text-gray-600 text-center mb-8">
            {t('forgotPasswordIntro', 'Enter your email address and we will send you a link to reset your password.')}
          </p>

          {submitted ? (
            <div className="text-center">
              <p className="text-green-600 font-medium mb-6">
                {t('resetLinkSent', 'A password reset link has been sent to your email if it exists in our system.')}
              </p>
              <Link to="/login" className="text-tourtastic-blue hover:text-tourtastic-dark-blue font-medium">
                {t('backToLogin', 'Back to Login')}
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email', 'Email')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tourtastic-blue"
                  placeholder={t('yourEmail', 'your@email.com')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-tourtastic-blue focus:ring-opacity-50"
              >
                {t('sendResetLink', 'Send Reset Link')}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-tourtastic-blue hover:text-tourtastic-dark-blue font-medium">
              {t('backToLogin', 'Back to Login')}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword; 