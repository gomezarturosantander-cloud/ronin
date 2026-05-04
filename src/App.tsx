import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Orders } from './components/Orders';
import { Customers } from './components/Customers';
import { Inventory } from './components/Inventory';
import { Suppliers } from './components/Suppliers';
import { LogIn, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'orders' | 'customers' | 'inventory' | 'suppliers';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-ronin-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ronin-gold"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-ronin-bg p-4 overflow-hidden relative">
        {/* Background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ronin-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full ronin-card p-10 text-center relative z-10"
        >
          <img 
            src="artifact://ronin_logo_full.jpg" 
            className="w-48 mx-auto mb-8 grayscale hover:grayscale-0 transition-all duration-700" 
            alt="Ronin Logo" 
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-ronin-gold/10 rounded-full mb-6">
            <ShieldCheck size={14} className="text-ronin-gold" />
            <span className="text-[10px] font-bold text-ronin-gold uppercase tracking-[0.2em]">Enterprise Terminal</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-100 mb-2 tracking-tight">RONIN</h1>
          <p className="text-slate-500 mb-10 text-sm">Panel de Control Estratégico</p>
          <button
            onClick={handleLogin}
            className="ronin-btn-primary w-full group"
          >
            <span className="mr-2">Autenticar con Google</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.div>
          </button>
        </motion.div>
        <p className="text-slate-700 text-[10px] mt-8 uppercase tracking-[0.3em]">Built for the modern warrior</p>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'orders': return <Orders />;
      case 'customers': return <Customers />;
      case 'inventory': return <Inventory />;
      case 'suppliers': return <Suppliers />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView} user={user}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
