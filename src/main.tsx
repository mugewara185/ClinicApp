/**
 * main.tsx
 * Application entry point.
 * Initializes the RDF Framework BEFORE mounting React.
 */

// Initialize RDF Framework first (registers schemas, attaches window.__DEV__)
import './framework/init';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
