import { ArrowLeft, Book, BookOpen, Calendar, CreditCard as CardIcon, Check, CheckCircle2, Clock, Copy, Download, FileCheck, FileText, Image, Layers, Maximize2, Printer, Settings, ShieldCheck, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import styles from './OrderDetails.module.css';

export default function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/orders/${id}/full`)
      .then(res => res.json())
      .then(data => setOrder(data))
      .catch(err => console.error('Error fetching order:', err));
  }, [id]);

  const updateStatus = (newStatus: string) => {
    fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(() => {
        // Re-fetch the full order details to refresh the UI
        return fetch(`${API_BASE_URL}/api/orders/${id}/full`)
          .then(res => res.json())
          .then(data => setOrder(data));
      })
      .catch(err => console.error('Error updating status:', err));
  };

  if (!order) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className={styles.pageWrapper}>
      {/* Custom Topbar for Order Details */}
      <div className={styles.customTopbar}>
        <div className={styles.topbarLeft}>
          <div className={styles.titleRow}>
            <h1>Order #{order.order?.order_id?.substring(0, 8).toUpperCase()}</h1>
          </div>
          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <User size={16} /> {order.student?.full_name || order.student?.name || 'Unknown'}
            </div>
            <div className={styles.metaItem}>
              <Calendar size={16} /> {order.order?.submitted_at ? new Date(order.order.submitted_at).toLocaleDateString() : 'N/A'}
            </div>
            <div className={styles.metaItem}>
              <Clock size={16} /> {order.order?.submitted_at ? new Date(order.order.submitted_at).toLocaleTimeString() : 'N/A'}
            </div>
            <div className={styles.statusBadge}>
              <div className={styles.statusDot}></div> {order.order?.status}
            </div>
          </div>
        </div>
        <div className={styles.topbarRight}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard/orders')}>
            <ArrowLeft size={16} /> Back to Orders
          </button>
        </div>
      </div>

      <div className={styles.layout3Col}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <User className={styles.cardHeaderIcon} size={20} />
              Customer Information
            </div>

            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Student Name</span>
              <span className={styles.infoValue}>{order.student?.full_name || order.student?.name || 'Unknown'}</span>
            </div>

            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Phone Number</span>
              <span className={styles.infoValue}>{order.student?.phone_number || 'N/A'}</span>
            </div>

            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Email Address</span>
              <span className={styles.infoValue}>{order.student?.email || 'N/A'}</span>
            </div>

            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Pickup Method</span>
              <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="#64748b" /> Shop Pickup
              </span>
            </div>

            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Payment Method</span>
              <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CardIcon size={14} color="#64748b" /> Online (Paystack)
              </span>
            </div>

            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Payment Status</span>
              <div className={styles.statusBadgePaid}>Paid</div>
            </div>

          </div>

          <div className={styles.card}>
            {(() => {
              const isMultiFile = order.files && order.files.length > 1;
              const firstFileType = (order.files?.[0]?.file_type || '').toLowerCase();
              const isPdf = firstFileType.includes('pdf');
              const isImg = firstFileType.includes('image');

              return (
                <>
                  <div className={styles.cardHeader}>
                    {isMultiFile ? (
                      <Copy className={styles.cardHeaderIcon} size={20} style={{ color: '#005CE6' }} />
                    ) : isImg ? (
                      <Image className={styles.cardHeaderIcon} size={20} style={{ color: '#8b5cf6' }} />
                    ) : isPdf ? (
                      <FileText className={styles.cardHeaderIcon} size={20} style={{ color: '#ef4444' }} />
                    ) : (
                      <FileText className={styles.cardHeaderIcon} size={20} style={{ color: '#3b82f6' }} />
                    )}
                    Document Information
                  </div>

                  <div className={styles.docInfoItem}>
                    <div 
                      className={styles.docInfoIcon}
                      style={{ 
                        backgroundColor: isMultiFile ? '#005CE6' : (isPdf ? '#ef4444' : (isImg ? '#8b5cf6' : '#3b82f6')),
                        color: '#ffffff'
                      }}
                    >
                      {isMultiFile && <Copy size={20} color="#ffffff" />}
                      {!isMultiFile && isPdf && <FileText size={20} color="#ffffff" />}
                      {!isMultiFile && isImg && <Image size={20} color="#ffffff" />}
                      {!isMultiFile && !isPdf && !isImg && <FileText size={20} color="#ffffff" />}
                    </div>
                    <div className={styles.infoBlock} style={{ marginBottom: 0 }}>
                      <span className={styles.infoLabel}>{isMultiFile ? 'Files' : 'File Name'}</span>
                      <span className={styles.infoValue} style={{ wordBreak: 'break-all' }}>
                        {isMultiFile ? `Multiple Files (${order.files.length})` : (order.files?.[0]?.file_name || 'N/A')}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}

            <div className={styles.docDetailsList}>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Total Size</span>
                <span className={styles.infoValue}>
                  {order.files ? `${order.files.reduce((sum: number, f: any) => sum + (f.file_size_kb || 0), 0)} KB` : 'N/A'}
                </span>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>Total Pages</span>
                <span className={styles.infoValue}>
                  {order.files ? order.files.reduce((sum: number, f: any) => sum + (f.page_count || 1), 0) : 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className={styles.middleCol}>
          {order.files && order.files.length > 0 ? (
            order.files.map((file: any, index: number) => {
              const setting = order.printSettings?.find((s: any) => (s.file_id?.file_id || s.file_id) === file.file_id) || {};
              const fileType = (file.file_type || '').toLowerCase();
              const isFilePdf = fileType.includes('pdf');
              const isFileImg = fileType.includes('image');

              return (
                <div key={file.file_id} style={{ marginBottom: 32 }}>
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      {isFileImg ? (
                        <Image className={styles.cardHeaderIcon} size={20} color="#8b5cf6" />
                      ) : isFilePdf ? (
                        <FileText className={styles.cardHeaderIcon} size={20} color="#ef4444" />
                      ) : (
                        <FileText className={styles.cardHeaderIcon} size={20} color="#3b82f6" />
                      )}
                      Document {index + 1}: {file.file_name}
                    </div>

                    <div className={styles.previewWrapper}>
                      <div className={styles.previewMain}>
                        <div className={styles.previewImage} style={{ padding: 0, overflow: 'hidden' }}>
                          {file.file_type?.startsWith('image/') ? (
                            <img
                              src={`${API_BASE_URL}/api/file/${file.file_id}/view`}
                              alt="Document Preview"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <div className={styles.pdfPlaceholder}>
                              <FileText size={48} color="#94a3b8" />
                              <span style={{ marginTop: 12, color: '#64748b', fontWeight: 500 }}>PDF Document</span>
                              <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Please use the download button below to view</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      className={styles.downloadBtn}
                      onClick={() => {
                        window.open(`${API_BASE_URL}/api/file/${file.file_id}/view`, '_blank');
                      }}
                    >
                      <Download size={16} /> Download File
                    </button>
                  </div>

                  <div className={styles.card} style={{ marginTop: 16 }}>
                    <div className={styles.cardHeader} style={{ marginBottom: 16 }}>
                      <Settings className={styles.cardHeaderIcon} size={20} />
                      Print Settings (Document {index + 1})
                    </div>
                    <div className={styles.printSettingsGrid}>
                      <div className={styles.printSettingCard}>
                        <Copy className={styles.printSettingCardIcon} size={20} />
                        <div className={styles.printSettingCardText}>
                          <span>Copies</span>
                          <span>{setting.copies || 1}</span>
                        </div>
                      </div>
                      <div className={styles.printSettingCard}>
                        <Image className={styles.printSettingCardIcon} size={20} color="#3b82f6" />
                        <div className={styles.printSettingCardText}>
                          <span>Color</span>
                          <span>{setting.color_mode?.replace('_', ' ') || 'Black and White'}</span>
                        </div>
                      </div>
                      <div className={styles.printSettingCard}>
                        <FileCheck className={styles.printSettingCardIcon} size={20} />
                        <div className={styles.printSettingCardText}>
                          <span>Sided</span>
                          <span>{setting.sided?.replace('_', ' ') || 'Single Sided'}</span>
                        </div>
                      </div>
                      <div className={styles.printSettingCard}>
                        <FileText className={styles.printSettingCardIcon} size={20} />
                        <div className={styles.printSettingCardText}>
                          <span>Page Range</span>
                          <span>{setting.page_range || 'All Pages'}</span>
                        </div>
                      </div>
                      <div className={styles.printSettingCard}>
                        <Book className={styles.printSettingCardIcon} size={20} color="#10b981" />
                        <div className={styles.printSettingCardText}>
                          <span>Paper Size</span>
                          <span>{setting.paper_size?.toUpperCase() || 'A4'}</span>
                        </div>
                      </div>
                      <div className={styles.printSettingCard}>
                        <Maximize2 className={styles.printSettingCardIcon} size={20} color="#8b5cf6" />
                        <div className={styles.printSettingCardText}>
                          <span>Orientation</span>
                          <span style={{ textTransform: 'capitalize' }}>{setting.orientation || 'Portrait'}</span>
                        </div>
                      </div>

                      {setting.requires_binding && (
                        <div className={styles.printSettingCard} style={{ borderColor: '#f59e0b', backgroundColor: '#fef3c7' }}>
                          <BookOpen className={styles.printSettingCardIcon} size={20} color="#d97706" />
                          <div className={styles.printSettingCardText}>
                            <span style={{ color: '#92400e' }}>Binding</span>
                            <span style={{ color: '#d97706', fontWeight: 600 }}>Requested</span>
                          </div>
                        </div>
                      )}

                      {setting.requires_lamination && (
                        <div className={styles.printSettingCard} style={{ borderColor: '#10b981', backgroundColor: '#d1fae5' }}>
                          <Layers className={styles.printSettingCardIcon} size={20} color="#059669" />
                          <div className={styles.printSettingCardText}>
                            <span style={{ color: '#064e3b' }}>Lamination</span>
                            <span style={{ color: '#059669', fontWeight: 600 }}>Requested</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.card} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              No documents attached to this order.
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              Order Timeline
            </div>
            {(() => {
              const status = order.order?.status;
              const steps = [
                { label: 'Order Placed', done: true },
                { label: 'Payment Confirmed', done: true },
                { label: 'Printing Started', done: status === 'Printing' || status === 'Ready' || status === 'Collected', active: status === 'Pending' },
                { label: 'Ready for Pickup', done: status === 'Ready' || status === 'Collected', active: status === 'Printing' },
                { label: 'Completed', done: status === 'Collected', active: status === 'Ready' },
              ];
              return steps.map((step, i) => (
                <div key={i} className={`${styles.timelineItem} ${step.done ? styles.completed : step.active ? styles.active : styles.pending}`}>
                  <div className={`${styles.timelineIcon} ${step.done ? styles.completed : step.active ? styles.current : ''}`}>
                    {step.done && <Check size={12} />}
                  </div>
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineTitle}>{step.label}</span>
                    <span className={styles.timelineTime}>{step.done ? 'Done' : step.active ? 'In Progress' : 'Pending'}</span>
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FileText className={styles.cardHeaderIcon} size={20} color="#64748b" />
              Pickup Code
            </div>
            <div className={styles.pickupCodeBox}>
              <div className={styles.pickupCodeText}>{order.order?.pickup_code || 'N/A'}</div>
              <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(order.order?.pickup_code || '')}><Copy size={14} /> Copy Code</button>
            </div>
          </div>

          <div className={styles.actionsStack}>
            {order.order?.status === 'Pending' && (
              <button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={() => updateStatus('Printing')}>
                <Printer size={18} /> Start Printing
              </button>
            )}

            {order.order?.status === 'Printing' && (
              <button className={`${styles.actionBtn} ${styles.btnOutlineBlue}`} onClick={() => updateStatus('Ready')}>
                <CheckCircle2 size={18} /> Mark Ready (Done Printing)
              </button>
            )}

            {order.order?.status === 'Ready' && (
              <button className={`${styles.actionBtn} ${styles.btnOutlineGreen}`} onClick={() => updateStatus('Collected')}>
                <ShieldCheck size={18} /> Complete Order (Student Collected)
              </button>
            )}

            {order.order?.status === 'Collected' && (
              <div style={{ padding: '16px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 500, border: '1px solid #bbf7d0' }}>
                <CheckCircle2 size={18} /> Order Fully Completed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
