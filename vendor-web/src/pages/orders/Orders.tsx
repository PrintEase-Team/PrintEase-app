import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, ChevronLeft, ChevronRight, MoreVertical, FileText, Book, Copy, ChevronsUpDown, Image } from 'lucide-react';
import styles from './Orders.module.css';

// We will fetch orders from the backend instead of using MOCK_ORDERS

export default function Orders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = () => {
    const shopId = localStorage.getItem('shop_id');
    if (!shopId) return;
    fetch(`http://localhost:8080/api/orders/shop/${shopId}`)
      .then(res => res.json())
      .then(data => {
        const mappedOrders = data.map((o: any) => ({
          id: o.order_id?.substring(0,8).toUpperCase(),
          rawId: o.order_id,
          studentName: o.student_name || 'Unknown Student',
          phone: o.student_phone || 'N/A',
          docName: o.document_name || 'Document',
          pages: o.page_count || 1,
          type: (o.file_type || 'pdf').toLowerCase().includes('pdf') ? 'pdf' : (o.file_type || '').toLowerCase().includes('image') ? 'img' : 'doc',
          copies: o.copies || 1,
          price: o.payment_amount != null ? `GHS ${Number(o.payment_amount).toFixed(2)}` : 'GHS --',
          status: o.status === 'Collected' ? 'Completed' : (o.status || 'Pending'),
          date: o.submitted_at ? new Date(o.submitted_at).toLocaleDateString() : 'N/A',
          time: o.submitted_at ? new Date(o.submitted_at).toLocaleTimeString() : 'N/A'
        }));
        // Sort by submitted_at descending
        mappedOrders.sort((a: any, b: any) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
        setOrders(mappedOrders);
      })
      .catch(err => console.error('Error fetching orders:', err));
  };
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';

  const tabs = [
    { name: 'All Orders', count: orders.length },
    { name: 'Pending', count: orders.filter(o => o.status === 'Pending').length, badgeStyle: styles.pending },
    { name: 'Printing', count: orders.filter(o => o.status === 'Printing').length, badgeStyle: styles.printing },
    { name: 'Ready', count: orders.filter(o => o.status === 'Ready').length, badgeStyle: styles.ready },
    { name: 'Completed', count: orders.filter(o => o.status === 'Completed' || o.status === 'Collected').length }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'All Orders' || order.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      order.id.toLowerCase().includes(searchQuery) ||
      order.studentName.toLowerCase().includes(searchQuery) ||
      order.docName.toLowerCase().includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  return (
    <div className={styles.ordersPage}>
      <div className={styles.card}>
        {/* Filters & Export */}
        <div className={styles.filtersRow}>
          <div className={styles.tabs}>
            {tabs.map(tab => (
              <button 
                key={tab.name}
                className={`${styles.tab} ${activeTab === tab.name ? styles.active : ''}`}
                onClick={() => { setActiveTab(tab.name); setCurrentPage(1); }}
              >
                {tab.name}
                <span className={`${styles.tabBadge} ${tab.badgeStyle || ''}`}>{tab.count}</span>
              </button>
            ))}
          </div>
          
          <button className={styles.exportBtn} onClick={() => alert("Export functionality will generate a CSV or PDF later.")}>
            <Download size={16} /> Export
          </button>
        </div>

        {/* Data Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" className={styles.checkbox} title="Select All" /></th>
                <th>Order ID <ChevronsUpDown size={12} className={styles.sortIcon} /></th>
                <th>Student <ChevronsUpDown size={12} className={styles.sortIcon} /></th>
                <th>Document <ChevronsUpDown size={12} className={styles.sortIcon} /></th>
                <th>Copies <ChevronsUpDown size={12} className={styles.sortIcon} /></th>
                <th>Price <ChevronsUpDown size={12} className={styles.sortIcon} /></th>
                <th>Status <ChevronsUpDown size={12} className={styles.sortIcon} /></th>
                <th>Placed On <ChevronsUpDown size={12} className={styles.sortIcon} /></th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>No orders found in this category.</td>
                </tr>
              )}
              {filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order, i) => (
                <tr key={i}>
                  <td><input type="checkbox" className={styles.checkbox} /></td>
                  <td className={styles.orderId}>{order.id}</td>
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
                      </div>
                      <div className={styles.docInfo}>
                        <span>{order.docName}</span>
                        <span className={styles.subText}>{order.pages} pages</span>
                      </div>
                    </div>
                  </td>
                  <td>{order.copies}</td>
                  <td>{order.price}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className={styles.timeInfo}>
                      <span>{order.date}</span>
                      <span className={styles.subText}>{order.time}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionsWrapper}>
                      <button className={styles.viewBtn} onClick={() => navigate(`/dashboard/orders/${order.rawId}`)}>View</button>
                      <button className={styles.moreBtn}><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <div className={styles.showingText}>Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders</div>
          <div className={styles.pageControls}>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={16} /></button>
            
            {Array.from({ length: Math.ceil(filteredOrders.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
              <button 
                key={page} 
                className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredOrders.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage) || filteredOrders.length === 0}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
