import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@fontsource-variable/vazirmatn';
import '@fontsource/lalezar';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { I18nProvider } from './i18n';
import { AuthProvider } from './auth/AuthProvider';
import { ToastProvider } from './components/Feedback';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
);
