import React, { useEffect, useState } from 'react';
import { Listing, User } from '../types';
import { ShoppingCart, ShieldCheck, Star, Trophy, Crosshair, ChevronRight, Gamepad2, Trash2, Loader2, Share2 } from 'lucide-react';

interface MarketplaceProps {
  onStartTrade: (listingId: string) => void;
  user: User | null;
}

export function Marketplace({ onStartTrade, user }: MarketplaceProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchListings = () => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(data => {
        setListings(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    setDeleteLoading(id);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchListings();
    } catch(e) {
      console.error(e);
      alert("Failed to delete listing.");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#00FFFF] font-bold tracking-widest uppercase flex items-center justify-center gap-2 h-[50vh]"><Loader2 className="w-6 h-6 animate-spin" /> Loading Market...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 p-8 rounded-2xl bg-[#121826] border border-[#1a2235] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00FFFF] opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <Gamepad2 className="w-8 h-8 text-[#00FFFF] drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
          <h1 className="text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight uppercase drop-shadow-sm">Active Market</h1>
        </div>
        <p className="text-[#848e9c] relative z-10 max-w-xl leading-relaxed text-sm font-medium">
          Browse top-tier BGMI accounts. Every transaction is 100% secured by our E2E Escrow engine.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-[#848e9c] uppercase tracking-widest bg-[#121826] rounded-t-xl border-b border-[#2b3139]">
          <div className="col-span-3">Seller</div>
          <div className="col-span-4">Account Highlights</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-3 text-right">Action</div>
        </div>

        {/* Listings List */}
        <div className="bg-[#121826] rounded-b-xl overflow-hidden border border-[#1a2235] md:border-t-0 shadow-lg mb-8">
          {listings.length === 0 && (
            <div className="text-center py-16 text-[#848e9c] font-bold uppercase tracking-wider">No Active Listings</div>
          )}
          {listings.map(ad => (
            <div key={ad.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-6 border-b border-[#1a2235] last:border-b-0 hover:bg-[#161d2b] transition-colors items-center min-w-full">
              
              {/* Seller Info */}
              <div className="col-span-1 md:col-span-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold hover:text-[#00FFFF] cursor-pointer transition-colors max-w-full truncate">{ad.sellerName}</span>
                  <ShieldCheck className="w-4 h-4 text-[#00FFFF] shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#848e9c]">
                  <span className="bg-[#1a2235] px-2 py-0.5 rounded text-gray-300">{ad.sellerTrades} orders</span>
                  <div className="flex items-center text-[#FF9900]">
                    <Star className="w-3.5 h-3.5 fill-current mr-1 text-[#00FFFF]/80" />
                    <span className="text-[#00FFFF]">{Math.max(4.5, ad.sellerRating || 5.0).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Acc Details */}
              <div className="col-span-1 md:col-span-4 flex flex-col gap-2.5">
                <span className="text-white font-bold tracking-wide truncate font-['Space_Grotesk'] text-lg" title={ad.title}>{ad.title}</span>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 bg-[#2b3139]/50 rounded border border-[#3b414a] text-gray-300 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-[#FF9900]" /> Lv {ad.level}
                  </span>
                  <span className="px-2.5 py-1 bg-[#2b3139]/50 rounded border border-[#3b414a] text-gray-300 flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-[#00FFFF]" /> {ad.skins} Mythics
                  </span>
                  {ad.linkedAccounts && (
                    <span className="px-2.5 py-1 bg-[#FF9900]/10 rounded border border-[#FF9900]/20 text-[#FF9900] flex items-center gap-1.5">
                      🔗 {ad.linkedAccounts}
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-[#1a2235] rounded text-gray-400 border border-[#2b3139]">
                    {ad.rp}
                  </span>
                </div>
                <p className="text-xs text-[#848e9c] line-clamp-1 truncate">{ad.description}</p>
              </div>

              {/* Price */}
              <div className="col-span-1 md:col-span-2 flex md:flex-col items-center flex-row justify-between md:items-end gap-1 relative overflow-hidden">
                <div className="text-[#848e9c] text-xs font-bold uppercase tracking-wider md:hidden">Price</div>
                <div className="text-2xl font-black text-[#00FFFF] font-mono drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">
                  ₹{ad.price.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Action */}
              <div className="col-span-1 md:col-span-3 flex justify-end gap-2 flex-wrap">
                <button
                  onClick={() => {
                     navigator.clipboard.writeText(`${window.location.origin}/?listing=${ad.id}`);
                     alert('Listing Link Copied! Share it with your friends.');
                  }}
                  className="w-12 bg-[#1a2235] border border-[#00FFFF]/20 hover:bg-[#00FFFF]/20 text-[#00FFFF] p-3 rounded-lg transition-all flex items-center justify-center shrink-0"
                  title="Share this listing"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {(user?.id === ad.sellerId || user?.role === 'admin') && (
                   <button 
                     onClick={() => handleDelete(ad.id)}
                     disabled={deleteLoading === ad.id}
                     className="w-12 bg-[#1a2235] border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 p-3 rounded-lg transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                   >
                     {deleteLoading === ad.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                   </button>
                )}
                {user?.id !== ad.sellerId && (
                  <button 
                    onClick={() => onStartTrade(ad.id)}
                    disabled={user?.balance !== undefined && user.balance < ad.price}
                    className="w-full md:w-36 bg-gradient-to-r from-[#00FFFF] to-[#00cccc] hover:from-[#FF4500] hover:to-[#ff2a00] text-black hover:text-white font-black py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,69,0,0.5)] transform hover:scale-105 active:scale-95 uppercase tracking-wide"
                  >
                    Buy ID
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              {user?.id !== ad.sellerId && user?.balance !== undefined && user.balance < ad.price && (
                <div className="col-span-full md:col-start-10 md:col-span-3 text-right text-[10px] uppercase font-bold text-red-500 mt-2 md:mt-0 tracking-widest">
                  Low Balance
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
