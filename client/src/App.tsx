import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from './providers/AuthProvider';
import AppRoutes from './routes';
import api from './config/api';
import { setSypRate } from './utils/currency';
import React, { useEffect } from 'react';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Try to fetch server-stored SYP rate and seed localStorage
    (async () => {
      try {
        const resp = await api.get('/settings/sypRate');
        if (resp.data && resp.data.success && resp.data.data != null) {
          const v = Number(resp.data.data);
          if (!isNaN(v) && v > 0) setSypRate(v);
        }
      } catch (e) {
        // ignore - fallback to local value
      }
    })();
  }, []);
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
