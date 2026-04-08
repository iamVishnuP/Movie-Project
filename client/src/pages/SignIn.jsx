import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Film, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const SignIn = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/signin', formData);
      login(response.data.user, response.data.token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
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
          <form onSubmit={handleSubmit}>
            <div className="clapboard-field">
              <label className="clapboard-label">Email </label>
              <input
                type="email"
                placeholder="ENTER EMAIL"
                className="clapboard-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="clapboard-field">
              <label className="clapboard-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="ENTER PASSWORD"
                  className="clapboard-input pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            

            <div className="clapboard-grid">
              <div className="clapboard-grid-item">
                <label className="clapboard-label">Scene</label>
                <div className="clapboard-input">01</div>
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
                <div className="clapboard-input">24</div>
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
                <Link to="/signup" className="text-xs gold-text hover:underline mb-1">
                  NEW MEMBER? SIGN UP
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
