import React from 'react';
import { ShoppingCart, LogOut, ShieldCheck, ShieldAlert, Crosshair, Home, PlusCircle, LayoutDashboard } from 'lucide-react';
import { User } from '../types';

interface NavigationProps {
  currentView: string;
  setView: (v: any) => void;
  user: User | null;
  onLogout: () => void;
}

export function Navigation({ currentView, setView, user, onLogout }: NavigationProps) {
  return (
    <nav className="bg-[#0A0F1A]/95 backdrop-blur-md border-b border-[#2b3139] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setView(user ? 'market' : 'home')}
        >
          <div className="p-1.5 rounded-lg bg-[#00FFFF]/10 group-hover:bg-[#00FFFF]/20 border border-[#00FFFF]/20 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] transition-all">
            <Crosshair className="w-8 h-8 text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
          </div>
          <span className="text-xl font-black text-white tracking-tight font-['Space_Grotesk'] uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            KALKIS STORE <span className="text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">BGMI</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold tracking-wide">
          {!user && (
            <button 
              onClick={() => setView('home')}
              className={`transition-colors flex items-center gap-1.5 ${currentView === 'home' ? 'text-[#00FFFF] drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]' : 'text-[#848e9c] hover:text-white'}`}
            >
              <Home className="w-4 h-4" /> Home
            </button>
          )}
          <button 
            onClick={() => setView('market')}
            className={`transition-colors flex items-center gap-1.5 ${currentView === 'market' ? 'text-[#00FFFF] drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]' : 'text-[#848e9c] hover:text-white'}`}
          >
            <ShoppingCart className="w-4 h-4" /> Marketplace
          </button>
          
          {user && (
            <>
              <button 
                onClick={() => setView('dashboard')}
                className={`transition-colors flex items-center gap-1.5 ${currentView === 'dashboard' ? 'text-[#00FFFF] drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]' : 'text-[#848e9c] hover:text-white'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              
              <button 
                onClick={() => setView('post')}
                className={`transition-colors flex items-center gap-1.5 ${currentView === 'post' ? 'text-[#FF4500] drop-shadow-[0_0_5px_rgba(255,69,0,0.8)]' : 'text-[#848e9c] hover:text-white'}`}
              >
                <PlusCircle className="w-4 h-4" /> Post ID
              </button>
              
              {user.role === 'admin' && (
                <button 
                  onClick={() => setView('admin')}
                  className={`transition-colors flex items-center gap-1.5 ${currentView === 'admin' ? 'text-[#FF4500] drop-shadow-[0_0_5px_rgba(255,69,0,0.8)]' : 'text-[#848e9c] hover:text-white'}`}
                >
                  <ShieldAlert className="w-4 h-4" /> Admin Panel
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#121826] border border-[#2b3139] rounded-lg">
              <span className="text-[#848e9c] text-xs font-bold uppercase">Balance</span>
              <span className="text-white font-mono text-sm font-medium">
                ₹{user.balance.toLocaleString('en-IN')}
              </span>
            </div>
            
            <div className="flex items-center gap-3 border-l border-[#2b3139] pl-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-white">{user.name}</span>
                <div className="flex items-center gap-1 justify-end">
                  {user.verified ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" />
                  )}
                  <span className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">
                    {user.role === 'admin' ? 'Admin' : `${user.tradesCompleted} Trades`}
                  </span>
                </div>
              </div>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br border flex items-center justify-center font-bold text-white uppercase text-lg shadow-inner ${user.role === 'admin' ? 'from-[#FF4500]/20 to-[#ff2a00]/40 border-[#FF4500]/50' : 'from-[#2b3139] to-[#121826] border-[#3b414a]'}`}>
                {user.name.charAt(0)}
              </div>
              <button 
                onClick={onLogout}
                className="ml-2 p-2 text-[#848e9c] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex gap-3">
             <button 
                onClick={() => setView('login')}
                className="text-white font-bold text-sm hover:text-[#00FFFF] transition-colors drop-shadow-[0_0_5px_rgba(0,255,255,0)] hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]"
              >
                Log In
             </button>
             <button 
                onClick={() => setView('register')}
                className="bg-gradient-to-r from-[#00FFFF] to-[#00cccc] hover:from-[#FF4500] hover:to-[#ff2a00] text-black hover:text-white font-black py-1.5 px-4 rounded text-sm transition-all shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_15px_rgba(255,69,0,0.6)] uppercase tracking-tight"
              >
                Register
             </button>
          </div>
        )}
      </div>
    </nav>
  );
}
