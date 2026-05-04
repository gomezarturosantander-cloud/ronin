import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Supplier } from '../types';
import { Truck, Search, Phone, Mail, User, Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contactName: '', phone: '', email: '', category: '' });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'suppliers'), orderBy('name', 'asc')), (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    });
    return unsub;
  }, []);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'suppliers'), {
        ...newSupplier,
        createdAt: new Date().toISOString()
      });
      setNewSupplier({ name: '', contactName: '', phone: '', email: '', category: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding supplier", error);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Proveedores</h1>
          <p className="text-slate-500 text-sm">Gestiona tus fuentes de materia prima y productos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="ronin-btn-primary"
        >
          <Plus size={20} />
          <span>Agregar Proveedor</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Buscar proveedores..." 
          className="ronin-input w-full pl-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredSuppliers.map((supplier, i) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="ronin-card p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-ronin-gold/10 rounded-xl flex items-center justify-center text-ronin-gold">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">{supplier.name}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-ronin-gold font-bold">{supplier.category}</span>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <User size={14} className="text-ronin-gold/60" />
                  <span>{supplier.contactName || 'Sin contacto'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Phone size={14} className="text-ronin-gold/60" />
                  <span>{supplier.phone}</span>
                </div>
                {supplier.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <Mail size={14} className="text-ronin-gold/60" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-ronin-border flex justify-end">
                <button 
                  onClick={() => deleteDoc(doc(db, 'suppliers', supplier.id))}
                  className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="ronin-card w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-ronin-border flex items-center justify-between bg-ronin-card">
              <h2 className="text-xl font-bold text-slate-100">Nuevo Proveedor</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ronin-gold uppercase tracking-widest mb-2">Nombre de Empresa</label>
                <input 
                  type="text" 
                  className="ronin-input w-full"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ronin-gold uppercase tracking-widest mb-2">Categoría</label>
                  <input 
                    type="text" 
                    className="ronin-input w-full"
                    placeholder="Ej: Textiles"
                    value={newSupplier.category}
                    onChange={(e) => setNewSupplier({...newSupplier, category: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ronin-gold uppercase tracking-widest mb-2">Contacto</label>
                  <input 
                    type="text" 
                    className="ronin-input w-full"
                    value={newSupplier.contactName}
                    onChange={(e) => setNewSupplier({...newSupplier, contactName: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ronin-gold uppercase tracking-widest mb-2">Teléfono</label>
                  <input 
                    type="tel" 
                    className="ronin-input w-full"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ronin-gold uppercase tracking-widest mb-2">Email</label>
                  <input 
                    type="email" 
                    className="ronin-input w-full"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 ronin-btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 ronin-btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
