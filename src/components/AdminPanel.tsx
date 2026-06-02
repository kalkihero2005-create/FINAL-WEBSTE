import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Users, ShoppingBag, Eye, DollarSign, XCircle, CheckCircle2, AlertTriangle, MessageSquare, Search, CreditCard, CrossIcon, Check, X } from 'lucide-react';
import { User, Trade, Listing, WithdrawalRequest } from '../types';

interface AdminPanelProps {
  token: string;
  onOpenTrade: (tradeId: string) => void;
  onBack?: () => void;
}

export function AdminPanel({ token, onOpenTrade, onBack }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'trades' | 'users' | 'withdrawals'>('trades');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchData = () => {
    fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setUsers);

    fetch('/api/admin/trades', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setTrades);
      
    fetch('/api/admin/withdrawals', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setWithdrawals);

    fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setStats);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u => 
      u.email.toLowerCase().includes(q) || 
      u.name.toLowerCase().includes(q) || 
      (u.userCode || '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleWithdrawalAction = async (id: string, status: 'approved' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to mark this request as ${status}?`)) return;
    await fetch(`/api/admin/withdrawals/${id}/status`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-64px)] flex flex-col font-sans">
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button onClick={onBack} className="p-3 mr-2 bg-[#1a2235] hover:bg-[#2b3139] border border-[#2b3139] rounded-xl text-white transition-colors">
             &larr; Back
          </button>
        )}
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
          <ShoppingBag className="w-4 h-4" /> Trades
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'users' ? 'bg-[#FF4500] text-white shadow-[0_0_15px_rgba(255,69,0,0.4)]' : 'bg-[#121826] text-[#848e9c] border border-[#2b3139] hover:bg-[#1a2235] hover:text-white'}`}
        >
          <Users className="w-4 h-4" /> Users
        </button>
        <button 
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'withdrawals' ? 'bg-[#FF4500] text-white shadow-[0_0_15px_rgba(255,69,0,0.4)]' : 'bg-[#121826] text-[#848e9c] border border-[#2b3139] hover:bg-[#1a2235] hover:text-white'}`}
        >
          <CreditCard className="w-4 h-4" /> Withdrawals
          {withdrawals.filter(w => w.status==='pending').length > 0 && <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px]">{withdrawals.filter(w=>w.status==='pending').length}</span>}
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
         <div className="bg-[#121826] border border-[#2b3139] rounded-xl overflow-hidden shadow-xl p-4 flex flex-col gap-4">
           <div className="flex bg-[#0b101a] border border-[#1a2235] rounded-xl px-4 py-2 items-center">
             <Search className="w-5 h-5 text-[#848e9c] mr-3" />
             <input type="text" placeholder="Search by UID, Email, Username..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-white w-full" />
           </div>
           <div className="overflow-x-auto rounded-xl border border-[#1a2235]">
             <table className="w-full text-left text-sm text-[#848e9c]">
               <thead className="text-xs text-white uppercase bg-[#1a2235]">
                 <tr>
                   <th className="px-6 py-4">UID</th>
                   <th className="px-6 py-4">User</th>
                   <th className="px-6 py-4">Balance</th>
                   <th className="px-6 py-4">Role</th>
                   <th className="px-6 py-4">Action</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredUsers.map(u => (
                   <tr key={u.id} className="border-b border-[#2b3139] hover:bg-[#1a2235]/50 transition-colors">
                     <td className="px-6 py-4 font-mono text-[#00FFFF] font-bold">{u.userCode}</td>
                     <td className="px-6 py-4 text-white font-bold">{u.name}<br /><span className="text-[10px] text-[#848e9c] font-normal font-mono">{u.email}</span></td>
                     <td className="px-6 py-4 font-mono text-white font-bold">₹{u.balance.toLocaleString('en-IN')}</td>
                     <td className="px-6 py-4 flex gap-2 items-center">
                       {u.role === 'admin' ? (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/50">Admin</span>
                       ) : (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#1a2235] border border-[#2b3139] text-gray-300">User</span>
                       )}
                     </td>
                     <td className="px-6 py-4">
                       <button onClick={() => setSelectedUser(u)} className="bg-[#1a2235] hover:bg-[#2b3139] text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-[#2b3139]">View Profile</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
      )}

      {activeTab === 'withdrawals' && (
         <div className="bg-[#121826] border border-[#2b3139] rounded-xl overflow-hidden shadow-xl">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-[#848e9c]">
               <thead className="text-xs text-white uppercase bg-[#1a2235]">
                 <tr>
                   <th className="px-6 py-4">User Info</th>
                   <th className="px-6 py-4">Method & Details</th>
                   <th className="px-6 py-4">Amount</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {withdrawals.length === 0 && (
                   <tr>
                     <td colSpan={5} className="py-8 text-center">No withdrawal requests found.</td>
                   </tr>
                 )}
                 {withdrawals.map(w => (
                   <tr key={w.id} className="border-b border-[#2b3139] hover:bg-[#1a2235]/50 transition-colors">
                     <td className="px-6 py-4">
                       {w.user ? (
                         <>
                           <span className="text-white font-bold">{w.user.name}</span> <span className="text-[#00FFFF] text-xs font-mono">({w.user.userCode})</span>
                           <br />
                           <span className="text-[10px] font-mono">{w.user.email}</span>
                         </>
                       ) : 'Deleted User'}
                     </td>
                     <td className="px-6 py-4">
                       <span className="text-white font-bold uppercase tracking-wider text-xs">{w.method}</span>
                       <br />
                       <span className="font-mono text-xs text-[#848e9c]">
                          {w.method === 'upi' ? w.paymentDetails?.upiId : `${w.paymentDetails?.accNo} | ${w.paymentDetails?.ifsc} | ${w.paymentDetails?.name}`}
                       </span>
                     </td>
                     <td className="px-6 py-4 font-mono font-black text-white">₹{w.amount.toLocaleString('en-IN')}</td>
                     <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${w.status === 'pending' ? 'bg-[#00FFFF]/10 text-[#00FFFF] border-[#00FFFF]/30' : w.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                         {w.status}
                       </span>
                     </td>
                     <td className="px-6 py-4 flex gap-2">
                       {w.status === 'pending' && (
                         <>
                           <button onClick={() => handleWithdrawalAction(w.id, 'approved')} className="bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500 hover:text-white p-2 rounded transition-colors" title="Mark as Paid">
                             <Check className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleWithdrawalAction(w.id, 'rejected')} className="bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white p-2 rounded transition-colors" title="Reject & Refund">
                             <X className="w-4 h-4" />
                           </button>
                         </>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-[#05080f]/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121826] border border-[#00FFFF]/30 p-8 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,255,255,0.15)] relative">
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-[#848e9c] hover:text-white">✕</button>
            <h3 className="text-2xl font-black text-white font-['Space_Grotesk'] mb-2 uppercase tracking-tight">
              User Profile
            </h3>
            <p className="text-[#00FFFF] font-mono font-bold mb-6">{selectedUser.userCode}</p>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#0b101a] border border-[#1a2235] p-4 rounded-xl flex flex-col items-center justify-center text-center">
                 <span className="text-[#848e9c] text-xs font-bold uppercase tracking-wider mb-1">Available Balance</span>
                 <span className="text-xl font-mono font-black text-[#00FFFF]">₹{selectedUser.balance.toLocaleString('en-IN')}</span>
               </div>
               <div className="bg-[#0b101a] border border-[#1a2235] p-4 rounded-xl flex flex-col items-center justify-center text-center">
                 <span className="text-[#848e9c] text-xs font-bold uppercase tracking-wider mb-1">Trust Rating</span>
                 <span className="text-xl font-mono font-black text-white">{selectedUser.rating} / 5</span>
               </div>
               <div className="bg-[#0b101a] border border-[#1a2235] p-4 rounded-xl flex flex-col items-center justify-center text-center">
                 <span className="text-[#848e9c] text-xs font-bold uppercase tracking-wider mb-1">Trades Completed</span>
                 <span className="text-xl font-mono font-black text-white">{selectedUser.tradesCompleted}</span>
               </div>
               <div className="bg-[#0b101a] border border-[#1a2235] p-4 rounded-xl flex flex-col items-center justify-center text-center">
                 <span className="text-[#848e9c] text-xs font-bold uppercase tracking-wider mb-1">Account Role</span>
                 <span className="text-sm font-black text-white uppercase tracking-wider">{selectedUser.role}</span>
               </div>
            </div>
            
            <div className="mt-6 border-t border-[#1a2235] pt-6 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-[#848e9c] font-bold uppercase">Email:</span>
                 <span className="text-white font-mono">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-[#848e9c] font-bold uppercase">Internal ID:</span>
                 <span className="text-white font-mono text-xs">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-[#848e9c] font-bold uppercase">Joined:</span>
                 <span className="text-white font-mono text-xs">{new Date(selectedUser.joinDate).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
