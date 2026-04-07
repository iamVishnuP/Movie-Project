import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Film, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SignUp = () => {
  const [formData, setFormData] = useState({ name: '', characterName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/signup', formData);
      toast.success('OTP sent to your email!');
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ff7f7f] flex items-center justify-center p-6 overflow-y-auto relative">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors group z-20">
        <img src="/logo.png" alt="Logo" className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">സിനിമ കൊട്ടക</span>
      </Link>
      <div className="clapboard-container">
        <div className="clapboard-hinge"></div>
        <div className="clapboard-top-bar"></div>
        <div className="clapboard-bottom-bar"></div>

        <div className="clapboard-body">
          <form onSubmit={handleSubmit}>
            <div className="clapboard-field">
              <label className="clapboard-label"> Name</label>
              <input
                type="text"
                placeholder="ENTER FULL NAME"
                className="clapboard-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="clapboard-field">
              <label className="clapboard-label"> Character Name</label>
              <input
                type="text"
                placeholder="CHOOSE A UNIQUE CHARACTER NAME"
                className="clapboard-input"
                value={formData.characterName}
                onChange={(e) => setFormData({ ...formData, characterName: e.target.value })}
                required
              />
            </div>

            <div className="clapboard-field">
              <label className="clapboard-label">Email </label>
              <input
                type="email"
                placeholder="ENTER EMAIL ADDRESS"
                className="clapboard-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="clapboard-field">
              <label className="clapboard-label">Password</label>
              <input
                type="password"
                placeholder="ENTER PASSWORD"
                className="clapboard-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="clapboard-grid">
              <div className="clapboard-grid-item">
                <label className="clapboard-label">Scene</label>
                <div className="clapboard-input">02</div>
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
                    "ACTION"
                  )}
                </button>
              </div>
              <div className="clapboard-grid-item">
                <label className="clapboard-label">Roll</label>
                <div className="clapboard-input">12</div>
              </div>
            </div>

            <div className="clapboard-field">
              <div className="flex justify-between items-end">
                <div>
                  <label className="clapboard-label">Date</label>
                  <div className="clapboard-input text-sm">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
                <Link to="/signin" className="text-xs gold-text hover:underline mb-1">
                  ALREADY JOINED? SIGN IN
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
