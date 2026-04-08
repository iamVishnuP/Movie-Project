import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import OTPVerification from './pages/OTPVerification';
import GenreSelection from './pages/onboarding/GenreSelection';
import LanguageSelection from './pages/onboarding/LanguageSelection';
import DirectorSelection from './pages/onboarding/DirectorSelection';
import MovieSelection from './pages/onboarding/MovieSelection';
import ProfilePicture from './pages/onboarding/ProfilePicture';
import Completion from './pages/onboarding/Completion';
import Profile from './pages/Profile';
import MovieDetail from './pages/MovieDetail';
import Watchlist from './pages/Watchlist';
import Search from './pages/Search';
import FindPeople from './pages/FindPeople';
import PublicProfile from './pages/PublicProfile';
import CreateDiscussion from './pages/CreateDiscussion';
import DiscussionThread from './pages/DiscussionThread';
import ViewAll from './pages/ViewAll';
import Landing from './pages/Landing';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gold-text border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/" />;

  // Onboarding Check: If user has no genres, they must go through onboarding first.
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  const needsOnboarding = !user.selectedGenres || user.selectedGenres.length === 0;

  if (needsOnboarding && !isOnboardingRoute) {
    return <Navigate to="/onboarding/profile-picture" />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    const needsOnboarding = !user.selectedGenres || user.selectedGenres.length === 0;
    return <Navigate to={needsOnboarding ? "/onboarding/profile-picture" : "/discover"} />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black text-white">
          <Routes>
            <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
            <Route path="/verify-otp" element={<PublicRoute><OTPVerification /></PublicRoute>} />
            <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
            
            <Route path="/" element={<Landing />} />
            
            <Route path="/discover" element={<ProtectedRoute><MainLayout><Home /></MainLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
            <Route path="/onboarding/profile-picture" element={<ProtectedRoute><MainLayout><ProfilePicture /></MainLayout></ProtectedRoute>} />
            <Route path="/onboarding/genres" element={<ProtectedRoute><MainLayout><GenreSelection /></MainLayout></ProtectedRoute>} />
            <Route path="/onboarding/languages" element={<ProtectedRoute><MainLayout><LanguageSelection /></MainLayout></ProtectedRoute>} />
            <Route path="/onboarding/directors" element={<ProtectedRoute><MainLayout><DirectorSelection /></MainLayout></ProtectedRoute>} />
            <Route path="/onboarding/movies" element={<ProtectedRoute><MainLayout><MovieSelection /></MainLayout></ProtectedRoute>} />
            <Route path="/onboarding/completion" element={<ProtectedRoute><MainLayout><Completion /></MainLayout></ProtectedRoute>} />
            <Route path="/movie/:id" element={<ProtectedRoute><MainLayout><MovieDetail /></MainLayout></ProtectedRoute>} />
            <Route path="/watchlist" element={<ProtectedRoute><MainLayout><Watchlist /></MainLayout></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><MainLayout><Search /></MainLayout></ProtectedRoute>} />
            <Route path="/find-people" element={<ProtectedRoute><MainLayout><FindPeople /></MainLayout></ProtectedRoute>} />
            <Route path="/user/:id" element={<ProtectedRoute><MainLayout><PublicProfile /></MainLayout></ProtectedRoute>} />
            <Route path="/create-discussion" element={<ProtectedRoute><MainLayout><CreateDiscussion /></MainLayout></ProtectedRoute>} />
            <Route path="/discussion/:id" element={<ProtectedRoute><MainLayout><DiscussionThread /></MainLayout></ProtectedRoute>} />
            <Route path="/view-all" element={<ProtectedRoute><MainLayout><ViewAll /></MainLayout></ProtectedRoute>} />
          </Routes>
          <Toaster position="top-center" toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid rgba(255, 215, 0, 0.2)'
            }
          }} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
