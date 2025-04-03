import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Check for required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_URL',
  'VITE_GEMINI_API_KEY',
  'VITE_OPENWEATHER_API_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);