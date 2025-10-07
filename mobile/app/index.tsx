import { AuthProvider, useAuth } from './auth/AuthContext';
import React from 'react';
import { Home } from './views/Home';
import { LoginScreen } from './views/Login';


export default function Index() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const {accessToken } = useAuth();
  return accessToken ? <Home /> : <LoginScreen />;
}
