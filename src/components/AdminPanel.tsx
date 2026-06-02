import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, ShoppingBag, Eye, DollarSign, XCircle, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';
import { User, Trade, Listing } from '../types';

interface AdminPanelProps {
  token: string;
  onOpenTrade: (tradeId: string) => void;
}

export function AdminPanel({ token, onOpenTrade }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'trades'>('trades');

  useEffect(() => {
    fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setUsers);

    fetch('/api/admin/trades', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setTrades);

    fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setStats);
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-64px)] flex flex-col font-sans">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-[#FF4500]/10 rounded-xl border border-[#FF4500]/20">
          <ShieldAlert className="w-8 h-8 text-[#FF4500]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white font-['Space_Grotesk'] uppercase tracking-tight">Admin System</h1>
          <p className="text-[#848e9c] text-sm">Full Control Panel & Dispute Resolution</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#121826] border border-[#2b3139] rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[#848e9c] text-xs font-bold uppercase tracking-wider">Total IDs Posted</span>
            <span className="text-2xl font-black text-white">{stats.totalListings}</span>
          </div>
          <div className="bg-[#121826] border border-[#2b3139] rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[#848e9c] text-xs font-bold uppercase tracking-wider">Total IDs Sold</span>
            <span className="text-2xl font-black text-[#00FFFF]">{stats.itemsSold}</span>
          </div>
          <div className="bg-[#121826] border border-[#2b3139] rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[#848e9c] text-xs font-bold uppercase tracking-wider">Total Transaction Vol</span>
            <span className="text-2xl font-black text-white font-mono">₹{stats.transactionVolume.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-gradient-to-br from-[#121826] to-[#0a0d14] border border-[#00FFFF]/30 rounded-xl p-4 flex flex-col gap-1 shadow-[0_0_15px_rgba(0,255,255,0.1)] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[50px] h-[50px] bg-[#00FFFF] opacity-20 blur-xl"></div>
            <span className="text-[#00FFFF] text-xs font-bold uppercase tracking-wider">Company Profit (16%)</span>
            <span className="text-2xl font-black text-[#00FFFF] font-mono drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">₹{stats.companyProfit.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('trades')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'trades' ? 'bg-[#FF4500] text-white shadow-[0_0_15px_rgba(255,69,0,0.4)]' : 'bg-[#121826] text-[#848e9c] border border-[#2b3139] hover:bg-[#1a2235] hover:text-white'}`}
        >
          <ShoppingBag className="w-4 h-4" /> All Orders & Disputes
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'users' ? 'bg-[#FF4500] text-white shadow-[0_0_15px_rgba(255,69,0,0.4)]' : 'bg-[#121826] text-[#848e9c] border border-[#2b3139] hover:bg-[#1a2235] hover:text-white'}`}
        >
          <Users className="w-4 h-4" /> Users List
        </button>
      </div>

      {activeTab === 'trades' && (
        <div className="bg-[#121826] border border-[#2b3139] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#848e9c]">
              <thead className="text-xs text-white uppercase bg-[#1a2235]">
                <tr>
                  <th className="px-6 py-4">Trade ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Buyer/Seller</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">No trades found.</td>
                  </tr>
                )}
                {trades.map(trade => (
                  <tr key={trade.id} className="border-b border-[#2b3139] hover:bg-[#1a2235]/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white">{trade.id}</td>
                    <td className="px-6 py-4 font-mono text-[#00FFFF]">₹{trade.price.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      B: <span className="text-white">{trade.buyerId}</span><br />
                      S: <span className="text-white">{trade.sellerId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${trade.status === 'disputed' ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(255,0,0,0.2)]' : trade.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/30' : trade.status === 'cancelled' ? 'bg-gray-500/10 text-gray-400 border-gray-500/30' : 'bg-[#00FFFF]/10 text-[#00FFFF] border-[#00FFFF]/30'}`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => onOpenTrade(trade.id)}
                        className={`font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${trade.status === 'disputed' ? 'bg-[#FF4500] hover:bg-[#ff2a00] text-white shadow-[0_0_10px_rgba(255,69,0,0.5)]' : 'bg-[#1a2235] hover:bg-[#2b3139] text-white border border-[#2b3139]'}`}
                      >
                        {trade.status === 'disputed' ? <><MessageSquare className="w-4 h-4" /> Resolve</> : <><Eye className="w-4 h-4" /> View</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
         <div className="bg-[#121826] border border-[#2b3139] rounded-xl overflow-hidden shadow-xl">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-[#848e9c]">
               <thead className="text-xs text-white uppercase bg-[#1a2235]">
                 <tr>
                   <th className="px-6 py-4">User</th>
                   <th className="px-6 py-4">ID</th>
                   <th className="px-6 py-4">Balance</th>
                   <th className="px-6 py-4">Role / Status</th>
                 </tr>
               </thead>
               <tbody>
                 {users.map(u => (
                   <tr key={u.id} className="border-b border-[#2b3139] hover:bg-[#1a2235]/50 transition-colors">
                     <td className="px-6 py-4 text-white font-bold">{u.name}<br /><span className="text-xs text-[#848e9c] font-normal">{u.email}</span></td>
                     <td className="px-6 py-4 font-mono text-xs">{u.id}</td>
                     <td className="px-6 py-4 font-mono text-[#00FFFF] font-bold">₹{u.balance.toLocaleString('en-IN')}</td>
                     <td className="px-6 py-4 flex gap-2 items-center">
                       {u.role === 'admin' ? (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/50">Admin</span>
                       ) : (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#1a2235] border border-[#2b3139] text-gray-300">User</span>
                       )}
                       {u.verified && <span className="text-green-400" title="Verified"><CheckCircle2 className="w-4 h-4" /></span>}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
      )}
    </div>
  );
}
