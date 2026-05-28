import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Reset link sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ff7f7f] flex items-center justify-center p-6 overflow-hidden relative">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors group z-20">
        <img src="/logo.png" alt="Logo" className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">സിനിമ കൊട്ടക</span>
      </Link>
      
      <div className="clapboard-container">
        <div className="clapboard-hinge"></div>
        <div className="clapboard-top-bar"></div>
        <div className="clapboard-bottom-bar"></div>
        
        <div className="clapboard-body">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <div className="text-center mb-6">
                <h2 className="text-white font-black text-2xl tracking-widest uppercase">Forgot Password</h2>
                <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">Enter your email to receive a reset link</p>
              </div>

              <div className="clapboard-field">
                <label className="clapboard-label">Email</label>
                <input
                  type="email"
                  placeholder="ENTER EMAIL"
                  className="clapboard-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="clapboard-grid">
                <div className="clapboard-grid-item">
                  <label className="clapboard-label">Scene</label>
                  <div className="clapboard-input">RESET</div>
                </div>
                <div className="clapboard-grid-item">
                  <label className="clapboard-label">Take</label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="clapboard-button"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "SEND LINK"
                    )}
                  </button>
                </div>
                <div className="clapboard-grid-item">
                  <label className="clapboard-label">Roll</label>
                  <div className="clapboard-input">01</div>
                </div>
              </div>

              <div className="clapboard-field mt-6">
                <div className="flex justify-between items-end">
                  <div>
                    <label className="clapboard-label">Date</label>
                    <div className="clapboard-input text-sm">
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                  <Link to="/signin" className="text-xs gold-text hover:underline mb-1">
                    BACK TO LOGIN
                  </Link>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <h2 className="text-white font-black text-2xl tracking-widest uppercase mb-4">Link Sent</h2>
              <p className="text-gray-400 text-sm uppercase tracking-widest mb-8">
                Check your email for the reset link.<br/>It may take a few minutes to arrive.
              </p>
              <Link to="/signin" className="clapboard-button inline-block px-8 py-3">
                RETURN TO LOGIN
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
