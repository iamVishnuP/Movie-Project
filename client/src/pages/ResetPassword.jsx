import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!email || !token) {
      toast.error('Invalid password reset link');
      navigate('/signin');
    }
  }, [email, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passwords.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        newPassword: passwords.newPassword
      });
      toast.success('Password reset successfully!');
      navigate('/signin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) return null;

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
            <div className="text-center mb-6">
              <h2 className="text-white font-black text-2xl tracking-widest uppercase">New Password</h2>
              <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">Enter a strong new password</p>
            </div>

            <div className="clapboard-field">
              <label className="clapboard-label">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="ENTER NEW PASSWORD"
                  className="clapboard-input pr-10"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
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

            <div className="clapboard-field">
              <label className="clapboard-label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="CONFIRM NEW PASSWORD"
                  className="clapboard-input pr-10"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                    "UPDATE"
                  )}
                </button>
              </div>
              <div className="clapboard-grid-item">
                <label className="clapboard-label">Roll</label>
                <div className="clapboard-input">02</div>
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
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
