import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/config/api';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Determine if the input is an email or username
      const isEmail = formData.email.includes('@');
      const loginData = {
        password: formData.password,
        ...(isEmail ? { email: formData.email } : { username: formData.email })
      };
      console.log('Attempting login with:', loginData);
      const response = await api.post('/auth/login', loginData);

      console.log('Login response:', response.data);

      if (response.data.success) {
        console.log('Login successful, calling login function');
        
        // Log the user in with both tokens and user data
        login(
          {
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken
          },
          response.data.user
        );
        
        // Sync local cart items if any exist
        const localCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        if (localCartItems.length > 0) {
          try {
            // Create bookings for each local cart item
                for (const item of localCartItems) {
                  // The client-side cart items historically used `departureTime` while the
                  // server expects `departureDate`. Normalize common variants so the
                  // createBooking endpoint receives a `departureDate` and passes schema validation.
                  const departureDate = item.departureDate || item.departureTime || item.departure_time ||
                    item.selectedFlight?.departureTime || item.selectedFlight?.legs?.[0]?.from?.date || null;

                  const flightDetails = {
                    ...item,
                    departureDate,
                  };

                  await api.post('/bookings', { flightDetails });
                }
            // Clear local cart after successful sync
            localStorage.removeItem('cartItems');
          } catch (error) {
            console.error('Failed to sync cart items to bookings:', error);
          }
        }

        toast({
          title: "Success",
          description: "Successfully logged in",
        });

        // Check if we should redirect to cart for checkout
        const { state } = location;
        if (state?.returnUrl === '/cart' && state?.message?.includes('checkout')) {
          navigate('/cart');
        } else {
          navigate(from);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to login";
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-16 container-custom">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">{t('signIn', 'Sign In')}</h1>
        <p className="text-gray-600 text-center mb-8">
          {t('welcomeBack', 'Welcome back! Please sign in to your account.')}
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('emailOrUsername', 'Email or Username')}
            </label>
            <input
              id="email"
              name="email"
              type="text"
              required
              value={formData.email}
              onChange={handleInputChange}
              pattern="^([A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]|[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+\.[A-Za-z]{2,})$"
              title={t('emailOrUsernameValidation', 'Enter a valid email address or username')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tourtastic-blue"
              placeholder={t('emailOrUsernamePlaceholder', 'email@example.com or username')}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('password', 'Password')}
              </label>
              <Link to="/forgot-password" className="text-sm text-tourtastic-blue hover:text-tourtastic-dark-blue">
                {t('forgotPassword', 'Forgot Password?')}
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tourtastic-blue pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-tourtastic-blue focus:ring-tourtastic-blue border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              {t('rememberMe', 'Remember me')}
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-tourtastic-blue hover:bg-tourtastic-dark-blue text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-tourtastic-blue focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('signingIn', 'Signing in...') : t('signIn', 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('noAccount', "Don't have an account?")}{' '}
            <Link to="/register" className="text-tourtastic-blue hover:text-tourtastic-dark-blue font-medium">
              {t('register', 'Register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
