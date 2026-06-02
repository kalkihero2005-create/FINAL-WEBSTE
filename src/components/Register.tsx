import React, { useState } from 'react';

interface RegisterProps {
  onLoginSuccess: (token: string) => void;
  onNavigate: (view: 'login') => void;
}

export function Register({ onLoginSuccess, onNavigate }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
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
      <div className="w-full max-w-md bg-[#121826] p-8 rounded-2xl border border-[#1a2235] shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white font-['Space_Grotesk'] mb-2">Create Account</h2>
          <p className="text-[#848e9c]">Join the safest P2P marketplace for BGMI.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#848e9c] mb-2">Display Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0b101a] border border-[#2b3139] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF4500] transition-colors"
              placeholder="e.g. Mortal_Fanboy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#848e9c] mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0b101a] border border-[#2b3139] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF4500] transition-colors"
              placeholder="gamer@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#848e9c] mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0b101a] border border-[#2b3139] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF4500] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF4500] to-[#FF9900] hover:from-[#FF5500] hover:to-[#FFAA00] text-white font-bold py-3.5 px-4 rounded-lg transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-[#848e9c] text-sm">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-[#FF9900] hover:text-[#FF4500] font-bold transition-colors">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
