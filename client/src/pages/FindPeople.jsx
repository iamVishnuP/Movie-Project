import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import api from '../utils/api';
import UserCard from '../components/UserCard';
import toast from 'react-hot-toast';

const FindPeople = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  const fetchConnections = async () => {
    setConnectionsLoading(true);
    try {
      const response = await api.get('/connections/my-connections');
      setConnections(response.data);
    } catch (error) {
      toast.error('Failed to load connections');
    } finally {
      setConnectionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'connections') {
      fetchConnections();
    }
  }, [activeTab]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (error) {
      console.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleAction = async (type, userId) => {
    if (type === 'connect') {
      try {
        await api.post('/connections/request', { recipientId: userId });
        toast.success('Connection request sent!');
        handleSearch(searchTerm); // Refresh info
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to send request');
      }
    } else if (type === 'remove') {
      if (window.confirm('Are you sure you want to remove this connection?')) {
        try {
          await api.delete(`/connections/remove/${userId}`);
          toast.success('Connection removed');
          if (activeTab === 'connections') {
            fetchConnections();
          } else {
            handleSearch(searchTerm);
          }
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to remove connection');
        }
      }
    }
  };

  return (
    <main className="pt-24 min-h-screen bg-black text-white px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter gold-text mb-4">Find People</h1>
          <p className="text-gray-500 uppercase tracking-[0.2em] text-[10px] md:text-xs font-bold">Search by Cinema Character Name</p>
        </div>

        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
          <button 
            onClick={() => setActiveTab('search')}
            className={`font-black uppercase tracking-widest text-sm pb-2 transition-all ${activeTab === 'search' ? 'text-gold-text border-b-2 border-gold-text' : 'text-gray-500 hover:text-white'}`}
          >
            Search People
          </button>
          <button 
            onClick={() => setActiveTab('connections')}
            className={`font-black uppercase tracking-widest text-sm pb-2 transition-all ${activeTab === 'connections' ? 'text-gold-text border-b-2 border-gold-text' : 'text-gray-500 hover:text-white'}`}
          >
            My Connections
          </button>
        </div>

        {activeTab === 'search' ? (
          <>
            <div className="relative mb-12 max-w-xl mx-auto group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-gold-text transition-colors" />
              <input
                type="text"
                placeholder="Search character name..."
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-3 md:py-4 pl-12 md:pl-14 pr-4 md:pr-6 focus:border-gold-text outline-none text-base md:text-xl font-bold tracking-tight transition-all placeholder:text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-6 h-6 text-gold-text animate-spin" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map(user => (
                <UserCard
                  key={user._id}
                  user={user}
                  connectionStatus="none" 
                  onAction={handleAction}
                />
              ))}
              {searchTerm.trim() && !loading && results.length === 0 && (
                <div className="col-span-full py-20 text-center glass-card border-dashed">
                  <p className="text-gray-600 text-sm italic uppercase tracking-widest font-bold">No characters found with that name</p>
                </div>
              )}
              {!searchTerm.trim() && (
                <div className="col-span-full py-40 text-center pointer-events-none opacity-20">
                  <Search className="w-20 h-20 text-gold-text mx-auto mb-4" />
                  <p className="text-xl md:text-3xl font-black uppercase tracking-tighter">Start typing to explore</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connectionsLoading ? (
               <div className="col-span-full py-20 flex justify-center">
                  <Loader2 className="w-8 h-8 text-gold-text animate-spin" />
               </div>
            ) : connections.length > 0 ? (
              connections.map(user => (
                <UserCard
                  key={user._id}
                  user={user}
                  connectionStatus="accepted" 
                  onAction={handleAction}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center glass-card border-dashed">
                <p className="text-gray-600 text-sm italic uppercase tracking-widest font-bold">You have no connections yet</p>
              </div>
            )}
          </div>
        )}


      </div>
    </main>
  );
};

export default FindPeople;
