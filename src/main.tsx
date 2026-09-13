import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      fallbackTitle="WIFI HITMAP System Protection"
      fallbackMessage="An unexpected rendering issue was intercepted safely. Click below to reload the workspace."
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
