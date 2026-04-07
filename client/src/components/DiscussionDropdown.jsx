import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const DiscussionDropdown = ({ forceShow = false }) => {
  const [discussions, setDiscussions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchDiscussions = async () => {
    try {
      const response = await api.get('/discussions/my-discussions');
      setDiscussions(response.data);
    } catch (error) {
      console.error('Failed to fetch discussions');
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = discussions.filter(disc => {
    const lastRead = localStorage.getItem(`disc_${disc._id}`);
    if (!lastRead) return true; // Never opened, so it's new
    return new Date(disc.updatedAt) > new Date(lastRead);
  }).length;

  return (
    <div className={`relative ${forceShow ? 'block' : (unreadCount === 0 ? 'hidden sm:block' : 'block')}`} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
        title="Your Discussions"
      >
        <MessageSquare className="w-6 h-6 text-gray-400 hover:text-gold-text transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-gold-text rounded-full text-[10px] font-bold text-black flex items-center justify-center border-2 border-black">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-20 sm:top-full left-4 right-4 sm:left-auto sm:right-0 sm:w-80 bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[100]">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black">
            <h3 className="font-black uppercase tracking-tighter text-sm gold-text">Discussions</h3>
            <button 
              onClick={() => {
                 setIsOpen(false);
                 navigate('/create-discussion');
              }}
              className="text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors"
            >
              Start New
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {discussions.length === 0 ? (
              <div className="p-8 text-center bg-transparent">
                <MessageSquare className="w-10 h-10 text-gray-800 mx-auto mb-2 opacity-20" />
                <p className="text-gray-600 text-xs italic uppercase tracking-widest">No active discussions</p>
              </div>
            ) : (
              discussions.map((disc) => {
                const lastRead = localStorage.getItem(`disc_${disc._id}`);
                const isUnread = !lastRead || new Date(disc.updatedAt) > new Date(lastRead);

                return (
                  <div 
                    key={disc._id} 
                    className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group relative"
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/discussion/${disc._id}`);
                    }}
                  >
                    {isUnread && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold-text shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                    )}
                    <div className="flex items-center gap-3 pl-2">
                      <img 
                        src={disc.movie?.posterPath ? `https://image.tmdb.org/t/p/w92${disc.movie.posterPath}` : 'https://placehold.co/92x138/1a1a1a/ffd700?text=Img'}
                        className="w-10 h-14 object-cover rounded shadow-md border border-white/10"
                        alt={disc.movie?.title}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate transition-colors ${isUnread ? 'text-white' : 'text-gray-300'} group-hover:text-gold-text`}>
                          {disc.caption || disc.movie?.title}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {disc.participants?.length || 0} Joined
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gold-text transition-colors flex-shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default DiscussionDropdown;
