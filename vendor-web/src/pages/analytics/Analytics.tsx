import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, ChevronDown, Activity, ShoppingBag, Printer, Users, DollarSign, Image, Scan, Book, FileCheck, Info, ArrowUpRight, Loader } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import styles from './Analytics.module.css';

const API_URL = `${API_BASE_URL}/api/orders/shop/`;
export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const timeRange = searchParams.get('timeRange') || 'Daily';
  const [allOrders, setAllOrders] = useState<any[]>([]);

  useEffect(() => {
    const handleExport = () => {
      if (!allOrders.length) return alert('No data to export for this time range.');
      
      const headers = ['Order ID', 'Date', 'Total Pages', 'Color Mode', 'Payment Amount', 'Status'];
      const rows = allOrders.map((o: any) => [
        o.order_id,
        new Date(o.submitted_at).toLocaleString().replace(/,/g, ''), // prevent CSV breaking
        o.page_count || 1,
        o.color_mode || 'N/A',
        o.payment_amount?.toFixed(2) || '0.00',
        o.status || 'N/A'
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `PrintEase_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    window.addEventListener('exportAnalytics', handleExport as EventListener);
    return () => window.removeEventListener('exportAnalytics', handleExport as EventListener);
  }, [allOrders, timeRange]);

  useEffect(() => {
    const shopId = localStorage.getItem('shop_id');
    if (!shopId) return;
    fetch(API_URL + shopId)
      .then(res => res.json())
      .then(orders => {
        const today = new Date();
        const pastDate = new Date(today);
        if (timeRange === 'Weekly') pastDate.setDate(today.getDate() - 7);
        if (timeRange === 'Monthly') pastDate.setMonth(today.getMonth() - 1);
        if (timeRange === 'Yearly') pastDate.setFullYear(today.getFullYear() - 1);

        const filteredOrders = timeRange === 'Daily' 
          ? orders.filter((o: any) => new Date(o.submitted_at).toDateString() === today.toDateString())
          : orders.filter((o: any) => new Date(o.submitted_at) >= pastDate);
          
        setAllOrders(filteredOrders);

        const totalOrders = filteredOrders.length;
        const pending = filteredOrders.filter((o: any) => o.status === 'Pending').length;
        const printing = filteredOrders.filter((o: any) => o.status === 'Printing').length;
        const ready = filteredOrders.filter((o: any) => o.status === 'Ready').length;
        const completed = filteredOrders.filter((o: any) => o.status === 'Collected').length;

        let totalRevenue = 0;
        let totalPrints = 0;
        
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const revByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0, Today: 0 };
        const todayStr = new Date().toDateString();
        
        let bwOrders = 0;
        let bwRev = 0;
        let colorOrders = 0;
        let colorRev = 0;

        let a4Count = 0;
        let a3Count = 0;
        let letterCount = 0;

        filteredOrders.forEach((o: any) => {
          const amt = o.payment_amount || 0;
          totalRevenue += amt;
          totalPrints += o.page_count || 1;

          if (o.submitted_at) {
            const date = new Date(o.submitted_at);
            const dayName = daysOfWeek[date.getDay()];
            revByDay[dayName as keyof typeof revByDay] += amt;
            if (date.toDateString() === today.toDateString()) {
              revByDay['Today'] += amt;
            }
          }

          if (o.color_mode === 'Black_and_White') {
            bwOrders++;
            bwRev += amt;
          } else if (o.color_mode === 'Colored') {
            colorOrders++;
            colorRev += amt;
          }

          const paper = o.paper_size?.toLowerCase();
          if (paper === 'a3') a3Count++;
          else if (paper === 'letter') letterCount++;
          else a4Count++; // default a4
        });

        const computedData = {
          summaryStats: {
            totalRevenue: `GHS ${totalRevenue.toFixed(2)}`,
            totalOrders,
            totalPrints,
            newCustomers: totalOrders > 0 ? 1 : 0, // approximation
            averageOrderValue: totalOrders > 0 ? `GHS ${(totalRevenue / totalOrders).toFixed(2)}` : 'GHS 0.00'
          },
          statusData: [
            { name: 'Pending', value: pending, color: '#f59e0b' },
            { name: 'Printing', value: printing, color: '#3b82f6' },
            { name: 'Ready', value: ready, color: '#10b981' },
            { name: 'Collected', value: completed, color: '#64748b' },
          ],
          revenueData: [
            { date: 'Mon', revenue: revByDay['Mon'] },
            { date: 'Tue', revenue: revByDay['Tue'] },
            { date: 'Wed', revenue: revByDay['Wed'] },
            { date: 'Thu', revenue: revByDay['Thu'] },
            { date: 'Fri', revenue: revByDay['Fri'] },
            { date: 'Sat', revenue: revByDay['Sat'] },
            { date: 'Today', revenue: revByDay['Today'] } 
          ],
          revenueByDayData: [
            { date: 'Mon', val: revByDay['Mon'] },
            { date: 'Tue', val: revByDay['Tue'] },
            { date: 'Wed', val: revByDay['Wed'] },
            { date: 'Thu', val: revByDay['Thu'] },
            { date: 'Fri', val: revByDay['Fri'] },
            { date: 'Sat', val: revByDay['Sat'] },
            { date: 'Today', val: revByDay['Today'] }
          ],
          servicesData: [
            { name: 'Black & White', revenue: `GHS ${bwRev.toFixed(2)}`, percent: totalRevenue ? (bwRev/totalRevenue)*100 : 0, color: '#475569', orders: bwOrders, icon: <Printer size={20} color="#475569" /> },
            { name: 'Color Print', revenue: `GHS ${colorRev.toFixed(2)}`, percent: totalRevenue ? (colorRev/totalRevenue)*100 : 0, color: '#3b82f6', orders: colorOrders, icon: <Image size={20} color="#3b82f6" /> },
          ],
          paperSizeData: [
            { name: 'A4 Size', value: a4Count, color: '#3b82f6' },
            { name: 'A3 Size', value: a3Count, color: '#6366f1' },
            { name: 'Letter', value: letterCount, color: '#0ea5e9' },
          ]
        };

        setData(computedData);
      })
      .catch(err => console.error("Failed to load analytics:", err));
  }, [timeRange]);

  if (!data) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px'}}><Loader className={styles.spinner} /> Loading Analytics...</div>;
  }

  return (
    <div className={styles.analyticsPage}>
      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIconBox} style={{ background: '#eff6ff' }}>
              <Activity size={24} color="#3b82f6" />
            </div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Revenue</span>
            <span className={styles.statValue}>{data.summaryStats.totalRevenue}</span>
            <div className={styles.statTrend}>
              <TrendingUp size={14} className={styles.trendUp} />
              <span className={styles.trendUp}>18.5%</span>
              <span className={styles.trendText}>vs May 9 - May 15</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIconBox} style={{ background: '#f0fdf4' }}>
              <ShoppingBag size={24} color="#22c55e" />
            </div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Orders</span>
            <span className={styles.statValue}>{data.summaryStats.totalOrders}</span>
            <div className={styles.statTrend}>
              <TrendingUp size={14} className={styles.trendUp} />
              <span className={styles.trendUp}>12.7%</span>
              <span className={styles.trendText}>vs May 9 - May 15</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIconBox} style={{ background: '#fffbeb' }}>
              <Printer size={24} color="#f59e0b" />
            </div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Prints</span>
            <span className={styles.statValue}>{data.summaryStats.totalPrints}</span>
            <div className={styles.statTrend}>
              <TrendingUp size={14} className={styles.trendUp} />
              <span className={styles.trendUp}>15.3%</span>
              <span className={styles.trendText}>vs May 9 - May 15</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIconBox} style={{ background: '#faf5ff' }}>
              <Users size={24} color="#a855f7" />
            </div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>New Customers</span>
            <span className={styles.statValue}>{data.summaryStats.newCustomers}</span>
            <div className={styles.statTrend}>
              <TrendingUp size={14} className={styles.trendUp} />
              <span className={styles.trendUp}>10.0%</span>
              <span className={styles.trendText}>vs May 9 - May 15</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIconBox} style={{ background: '#f0fdfa' }}>
              <DollarSign size={24} color="#14b8a6" />
            </div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Average Order Value</span>
            <span className={styles.statValue}>{data.summaryStats.averageOrderValue}</span>
            <div className={styles.statTrend}>
              <TrendingUp size={14} className={styles.trendUp} />
              <span className={styles.trendUp}>5.2%</span>
              <span className={styles.trendText}>vs May 9 - May 15</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Overview & Status */}
      <div className={styles.row2Col}>
        <div className={styles.wideCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Revenue Overview</span>
            <div className={styles.cardAction}>Daily <ChevronDown size={14} /></div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenueAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005CE6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#005CE6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `GHS ${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`GHS ${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#005CE6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenueAnalytics)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.narrowCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Orders by Status</span>
          </div>
          <div className={styles.donutContainer}>
            <div className={styles.donutChartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.donutCenter}>
                <div className={styles.donutCenterValue}>{data.summaryStats.totalOrders}</div>
                <div className={styles.donutCenterLabel}>Total Orders</div>
              </div>
            </div>
            
            <div className={styles.legendList}>
              {data.statusData.map((item: any, idx: number) => (
                <div key={idx} className={styles.legendItem}>
                  <div className={styles.legendLeft}>
                    <div className={styles.legendDot} style={{ background: item.color }}></div>
                    {item.name}
                  </div>
                  <div className={styles.legendRight}>
                    {item.value} ({(item.value / data.summaryStats.totalOrders * 100).toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Detail Charts */}
      <div className={styles.row3Col}>
        <div className={styles.narrowCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Revenue by Day</span>
            <div className={styles.cardAction}>Daily <ChevronDown size={14} /></div>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `GHS ${val}`} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="val" fill="#005CE6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.narrowCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Top Services</span>
            <span className={styles.viewAll}>View all</span>
          </div>
          <div className={styles.servicesList}>
            {data.servicesData.map((service: any, idx: number) => (
              <div key={idx} className={styles.serviceItem}>
                <div className={styles.serviceIcon}>{service.icon}</div>
                <div className={styles.serviceInfo}>
                  <div className={styles.serviceTitleRow}>
                    <strong>{service.name}</strong>
                    <strong>{service.revenue} <span style={{fontWeight: 400}}>({service.percent}%)</span></strong>
                  </div>
                  <div className={styles.serviceOrders}>{service.orders} orders</div>
                  <div className={styles.progressBarBg}>
                    <div className={styles.progressBarFill} style={{ width: `${service.percent}%`, background: service.color }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.narrowCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Popular Paper Sizes</span>
            <span className={styles.viewAll}>View all</span>
          </div>
          <div className={styles.donutContainer} style={{flexDirection: 'column', gap: 16}}>
            <div className={styles.donutChartBox} style={{height: 160, width: '100%'}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.paperSizeData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.paperSizeData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.donutCenter}>
                <div className={styles.donutCenterValue}>{data.summaryStats.totalPrints}</div>
                <div className={styles.donutCenterLabel}>Total Prints</div>
              </div>
            </div>
            
            <div className={styles.legendList} style={{width: '100%', gap: 8}}>
              {data.paperSizeData.map((item: any, idx: number) => (
                <div key={idx} className={styles.legendItem}>
                  <div className={styles.legendLeft}>
                    <div className={styles.legendDot} style={{ background: item.color }}></div>
                    {item.name}
                  </div>
                  <div className={styles.legendRight}>
                    {item.value} ({(item.value / data.summaryStats.totalPrints * 100).toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Banner */}
      <div className={styles.performanceBanner}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIcon}><Info size={24} /></div>
          <div className={styles.bannerText}>
            <h4>Great job! Your revenue increased by 18.5% compared to the previous 7 days.</h4>
            <p>Keep it up! You completed more orders and gained new customers.</p>
          </div>
        </div>
        <div className={styles.bannerRight}>
          <ArrowUpRight className={styles.bannerTrendArrow} size={32} />
          {[12, 16, 24, 18, 30, 42, 38].map((h, i) => (
            <div key={i} className={styles.miniBar} style={{ height: `${h}px` }}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
