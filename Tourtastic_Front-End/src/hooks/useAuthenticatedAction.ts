import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export const useAuthenticatedAction = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthenticatedAction = (action: () => void) => {
    if (!isAuthenticated) {
      // Save the current location for redirect after login
      navigate('/login', { state: { from: location } });
      return;
    }
    action();
  };

  return handleAuthenticatedAction;
};
