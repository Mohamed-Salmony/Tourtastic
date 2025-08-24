import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export const useAuthenticatedAction = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (action: () => void) => {
    if (!user) {
      toast.error('Please log in to continue');
      navigate('/login');
      return;
    }
    action();
  };
};
