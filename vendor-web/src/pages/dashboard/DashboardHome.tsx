import React, { useState, useEffect } from 'react';
import {
  ArrowUp,
  ArrowRight,
  DollarSign,
  ClipboardList,
  Printer,
  CheckCircle,
  ShoppingBag,
  ChevronDown,
  FileText,
  Smartphone,
  Book,
  Copy,
  Image,
  Inbox,
  X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import styles from './DashboardHome.module.css';

export default function DashboardHome() {
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dynamicChartData, setDynamicChartData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    revenue: 0,
    pending: 0,
    printing: 0,
    ready: 0,
    completedToday: 0
  });
  const [serviceCounts, setServiceCounts] = useState({
    bw: 0, color: 0, scan: 0, binding: 0
  });
  const [overviewRange, setOverviewRange] = useState('Today');
  const [allRawOrders, setAllRawOrders] = useState<any[]>([]);
  const [showServicesModal, setShowServicesModal] = useState(false);

  useEffect(() => {
    const shopId = localStorage.getItem('shop_id');
    if (!shopId) return;

    const fetchOrders = () => {
      fetch(`http://localhost:8080/api/orders/shop/${shopId}`)
        .then(res => res.json())
        .then(data => {
          setAllRawOrders(data);
        })
        .catch(err => console.error('Error fetching dashboard orders:', err));
    };

    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // 30s polling fallback

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-printease'),
      debug: function (str) {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function () {
      client.subscribe('/topic/shop/' + shopId, (message) => {
        if (message.body) {
          fetchOrders();
        }
      });
    };

    client.activate();

    return () => {
      clearInterval(interval);
      client.deactivate();
    };
  }, []);

  useEffect(() => {
    if (allRawOrders.length === 0) return;
    const data = allRawOrders;
    let rev = 0, pend = 0, print = 0, read = 0, comp = 0;
    
    const now = new Date();
    const today = now.toDateString();
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    const startOfWeekDate = new Date();
    startOfWeekDate.setDate(now.getDate() - now.getDay());
    const startOfWeek = startOfWeekDate.getTime();

    const timeBuckets = { '12 AM': 0, '6 AM': 0, '12 PM': 0, '6 PM': 0, '11 PM': 0 };
    const weekBuckets = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };

    let bwCount = 0, colorCount = 0, scanCount = 0, bindingCount = 0;

    const mappedOrders = data.map((o: any) => {
      const orderDate = o.submitted_at ? new Date(o.submitted_at) : new Date();
      const amount = o.payment_amount || 0;
      
      const isToday = orderDate.toDateString() === today;
      const isYesterday = orderDate.toDateString() === yesterday;
      const isThisWeek = orderDate.getTime() >= startOfWeek;

      let includeInChart = false;
      if (overviewRange === 'Today' && isToday) includeInChart = true;
      if (overviewRange === 'Yesterday' && isYesterday) includeInChart = true;
      if (overviewRange === 'This Week' && isThisWeek) includeInChart = true;
      
      if (o.status === 'Pending' || o.status === 'Unpaid') pend++;
      if (o.status === 'Printing') print++;
      if (o.status === 'Ready') read++;
      if (o.status === 'Collected' && isToday) comp++;
      
      if (includeInChart) {
        rev += amount;
        
        if (o.items && o.items.length > 0) {
          o.items.forEach((item: any) => {
            if (item.color_mode === 'Black_and_White') bwCount++;
            if (item.color_mode === 'Colored') colorCount++;
            if (item.requires_binding) bindingCount++;
            if (item.document_name && item.document_name.toLowerCase().includes('scan')) scanCount++;
          });
        }

        if (overviewRange === 'This Week') {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          weekBuckets[days[orderDate.getDay()] as keyof typeof weekBuckets] += amount;
        } else {
          const hour = orderDate.getHours();
          if (hour < 6) timeBuckets['12 AM'] += amount;
          else if (hour < 12) timeBuckets['6 AM'] += amount;
          else if (hour < 18) timeBuckets['12 PM'] += amount;
          else if (hour < 23) timeBuckets['6 PM'] += amount;
          else timeBuckets['11 PM'] += amount;
        }
      }

      return {
        id: o.order_id?.substring(0,8).toUpperCase(),
        rawId: o.order_id,
        studentName: o.student_name || 'Unknown',
        phone: o.student_phone || 'N/A',
        docName: o.items && o.items.length > 1 ? `Multiple Files (${o.items.length})` : (o.items && o.items[0]?.document_name ? o.items[0].document_name : 'Document'),
        pages: o.items ? o.items.reduce((sum: number, item: any) => sum + (item.page_count || 1), 0) : 1,
        copies: o.items ? o.items.reduce((sum: number, item: any) => sum + (item.copies || 1), 0) : 1,
        type: o.items && o.items.length > 1 ? 'batch' : ((o.items && o.items[0]?.file_type || 'pdf').toLowerCase().includes('pdf') ? 'pdf' : (o.items && o.items[0]?.file_type || '').toLowerCase().includes('image') ? 'img' : 'doc'),
        status: o.status === 'Collected' ? 'completed' : (o.status?.toLowerCase() || 'pending'),
        amount: `GHS ${amount.toFixed(2)}`,
        time: orderDate.toLocaleTimeString(),
        date: orderDate.toLocaleDateString(),
        timestamp: orderDate.getTime()
      };
    });

    mappedOrders.sort((a: any, b: any) => b.timestamp - a.timestamp);
    setRecentOrders(mappedOrders.slice(0, 5));
    setMetrics({ revenue: rev, pending: pend, printing: print, ready: read, completedToday: comp });
    setServiceCounts({ bw: bwCount, color: colorCount, scan: scanCount, binding: bindingCount });
    
    if (overviewRange === 'This Week') {
      setDynamicChartData(Object.keys(weekBuckets).map(time => ({ time, revenue: weekBuckets[time as keyof typeof weekBuckets] })));
    } else {
      setDynamicChartData(Object.keys(timeBuckets).map(time => ({ time, revenue: timeBuckets[time as keyof typeof timeBuckets] })));
    }

  }, [allRawOrders, overviewRange]);

  const totalServiceOrders = serviceCounts.bw + serviceCounts.color + serviceCounts.scan + serviceCounts.binding;
  const getPct = (cnt: number) => totalServiceOrders > 0 ? Math.round((cnt / totalServiceOrders) * 100) : 0;

  return (
    <div className={styles.dashboard}>
      {/* Top Horizontal Slider Track */}
      <div className={styles.topSliderTrack}>
        {/* 1. Today's Overview Card */}
        <div className={`${styles.card} ${styles.overviewCardItem}`}>
          <div className={styles.chartHeader}>
            <h3 className={styles.cardTitle}>{overviewRange}'s Overview</h3>
            <div style={{ position: 'relative' }}>
              <button className={styles.dropdownBtn} onClick={() => {
                const dropdown = document.getElementById('date-dropdown');
                if(dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
              }}>
                {overviewRange} <ChevronDown size={14} />
              </button>
              <div id="date-dropdown" style={{ display: 'none', position: 'absolute', top: 30, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', zIndex: 10, width: 120 }}>
                <div onClick={() => { setOverviewRange('Today'); document.getElementById('date-dropdown')!.style.display = 'none'; }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>Today</div>
                <div onClick={() => { setOverviewRange('Yesterday'); document.getElementById('date-dropdown')!.style.display = 'none'; }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>Yesterday</div>
                <div onClick={() => { setOverviewRange('This Week'); document.getElementById('date-dropdown')!.style.display = 'none'; }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}>This Week</div>
              </div>
            </div>
          </div>

          <div className={styles.overviewStatsRow}>
            <div className={styles.overviewStatItem}>
              <span className={styles.overviewStatValue}>{metrics.completedToday}</span>
              <span className={styles.overviewStatLabel}>Completed</span>
            </div>
            <div className={styles.overviewStatItem}>
              <span className={styles.overviewStatValue}>{metrics.ready}</span>
              <span className={styles.overviewStatLabel}>Ready</span>
            </div>
            <div className={styles.overviewStatItem}>
              <span className={styles.overviewStatValue}>{metrics.pending}</span>
              <span className={styles.overviewStatLabel}>Pending</span>
            </div>
            <div className={styles.overviewStatItem}>
              <span className={styles.overviewStatValue}>GHS {metrics.revenue.toFixed(2)}</span>
              <span className={styles.overviewStatLabel}>Revenue</span>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005CE6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#005CE6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => val >= 1000 ? `${val / 1000}K` : val} />
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#005CE6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Top Services Card */}
        <div className={`${styles.card} ${styles.topServicesCardItem}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Top Services</h3>
            <button onClick={() => setShowServicesModal(true)} className={styles.viewAll}>View all <ArrowRight size={14} /></button>
          </div>
          <div className={styles.servicesList}>
            <div className={styles.serviceItem}>
              <div className={styles.serviceIcon}><Printer size={20} /></div>
              <div className={styles.serviceInfo}>
                <span className={styles.serviceName}>Black & White Printing</span>
                <span className={styles.serviceOrders}>{serviceCounts.bw} orders</span>
              </div>
              <div className={styles.serviceRight}>
                <div className={styles.serviceProgressBarTrack}>
                  <div className={styles.serviceProgressBarFill} style={{ width: `${getPct(serviceCounts.bw)}%`, backgroundColor: '#64748b' }} />
                </div>
                <span className={styles.servicePctText}>{getPct(serviceCounts.bw)}%</span>
              </div>
            </div>

            <div className={styles.serviceItem}>
              <div className={styles.serviceIcon} style={{ backgroundColor: '#fff1f2' }}><Copy size={20} color="#f43f5e" /></div>
              <div className={styles.serviceInfo}>
                <span className={styles.serviceName}>Color Printing</span>
                <span className={styles.serviceOrders}>{serviceCounts.color} orders</span>
              </div>
              <div className={styles.serviceRight}>
                <div className={styles.serviceProgressBarTrack}>
                  <div className={styles.serviceProgressBarFill} style={{ width: `${getPct(serviceCounts.color)}%`, backgroundColor: '#f43f5e' }} />
                </div>
                <span className={styles.servicePctText}>{getPct(serviceCounts.color)}%</span>
              </div>
            </div>

            <div className={styles.serviceItem}>
              <div className={styles.serviceIcon} style={{ backgroundColor: '#eff6ff' }}><Smartphone size={20} color="#3b82f6" /></div>
              <div className={styles.serviceInfo}>
                <span className={styles.serviceName}>Scanning</span>
                <span className={styles.serviceOrders}>{serviceCounts.scan} orders</span>
              </div>
              <div className={styles.serviceRight}>
                <div className={styles.serviceProgressBarTrack}>
                  <div className={styles.serviceProgressBarFill} style={{ width: `${getPct(serviceCounts.scan)}%`, backgroundColor: '#3b82f6' }} />
                </div>
                <span className={styles.servicePctText}>{getPct(serviceCounts.scan)}%</span>
              </div>
            </div>

            <div className={styles.serviceItem}>
              <div className={styles.serviceIcon} style={{ backgroundColor: '#f3e8ff' }}><Book size={20} color="#a855f7" /></div>
              <div className={styles.serviceInfo}>
                <span className={styles.serviceName}>Binding</span>
                <span className={styles.serviceOrders}>{serviceCounts.binding} orders</span>
              </div>
              <div className={styles.serviceRight}>
                <div className={styles.serviceProgressBarTrack}>
                  <div className={styles.serviceProgressBarFill} style={{ width: `${getPct(serviceCounts.binding)}%`, backgroundColor: '#a855f7' }} />
                </div>
                <span className={styles.servicePctText}>{getPct(serviceCounts.binding)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Revenue Stat Card */}
        <div className={`${styles.metricCard} ${styles.metricCardItem}`}>
          <div className={styles.metricHeader}>
            <div className={`${styles.metricIcon} ${styles.revenue}`}>
              <DollarSign size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Today's Revenue</span>
              <span className={styles.metricValue}>GHS {metrics.revenue.toFixed(2)}</span>
            </div>
          </div>
          <div className={styles.metricFooter}>
            <ArrowUp size={14} className={styles.trendUp} />
            <span className={styles.trendUp}>Auto-calculated</span>
          </div>
        </div>

        {/* 4. Pending Stat Card */}
        <div className={`${styles.metricCard} ${styles.metricCardItem}`}>
          <div className={styles.metricHeader}>
            <div className={`${styles.metricIcon} ${styles.pending}`}>
              <ClipboardList size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Pending Orders</span>
              <span className={styles.metricValue}>{metrics.pending}</span>
            </div>
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.trendWarning}>⏳ Needs attention</span>
          </div>
        </div>

        {/* 5. Printing Stat Card */}
        <div className={`${styles.metricCard} ${styles.metricCardItem}`}>
          <div className={styles.metricHeader}>
            <div className={`${styles.metricIcon} ${styles.printing}`}>
              <Printer size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Printing</span>
              <span className={styles.metricValue}>{metrics.printing}</span>
            </div>
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.trendInfo}>⚙️ In progress</span>
          </div>
        </div>

        {/* 6. Ready for Pickup Stat Card */}
        <div className={`${styles.metricCard} ${styles.metricCardItem}`}>
          <div className={styles.metricHeader}>
            <div className={`${styles.metricIcon} ${styles.ready}`}>
              <CheckCircle size={20} />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Ready for Pickup</span>
              <span className={styles.metricValue}>{metrics.ready}</span>
            </div>
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.trendUp}>🚶‍♂️ Awaiting customers</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Table (Full Width) */}
      <div className={styles.card} style={{ width: '100%' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Recent Orders</h3>
          <button className={styles.viewAll} onClick={() => navigate('/dashboard/orders')}>View all orders <ArrowRight size={16} /></button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Student</th>
              <th>Document</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order, i) => (
              <tr key={i}>
                <td className={styles.orderId}>#{order.id}</td>
                <td>
                  <div className={styles.studentInfo}>
                    <span>{order.studentName}</span>
                    <span className={styles.subText}>{order.phone}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.docWrapper}>
                    <div className={`${styles.docIcon} ${styles[order.type] || styles.defaultIcon}`}>
                      {order.type === 'pdf' && <FileText size={16} />}
                      {order.type === 'img' && <Image size={16} />}
                      {order.type === 'doc' && <FileText size={16} />}
                      {order.type === 'batch' && <Copy size={16} />}
                    </div>
                    <div className={styles.docInfo}>
                      <span>{order.docName}</span>
                      <span className={styles.subText}>{order.pages} pages • {order.copies} copies</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[order.status === 'unpaid' ? 'pending' : order.status]}`}>
                    {order.status.toUpperCase()}
                  </span>
                </td>
                <td>{order.amount}</td>
                <td>
                  <div className={styles.timeInfo}>
                    <span>{order.time}</span>
                    <span className={styles.subText}>{order.date}</span>
                  </div>
                </td>
                <td>
                  <button className={styles.viewBtn} onClick={() => navigate(`/dashboard/orders/${order.rawId}`)}>View</button>
                </td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={7} style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>No recent orders found</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className={styles.caughtUpContainer}>
          <div className={styles.caughtUpIconBg}>
            <Inbox size={20} color="#94a3b8" />
          </div>
          <span className={styles.caughtUpTitle}>No more orders to show</span>
          <span className={styles.caughtUpSubtitle}>You're all caught up!</span>
        </div>
      </div>

      {/* Top Services Breakdown Overlay Modal */}
      {showServicesModal && (
        <div className={styles.modalOverlay} onClick={() => setShowServicesModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Top Services Breakdown</h3>
              <button className={styles.closeBtn} onClick={() => setShowServicesModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalStatRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Printer size={20} color="#64748b" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>Black & White Printing</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{serviceCounts.bw} total orders</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: '#005CE6', fontSize: 14 }}>{getPct(serviceCounts.bw)}%</span>
              </div>

              <div className={styles.modalStatRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Copy size={20} color="#f43f5e" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>Color Printing</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{serviceCounts.color} total orders</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: '#f43f5e', fontSize: 14 }}>{getPct(serviceCounts.color)}%</span>
              </div>

              <div className={styles.modalStatRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Smartphone size={20} color="#3b82f6" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>Scanning</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{serviceCounts.scan} total orders</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: 14 }}>{getPct(serviceCounts.scan)}%</span>
              </div>

              <div className={styles.modalStatRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Book size={20} color="#a855f7" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>Binding</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{serviceCounts.binding} total orders</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: '#a855f7', fontSize: 14 }}>{getPct(serviceCounts.binding)}%</span>
              </div>

              <button
                onClick={() => {
                  setShowServicesModal(false);
                  navigate('/dashboard/analytics');
                }}
                style={{
                  marginTop: 8,
                  padding: '12px',
                  backgroundColor: '#005CE6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Go to Full Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
