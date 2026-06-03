import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { auth, setupRecaptcha } from '../lib/firebase';
import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
  onNavigate: (view: 'register') => void;
}

export function Login({ onLoginSuccess, onNavigate }: LoginProps) {
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Setup recaptcha when OTP method selected
    if (loginMethod === 'otp') {
      setupRecaptcha('recaptcha-container');
    }
  }, [loginMethod]);

  const handleSendOtp = async () => {
    let finalPhone = loginId.trim();
    if (!finalPhone) {
       setError("Please enter your Phone Number");
       return;
    }
    if (!finalPhone.startsWith('+')) {
       finalPhone = '+91' + finalPhone;
    }
    
    setError('');
    setLoading(true);
    try {
      if (!(window as any).recaptchaVerifier) {
         setupRecaptcha('recaptcha-container');
      }
      const appVerifier = (window as any).recaptchaVerifier;
      // Use Firebase to send real OTP
      const confirmation = await signInWithPhoneNumber(auth, finalPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      alert("Real OTP sent to " + finalPhone);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Check phone number format (+91...) and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otp) return;
    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      
      // Let backend know, or directly pass token
      // We will exchange this for our app session token
      const res = await fetch('/api/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: result.user.phoneNumber, uid: result.user.uid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onLoginSuccess(data.token);
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMethod === 'otp') {
      if (!otpSent) return handleSendOtp();
      return handleVerifyOtp();
    }
    
    // Traditional Password Login
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           loginId, 
           password, 
           useOtp: false 
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLoginSuccess(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-[#0A0F1A]">
      <div className="w-full max-w-md bg-[#121826] p-8 rounded-2xl border border-[#00FFFF]/20 shadow-[0_0_50px_rgba(0,255,255,0.05)] relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00FFFF]/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#FF4500]/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-6 relative z-10">
          <h2 className="text-3xl font-black text-white font-['Space_Grotesk'] mb-2 uppercase tracking-tight">
            Welcome Back
          </h2>
          <p className="text-[#848e9c]">
            Log in to access your dashboard and trades.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium text-center relative z-10">
            {error}
          </div>
        )}

        <div className="flex gap-2 p-1 bg-[#0b101a] rounded-lg mb-6 relative z-10 border border-[#2b3139]">
          <button 
            type="button"
            className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-md transition-colors ${loginMethod === 'password' ? 'bg-[#121826] text-[#00FFFF] shadow' : 'text-[#848e9c] hover:text-white'}`}
            onClick={() => { setLoginMethod('password'); setOtpSent(false); setError(''); setLoginId(''); }}
          >
            Password
          </button>
          <button 
            type="button"
            className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-md transition-colors ${loginMethod === 'otp' ? 'bg-[#121826] text-[#FF4500] shadow' : 'text-[#848e9c] hover:text-white'}`}
            onClick={() => { setLoginMethod('otp'); setError(''); setLoginId('+91'); }}
          >
            OTP Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-bold text-[#848e9c] mb-2 uppercase tracking-wide">
              {loginMethod === 'otp' ? 'Phone Number with Country Code' : 'Login ID / Email'}
            </label>
            <input 
              type="text" 
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              disabled={otpSent}
              className="w-full bg-[#0b101a] border focus:border-[#00FFFF] border-[#2b3139] text-white rounded-lg px-4 py-3 focus:outline-none transition-colors shadow-inner disabled:opacity-50"
              placeholder={loginMethod === 'otp' ? "+91 9876543210" : "gamer@example.com"}
            />
          </div>
          
          {loginMethod === 'password' && (
            <div>
              <label className="block text-sm font-bold text-[#848e9c] mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0b101a] border focus:border-[#00FFFF] border-[#2b3139] text-white rounded-lg px-4 py-3 focus:outline-none transition-colors shadow-inner pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848e9c] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {loginMethod === 'otp' && otpSent && (
            <div>
              <label className="block text-sm font-bold text-[#FF4500] mb-2 uppercase tracking-wide">Enter OTP</label>
              <input 
                type="text" 
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-[#0b101a] border focus:border-[#FF4500] border-[#2b3139] text-white rounded-lg px-4 py-3 focus:outline-none transition-colors shadow-inner text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                maxLength={6}
              />
            </div>
          )}

          <div id="recaptcha-container"></div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full font-black text-black py-4 px-4 rounded-lg transition-all disabled:opacity-50 mt-6 uppercase tracking-wider bg-gradient-to-r ${loginMethod === 'otp' ? 'from-[#FF4500] to-[#FF9900] hover:shadow-[0_0_20px_rgba(255,69,0,0.5)] text-white' : 'from-[#00FFFF] to-[#00cccc] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]'}`}
          >
            {loading ? 'Authenticating...' : (loginMethod === 'otp' && !otpSent ? 'Send OTP' : 'Sign In')}
          </button>
          
          {loginMethod === 'otp' && otpSent && (
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(''); }}
              className="w-full text-center text-sm text-[#848e9c] hover:text-white pt-2"
            >
              Change Number
            </button>
          )}
        </form>

        <p className="mt-8 text-center text-[#848e9c] text-sm relative z-10">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('register')} className="text-[#00FFFF] hover:text-[#FF4500] font-bold transition-colors">
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}
