import React from 'react';
import { LayoutDashboard, ShoppingBag, Users, Package, LogOut, Menu, X, Truck } from 'lucide-react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
  user: User;
}

export function Layout({ children, currentView, setView, user }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Panel Control', icon: LayoutDashboard },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
  ];

  return (
    <div className="flex h-screen bg-ronin-bg overflow-hidden text-slate-300">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-ronin-card border-r border-ronin-border transition-all duration-300 flex flex-col z-30",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <img src="artifact://ronin_logo_full.jpg" className="w-10 h-10 object-contain" alt="L" />
              <span className="text-xl font-bold tracking-tighter text-slate-100">RONIN</span>
            </div>
          ) : (
            <img src="artifact://ronin_logo_full.jpg" className="w-10 h-10 object-contain" alt="L" />
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-ronin-border rounded-lg text-slate-500"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative",
                currentView === item.id 
                  ? "bg-ronin-gold/10 text-ronin-gold" 
                  : "text-slate-500 hover:bg-ronin-border hover:text-slate-100"
              )}
            >
              <item.icon size={20} className={cn(
                currentView === item.id ? "text-ronin-gold" : "text-slate-500 group-hover:text-slate-300"
              )} />
              {isSidebarOpen && <span className="font-semibold text-xs uppercase tracking-widest">{item.label}</span>}
              {currentView === item.id && (
                <div className="absolute left-0 w-1 h-6 bg-ronin-gold rounded-r-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-ronin-border">
          <div className="flex items-center gap-3 mb-4 p-2">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-10 h-10 rounded-xl border border-ronin-border shadow-md"
              alt={user.displayName || 'User'} 
            />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => signOut(auth)}
            className={cn(
              "w-full flex items-center gap-3 p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Desconectar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10 relative">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-ronin-gold/5 blur-[150px] -z-10" />
        
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
