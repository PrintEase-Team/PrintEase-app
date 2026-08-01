import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Download, ChevronLeft, ChevronRight, MoreVertical, FileText, Book, Copy, ChevronsUpDown, Image } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './Orders.module.css';

// We will fetch orders from the backend instead of using MOCK_ORDERS

export default function Orders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const itemsPerPage = 10;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchOrders();
    
    // Slow fallback polling just in case
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // Poll every 30 seconds instead of 5

    const shopId = localStorage.getItem('shop_id');
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
      if (shopId) {
        client.subscribe('/topic/shop/' + shopId, (message) => {
          if (message.body) {
            // New or updated order received instantly via WebSocket
            fetchOrders();
          }
        });
      }
    };

    client.activate();

    return () => {
      clearInterval(interval);
      client.deactivate();
    };
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
          docName: o.items && o.items.length > 1 ? `Multiple Files (${o.items.length})` : (o.items && o.items[0]?.document_name ? o.items[0].document_name : 'Document'),
          pages: o.items ? o.items.reduce((sum: number, item: any) => sum + (item.page_count || 1), 0) : 1,
          type: o.items && o.items.length > 1 ? 'batch' : ((o.items && o.items[0]?.file_type || 'pdf').toLowerCase().includes('pdf') ? 'pdf' : (o.items && o.items[0]?.file_type || '').toLowerCase().includes('image') ? 'img' : 'doc'),
          copies: o.items ? o.items.reduce((sum: number, item: any) => sum + (item.copies || 1), 0) : 1,
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

  useEffect(() => {
    setSelectedOrders([]);
  }, [activeTab, searchQuery]);

  const handleExport = (format: 'csv' | 'pdf') => {
    const targetOrders = selectedOrders.length > 0 
      ? filteredOrders.filter(o => selectedOrders.includes(o.id))
      : filteredOrders;

    if (targetOrders.length === 0) {
      alert('No data to export.');
      return;
    }

    const headers = ['Order ID', 'Student', 'Document', 'Copies', 'Price', 'Status', 'Date', 'Time'];
    const rows = targetOrders.map(o => [
      o.id,
      `${o.studentName} (${o.phone})`,
      `${o.docName} (${o.pages} pages)`,
      o.copies.toString(),
      o.price,
      o.status.toUpperCase(),
      o.date,
      o.time
    ]);

    const fileName = `PrintEase_Orders_${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(cell => `"${cell}"`).join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text("PrintEase Orders Report", 14, 15);
      doc.setFontSize(11);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 22);
      
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 92, 230] } // Brand color #005CE6
      });
      
      doc.save(`${fileName}.pdf`);
    }
  };

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
          
          <div className={styles.exportContainer} ref={exportMenuRef}>
            <button className={styles.exportBtn} onClick={() => setShowExportMenu(!showExportMenu)}>
              <Download size={16} /> Export
            </button>
            {showExportMenu && (
              <div className={styles.exportMenu}>
                <button onClick={() => { handleExport('csv'); setShowExportMenu(false); }}>Export as CSV</button>
                <button onClick={() => { handleExport('pdf'); setShowExportMenu(false); }}>Export as PDF</button>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    className={styles.checkbox} 
                    title="Select All" 
                    checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedOrders(filteredOrders.map(o => o.id));
                      else setSelectedOrders([]);
                    }}
                  />
                </th>
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
                  <td>
                    <input 
                      type="checkbox" 
                      className={styles.checkbox} 
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedOrders([...selectedOrders, order.id]);
                        else setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                      }}
                    />
                  </td>
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
                        {order.type === 'batch' && <Copy size={16} />}
                      </div>
                      <div className={styles.docInfo}>
                        <span>{order.docName}</span>
                        <span className={styles.subText}>{order.pages} pages • {order.copies} copies</span>
                      </div>
                    </div>
                  </td>
                  <td>{order.copies}</td>
                  <td>{order.price}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()] || styles.pending}`}>
                      {order.status.toLowerCase() === 'active' || order.status.toLowerCase() === 'unpaid' 
                        ? 'PENDING' 
                        : (order.status.toLowerCase() === 'collected' ? 'COMPLETED' : order.status.toUpperCase())}
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
