import './safeEnv.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import LightningBackdrop from './components/LightningBackdrop.jsx';
import { AppProvider } from './ctx.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
      <LightningBackdrop />
    </AppProvider>
  </React.StrictMode>
);
