import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AppRouter } from './routes/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import './styles/global.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-md)',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#0F5E3A', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
