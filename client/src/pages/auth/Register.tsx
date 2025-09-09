import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/hooks/useLocale';
import { Eye, EyeOff, Calendar } from 'lucide-react';
import api from '@/config/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker.css";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [existenceErrors, setExistenceErrors] = useState<{
    username?: string;
    email?: string;
  }>({});
  const { t } = useTranslation();
  // Require: at least 8 non-whitespace chars, must include letters, numbers, and symbols (no strict upper/lowercase requirement)
  const strongPasswordRegex = /^(?=\S{8,}$)(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

  // Cleanup debounce timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    // Sanitize password inputs: remove all whitespace characters as the policy disallows them
    const sanitizedValue = (id === 'password' || id === 'confirmPassword')
      ? value.replace(/\s+/g, '')
      : value;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : sanitizedValue
    }));

    // Clear any existing existence errors when field is cleared
    if ((id === 'email' || id === 'username') && !value) {
      setExistenceErrors(prev => ({ ...prev, [id]: undefined }));
    }

    // Debounced check for email and username existence
    if ((id === 'email' || id === 'username') && value) {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      setDebounceTimeout(
        setTimeout(async () => {
          try {
            // Only check if the field meets basic validation
            if (id === 'email' && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
              return;
            }
            if (id === 'username' && !/^[A-Za-z0-9][A-Za-z0-9-]{1,}[A-Za-z0-9]$/.test(value)) {
              return;
            }

            const response = await api.post('/auth/check-exists', { [id]: value });
            if (response.data.exists) {
              setExistenceErrors(prev => ({
                ...prev,
                [id]: t(id === 'email' ? 'emailExists' : 'usernameExists')
              }));
            } else {
              setExistenceErrors(prev => ({ ...prev, [id]: undefined }));
            }
          } catch (error) {
            console.error(`Error checking ${id} existence:`, error);
          }
        }, 500) // 500ms debounce
      );
    }
  };

  // Function to check if email/username exists
  const checkExisting = async (field: 'email' | 'username', value: string) => {
    try {
      const response = await api.post('/auth/check-exists', { [field]: value });
      // Return true if the status is 400 (exists) or if the result explicitly says exists
      return response.status === 400 || response.data.exists === true;
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error && 
          (error as any).response && typeof (error as any).response === 'object' && 'status' in (error as any).response &&
          (error as any).response.status === 400) {
        // The field exists if we got a 400 response
        return true;
      }
      console.error(`Error checking ${field}:`, error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.username || !formData.email || !formData.phoneNumber || !formData.dateOfBirth) {
      toast({
        title: "Error",
        description: t('fillAllFields', 'Please fill in all required fields'),
        variant: "destructive"
      });
      return;
    }

    // Validate username
    const usernameRegex = /^[A-Za-z0-9][A-Za-z0-9-]{1,}[A-Za-z0-9]$/;
    if (!usernameRegex.test(formData.username)) {
      toast({
        title: "Error",
        description: t('invalidUsername', 'Username must start and end with a letter or number, and can only contain letters, numbers, and hyphens'),
        variant: "destructive"
      });
      return;
    }

    if (formData.username.length < 3) {
      toast({
        title: "Error",
        description: t('usernameTooShort', 'Username must be at least 3 characters long'),
        variant: "destructive"
      });
      return;
    }

    // Validate email
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: t('invalidEmail', 'Please enter a valid email address'),
        variant: "destructive"
      });
      return;
    }

    // Validate age (must be 18 or older)
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      toast({
        title: "Error",
        description: t('mustBe18', 'You must be at least 18 years old to register'),
        variant: "destructive"
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast({
        title: "Error",
        description: t('invalidPhone', 'Please enter a valid phone number (e.g., +201234567890)'),
        variant: "destructive"
      });
      return;
    }

    // Trim password fields to avoid accidental spaces
    const trimmedPassword = (formData.password || '').trim();
    const trimmedConfirm = (formData.confirmPassword || '').trim();

    // Validate strong password (min 8 non-whitespace chars, includes letters, number, and symbol)
    if (!strongPasswordRegex.test(trimmedPassword)) {
      toast({
        title: "Error",
        description: t('passwordNotStrong', 'Password must be at least 8 characters and include letters, a number, and a symbol.'),
        variant: "destructive"
      });
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      toast({
        title: "Error",
        description: t('passwordsDoNotMatch', 'Passwords do not match'),
        variant: "destructive"
      });
      return;
    }

    if (!formData.terms) {
      toast({
        title: "Error",
        description: t('acceptTerms', 'Please accept the terms and conditions'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if there are any existence errors
      if (existenceErrors.email || existenceErrors.username) {
        toast({
          title: "Error",
          description: t('existingCredentials', 'Please fix the username/email issues before continuing.'),
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Double check existence in case the user modified the UI
      const [emailExists, usernameExists] = await Promise.all([
        checkExisting('email', formData.email),
        checkExisting('username', formData.username)
      ]);

      if (emailExists || usernameExists) {
        if (emailExists) {
          setExistenceErrors(prev => ({
            ...prev,
            email: t('emailExists')
          }));
        }
        if (usernameExists) {
          setExistenceErrors(prev => ({
            ...prev,
            username: t('usernameExists')
          }));
        }
        toast({
          title: "Error",
          description: t('existingCredentials', 'Please fix the username/email issues before continuing.'),
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const response = await api.post('/auth/register', {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        password: trimmedPassword,
        role: 'user'
      });

      const responseData = response.data;
      if (responseData.success) {
        // Store the token
        localStorage.setItem('token', responseData.accessToken);
        
        // Automatically log in the user
        login(
          {
            accessToken: responseData.accessToken,
            refreshToken: responseData.refreshToken
          },
          responseData.user
        );
        
        toast({
          title: "Success",
          description: "Registration successful! Welcome to Tourtastic.",
        });

        // Redirect to home page
        navigate('/');
      } else {
        throw new Error(responseData.message || 'Registration failed');
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Registration failed. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="py-16 container-custom">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-6 text-center">{t('createAccount', 'Create an Account')}</h1>
          <p className="text-gray-600 text-center mb-8">
            {t('joinTourtastic', 'Join Tourtastic and start planning your next adventure.')}
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('fullName', 'Full Name')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tourtastic-blue"
                placeholder={t('fullNamePlaceholder', 'John Doe')}
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                {t('username', 'Username')}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${existenceErrors.username ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-tourtastic-blue`}
                placeholder={t('usernamePlaceholder', 'johndoe123')}
              />
              {existenceErrors.username && (
                <p className="mt-1 text-sm text-red-500">{existenceErrors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('email', 'Email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${existenceErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-tourtastic-blue`}
                placeholder={t('emailPlaceholder', 'your.email@example.com')}
              />
              {existenceErrors.email && (
                <p className="mt-1 text-sm text-red-500">{existenceErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                {t('phoneNumber', 'Phone Number')}
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tourtastic-blue"
                placeholder={t('phoneNumberPlaceholder', '+1 (234) 567-8900')}
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                {t('dateOfBirth', 'Date of Birth')}
              </label>
              <div className="relative">
                <DatePicker
                  id="dateOfBirth"
                  selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                  onChange={(date: Date) => {
                    setFormData(prev => ({
                      ...prev,
                      dateOfBirth: date.toISOString().split('T')[0]
                    }));
                  }}
                  dateFormat="yyyy-MM-dd"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  placeholderText={t('dateOfBirthPlaceholder', 'mm/dd/yyyy')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tourtastic-blue"
                  required
                  showMonthDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                  minDate={new Date(1900, 0, 1)}
                  openToDate={new Date(2000, 0, 1)}
                />
                <Calendar className="datepicker-calendar-icon h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('password', 'Password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tourtastic-blue pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800"
                >
                  <span aria-label={showPassword ? t('hidePassword', 'Hide Password') : t('showPassword', 'Show Password')}>
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {t('confirmPassword', 'Confirm Password')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tourtastic-blue pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800"
                >
                  <span aria-label={showConfirmPassword ? t('hidePassword', 'Hide Password') : t('showPassword', 'Show Password')}>
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={formData.terms}
                onChange={handleChange}
                className="h-4 w-4 text-tourtastic-blue focus:ring-tourtastic-blue border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                {t('acceptance', 'I agree to')}{' '}
                <Link to="/support/terms-conditions" className="text-tourtastic-blue hover:underline">
                  {t('termsOfService', 'Terms of Service')}
                </Link>{' '}
                {t('and', 'and')}{' '}
                <Link to="/support/privacy-policy" className="text-tourtastic-blue hover:underline">
                  {t('privacyPolicy', 'Privacy Policy')}
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-tourtastic-blue focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a 8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('registering', 'Registering...')}
                </>
              ) : (
                t('register', 'Register')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('haveAccount', 'Already have an account?')}{' '}
              <Link to="/login" className="text-tourtastic-blue hover:text-tourtastic-dark-blue font-medium">
                {t('signIn', 'Sign In')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
