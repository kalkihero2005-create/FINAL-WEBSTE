import React, { useState, useEffect } from 'react';
import { ShieldCheck, Crosshair, Users, ArrowRight, Activity, Gamepad2, Flame, Trophy } from 'lucide-react';

interface HomeProps {
  onNavigate: (view: 'market' | 'register' | 'login') => void;
}

export function Home({ onNavigate }: HomeProps) {
  const [liveUsers, setLiveUsers] = useState(0);
  const [liveSellers, setLiveSellers] = useState(0);
  const [activeIDs, setActiveIDs] = useState(0);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setLiveUsers(data.liveBuyers || 0);
        setLiveSellers(data.activeSellers || 0);
        setActiveIDs(data.premiumIds || 0);
      }).catch(console.error);

    const interval = setInterval(() => {
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => {
          setLiveUsers(data.liveBuyers || 0);
          setLiveSellers(data.activeSellers || 0);
          setActiveIDs(data.premiumIds || 0);
        }).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] overflow-hidden bg-[#05080f] font-sans">
      
      {/* Hero Section */}
      <section className="relative px-4 py-20 lg:py-28 w-full flex flex-col items-center text-center z-10 flex-1 justify-center">
        
        {/* Gaming Wallpaper Background & Neon Gradients */}
        <div 
          className="absolute inset-0 bg-cover bg-center brightness-[0.5] mix-blend-screen pointer-events-none transition-transform duration-1000 scale-105 group-hover:scale-100"
          style={{ backgroundImage: `url('/src/assets/images/bgmi_neon_wallpaper_1780416438531.png')` }}
        ></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff10_1px,transparent_1px),linear-gradient(to_bottom,#ff450010_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080f] via-[#05080f]/80 to-transparent pointer-events-none"></div>
        
        {/* Neon Glows */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#00FFFF] opacity-[0.12] blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#FF4500] opacity-[0.12] blur-[120px] rounded-full pointer-events-none"></div>

        {/* Live Indicator Pulse */}
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] text-xs font-bold uppercase tracking-widest mb-10 shadow-[0_0_20px_rgba(0,255,255,0.3)] relative z-20 backdrop-blur-md">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFFF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00FFFF]"></span>
          </span>
          System Live & Escrow Secured
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-white mb-4 font-['Space_Grotesk'] uppercase tracking-tight drop-shadow-[0_0_15px_rgba(255,69,0,0.5)] flex flex-col items-center relative z-20">
          <span className="tracking-tighter">KALKIS STORE</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] via-[#FF4500] to-[#00FFFF] mt-[-5px] md:mt-[-15px] drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
            BGMI MARKET
          </span>
        </h1>
        
        <p className="text-[#848e9c] text-lg md:text-xl max-w-2xl mb-14 font-medium tracking-wide relative z-20">
          Level up safely. The #1 trusted hub for premium BGMI accounts with 
          <span className="text-white font-bold"> impenetrable escrow protection</span>.
        </p>

        {/* High-Tech Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto relative z-30">
          {/* Primary Market Button */}
          <button 
            onClick={() => onNavigate('market')}
            className="clip-angled group w-full sm:w-auto bg-gradient-to-r from-[#00FFFF] to-[#FF4500] p-[2px] shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:shadow-[0_0_50px_rgba(255,69,0,0.6)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <div className="clip-angled bg-gradient-to-r from-[#00FFFF] to-[#00cccc] group-hover:from-[#FF4500] group-hover:to-[#ff2a00] flex items-center justify-center gap-3 px-10 py-5 transition-colors duration-500">
               <Gamepad2 className="w-6 h-6 text-black group-hover:text-white transition-colors" />
               <span className="text-black group-hover:text-white font-black text-xl uppercase tracking-wider font-['Space_Grotesk'] transition-colors">
                 Enter Market
               </span>
               <ArrowRight className="w-5 h-5 text-black group-hover:text-white group-hover:translate-x-1.5 transition-all" />
            </div>
          </button>
          
          {/* Secondary Sell Button */}
          <button 
            onClick={() => onNavigate('register')}
            className="clip-angled group w-full sm:w-auto bg-[#00FFFF]/30 p-[2px] transition-all hover:bg-[#FF4500]/60 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(0,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,69,0,0.3)]"
          >
             <div className="clip-angled bg-[#05080f]/90 backdrop-blur-sm flex items-center justify-center gap-3 px-10 py-5 group-hover:bg-[#0a101d] transition-colors">
               <span className="text-[#00FFFF] group-hover:text-[#FF4500] font-black text-xl uppercase tracking-wider font-['Space_Grotesk'] transition-colors">
                 Start Selling
               </span>
             </div>
          </button>
        </div>
        
        {/* Live Stats Board */}
        <div className="w-full max-w-5xl mx-auto mt-24 relative z-20 px-4 md:px-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-[#0a101d]/80 backdrop-blur-xl border border-[#00FFFF]/30 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.15)] overflow-hidden">
             
             <div className="flex flex-col items-center justify-center p-6 border-r border-[#00FFFF]/10 border-b md:border-b-0 hover:bg-[#00FFFF]/5 transition-colors group">
               <Activity className="w-6 h-6 text-[#00FFFF] mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
               <span className="text-3xl md:text-4xl font-black text-white font-mono">{liveUsers.toLocaleString()}</span>
               <span className="text-[10px] md:text-xs text-[#00FFFF] font-bold uppercase tracking-widest mt-1">Live Buyers</span>
             </div>

             <div className="flex flex-col items-center justify-center p-6 md:border-r border-[#00FFFF]/10 border-b md:border-b-0 hover:bg-[#FF4500]/5 transition-colors group">
               <Users className="w-6 h-6 text-[#FF4500] mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(255,69,0,0.8)]" />
               <span className="text-3xl md:text-4xl font-black text-white font-mono">{liveSellers.toLocaleString()}</span>
               <span className="text-[10px] md:text-xs text-[#FF4500] font-bold uppercase tracking-widest mt-1">Active Sellers</span>
             </div>

             <div className="flex flex-col items-center justify-center p-6 border-r border-[#00FFFF]/10 hover:bg-[#00FFFF]/5 transition-colors group">
               <Trophy className="w-6 h-6 text-[#00FFFF] mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
               <span className="text-3xl md:text-4xl font-black text-white font-mono">{activeIDs.toLocaleString()}</span>
               <span className="text-[10px] md:text-xs text-[#00FFFF] font-bold uppercase tracking-widest mt-1">Premium IDs Listed</span>
             </div>

             <div className="flex flex-col items-center justify-center p-6 hover:bg-[#FF4500]/5 transition-colors group">
               <Flame className="w-6 h-6 text-[#FF4500] mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(255,69,0,0.8)]" />
               <span className="text-3xl md:text-4xl font-black text-white font-mono">100%</span>
               <span className="text-[10px] md:text-xs text-[#FF4500] font-bold uppercase tracking-widest mt-1">Scam-Free Success</span>
             </div>

          </div>
        </div>

      </section>

      {/* Features Grid */}
      <section className="bg-gradient-to-b from-[#05080f] to-[#0A0F1A] py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white font-['Space_Grotesk'] uppercase tracking-tight mb-4 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">Why Trust Kalkis Store?</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#00FFFF] to-[#FF4500] mx-auto rounded-full shadow-[0_0_10px_rgba(0,255,255,0.6)]"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="clip-angled-sm bg-[#121826] p-8 md:p-10 border-l border-t border-[#00FFFF]/30 hover:border-[#00FFFF]/70 transition-all group hover:-translate-y-2 shadow-xl hover:shadow-[0_10px_40px_rgba(0,255,255,0.2)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFFF]/5 rounded-bl-full pointer-events-none group-hover:bg-[#00FFFF]/10 transition-colors"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#00FFFF]/20 to-transparent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">
                <ShieldCheck className="w-8 h-8 text-[#00FFFF]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-['Space_Grotesk'] uppercase">Zero Scams. Escrow.</h3>
              <p className="text-[#848e9c] leading-relaxed font-medium">
                Funds are locked securely until credentials are fully tested. Neither buyer nor seller can cheat the system. Period.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="clip-angled-sm bg-[#121826] p-8 md:p-10 border-l border-t border-[#FF4500]/30 hover:border-[#FF4500]/70 transition-all group hover:-translate-y-2 shadow-xl hover:shadow-[0_10px_40px_rgba(255,69,0,0.2)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4500]/5 rounded-bl-full pointer-events-none group-hover:bg-[#FF4500]/10 transition-colors"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF4500]/20 to-transparent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(255,69,0,0.4)]">
                <Crosshair className="w-8 h-8 text-[#FF4500]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-['Space_Grotesk'] uppercase">Premium Accounts</h3>
              <p className="text-[#848e9c] leading-relaxed font-medium">
                From Conqueror frames to maxed X-Suits and Glacier M4s, find the exact loadout you want through verified sellers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="clip-angled-sm bg-[#121826] p-8 md:p-10 border-l border-t border-[#00FFFF]/30 hover:border-[#00FFFF]/70 transition-all group hover:-translate-y-2 shadow-xl hover:shadow-[0_10px_40px_rgba(0,255,255,0.2)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFFF]/5 rounded-bl-full pointer-events-none group-hover:bg-[#00FFFF]/10 transition-colors"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#00FFFF]/20 to-transparent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">
                <Users className="w-8 h-8 text-[#00FFFF]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-['Space_Grotesk'] uppercase">Trusted Community</h3>
              <p className="text-[#848e9c] leading-relaxed font-medium">
                Every seller is rated. Check their past trades, success rates, and dispute history before dealing. Play it safe.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
