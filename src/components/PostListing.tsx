import React, { useState } from 'react';
import { PlusCircle, Upload, Loader2 } from 'lucide-react';
import { User } from '../types';

interface PostListingProps {
  token: string;
  onSuccess: () => void;
}

export function PostListing({ token, onSuccess }: PostListingProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    level: '',
    rp: '',
    skins: '',
    popularity: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.title || !formData.price || !formData.description) {
      setError('Please fill in required fields.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to post ID');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 h-screen flex flex-col font-sans">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-[#00FFFF]/10 rounded-xl border border-[#00FFFF]/20">
          <Upload className="w-8 h-8 text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white font-['Space_Grotesk'] uppercase tracking-tight">Sell Your ID</h1>
          <p className="text-[#848e9c] text-sm">Post a new account listing to the marketplace</p>
        </div>
      </div>

      <div className="bg-[#121826] border border-[#2b3139] p-8 rounded-2xl shadow-xl flex-1 mb-8 overflow-y-auto custom-scrollbar">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-bold text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#848e9c] uppercase mb-2">Account Title</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Conqueror S5 + M4 Glacier Lv5"
                className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#00FFFF] text-white rounded-xl px-4 py-3 outline-none transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#848e9c] uppercase mb-2">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide accurate details about inventory, login types (Twitter/Google/FB)..."
                rows={4}
                className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#00FFFF] text-white rounded-xl px-4 py-3 outline-none transition-colors"
                required
              ></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#848e9c] uppercase mb-2">Price (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848e9c] font-bold">₹</span>
                  <input 
                    type="number" 
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="15000"
                    min="1"
                    className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#00FFFF] text-[#00FFFF] font-mono font-bold rounded-xl pl-8 pr-4 py-3 outline-none transition-colors"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#848e9c] uppercase mb-2">Account Level</label>
                <input 
                  type="number" 
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  placeholder="e.g. 74"
                  className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#00FFFF] text-white rounded-xl px-4 py-3 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#848e9c] uppercase mb-2">Royal Pass</label>
                <input 
                  type="text" 
                  name="rp"
                  value={formData.rp}
                  onChange={handleChange}
                  placeholder="e.g. Max S10-15"
                  className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#00FFFF] text-white rounded-xl px-4 py-3 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#848e9c] uppercase mb-2">Mythic Skins</label>
                <input 
                  type="number" 
                  name="skins"
                  value={formData.skins}
                  onChange={handleChange}
                  placeholder="e.g. 25"
                  className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#00FFFF] text-white rounded-xl px-4 py-3 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#848e9c] uppercase mb-2">Popularity</label>
                <input 
                  type="number" 
                  name="popularity"
                  value={formData.popularity}
                  onChange={handleChange}
                  placeholder="e.g. 500k"
                  className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#00FFFF] text-white rounded-xl px-4 py-3 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#00FFFF] to-[#00cccc] hover:from-[#FF4500] hover:to-[#ff2a00] text-black hover:text-white font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,69,0,0.5)] uppercase tracking-wider flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:transform-none"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlusCircle className="w-5 h-5" /> Post Listing to Market</>}
          </button>
        </form>
      </div>
    </div>
  );
}
