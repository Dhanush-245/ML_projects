import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import AppShell from './components/layout/AppShell';
import LoginPage from './components/auth/LoginPage';

export default function App() {
  const { theme, isAuthenticated, hydrateFromBackend, backendSynced } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Hydrate state from backend on app startup (experiments, deployments survive refresh)
  useEffect(() => {
    if (isAuthenticated && !backendSynced) {
      hydrateFromBackend();
    }
  }, [isAuthenticated, backendSynced]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppShell />;
}
