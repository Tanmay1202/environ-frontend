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

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
  console.error(errorMessage);
  
  // Create a visible error message in the UI
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="
        padding: 20px;
        margin: 20px;
        border: 1px solid red;
        border-radius: 5px;
        background-color: #fff3f3;
        color: #d32f2f;
        font-family: Arial, sans-serif;
      ">
        <h2>Configuration Error</h2>
        <p>${errorMessage}</p>
        <p>Please check your environment variables and try again.</p>
      </div>
    `;
    throw new Error(errorMessage);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);