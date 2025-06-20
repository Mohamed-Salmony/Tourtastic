
import './i18n';  // Import i18n initialization first
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/overrides.css'  // Override antd and other third-party styles

createRoot(document.getElementById("root")!).render(<App />);
