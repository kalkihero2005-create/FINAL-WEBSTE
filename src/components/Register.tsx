import React, { useState, useEffect } from 'react';
import { auth, setupRecaptcha } from '../lib/firebase';
import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

interface RegisterProps {
  onLoginSuccess: (token: string) => void;
  onNavigate: (view: 'login') => void;
}

export function Register({ onLoginSuccess, onNavigate }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    setupRecaptcha('recaptcha-container-reg');
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      setError('All fields are required');
      return;
    }
    
    let finalPhone = phone.trim();
    if (!finalPhone.startsWith('+')) {
      finalPhone = '+91' + finalPhone;
    }

    setError('');
    setLoading(true);

    try {
      if (!(window as any).recaptchaVerifier) {
         setupRecaptcha('recaptcha-container-reg');
      }
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, finalPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      alert(`Real OTP sent to ${finalPhone}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error sending OTP. Make sure to use Country Code (e.g., +91).');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) {
      setError('OTP is required');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1. Verify OTP with Firebase
      const result = await confirmationResult.confirm(otp);
      
      // 2. Register user to our Backend
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          phone: result.user.phoneNumber, 
          password, 
          uid: result.user.uid,
          otp: "verified_via_firebase" 
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed processing in Backend');
      }

      onLoginSuccess(data.token);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid OTP or Registration Failed');
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

        {step === 'form' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
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
              <label className="block text-sm font-medium text-[#848e9c] mb-2">Phone Number (with Code)</label>
              <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#0b101a] border border-[#2b3139] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF4500] transition-colors"
                placeholder="+919876543210"
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

            <div id="recaptcha-container-reg"></div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF4500] to-[#FF9900] hover:from-[#FF5500] hover:to-[#FFAA00] text-white font-bold py-3.5 px-4 rounded-lg transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#848e9c] mb-2">Enter OTP sent to {phone}</label>
              <input 
                type="text" 
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-[#0b101a] border border-[#2b3139] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF4500] transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF4500] to-[#FF9900] hover:from-[#FF5500] hover:to-[#FFAA00] text-white font-bold py-3.5 px-4 rounded-lg transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'Verifying...' : 'Verify & Register'}
            </button>
            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full text-sm text-[#848e9c] hover:text-white transition-colors text-center pt-2"
            >
               Go back and edit details
            </button>
          </form>
        )}

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
