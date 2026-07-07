import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import OptionsApp from './OptionsApp';
import '../panel/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>
);
