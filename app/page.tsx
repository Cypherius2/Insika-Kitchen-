'use client';

import React from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  History,
  Bell,
  Loader2,
  Cpu,
  Layers,
  Globe
} from 'lucide-react';
import { Shell } from '@/components/Shell';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const DAILY_SALES_DATA = [
  { time: '06:00', sales: 450 },
  { time: '08:00', sales: 1200 },
  { time: '10:00', sales: 1800 },
  { time: '12:00', sales: 2400 },
  { time: '14:00', sales: 1600 },
  { time: '16:00', sales: 900 },
  { time: '18:00', sales: 1100 },
  { time: '20:00', sales: 600 },
];

const MONTHLY_REVENUE_DATA = [
  { month: 'Jan', revenue: 18400 },
  { month: 'Feb', revenue: 21000 },
  { month: 'Mar', revenue: 19500 },
  { month: 'Apr', revenue: 24000 },
  { month: 'May', revenue: 28500 },
  { month: 'Jun', revenue: 32000 },
];

function StatCard({ title, value, change, isPositive, icon: Icon, color, subtext }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-4 rounded-2xl flex items-center justify-center transition-colors shadow-sm", color)}>
          <Icon size={24} />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black",
            isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
        {subtext && <p className="text-[10px] font-bold text-gray-400 mt-2">{subtext}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, signIn, profile } = useAuth();
  const [stats, setStats] = React.useState({
    revenue: 0,
    transactions: 0,
    inventory: 0,
    customers: 0,
    revenueChange: 12.5,
    transactionsChange: 5.2,
    inventoryChange: -2.1,
    customersChange: 8.4
  });
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [topProducts, setTopProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!profile) return;

    let unsubscribeTransactions = () => {};
    
    if (profile.role === 'admin') {
      unsubscribeTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
        const docs = snapshot.docs.map(d => d.data());
        const totalRevenue = docs
          .filter(d => (d.type === 'INVOICE' || d.type === 'invoice') && (d.status === 'PAID' || d.status === 'COMPLETED'))
          .reduce((acc, d) => acc + (d.total || 0), 0);
        
        setStats(prev => ({
          ...prev,
          revenue: totalRevenue,
          transactions: docs.length,
        }));

        const sorted = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 5);
        setRecentActivity(sorted);
      }, (error) => {
        console.error("Dashboard transactions error:", error);
      });
    }

    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalStock = products.reduce((acc, d: any) => acc + (d.stock || 0), 0);
      setStats(prev => ({
        ...prev,
        inventory: totalStock,
      }));
      
      // Mocking top products from catalog
      setTopProducts(products.slice(0, 4).map((p: any) => ({
        name: p.name,
        sold: Math.floor(Math.random() * 100) + 50,
        price: p.price
      })).sort((a, b) => b.sold - a.sold));
    });

    const unsubscribeCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setStats(prev => ({
        ...prev,
        customers: snapshot.size,
      }));
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, [profile]);

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00a2ff]/20 rounded-full blur-[120px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00e5ff]/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6">
           <div className="mb-12 p-8 bg-white/5 rounded-[3rem] border border-white/10 shadow-2xl backdrop-blur-xl">
              <div className="p-1.5 bg-[#00a2ff]/10 rounded-[2.2rem] border border-[#00a2ff]/20">
                <div className="bg-[#00a2ff] p-8 rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,162,255,0.3)]">
                  <Cpu size={48} className="text-white" />
                </div>
              </div>
           </div>
           
           <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none">
             MiraTech <span className="text-[#00a2ff]">Industries</span>
           </h1>
           <p className="text-white/40 font-medium text-lg max-w-md mb-12">
             Industrial-grade management protocol. Secure node authentication required.
           </p>

           <button 
             onClick={signIn}
             className="group relative px-12 py-5 bg-[#00a2ff] text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl overflow-hidden transition-all hover:shadow-[0_20px_40px_rgba(0,162,255,0.3)] active:scale-95"
           >
             <span className="relative z-10 flex items-center gap-3">
               Unlock Terminal
               <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </span>
             <div className="absolute inset-0 bg-gradient-to-r from-[#00e5ff] to-[#0072ff] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
           </button>
        </div>
      </div>
    );
  }

  return (
    <Shell>
      <div className="p-10 space-y-10 max-w-[1600px] mx-auto">
        <header className="flex flex-col gap-2">
           <div className="flex items-center gap-3 text-[#00a2ff]">
              <Globe size={16} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">MiraTech Management • Global Hub</p>
           </div>
           <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Command Center</h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard 
            title="Net Liquidity" 
            value={`$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            change={stats.revenueChange} 
            isPositive={true} 
            icon={TrendingUp} 
            color="bg-blue-50 text-[#00a2ff]"
            subtext="Vs. Previous Period"
          />
          <StatCard 
            title="Active Requests" 
            value={stats.transactions.toLocaleString()} 
            change={stats.transactionsChange} 
            isPositive={true} 
            icon={ShoppingCart} 
            color="bg-blue-50 text-[#00a2ff]"
            subtext="Node traffic status"
          />
          <StatCard 
            title="Asset Inventory" 
            value={`${stats.inventory.toLocaleString()} Units`} 
            change={stats.inventoryChange} 
            isPositive={false} 
            icon={Package} 
            color="bg-blue-50 text-[#00a2ff]"
            subtext="Hardware resources"
          />
          <StatCard 
            title="Network Nodes" 
            value={stats.customers.toLocaleString()} 
            change={stats.customersChange} 
            isPositive={true} 
            icon={Users} 
            color="bg-blue-50 text-[#00a2ff]"
            subtext="Connected entities"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Daily Sales Chart */}
           <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                      Data Throughput
                      <Activity size={20} className="text-[#00a2ff] animate-pulse" />
                    </h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time system processing</p>
                 </div>
                 <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <button className="px-4 py-2 bg-white text-[10px] font-black uppercase tracking-widest text-[#00a2ff] rounded-lg shadow-sm border border-gray-100">Live</button>
                    <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Weekly</button>
                 </div>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DAILY_SALES_DATA}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00a2ff" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#00a2ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0a0a0a', 
                        border: 'none', 
                        borderRadius: '1rem', 
                        color: 'white',
                        fontWeight: 900,
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: '#00a2ff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#00a2ff" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Top Selling Products */}
           <div className="lg:col-span-4 bg-[#0a0a0a] p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#00a2ff]/10 rounded-full blur-[80px]" />
              
              <div className="relative z-10 h-full flex flex-col">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                       <Layers size={20} className="text-[#00a2ff]" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black tracking-tight">Top performing Assets</h3>
                       <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Inventory Matrix</p>
                    </div>
                 </div>

                 <div className="space-y-6 flex-1">
                    {topProducts.map((product, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-default">
                         <div className="flex items-center gap-4">
                            <span className="text-2xl font-black text-white/5">{i + 1}</span>
                            <div>
                               <p className="text-sm font-black tracking-tight">{product.name}</p>
                               <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{product.sold} cycles</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-[#00a2ff]">${product.price.toFixed(2)}</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="mt-10 p-6 rounded-3xl bg-white/5 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/20">System Load</span>
                       <span className="text-sm font-black text-[#00a2ff]">94%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full w-[94%] bg-[#00a2ff] rounded-full" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Monthly Revenue Chart */}
           <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                      Revenue History
                      <Layers size={20} className="text-[#00a2ff]" />
                    </h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Industrial growth trajectory</p>
                 </div>
                 <div className="text-right">
                    <p className="text-3xl font-black text-gray-900">$153.4K</p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">+24% YoY Growth</p>
                 </div>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_REVENUE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                      tickFormatter={(value) => `$${value/1000}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                      contentStyle={{ 
                        backgroundColor: '#0a0a0a', 
                        border: 'none', 
                        borderRadius: '1rem', 
                        color: 'white',
                        fontWeight: 900,
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                      {MONTHLY_REVENUE_DATA.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === MONTHLY_REVENUE_DATA.length - 1 ? '#00a2ff' : '#cbd5e1'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Latest Activity */}
           <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#00a2ff] flex items-center justify-center">
                       <History size={18} />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Activity</h3>
                 </div>
                 <Link href="/pos" className="text-[10px] font-black uppercase tracking-widest text-[#00a2ff] hover:underline">New Request</Link>
              </div>
              
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="p-10 text-center opacity-20 border-2 border-dashed border-gray-100 rounded-3xl">
                     <p className="text-[10px] font-black uppercase tracking-widest">No Recent Operations</p>
                  </div>
                ) : recentActivity.map((doc: any) => (
                  <div key={doc.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                           <Activity size={16} className="text-[#00a2ff]" />
                        </div>
                        <div>
                           <p className="text-xs font-black text-gray-900">{doc.customerName || 'Standard User'}</p>
                           <p className="text-[9px] font-bold text-gray-400 tracking-widest">{doc.type}</p>
                        </div>
                     </div>
                     <p className="text-xs font-black text-[#00a2ff]">${(doc.total || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <button className="w-full mt-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 border border-gray-100 rounded-2xl hover:bg-[#00a2ff] hover:text-white hover:border-[#00a2ff] transition-all">
                 View All Journals
              </button>
           </div>
        </div>
      </div>
    </Shell>
  );
}
