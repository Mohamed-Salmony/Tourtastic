import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from './providers/AuthProvider';
import AppRoutes from './routes';

const queryClient = new QueryClient();

function App() {
  return (
    // add v7 future flags to opt-in to upcoming react-router behavior
    // we extend the Router props via a .d.ts file so no cast is needed
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
