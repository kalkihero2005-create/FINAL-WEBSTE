import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
  onNavigate: (view: 'register') => void;
}

export function Login({ onLoginSuccess, onNavigate }: LoginProps) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password })
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

        <div className="text-center mb-8 relative z-10">
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

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-bold text-[#848e9c] mb-2 uppercase tracking-wide">
              Login ID / Email
            </label>
            <input 
              type="text" 
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full bg-[#0b101a] border focus:border-[#00FFFF] border-[#2b3139] text-white rounded-lg px-4 py-3 focus:outline-none transition-colors shadow-inner"
              placeholder="gamer@example.com"
            />
          </div>
          
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

          <button 
            type="submit" 
            disabled={loading}
            className="w-full font-black text-black py-4 px-4 rounded-lg transition-all disabled:opacity-50 mt-6 uppercase tracking-wider bg-gradient-to-r from-[#00FFFF] to-[#00cccc] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
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
