import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, Product, OrderStatus } from '../types';
import { ShoppingBag, TrendingUp, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    activeOrders: 0,
    completedOrders: 0,
    lowStock: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const productsRef = collection(db, 'products');

    const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      
      const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const active = orders.filter(o => o.status !== OrderStatus.DELIVERED).length;
      const completed = orders.filter(o => o.status === OrderStatus.DELIVERED).length;

      setStats(prev => ({ ...prev, totalSales, activeOrders: active, completedOrders: completed }));
      
      // Process chart data (count by day)
      const dailySales: Record<string, number> = {};
      orders.forEach(order => {
        const date = new Date(order.orderDate).toLocaleDateString();
        dailySales[date] = (dailySales[date] || 0) + order.totalAmount;
      });
      
      setChartData(Object.entries(dailySales).map(([date, amount]) => ({ date, amount })).slice(-7));
    });

    const unsubProducts = onSnapshot(productsRef, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      const low = products.filter(p => p.stock <= (p.minStockThreshold || 5)).length;
      setStats(prev => ({ ...prev, lowStock: low }));
      setLoading(false);
    });

    return () => { unsubOrders(); unsubProducts(); };
  }, []);

  const statCards = [
    { label: 'Ingresos Totales', value: formatCurrency(stats.totalSales), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Órdenes Activas', value: stats.activeOrders, icon: ShoppingBag, color: 'text-ronin-gold', bg: 'bg-ronin-gold/10' },
    { label: 'Completadas', value: stats.completedOrders, icon: CheckCircle2, color: 'text-slate-400', bg: 'bg-slate-400/10' },
    { label: 'Stock Crítico', value: stats.lowStock, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ];

  if (loading) return <div className="text-slate-500 animate-pulse">Cargando inteligencia de mercado...</div>;

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-[2px] w-8 bg-ronin-gold" />
          <span className="text-[10px] font-bold tracking-[0.3em] text-ronin-gold uppercase">Operational Status</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-100 tracking-tight">RONIN TERMINAL</h1>
        <p className="text-slate-500 text-sm mt-1">Monitoreo en tiempo real de operaciones de manufactura y ventas.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="ronin-card p-8 border-l-4 border-l-ronin-gold/20 hover:border-l-ronin-gold transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={stat.bg + " p-3 rounded-xl border border-white/5 shadow-inner"}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-100 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="ronin-card p-10 bg-ronin-card/50 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Proyección de Ingresos</h2>
            <p className="text-slate-500 text-xs mt-1">Análisis de los últimos 7 ciclos diarios</p>
          </div>
          <select className="bg-ronin-bg border border-ronin-border rounded-lg text-[10px] font-bold uppercase tracking-widest px-4 py-2 text-ronin-gold focus:ring-1 focus:ring-ronin-gold outline-hidden">
            <option>Standard Range (7d)</option>
            <option>Extended Range (30d)</option>
          </select>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c5a059" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#c5a059" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#212835" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151921', borderRadius: '12px', border: '1px solid #212835', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                itemStyle={{ color: '#c5a059', fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Area type="monotone" dataKey="amount" stroke="#c5a059" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
