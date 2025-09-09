import './i18n';  // Import i18n initialization first
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/overrides.css'  // Override antd and other third-party styles
import { inject } from '@vercel/analytics'

// Initialize Vercel Web Analytics (no-op in development)
inject()

createRoot(document.getElementById("root")!).render(<App />);
