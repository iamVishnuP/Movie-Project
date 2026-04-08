import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const onboardingRoutes = [
    '/onboarding/profile-picture',
    '/onboarding/genres',
    '/onboarding/languages',
    '/onboarding/directors',
    '/onboarding/movies',
    '/onboarding/completion',
  ];

  const showNavbar = !onboardingRoutes.includes(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-text border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
};

export default MainLayout;
