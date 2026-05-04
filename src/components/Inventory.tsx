import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { Package, Plus, Search, AlertTriangle, Edit2, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: 0, stock: 0, minStockThreshold: 5 });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'products'), orderBy('name', 'asc')), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return unsub;
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        createdAt: new Date().toISOString()
      });
      setNewProduct({ name: '', category: '', price: 0, stock: 0, minStockThreshold: 5 });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding product", error);
    }
  };

  const updateStock = async (id: string, currentStock: number, delta: number) => {
    await updateDoc(doc(db, 'products', id), {
      stock: Math.max(0, currentStock + delta)
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Bóveda de Stock</h1>
          <p className="text-slate-500 text-sm">Control crítico de activos y materias primas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="ronin-btn-primary"
        >
          <Plus size={20} />
          <span>Ingreso de Stock</span>
        </button>
      </div>

      {/* Low Stock Alerts */}
      {products.some(p => p.stock <= p.minStockThreshold) && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl flex items-center gap-4 text-rose-400">
          <AlertTriangle className="text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]" size={28} />
          <div>
            <p className="font-bold uppercase tracking-widest text-xs">Atención: Anomalía de Inventario</p>
            <p className="text-sm opacity-80 mt-0.5">Se detectaron {products.filter(p => p.stock <= p.minStockThreshold).length} unidades por debajo del umbral mínimo de seguridad.</p>
          </div>
        </div>
      )}

      <div className="ronin-card overflow-hidden">
        <div className="p-6 border-b border-ronin-border bg-white/5 flex flex-col md:flex-row gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Escanear catálogo..." 
              className="ronin-input w-full pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-ronin-border text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
              <th className="px-8 py-6 font-semibold">Criptografía / Item</th>
              <th className="px-8 py-6 font-semibold">Categoría</th>
              <th className="px-8 py-6 font-semibold">Valor Unitario</th>
              <th className="px-8 py-6 font-semibold">Disponibilidad</th>
              <th className="px-8 py-6 font-semibold text-right">Mantenimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ronin-border">
            {filteredProducts.map((product) => {
              const isLow = product.stock <= product.minStockThreshold;
              return (
                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-black border transition-all", 
                        isLow ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-ronin-gold/10 text-ronin-gold border-ronin-gold/20")}>
                        {product.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-100 italic transition-all group-hover:text-ronin-gold">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{product.category}</span>
                  </td>
                  <td className="px-8 py-6 font-mono text-sm text-ronin-gold">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateStock(product.id, product.stock, -1)}
                          className="p-1.5 bg-ronin-bg border border-ronin-border hover:border-ronin-gold rounded-lg text-slate-500 transition-colors"
                        ><ArrowDownRight size={14} /></button>
                        <span className={cn("inline-flex items-center justify-center w-12 py-2 rounded-lg text-xs font-black border transition-all",
                          isLow ? "bg-rose-500/10 text-rose-500 border-rose-500/30" : "bg-ronin-bg text-emerald-400 border-emerald-400/20")}>
                          {product.stock}
                        </span>
                        <button 
                          onClick={() => updateStock(product.id, product.stock, 1)}
                          className="p-1.5 bg-ronin-bg border border-ronin-border hover:border-ronin-gold rounded-lg text-slate-500 transition-all"
                        ><ArrowUpRight size={14} /></button>
                      </div>
                      {isLow && <p className="text-[9px] font-black text-rose-500 italic uppercase tracking-tighter animate-pulse">Critical!</p>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-600 hover:text-ronin-gold transition-colors"><Edit2 size={16} /></button>
                      <button 
                        onClick={() => deleteDoc(doc(db, 'products', product.id))}
                        className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                      ><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="py-28 text-center bg-ronin-card/20">
            <Package className="mx-auto text-ronin-border mb-6" size={64} />
            <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[10px]">Depósito Vacío</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="ronin-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-ronin-border flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Nuevo Activo</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-ronin-gold transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-ronin-gold uppercase tracking-widest mb-2">Denominación</label>
                <input 
                  type="text" 
                  className="ronin-input w-full"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Ej: Remera Ronin Ghost"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-ronin-gold uppercase tracking-widest mb-2">Clasificación</label>
                  <input 
                    type="text" 
                    className="ronin-input w-full"
                    placeholder="Ej: Apparel"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-ronin-gold uppercase tracking-widest mb-2">Precio de Entrada</label>
                  <input 
                    type="number" 
                    className="ronin-input w-full"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-ronin-gold uppercase tracking-widest mb-2">Volumen Inicial</label>
                  <input 
                    type="number" 
                    className="ronin-input w-full"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-ronin-gold uppercase tracking-widest mb-2">Nivel de Alerta</label>
                  <input 
                    type="number" 
                    className="ronin-input w-full"
                    value={newProduct.minStockThreshold}
                    onChange={(e) => setNewProduct({...newProduct, minStockThreshold: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 ronin-btn-secondary">Cancelar</button>
                <button type="submit" className="flex-1 ronin-btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>; }
