import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './i18n';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AskSakhi from './pages/AskSakhi';
import Auth from './pages/Auth';
import Wishlist from './pages/Wishlist';
import History from './pages/History';
import Profile from './pages/Profile';
import Search from './pages/Search';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import FAQ from './pages/FAQ';

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
                  <Route path="search" element={<ErrorBoundary><Search /></ErrorBoundary>} />
                  <Route path="product/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
                  <Route path="about" element={<ErrorBoundary><About /></ErrorBoundary>} />
                  <Route path="faq" element={<ErrorBoundary><FAQ /></ErrorBoundary>} />
                  <Route path="auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
                  <Route path="app" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                  <Route path="app/ask" element={<ErrorBoundary><AskSakhi /></ErrorBoundary>} />
                  <Route path="app/wishlist" element={<ErrorBoundary><Wishlist /></ErrorBoundary>} />
                  <Route path="app/history" element={<ErrorBoundary><History /></ErrorBoundary>} />
                  <Route path="app/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}

