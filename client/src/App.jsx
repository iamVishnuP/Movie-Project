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



function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black text-white">
          <Routes>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-otp" element={<OTPVerification />} />
            <Route path="/signin" element={<SignIn />} />
            
            <Route path="/" element={<Landing />} />
            <Route path="/discover" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
            <Route path="/onboarding/profile-picture" element={<MainLayout><ProfilePicture /></MainLayout>} />
            <Route path="/onboarding/genres" element={<MainLayout><GenreSelection /></MainLayout>} />
            <Route path="/onboarding/languages" element={<MainLayout><LanguageSelection /></MainLayout>} />
            <Route path="/onboarding/directors" element={<MainLayout><DirectorSelection /></MainLayout>} />
            <Route path="/onboarding/movies" element={<MainLayout><MovieSelection /></MainLayout>} />
            <Route path="/onboarding/completion" element={<MainLayout><Completion /></MainLayout>} />
            <Route path="/movie/:id" element={<MainLayout><MovieDetail /></MainLayout>} />
            <Route path="/watchlist" element={<MainLayout><Watchlist /></MainLayout>} />
            <Route path="/search" element={<MainLayout><Search /></MainLayout>} />
            <Route path="/find-people" element={<MainLayout><FindPeople /></MainLayout>} />
            <Route path="/user/:id" element={<MainLayout><PublicProfile /></MainLayout>} />
            <Route path="/create-discussion" element={<MainLayout><CreateDiscussion /></MainLayout>} />
            <Route path="/discussion/:id" element={<MainLayout><DiscussionThread /></MainLayout>} />
            <Route path="/view-all" element={<MainLayout><ViewAll /></MainLayout>} />
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
