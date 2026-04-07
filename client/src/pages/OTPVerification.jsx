import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  React.useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await api.post('/auth/resend-otp', { email: state?.email });
      toast.success('New OTP sent!');
      setTimer(60);
      setCanResend(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email: state?.email, otp });
      login(response.data.user, response.data.token);
      toast.success('Verification successful!');
      navigate('/onboarding/profile-picture');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-text/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold-text/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md relative">
        <div className="glass-card p-8 border-gold-text/20 shadow-2xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gold-text flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
              <ShieldCheck className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold gold-text">Verify Email</h1>
            <p className="text-gray-400 mt-2">Enter the OTP sent to {state?.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              placeholder="000000"
              maxLength="6"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-4 text-center text-3xl font-bold tracking-[1em] focus:border-gold-text/50 focus:outline-none transition-all placeholder:text-gray-800"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full gold-button py-3 rounded-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                disabled={!canResend}
                onClick={handleResend}
                className="text-sm font-medium text-gold-text hover:underline disabled:text-gray-600 disabled:no-underline transition-all"
              >
                {canResend ? 'Resend OTP' : `Resend in ${timer}s`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
