import React, { useEffect, useState, useRef } from 'react';
import { Trade, ChatMessage, User, Listing } from '../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, Send, Loader2, CheckCircle2, FileText, Ban, XCircle, Star } from 'lucide-react';

interface TradeRoomProps {
  tradeId: string;
  user: User;
  token: string;
  onClose: () => void;
}

export function TradeRoom({ tradeId, user, token, onClose }: TradeRoomProps) {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  // Review
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const CANCEL_REASONS = [
    "Changed my mind",
    "Seller is not responding",
    "Found a better deal",
    "Other"
  ];

  const APPEAL_REASONS = [
    "Login credentials don't work",
    "Account details don't match listing",
    "Seller is asking for direct payment",
    "Other"
  ];

  const fetchData = async () => {
    try {
      const [tradeRes, msgsRes] = await Promise.all([
        fetch(`/api/trades/${tradeId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/messages/${tradeId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const tradeData = await tradeRes.json();
      const msgs = await msgsRes.json();
      
      setTrade(tradeData);
      setMessages(msgs);
      
      if (tradeData.listingId && !listing) {
        const listingRes = await fetch(`/api/listings/${tradeData.listingId}`);
        const listingData = await listingRes.json();
        setListing(listingData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    // Use interval for polling messages instead of WebSockets for Serverless/Cloudflare support
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [tradeId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const text = inputText.trim();
    setInputText('');
    
    await fetch(`/api/messages`, {
       method: 'POST',
       headers: { 
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}`
       },
       body: JSON.stringify({ tradeId, text })
    });
    fetchData(); // refresh immediately
  };

  const updateTradeStatus = async (status: string, reason?: string) => {
    await fetch(`/api/trades/${tradeId}/status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, reason })
    });
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
    setActionReason('');
    setOtherReason('');
  };

  const handleAppealClick = () => {
    setShowAppealModal(true);
    setActionReason('');
    setOtherReason('');
  };

  const submitCancel = () => {
    const finalReason = actionReason === 'Other' ? otherReason : actionReason;
    if (!finalReason) return;
    updateTradeStatus('cancelled', finalReason);
    setShowCancelModal(false);
  };

  const submitAppeal = () => {
    const finalReason = actionReason === 'Other' ? otherReason : actionReason;
    if (!finalReason) return;
    updateTradeStatus('disputed', finalReason);
    setShowAppealModal(false);
  };

  // Mock seller sending credentials if pending
  const submitCredentials = async (loginId: string, password: string) => {
    await fetch(`/api/trades/${tradeId}/credentials`, { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password })
    });
    fetchData();
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trade || reviewRating === 0) return;
    const revieweeId = isBuyer ? trade.sellerId : trade.buyerId;
    try {
      const res = await fetch(`/api/reviews`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, revieweeId, rating: reviewRating, comment: reviewComment })
      });
      if (res.ok) {
        setReviewSubmitted(true);
      } else {
        const error = await res.json();
        if (error.error === "You have already reviewed this trade") setReviewSubmitted(true);
        else alert(error.error);
      }
    } catch(err) {
      console.error(err);
    }
  };

  if (!trade) return <div className="p-8 text-white flex gap-2 justify-center items-center h-[calc(100vh-64px)]"><Loader2 className="animate-spin text-[#FF9900]"/> Launching SafeRoom...</div>;

  const isBuyer = user.id === trade.buyerId;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-64px)] flex flex-col md:flex-row gap-8">
      
      {/* Left Panel: Trade Details & Actions */}
      <div className="w-full md:w-1/3 flex flex-col gap-5">
        <button onClick={onClose} className="text-[#848e9c] hover:text-[#FF9900] text-sm font-bold uppercase tracking-wider mr-auto mb-2 flex items-center gap-2 transition-colors">
          ← Dashboard
        </button>

        <div className="bg-[#121826] border border-[#1a2235] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4500]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">Safety Control Room</h2>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-[#848e9c]">Order ID</span>
              <span className="px-2.5 py-1 mt-1 rounded bg-[#1a2235] text-xs font-mono font-bold tracking-widest text-[#00FFFF] border border-[#2b3139] shadow-[0_0_10px_rgba(0,255,255,0.1)]">
                {trade.id}
              </span>
            </div>
          </div>

          <div className="space-y-5 text-sm relative z-10">
            <div className="flex flex-col gap-1 border-b border-[#1a2235] pb-4">
              <span className="text-[#848e9c] text-xs font-bold uppercase tracking-wider">Account</span>
              <span className="font-bold text-white text-lg font-['Space_Grotesk']" title={listing?.title}>{listing?.title || 'Loading...'}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#1a2235] pb-4">
              <span className="text-[#848e9c] text-xs font-bold uppercase tracking-wider">Locked Funds</span>
              <span className="font-mono text-xl font-bold text-[#FF9900]">₹{trade.price.toLocaleString('en-IN')}</span>
            </div>

            <div className="bg-[#0b101a] p-5 rounded-xl border border-[#1a2235]">
              <span className="text-[#848e9c] text-[10px] font-bold uppercase tracking-widest block mb-4">Contract Status</span>
              
              {trade.status === 'pending' && (
                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between text-[#00FFFF] font-bold pb-3 border-b border-[#1a2235]">
                     <div className="flex items-center gap-2">
                       <Loader2 className="w-5 h-5 animate-spin" /> Awaiting Credentials
                     </div>
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed font-medium">Funds safely held. The seller must provide the ID & password in this chat.</p>
                   {isBuyer && (
                     <button onClick={handleCancelClick} className="w-full bg-[#1a2235] hover:bg-red-500/10 hover:border-red-500/50 border border-[#2b3139] text-red-400 font-bold py-3 mt-2 rounded-lg flex justify-center items-center gap-2 transition-colors">
                       <XCircle className="w-4 h-4" /> Cancel Order
                     </button>
                   )}
                   {!isBuyer && (
                      <form onSubmit={(e) => {
                         e.preventDefault();
                         const formData = new FormData(e.currentTarget);
                         submitCredentials(formData.get('loginId') as string, formData.get('password') as string);
                      }} className="mt-4 flex flex-col gap-3 p-4 bg-[#1a2235] rounded-xl border border-[#2b3139]">
                         <span className="text-[#00FFFF] font-bold text-xs uppercase">Submit Credentials</span>
                         <input name="loginId" type="text" placeholder="Login ID / Email / Twitter" required className="w-full bg-[#0b101a] border border-[#2b3139] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00FFFF]" />
                         <input name="password" type="password" placeholder="Password" required className="w-full bg-[#0b101a] border border-[#2b3139] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00FFFF]" />
                         <button type="submit" className="w-full bg-[#00FFFF] text-black font-bold py-2 rounded-lg hover:bg-white transition-colors">Provide to Buyer</button>
                      </form>
                   )}
                </div>
              )}

              {trade.status === 'credentials_sent' && (
                <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-2 text-[#00FFFF] font-bold text-base">
                     <FileText className="w-5 h-5" /> Testing Phase
                   </div>
                   <p className="text-xs text-gray-300 leading-relaxed font-medium">
                     Please carefully check the provided details. If the account matches the description, release the funds.
                   </p>
                   {isBuyer && (
                     <div className="flex flex-col gap-3 pt-4 border-t border-[#1a2235]">
                       <button onClick={() => updateTradeStatus('completed')} className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] text-white font-black py-3 rounded-lg flex justify-center items-center gap-2 transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wider">
                         <CheckCircle2 className="w-5 h-5" /> Confirm Delivery
                       </button>
                       <button onClick={handleAppealClick} className="w-full bg-[#1a2235] hover:bg-red-500/10 hover:border-red-500/50 border border-[#2b3139] text-red-400 font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-colors">
                         <AlertTriangle className="w-4 h-4" /> Raise Appeal
                       </button>
                     </div>
                   )}
                </div>
              )}

              {trade.status === 'completed' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400 font-bold">
                      <CheckCircle2 className="w-5 h-5" /> Escrow Finalized
                    </div>
                    <p className="text-[11px] text-green-200/70 font-medium">Funds successfully transferred to seller.</p>
                  </div>
                  
                  {!reviewSubmitted && (
                    <form onSubmit={submitReview} className="bg-[#1a2235] p-4 rounded-xl border border-[#2b3139]">
                      <h4 className="text-[#00FFFF] font-bold text-xs uppercase mb-3">Leave a Review</h4>
                      <div className="flex gap-2 mb-3">
                        {[1,2,3,4,5].map(star => (
                           <button 
                             key={star} 
                             type="button" 
                             onClick={() => setReviewRating(star)}
                             className={`p-1 transition-transform hover:scale-110 ${reviewRating >= star ? 'text-[#FF9900]' : 'text-gray-600'}`}
                           >
                             <Star className="w-6 h-6 fill-current" />
                           </button>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Reason (Optional)" 
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        className="w-full bg-[#0b101a] border border-[#2b3139] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00FFFF] mb-3"
                      />
                      <button 
                        type="submit" 
                        disabled={reviewRating === 0}
                        className="w-full bg-[#FF9900] disabled:opacity-50 text-black font-bold py-2 rounded-lg hover:bg-white transition-colors uppercase text-xs tracking-wider"
                      >
                        Submit Review
                      </button>
                    </form>
                  )}
                  {reviewSubmitted && (
                    <div className="text-center text-xs text-[#848e9c] p-2 bg-[#1a2235] rounded-xl border border-[#2b3139]">
                      ✓ Review Submitted
                    </div>
                  )}
                </div>
              )}

              {trade.status === 'cancelled' && (
                <div className="flex flex-col gap-2 p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400 font-bold">
                    <XCircle className="w-5 h-5" /> Order Cancelled
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">Funds unlocked and refunded.</p>
                </div>
              )}

              {trade.status === 'disputed' && (
                <div className="flex flex-col gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg shadow-[inset_0_0_15px_rgba(255,0,0,0.1)]">
                  <div className="flex items-center gap-2 text-red-500 font-black tracking-wide uppercase">
                    <Ban className="w-5 h-5" /> Frozen: Admin Review
                  </div>
                  <p className="text-[11px] text-red-200/70 font-medium">Our investigation team (Admin Support) has joined the chat.</p>
                </div>
              )}
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-[#FF4500]/5 border border-[#FF4500]/20 rounded-xl text-xs text-gray-300">
              <ShieldCheck className="w-7 h-7 text-[#FF4500] shrink-0" />
              <p className="leading-relaxed font-medium">Your funds are protected. Under absolutely NO circumstances should you perform trades outside this secure room.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Chat */}
      <div className="w-full md:w-2/3 bg-[#121826] border border-[#1a2235] rounded-2xl flex flex-col shadow-xl overflow-hidden h-[600px] md:h-auto font-sans">
        <div className="bg-[#0b101a] px-6 py-5 flex items-center justify-between border-b border-[#1a2235]">
          <div className="flex items-center gap-4">
            <div className="relative">
               <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
               <div className="w-2.5 h-2.5 bg-green-500 rounded-full absolute top-0 left-0 animate-ping"></div>
            </div>
            <h3 className="font-bold text-white tracking-wide">Secure Chat Room</h3>
          </div>
          <span className="text-[10px] text-[#848e9c] font-mono tracking-widest uppercase border border-[#2b3139] px-2 py-1 rounded">E2E Escrow Monitored</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0b101a] custom-scrollbar">
          {messages.map(msg => {
            if (msg.senderId === 'system') {
              const isWarning = msg.text.includes('🚨');
              return (
                <div key={msg.id} className="flex justify-center my-6">
                  <div className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider max-w-[85%] text-center border shadow-inner ${isWarning ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-[#1a2235] text-[#848e9c] border-[#2b3139]'}`}>
                    {msg.text}
                  </div>
                </div>
              );
            }
            const isMe = msg.senderId === user.id;
            const isAdmin = msg.senderId === 'admin1';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm font-medium ${
                  isMe 
                    ? 'bg-gradient-to-br from-[#00FFFF] to-[#00cccc] text-black shadow-md rounded-br-sm font-bold' 
                    : isAdmin 
                      ? 'bg-[#FF4500]/20 text-white border border-[#FF4500]/50 rounded-bl-sm'
                      : 'bg-[#1a2235] text-gray-200 border border-[#2b3139] rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <span className={`text-[10px] block mt-2 font-bold ${isMe ? 'text-black/60' : isAdmin ? 'text-[#FF4500]' : 'text-[#848e9c]'} text-right`}>
                    {isAdmin && 'SUPPORT AGENT | '}
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-[#121826] border-t border-[#1a2235]">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={trade.status === 'completed' || trade.status === 'cancelled'}
              placeholder={trade.status === 'completed' || trade.status === 'cancelled' ? "Chat is closed" : "Type a secure message..."}
              className="flex-1 bg-[#0b101a] border border-[#2b3139] text-white rounded-xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-[#00FFFF] transition-colors disabled:opacity-50 placeholder-[#474d57]"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || trade.status === 'completed' || trade.status === 'cancelled'}
              className="bg-gradient-to-r from-[#00FFFF] to-[#00cccc] hover:from-[#FF4500] hover:to-[#ff2a00] text-black hover:text-white p-3.5 rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:transform-none flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </div>
        </form>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-[#05080f]/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121826] border border-[#1a2235] p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowCancelModal(false)} className="absolute top-4 right-4 text-[#848e9c] hover:text-white">✕</button>
            <h3 className="text-xl font-bold text-white font-['Space_Grotesk'] mb-6 uppercase tracking-tight flex items-center gap-2">
              <span className="text-red-400">Cancel</span> Order
            </h3>
            
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#848e9c] uppercase mb-2">Reason for Cancellation</label>
              <div className="space-y-2">
                {CANCEL_REASONS.map(reason => (
                  <label key={reason} className="flex items-center gap-3 p-3 rounded-lg border border-[#1a2235] bg-[#0b101a] cursor-pointer hover:border-[#00FFFF] transition-colors">
                    <input 
                      type="radio" 
                      name="cancelReason" 
                      value={reason}
                      checked={actionReason === reason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="accent-[#00FFFF]"
                    />
                    <span className="text-white text-sm">{reason}</span>
                  </label>
                ))}
              </div>
              
              {actionReason === 'Other' && (
                <div>
                  <input 
                    type="text" 
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Specify other reason..."
                    className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#00FFFF] text-white rounded-lg px-4 py-3 outline-none transition-colors mt-2"
                  />
                </div>
              )}

              <button 
                onClick={submitCancel}
                disabled={!actionReason || (actionReason === 'Other' && !otherReason)}
                className="w-full bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white font-bold py-3.5 px-4 rounded-lg transition-all disabled:opacity-50 uppercase tracking-widest mt-4"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appeal Modal */}
      {showAppealModal && (
        <div className="fixed inset-0 bg-[#05080f]/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121826] border border-[#FF4500]/30 p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(255,69,0,0.15)] relative">
            <button onClick={() => setShowAppealModal(false)} className="absolute top-4 right-4 text-[#848e9c] hover:text-white">✕</button>
            <h3 className="text-xl font-bold text-white font-['Space_Grotesk'] mb-6 uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#FF4500]">Raise</span> Appeal
            </h3>
            
            <p className="text-[#848e9c] text-xs mb-6">Raising an appeal will freeze the funds and invite Customer Support into the chat room.</p>
            
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#848e9c] uppercase mb-2">Reason for Dispute</label>
              <div className="space-y-2">
                {APPEAL_REASONS.map(reason => (
                  <label key={reason} className="flex items-center gap-3 p-3 rounded-lg border border-[#1a2235] bg-[#0b101a] cursor-pointer hover:border-[#FF4500] transition-colors">
                    <input 
                      type="radio" 
                      name="appealReason" 
                      value={reason}
                      checked={actionReason === reason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="accent-[#FF4500]"
                    />
                    <span className="text-white text-sm">{reason}</span>
                  </label>
                ))}
              </div>
              
              {actionReason === 'Other' && (
                <div>
                  <input 
                    type="text" 
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Provide specific details..."
                    className="w-full bg-[#0b101a] border border-[#1a2235] focus:border-[#FF4500] text-white rounded-lg px-4 py-3 outline-none transition-colors mt-2"
                  />
                </div>
              )}

              <button 
                onClick={submitAppeal}
                disabled={!actionReason || (actionReason === 'Other' && !otherReason)}
                className="w-full bg-[#FF4500] hover:bg-[#ff2a00] hover:shadow-[0_0_15px_rgba(255,69,0,0.5)] text-white font-black py-3.5 px-4 rounded-lg transition-all disabled:opacity-50 uppercase tracking-widest mt-4"
              >
                Submit to Customer Support
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
