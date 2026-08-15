import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './i18n';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AskSakhi from './pages/AskSakhi';
import Auth from './pages/Auth';
import Wishlist from './pages/Wishlist';
import History from './pages/History';

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<LandingPage />} />
                <Route path="auth" element={<Auth />} />
                <Route path="app" element={<Dashboard />} />
                <Route path="app/ask" element={<AskSakhi />} />
                <Route path="app/wishlist" element={<Wishlist />} />
                <Route path="app/history" element={<History />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
