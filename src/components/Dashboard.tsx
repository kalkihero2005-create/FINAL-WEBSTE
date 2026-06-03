import React, { useEffect, useState } from 'react';
import { User, Trade, Transaction } from '../types';
import { Wallet, History, AlertCircle, TrendingUp, Download, ArrowUpRight, CheckCircle2, QrCode, Building2, Smartphone, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  user: User;
  token: string;
  onOpenTrade: (tradeId: string) => void;
  onUserUpdate?: (user: User) => void;
}

export function Dashboard({ user, token, onOpenTrade, onUserUpdate }: DashboardProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  // Deposit State
  const [depositAmount, setDepositAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [depositStatus, setDepositStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  // Withdraw State
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({ accNo: '', ifsc: '', name: '' });
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'success'>('idle');

  const fetchDashboardData = () => {
    Promise.all([
      fetch('/api/trades', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/wallet/transactions', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
    ]).then(([tradesData, txData]) => {
      setTrades(tradesData);
      setTransactions(txData);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) < 1) return;
    setDepositStatus('processing');
    
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert("Failed to load Razorpay SDK. Check your connection.");
        setDepositStatus('idle');
        return;
      }

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ amount: Number(depositAmount) })
      });
      const data = await res.json();
      
      if (data.order_id) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Sx4rlAqSP0N0An',
          amount: data.amount,
          currency: data.currency,
          name: "EscrowPay",
          description: "Wallet Deposit",
          order_id: data.order_id,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setDepositStatus('success');
                if (onUserUpdate) onUserUpdate({ ...user, balance: verifyData.balance });
                setTimeout(() => {
                  setShowDeposit(false);
                  setDepositStatus('idle');
                  setDepositAmount('');
                }, 2000);
                // Also refresh transactions
                fetchDashboardData();
              } else {
                alert(verifyData.error || "Payment verification failed");
                setDepositStatus('idle');
              }
            } catch (err) {
              console.error(err);
              alert("Error verifying payment");
              setDepositStatus('idle');
            }
          },
          prefill: {
            name: user.name || "Buyer",
            email: user.email || "test@example.com",
            contact: "9999999999"
          },
          theme: {
            color: "#00FFFF"
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.on('payment.failed', function (response: any) {
          alert('Payment failed: ' + response.error.description);
          setDepositStatus('idle');
        });
        razorpay.open();
      } else {
        alert(data.error || "Failed to create order");
        setDepositStatus('idle');
      }
    } catch (e) {
      console.error(e);
      setDepositStatus('idle');
      alert('Deposit API failed');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) > user.balance) return;
    if (withdrawMethod === 'upi' && !upiId) return;
    if (withdrawMethod === 'bank' && (!bankDetails.accNo || !bankDetails.ifsc || !bankDetails.name)) return;

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          amount: Number(withdrawAmount), 
          method: withdrawMethod,
          details: withdrawMethod === 'upi' ? { upiId } : bankDetails
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setWithdrawStatus('success');
        if (onUserUpdate) onUserUpdate({ ...user, balance: data.balance });
        
        setTimeout(() => {
          setShowWithdraw(false);
          setWithdrawStatus('idle');
          setWithdrawAmount('');
          setUpiId('');
          setBankDetails({ accNo: '', ifsc: '', name: '' });
        }, 2500);
      }
    } catch (e) {
      console.error(e);
      alert('Withdrawal request failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-[#FF9900]/10 rounded-xl border border-[#FF9900]/20">
          <History className="w-6 h-6 text-[#FF9900]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white font-['Space_Grotesk'] uppercase tracking-tight">Dashboard Central</h1>
        </div>
      </div>

      {/* Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-[#121826] p-8 rounded-2xl border border-[#00FFFF]/20 shadow-[0_0_30px_rgba(0,255,255,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00FFFF]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-3 text-[#848e9c] font-bold uppercase tracking-wider text-sm mb-3 relative z-10">
            <Wallet className="w-5 h-5 text-[#00FFFF]" /> Wallet Balance
          </div>
          <div className="text-5xl font-mono font-black text-white tracking-tight mb-8 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            ₹{user.balance.toLocaleString('en-IN')}
          </div>
          <div className="flex flex-wrap gap-4 relative z-10">
            <button 
              onClick={() => setShowDeposit(true)}
              className="bg-gradient-to-r from-[#00FFFF] to-[#00cccc] hover:from-[#FF4500] hover:to-[#ff2a00] text-black hover:text-white font-black uppercase tracking-wider py-3 px-8 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,69,0,0.5)]"
            >
              <Download className="w-4 h-4 rotate-180" /> Add Funds (Paytm/UPI)
            </button>
            <button 
              onClick={() => setShowWithdraw(true)}
              className="bg-[#1a2235] hover:bg-[#FF4500]/10 text-white font-bold uppercase tracking-wider py-3 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 border border-[#00FFFF]/20 hover:border-[#FF4500]/50 hover:text-[#FF4500]"
            >
               Withdraw (Bank/UPI)
            </button>
          </div>
        </div>

        <div className="bg-[#121826] p-6 rounded-2xl border border-[#00FFFF]/10 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-[#848e9c] font-bold uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF4500]" /> Trade Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#0b101a] p-3 rounded-lg border border-[#1a2235]">
                <span className="text-[#848e9c] font-medium text-sm drop-shadow-sm">Escrows Completed</span>
                <span className="text-white font-black font-mono">{user.tradesCompleted}</span>
              </div>
              <div className="flex justify-between items-center bg-[#0b101a] p-3 rounded-lg border border-[#1a2235]">
                <span className="text-[#848e9c] font-medium text-sm drop-shadow-sm">Trust Rating</span>
                <span className="text-[#00FFFF] font-black font-mono flex items-center gap-1 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
                  {user.rating} / 5.0
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-start gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]" />
            <p className="text-xs text-red-200/80 leading-relaxed font-medium">
              We process everything through escrow. Never send codes directly to buyers.
            </p>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 bg-[#05080f]/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121826] border border-[#00FFFF]/30 p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,255,255,0.15)] relative">
            <button onClick={() => setShowDeposit(false)} className="absolute top-4 right-4 text-[#848e9c] hover:text-white">✕</button>
            <h3 className="text-2xl font-black text-white font-['Space_Grotesk'] mb-6 uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#00FFFF]">Quick</span> Deposit
            </h3>
            
            {depositStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-[#00FFFF] mx-auto mb-4 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
                <p className="text-white font-bold text-xl mb-2">Redirecting to Payment Gateway...</p>
                <p className="text-[#848e9c] text-sm">Please do not close this window.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-[#0b101a] p-4 rounded-xl border border-[#1a2235] text-center">
                  <div className="w-16 h-16 bg-[#00FFFF]/10 rounded-full mx-auto mb-4 flex items-center justify-center border border-[#00FFFF]/20">
                     <ShieldCheck className="w-8 h-8 text-[#00FFFF]" />
                  </div>
                  <p className="text-[#00FFFF] font-mono text-sm font-bold mb-1">Razorpay Secure Checkout</p>
                  <p className="text-[#848e9c] text-xs">Credit Cards, UPI, NetBanking supported</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#848e9c] mb-1.5 uppercase">Amount (INR)</label>
                    <input 
                      type="number" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#00FFFF] text-white rounded-lg px-4 py-3 outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleDeposit}
                  disabled={depositStatus === 'processing' || !depositAmount}
                  className="w-full bg-gradient-to-r from-[#00FFFF] to-[#00cccc] hover:from-[#00cccc] hover:to-[#009999] text-black font-black uppercase tracking-wider py-3.5 px-4 rounded-lg transition-all disabled:opacity-50"
                >
                  {depositStatus === 'processing' ? 'Processing...' : 'Pay via Razorpay'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-[#05080f]/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121826] border border-[#FF4500]/30 p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(255,69,0,0.15)] relative">
            <button onClick={() => setShowWithdraw(false)} className="absolute top-4 right-4 text-[#848e9c] hover:text-white">✕</button>
            <h3 className="text-2xl font-black text-white font-['Space_Grotesk'] mb-6 uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#FF4500]">Manual</span> Withdraw
            </h3>

            {withdrawStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-[#FF4500] mx-auto mb-4 drop-shadow-[0_0_10px_rgba(255,69,0,0.8)]" />
                <p className="text-white font-bold text-xl mb-2">Withdrawal Requested!</p>
                <p className="text-[#848e9c] text-sm">Amount will reflect in your account within 24 HRS via NEFT/IMPS/UPI.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex bg-[#0b101a] p-1 rounded-lg border border-[#1a2235]">
                  <button 
                    onClick={() => setWithdrawMethod('upi')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-bold text-sm transition-all ${withdrawMethod === 'upi' ? 'bg-[#00FFFF]/20 text-[#00FFFF]' : 'text-[#848e9c]'}`}
                  >
                    <Smartphone className="w-4 h-4" /> UPI ID
                  </button>
                  <button 
                    onClick={() => setWithdrawMethod('bank')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-bold text-sm transition-all ${withdrawMethod === 'bank' ? 'bg-[#FF4500]/20 text-[#FF4500]' : 'text-[#848e9c]'}`}
                  >
                    <Building2 className="w-4 h-4" /> Bank (IMPS/NEFT)
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#848e9c] mb-1.5 uppercase">Amount to Withdraw (INR)</label>
                    <input 
                      type="number" 
                      max={user.balance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={`Max: ₹${user.balance}`}
                      className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#FF4500] text-white rounded-lg px-4 py-3 outline-none transition-colors font-mono"
                    />
                  </div>

                  {withdrawMethod === 'upi' ? (
                    <div>
                      <label className="block text-xs font-bold text-[#848e9c] mb-1.5 uppercase">Receiving UPI ID</label>
                      <input 
                        type="text" 
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. 9876543210@ybl"
                        className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#00FFFF] text-white rounded-lg px-4 py-3 outline-none transition-colors"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#848e9c] mb-1.5 uppercase">Account Holder Name</label>
                        <input 
                          type="text" 
                          value={bankDetails.name}
                          onChange={(e) => setBankDetails({...bankDetails, name: e.target.value})}
                          placeholder="Name as per bank"
                          className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#FF4500] text-white rounded-lg px-4 py-3 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#848e9c] mb-1.5 uppercase">Account Number</label>
                        <input 
                          type="text" 
                          value={bankDetails.accNo}
                          onChange={(e) => setBankDetails({...bankDetails, accNo: e.target.value})}
                          placeholder="1234567890"
                          className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#FF4500] text-white rounded-lg px-4 py-3 outline-none transition-colors font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#848e9c] mb-1.5 uppercase">IFSC Code</label>
                        <input 
                          type="text" 
                          value={bankDetails.ifsc}
                          onChange={(e) => setBankDetails({...bankDetails, ifsc: e.target.value})}
                          placeholder="SBIN0001234"
                          className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#FF4500] text-white rounded-lg px-4 py-3 outline-none transition-colors font-mono uppercase"
                        />
                      </div>
                    </>
                  )}
                </div>

                <button 
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || Number(withdrawAmount) > user.balance}
                  className="w-full bg-gradient-to-r from-[#FF4500] to-[#ff2a00] hover:shadow-[0_0_20px_rgba(255,69,0,0.5)] text-white font-black uppercase tracking-wider py-3.5 px-4 rounded-lg transition-all disabled:opacity-50"
                >
                  Request IMPS/NEFT Payout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* order History */}
      <div>
        <h2 className="text-2xl font-black text-white mb-6 font-['Space_Grotesk'] uppercase tracking-tight flex items-center gap-3 drop-shadow-[0_0_8px_rgba(0,255,255,0.3)]">
          <History className="w-6 h-6 text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" /> Escrow Operations
        </h2>
        
        {trades.length === 0 ? (
          <div className="bg-[#121826] border border-[#00FFFF]/10 rounded-2xl p-16 text-center flex flex-col items-center shadow-lg">
             <div className="w-20 h-20 bg-[#0b101a] rounded-full flex items-center justify-center mb-5 border border-[#1a2235] shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden">
               <div className="absolute inset-0 bg-[#00FFFF]/5"></div>
               <History className="w-10 h-10 text-[#00FFFF]/50 relative z-10" />
             </div>
             <p className="text-white font-black text-lg mb-2 font-['Space_Grotesk'] uppercase tracking-wider">No Active Trades</p>
             <p className="text-[#848e9c] max-w-sm font-medium">When you buy or sell a BGMI ID, the active escrow will appear here.</p>
          </div>
        ) : (
          <div className="bg-[#121826] border border-[#00FFFF]/20 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.05)]">
            <div className="hidden md:grid grid-cols-5 p-4 border-b border-[#00FFFF]/10 text-xs font-bold text-[#848e9c] uppercase tracking-wider bg-[#0b101a]">
              <div className="col-span-2">Contract ID & Time</div>
              <div>Role</div>
              <div>Value (INR)</div>
              <div className="text-right">State</div>
            </div>
            {trades.map(trade => (
              <div key={trade.id} className="grid grid-cols-2 md:grid-cols-5 p-5 border-b border-[#1a2235] last:border-0 items-center hover:bg-[#161d2b] transition-colors gap-y-4">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <span className="text-[#00FFFF] font-mono text-sm max-w-[200px] truncate font-bold">{trade.id}</span>
                  <span className="text-[11px] font-medium text-[#848e9c]">{new Date(trade.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-sm font-black text-gray-300 uppercase tracking-wider">
                   {trade.buyerId === user.id ? 'Purchasing' : 'Selling'}
                </div>
                <div className="text-lg font-black text-white font-mono">
                  ₹{trade.price.toLocaleString('en-IN')}
                </div>
                <div className="col-span-2 md:col-span-1 text-right flex items-center justify-end gap-3 mt-4 md:mt-0">
                   <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg ${
                     trade.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                     trade.status === 'disputed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                     trade.status === 'cancelled' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                     'bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/20'
                   }`}>
                     {trade.status.replace('_', ' ')}
                   </span>
                   <button 
                     onClick={() => onOpenTrade(trade.id)}
                     className="p-2.5 bg-[#0b101a] hover:bg-gradient-to-r hover:from-[#00FFFF] hover:to-[#00cccc] border border-[#1a2235] hover:border-transparent rounded-lg text-[#848e9c] hover:text-black transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                     title="Open Escrow Room"
                   >
                     <ArrowUpRight className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-2xl font-black text-white mb-6 font-['Space_Grotesk'] uppercase tracking-tight flex items-center gap-3 drop-shadow-[0_0_8px_rgba(0,255,255,0.3)] mt-8">
          <History className="w-6 h-6 text-[#00FFFF]" /> Wallet Transactions
        </h2>
        
        {transactions.length === 0 ? (
          <div className="bg-[#121826] border border-[#1a2235] rounded-2xl p-10 text-center shadow-lg">
             <p className="text-[#848e9c] font-medium">No transactions found.</p>
          </div>
        ) : (
          <div className="bg-[#121826] border border-[#1a2235] rounded-2xl overflow-hidden shadow-lg">
            <div className="hidden md:grid grid-cols-5 p-4 border-b border-[#1a2235] text-xs font-bold text-[#848e9c] uppercase tracking-wider bg-[#0b101a]">
              <div className="col-span-2">Date & Time</div>
              <div>Type</div>
              <div>Amount</div>
              <div>Balance After</div>
            </div>
            {transactions.map(txn => (
              <div key={txn.id} className="grid grid-cols-2 md:grid-cols-5 p-5 border-b border-[#1a2235] last:border-0 items-center hover:bg-[#161d2b] transition-colors gap-y-4">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <span className="text-white text-sm font-medium">{txn.description}</span>
                  <span className="text-[11px] font-medium text-[#848e9c]">{new Date(txn.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-sm font-bold text-gray-300 uppercase">
                  {txn.type.replace('_', ' ')}
                </div>
                <div className={`text-sm font-black font-mono ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.amount > 0 ? '+' : ''}₹{txn.amount.toLocaleString('en-IN')}
                </div>
                <div className="text-sm font-mono text-white">
                  ₹{txn.balanceAfter.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

