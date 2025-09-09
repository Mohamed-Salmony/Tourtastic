import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import api from '@/config/api';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: email, 2: code, 3: new pass, 4: success

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const resp = await api.post('/auth/password/forgot', { email });
      if (resp.data?.success) {
        setStep(2);
        toast({
          title: t('success', 'Success'),
          description: t('resetCodeSent', 'A verification code has been sent to your email.'),
        });
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      toast({
        title: t('error', 'Error'),
        description: t('resetLinkError', 'Failed to send reset code. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const resp = await api.post('/auth/password/verify', { email, code });
      if (resp.data?.success) {
        setStep(3);
        toast({ title: t('success', 'Success'), description: t('codeVerified', 'Code verified. Please enter a new password.') });
      } else {
        throw new Error('Invalid code');
      }
    } catch (error) {
      toast({ title: t('error', 'Error'), description: t('invalidCode', 'Invalid or expired code.'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: t('error', 'Error'), description: t('passwordTooShort', 'Password must be at least 6 characters.'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('error', 'Error'), description: t('passwordMismatch', 'Passwords do not match.'), variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const resp = await api.post('/auth/password/reset', { email, code, newPassword });
      if (resp.data?.success) {
        setStep(4);
        toast({ title: t('success', 'Success'), description: t('passwordResetSuccess', 'Your password has been reset successfully.') });
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      toast({ title: t('error', 'Error'), description: t('passwordResetFailed', 'Failed to reset password. Please try again.'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="py-16 container-custom">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">{t('forgotPassword', 'Forgot Password')}</h1>
          {step === 1 && (
            <>
              <p className="text-gray-600 mb-6">
                {t('forgotPasswordIntro', 'Enter your email address and we will send you a verification code to reset your password.')}
              </p>
              <form onSubmit={submitEmail}>
                <div className="mb-4">
                  <Input
                    type="email"
                    placeholder={t('email', 'Email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t('sending', 'Sending...') : t('sendResetCode', 'Send Verification Code')}
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-gray-600 mb-6">
                {t('enterCode', 'Enter the 6-digit code we sent to your email.')}
              </p>
              <form onSubmit={submitCode}>
                <div className="mb-4">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    placeholder={t('verificationCode', 'Verification Code')}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={isSubmitting}>
                    {t('back', 'Back')}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? t('verifying', 'Verifying...') : t('verifyCode', 'Verify Code')}
                  </Button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-gray-600 mb-6">
                {t('setNewPassword', 'Enter your new password below.')}
              </p>
              <form onSubmit={submitNewPassword}>
                <div className="mb-4">
                  <Input
                    type="password"
                    placeholder={t('newPassword', 'New Password')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <Input
                    type="password"
                    placeholder={t('confirmPassword', 'Confirm Password')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setStep(2)} disabled={isSubmitting}>
                    {t('back', 'Back')}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? t('saving', 'Saving...') : t('resetPassword', 'Reset Password')}
                  </Button>
                </div>
              </form>
            </>
          )}

          {step === 4 && (
            <div className="text-center">
              <p className="text-green-600 mb-4">{t('passwordResetSuccess', 'Your password has been reset successfully. You can now log in with your new password.')}</p>
              <Button asChild>
                <Link to="/login">{t('backToLogin', 'Back to Login')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;