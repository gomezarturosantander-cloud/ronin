import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types';
import { UserPlus, Search, Phone, Instagram, Mail, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', instagram: '', email: '' });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'customers'), orderBy('name', 'asc')), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });
    return unsub;
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'customers'), {
        ...newCustomer,
        createdAt: new Date().toISOString()
      });
      setNewCustomer({ name: '', phone: '', instagram: '', email: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding customer", error);
    }
  };

  const deleteCustomer = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      await deleteDoc(doc(db, 'customers', id));
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Inteligencia de Clientes</h1>
          <p className="text-slate-500 text-sm">Registro histórico y canales de contacto.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="ronin-btn-primary"
        >
          <UserPlus size={20} />
          <span>Registrar Perfil</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Rastrear por identidad o contacto..." 
          className="ronin-input w-full pl-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCustomers.map((customer, i) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="ronin-card p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-ronin-gold/5 blur-2xl -z-10 group-hover:bg-ronin-gold/10 transition-colors" />
              
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-ronin-gold/10 border border-ronin-gold/20 rounded-2xl flex items-center justify-center text-ronin-gold font-black text-2xl shadow-inner">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{customer.name}</h3>
                  <p className="text-[10px] font-bold text-ronin-gold tracking-widest uppercase mt-1">Activo desde {new Date(customer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-slate-400 group/item">
                  <div className="w-8 h-8 rounded-lg bg-ronin-bg border border-ronin-border flex items-center justify-center group-hover/item:border-ronin-gold/50 transition-colors">
                    <Phone size={14} className="text-ronin-gold/70" />
                  </div>
                  <span className="font-medium">{customer.phone}</span>
                </div>
                {customer.instagram && (
                  <div className="flex items-center gap-4 text-sm text-slate-400 group/item">
                    <div className="w-8 h-8 rounded-lg bg-ronin-bg border border-ronin-border flex items-center justify-center group-hover/item:border-ronin-gold/50 transition-colors">
                      <Instagram size={14} className="text-ronin-gold/70" />
                    </div>
                    <span className="font-medium tracking-tight">@{customer.instagram}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-4 text-sm text-slate-400 group/item">
                    <div className="w-8 h-8 rounded-lg bg-ronin-bg border border-ronin-border flex items-center justify-center group-hover/item:border-ronin-gold/50 transition-colors">
                      <Mail size={14} className="text-ronin-gold/70" />
                    </div>
                    <span className="truncate font-medium">{customer.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-ronin-border flex items-center justify-between">
                <button className="text-ronin-gold text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity">
                  Log histórico <ExternalLink size={12} />
                </button>
                <button 
                  onClick={() => deleteCustomer(customer.id)}
                  className="p-2 text-slate-700 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="ronin-card w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-8">
            <div className="p-8 border-b border-ronin-border flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-100 italic">Alta de Perfil</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-ronin-gold transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-ronin-gold uppercase tracking-[0.2em] mb-2">Identidad Legal/Comercial</label>
                <input 
                  type="text" 
                  className="ronin-input w-full"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  required 
                  placeholder="Nombre y Apellido"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-ronin-gold uppercase tracking-[0.2em] mb-2">Línea de Contacto</label>
                <input 
                  type="tel" 
                  className="ronin-input w-full"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  required 
                  placeholder="+54 9..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-ronin-gold uppercase tracking-[0.2em] mb-2">ID Social</label>
                  <input 
                    type="text" 
                    className="ronin-input w-full"
                    placeholder="@usuario"
                    value={newCustomer.instagram}
                    onChange={(e) => setNewCustomer({...newCustomer, instagram: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-ronin-gold uppercase tracking-[0.2em] mb-2">Email</label>
                  <input 
                    type="email" 
                    className="ronin-input w-full"
                    placeholder="mail@host.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 ronin-btn-secondary">Abortar</button>
                <button type="submit" className="flex-1 ronin-btn-primary">Sincronizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>; }
