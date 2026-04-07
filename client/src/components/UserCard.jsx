import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MessageSquare, UserPlus, Check, Trash2 } from 'lucide-react';

const UserCard = ({ user, connectionStatus, onAction }) => {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-4 flex items-center justify-between hover:border-gold-text/40 transition-all group">
      <div 
        className="flex items-center gap-4 cursor-pointer" 
        onClick={() => navigate(`/user/${user._id || user.id}`)}
      >
        <div className="w-12 h-12 rounded-full bg-gold-text flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(255,215,0,0.2)] group-hover:scale-105 transition-transform overflow-hidden">
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name?.[0]?.toUpperCase() || <User className="w-6 h-6" />
          )}
        </div>
        <div>
          <h3 className="font-bold text-white group-hover:text-gold-text transition-colors">@{user.characterName}</h3>
          <p className="text-xs text-gray-500 uppercase tracking-widest">{user.name}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {connectionStatus === 'none' && (
          <button 
            onClick={() => onAction && onAction('connect', user._id || user.id)}
            className="p-2 bg-gold-text/10 text-gold-text rounded-full hover:bg-gold-text hover:text-black transition-all"
            title="Add Connection"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        )}
        {connectionStatus === 'pending' && (
          <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-white/10">
            Pending
          </div>
        )}
        {connectionStatus === 'accepted' && (
          <div className="flex gap-2">
            {onAction ? (
              <button 
                onClick={() => onAction('remove', user._id || user.id)}
                className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                title="Remove Connection"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2 bg-green-500/10 text-green-500 rounded-full border border-green-500/20" title="Connected">
                <Check className="w-5 h-5" />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default UserCard;
