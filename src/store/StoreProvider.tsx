"use client";

import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { makeStore, AppStore } from './index';
import { logout, updateAccessToken } from './slices/authSlice';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    localStorage.removeItem('jira_tickets_data');

    const handleRefresh = (event: Event) => {
      const token = (event as CustomEvent<string>).detail;
      if (token) store.dispatch(updateAccessToken(token));
    };
    const handleLogout = () => store.dispatch(logout());

    window.addEventListener('auth:token-refreshed', handleRefresh);
    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:token-refreshed', handleRefresh);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  return (
    <Provider store={storeRef.current}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {children}
      </GoogleOAuthProvider>
    </Provider>
  );
}
