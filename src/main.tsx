import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LandscapeGuard } from './components/LandscapeGuard.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LandscapeGuard>
      <App />
    </LandscapeGuard>
  </StrictMode>,
);
