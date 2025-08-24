import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export const useAuthenticatedAction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (action: () => void) => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    action();
  };
}; 