import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Toaster } from 'react-hot-toast';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1E293B',
              color: '#FFF',
              fontSize: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)'
            }
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
