import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Marketplace } from './components/Marketplace';
import { Dashboard } from './components/Dashboard';
import { TradeRoom } from './components/TradeRoom';
import { Home } from './components/Home';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { AdminPanel } from './components/AdminPanel';
import { PostListing } from './components/PostListing';
import { User, Trade } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'market' | 'login' | 'register' | 'dashboard' | 'trade' | 'admin' | 'post'>(
    (localStorage.getItem('view') as any) || 'home'
  );
  const [activeTradeId, setActiveTradeId] = useState<string | null>(localStorage.getItem('activeTradeId'));

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('view', view);
  }, [view]);

  useEffect(() => {
    if (activeTradeId) localStorage.setItem('activeTradeId', activeTradeId);
    else localStorage.removeItem('activeTradeId');
  }, [activeTradeId]);

  // Fetch current user details
  const fetchUser = () => {
    if (!token) {
      setUser(null);
      return;
    }
    fetch('/api/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(setUser)
      .catch((err) => {
        console.error(err);
        handleLogout();
      });
  };

  useEffect(() => {
    fetchUser();
    // Setting up polling for user balance updates
    const interval = setInterval(fetchUser, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setView('dashboard');
  };

  const handleLogout = async () => {
    if (token) {
      fetch('/api/logout', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(console.error);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setView('home');
  };

  const handleStartTrade = async (listingId: string) => {
    if (!token) {
      setView('login');
      return;
    }
    
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ listingId })
      });
      const trade: Trade | { error: string } = await res.json();
      
      if ('error' in trade) {
        alert("Action failed: " + trade.error);
        return;
      }
      setActiveTradeId(trade.id);
      setView('trade');
      fetchUser(); // Refetch balance
    } catch (e) {
      console.error(e);
      alert("Failed to start trade.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b101a] text-white selection:bg-[#FF9900] selection:text-black scroll-smooth font-sans pb-20 md:pb-0">
      <Navigation currentView={view} setView={setView} user={user} onLogout={handleLogout} />
      
      <main>
        {view === 'home' && (
           <Home onNavigate={setView} />
        )}

        {view === 'login' && (
           <Login onLoginSuccess={handleLoginSuccess} onNavigate={setView} />
        )}

        {view === 'register' && (
           <Register onLoginSuccess={handleLoginSuccess} onNavigate={setView} />
        )}

        {view === 'market' && (
          <Marketplace onStartTrade={handleStartTrade} user={user} />
        )}
        
        {view === 'dashboard' && user && (
          <Dashboard 
            user={user} 
            token={token!}
            onOpenTrade={(id) => {
              setActiveTradeId(id);
              setView('trade');
            }} 
            onUserUpdate={setUser}
          />
        )}
        
        {view === 'trade' && activeTradeId && user && token && (
          <TradeRoom 
            tradeId={activeTradeId} 
            user={user}
            token={token}
            onClose={() => setView(user.role === 'admin' ? 'admin' : 'dashboard')}
          />
        )}

        {view === 'admin' && user?.role === 'admin' && token && (
           <AdminPanel 
             token={token}
             onOpenTrade={(id) => {
               setActiveTradeId(id);
               setView('trade');
             }}
             onBack={() => setView('market')}
           />
        )}

        {view === 'post' && user && token && (
           <PostListing 
             token={token} 
             onSuccess={() => setView('market')} 
             onBack={() => setView('market')}
           />
        )}
      </main>
    </div>
  );
}
