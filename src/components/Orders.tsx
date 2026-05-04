import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus, OrderType, Customer, Product } from '../types';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, ChevronRight, Palette, Hammer, Box, Truck, Check, ShoppingBag } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  // New Order Form State
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    type: OrderType.NORMAL,
    notes: '',
    items: [] as any[],
  });

  useEffect(() => {
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('orderDate', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    return () => { unsubOrders(); unsubCustomers(); unsubProducts(); };
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === newOrder.customerId);
    if (!customer) return;

    const orderData = {
      ...newOrder,
      customerName: customer.name,
      status: newOrder.type === OrderType.CUSTOM ? OrderStatus.DESIGN : OrderStatus.NEW,
      orderDate: new Date().toISOString(),
      lastStatusUpdate: new Date().toISOString(),
      totalAmount: 0, // In a real app, calculate from items
      estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      setIsModalOpen(false);
      setNewOrder({ customerId: '', type: OrderType.NORMAL, notes: '', items: [] });
    } catch (error) {
      console.error("Error creating order", error);
    }
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        lastStatusUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW: return <ShoppingBag size={18} />;
      case OrderStatus.DESIGN: return <Palette size={18} />;
      case OrderStatus.PRODUCTION: return <Hammer size={18} />;
      case OrderStatus.READY: return <Box size={18} />;
      case OrderStatus.DELIVERED: return <Check size={18} />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.NEW: return "bg-gray-100 text-gray-600";
      case OrderStatus.DESIGN: return "bg-purple-100 text-purple-600";
      case OrderStatus.PRODUCTION: return "bg-orange-100 text-orange-600";
      case OrderStatus.READY: return "bg-blue-100 text-blue-600";
      case OrderStatus.DELIVERED: return "bg-green-100 text-green-600";
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Gestión de Órdenes</h1>
          <p className="text-slate-500 text-sm">Registro centralizado de producción y entregas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="ronin-btn-primary"
        >
          <Plus size={20} />
          <span>Nueva Orden</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 ronin-card p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Filtrar por cliente..." 
            className="ronin-input w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter size={18} className="text-ronin-gold mr-2" />
          {(['ALL', ...Object.values(OrderStatus)] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "whitespace-nowrap px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all",
                statusFilter === status 
                  ? "bg-ronin-gold text-ronin-bg shadow-lg shadow-ronin-gold/20" 
                  : "bg-ronin-bg text-slate-500 hover:text-slate-300 border border-ronin-border"
              )}
            >
              {status === 'ALL' ? 'Todos' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="ronin-card overflow-hidden group hover:border-ronin-gold/30 transition-all">
            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                {/* Order Identity */}
                <div className="flex items-center gap-6">
                  <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center border border-white/5 shadow-inner", getStatusColor(order.status))}>
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{order.customerName}</h3>
                    <p className="text-[10px] text-ronin-gold font-bold tracking-[0.2em] mt-0.5">ORD-#{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                {/* Status Pills */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn("px-3 py-1 rounded-md text-[9px] font-black tracking-[0.1em] uppercase border", 
                    order.type === OrderType.CUSTOM ? "bg-amber-400/5 text-amber-400 border-amber-400/20" : "bg-blue-400/5 text-blue-400 border-blue-400/20")}>
                    {order.type === OrderType.CUSTOM ? 'Custom' : 'Stock'}
                  </span>
                  <div className="h-4 w-[1px] bg-ronin-border mx-2 hidden lg:block" />
                  <div className="flex items-center gap-2">
                    {Object.values(OrderStatus).map((status) => {
                      const isCurrent = order.status === status;
                      const isPast = Object.values(OrderStatus).indexOf(order.status) > Object.values(OrderStatus).indexOf(status);
                      return (
                        <button
                          key={status}
                          onClick={() => updateStatus(order.id, status)}
                          title={status}
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center transition-all border",
                            isCurrent ? "bg-ronin-gold border-ronin-gold shadow-lg shadow-ronin-gold/30 text-ronin-bg scale-110" : 
                            isPast ? "bg-ronin-gold/10 border-ronin-gold/20 text-ronin-gold" : "bg-ronin-bg border-ronin-border text-slate-600 hover:text-slate-400"
                          )}
                        >
                          {getStatusIcon(status)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-10 flex-1">
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-100 italic">{formatCurrency(order.totalAmount || 0)}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      ETD: {format(new Date(order.estimatedDeliveryDate), 'dd MMM', { locale: es })}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-ronin-border rounded-lg text-slate-600 hover:text-slate-100 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Progress Line */}
              <div className="mt-8 h-1 w-full bg-ronin-border rounded-full relative overflow-hidden">
                <div 
                  className="absolute h-full bg-ronin-gold shadow-[0_0_10px_#c5a059] transition-all duration-700 ease-out"
                  style={{ width: `${(Object.values(OrderStatus).indexOf(order.status) + 1) / Object.values(OrderStatus).length * 100}%` }}
                />
              </div>
            </div>
            
            {order.notes && (
              <div className="px-8 py-3 bg-ronin-bg/30 border-t border-ronin-border text-[11px] text-slate-500 italic flex items-center gap-3">
                <Palette size={14} className="text-ronin-gold" />
                <span className="opacity-80">Logística: {order.notes}</span>
              </div>
            )}
          </div>
        ))}
        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-24 ronin-card border-dashed">
            <ShoppingBag className="mx-auto text-ronin-border mb-4" size={56} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sin registros encontrados</p>
          </div>
        )}
      </div>

      {/* Modal Re-styled */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="ronin-card w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-ronin-border flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-100">Nueva Operación</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-ronin-gold transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateOrder} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-ronin-gold uppercase tracking-widest mb-2">Cliente Destino</label>
                <select 
                  className="ronin-input w-full"
                  value={newOrder.customerId}
                  onChange={(e) => setNewOrder({...newOrder, customerId: e.target.value})}
                  required
                >
                  <option value="">Seleccionar de la base...</option>
                  {customers.map(c => <option key={c.id} value={c.id} className="bg-ronin-card">{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-ronin-gold uppercase tracking-widest mb-2">Protocolo</label>
                  <select 
                    className="ronin-input w-full"
                    value={newOrder.type}
                    onChange={(e) => setNewOrder({...newOrder, type: e.target.value as OrderType})}
                  >
                    <option value={OrderType.NORMAL} className="bg-ronin-card">Venta Standard</option>
                    <option value={OrderType.CUSTOM} className="bg-ronin-card">Manufactura Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ronin-gold uppercase tracking-widest mb-2">Presupuesto</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="ronin-input w-full" 
                    onChange={(e) => setOrders(prev => prev)} // Placeholder mapping
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-ronin-gold uppercase tracking-widest mb-2">Instrucciones Operativas</label>
                <textarea 
                  className="ronin-input w-full h-28 resize-none"
                  placeholder="Detalles técnicos, talles, colores..."
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 ronin-btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 ronin-btn-primary"
                >
                  Finalizar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>; }
