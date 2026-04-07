import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, User, LogOut, Bookmark, Search, Star, Trash2, Plus, Users, Menu, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import DiscussionDropdown from './DiscussionDropdown';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/auth/delete-account');
        toast.success('Account deleted successfully');
        logout();
        navigate('/signin');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete account');
      }
    }
  };


  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await api.get(`/movies/search?query=${encodeURIComponent(searchQuery)}`);
        setSuggestions(response.data?.slice(0, 5) || []);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (movieId) => {
    navigate(`/movie/${movieId}`);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <nav className="glass-nav fixed top-0 w-full z-50 px-4 sm:px-8 py-3 flex justify-between items-center h-20">
      <NavLink to="/discover" className="flex items-center gap-2 text-2xl font-black gold-text tracking-tighter hover:scale-105 transition-transform duration-300 flex-shrink-0">
        <img src="/logo.png" alt="Cinema Kottakam" className="w-8 h-8 md:w-10 md:h-10" />
        <span className="text-xl font-bold tracking-wide text-yellow-400 hidden sm:block">സിനിമ കൊട്ടക</span>
      </NavLink>
      
      {/* Desktop Navigation Links */}
      <div className="hidden lg:flex items-center gap-4">
        <NavLink 
          to="/discover" 
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          Discover
        </NavLink>
        <NavLink 
          to="/watchlist" 
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          <Bookmark className="w-5 h-5" />
          Watchlist
        </NavLink>
        <NavLink 
          to="/find-people" 
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          <Users className="w-5 h-5" />
          Find People
        </NavLink>
        <NavLink 
          to="/create-discussion" 
          className="nav-link bg-white/5 border border-white/10 hover:border-gold-text/50 hover:bg-gold-text/10"
        >
          <Plus className="w-4 h-4 text-gold-text" />
          Create
        </NavLink>
      </div>

      <div className="flex items-center gap-1 sm:gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <DiscussionDropdown />
          <NotificationBell />
        </div>
        <div className="flex items-center gap-4 pl-4 border-l border-white/5">
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input 
                type="text" 
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Search..."
                className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-text/30 focus:bg-white/10 focus:border-gold-text/50 text-sm transition-all w-32 sm:w-40 focus:w-48 sm:focus:w-64 md:w-48 md:focus:w-72"
              />
              <button type="submit" className="absolute right-3 p-1 hover:text-gold-text transition-colors" title="Search">
                <Search className="w-4 h-4 text-gray-400 hover:text-gold-text" />
              </button>
            </form>

            {showSuggestions && searchQuery.trim() && suggestions.length > 0 && (
              <div className="fixed sm:absolute top-20 sm:top-full left-4 right-4 sm:left-auto sm:right-0 sm:w-80 md:w-96 bg-black/95 backdrop-blur-xl border border-[#ffd700]/30 rounded-xl overflow-hidden shadow-2xl z-[100] mt-2">
                {suggestions.map((movie) => (
                  <div 
                    key={movie.id} 
                    onClick={() => handleSuggestionClick(movie.id)}
                    className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-none group"
                  >
                    <img 
                      src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : 'https://placehold.co/92x138/1a1a1a/ffd700?text=No+Img'} 
                      alt={movie.title}
                      className="w-10 h-14 object-cover rounded-md border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate group-hover:text-[#ffd700] transition-colors">{movie.title}</p>
                      <p className="text-gray-400 text-xs mt-1 truncate">{movie.release_date?.split('-')[0]}</p>
                      {movie.vote_average > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-[#ffd700] text-xs font-medium">
                          <Star className="w-3 h-3" fill="#ffd700" />
                          <span>{movie.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-xl bg-gold-text border-2 border-gold-text/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] group overflow-hidden"
              title="Profile"
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-black font-black text-lg leading-none select-none group-hover:rotate-12 transition-transform">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-black/95 backdrop-blur-xl border border-[#ffd700]/30 rounded-lg overflow-hidden shadow-2xl z-50">
                <div className="p-3 border-b border-white/10 bg-white/5">
                  <p className="text-white text-sm font-bold truncate">{user?.name}</p>
                  <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                </div>
                
                <button 
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-left"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>

                <button 
                  onClick={() => {
                    handleLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>

                <button 
                  onClick={() => {
                    handleDeleteAccount();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors text-left border-t border-white/5"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            )}
          </div>
          <div className="lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white hover:text-gold-text transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-20 bg-black z-40 animate-in slide-in-from-top duration-300" ref={mobileMenuRef}>
          <div className="flex flex-col p-6 gap-4">
            <NavLink 
              to="/discover" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `flex items-center gap-4 p-4 rounded-xl text-lg font-bold transition-all ${isActive ? 'bg-gold-text text-black' : 'text-white hover:bg-white/10'}`}
            >
              Discover
            </NavLink>
            <NavLink 
              to="/watchlist" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `flex items-center gap-4 p-4 rounded-xl text-lg font-bold transition-all ${isActive ? 'bg-gold-text text-black' : 'text-white hover:bg-white/10'}`}
            >
              <Bookmark className="w-6 h-6" />
              Watchlist
            </NavLink>
            <NavLink 
              to="/find-people" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `flex items-center gap-4 p-4 rounded-xl text-lg font-bold transition-all ${isActive ? 'bg-gold-text text-black' : 'text-white hover:bg-white/10'}`}
            >
              <Users className="w-6 h-6" />
              Find People
            </NavLink>
            <NavLink 
              to="/create-discussion" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-4 p-4 rounded-xl text-lg font-bold bg-white/5 border border-white/10 text-gold-text"
            >
              <Plus className="w-6 h-6" />
              Create Discussion
            </NavLink>
            <div className="sm:hidden border-t border-white/10 pt-4 mt-2">
              <div className="p-4 flex justify-between items-center">
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Discussions & Alerts</p>
                <div className="flex gap-4">
                  <DiscussionDropdown forceShow={true} />
                  <NotificationBell forceShow={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
