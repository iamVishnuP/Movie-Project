import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

const Completion = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative text-center"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold-text/20 rounded-full blur-[80px]" />
        
        <div className="w-24 h-24 rounded-full bg-gold-text flex items-center justify-center mb-8 mx-auto shadow-[0_0_40px_rgba(255,215,0,0.5)]">
          <PartyPopper className="w-12 h-12 text-black" />
        </div>

        <h1 className="text-5xl font-black gold-text uppercase tracking-tighter mb-4">You're All Set!</h1>
        <p className="text-xl text-gray-400 mb-12">
          We've personalized your cinema experience based on your favorite genres, languages, directors, and movies.
        </p>

        <div className="glass-card p-10 mb-12 border-gold-text/30 relative overflow-hidden">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Profile Verified</h3>
              <p className="text-gray-500">Preferences successfully synced to your account.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="group w-full max-w-md gold-button py-5 rounded-2xl flex items-center justify-center gap-3 text-xl font-black uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Enter Dashboard <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
};

export default Completion;
