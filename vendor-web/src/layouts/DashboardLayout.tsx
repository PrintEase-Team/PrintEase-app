import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart2, Settings, Bell, ChevronDown, Search, Calendar, Download } from 'lucide-react';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout() {
  const [vendorName, setVendorName] = useState('Loading...');
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isOrdersPage = location.pathname === '/dashboard/orders';
  const isOrderDetailsPage = location.pathname.startsWith('/dashboard/orders/');
  const isAnalyticsPage = location.pathname === '/dashboard/analytics';
  const isSettingsPage = location.pathname === '/dashboard/settings';

  const [searchParams, setSearchParams] = useSearchParams();
  const timeRange = searchParams.get('timeRange') || 'Daily';

  const handleTimeRangeChange = (range: string) => {
    setSearchParams(prev => {
      prev.set('timeRange', range);
      return prev;
    });
  };

  const getDisplayDateRange = () => {
    const today = new Date();
    if (timeRange === 'Daily') return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const pastDate = new Date(today);
    if (timeRange === 'Weekly') pastDate.setDate(today.getDate() - 7);
    if (timeRange === 'Monthly') pastDate.setMonth(today.getMonth() - 1);
    if (timeRange === 'Yearly') pastDate.setFullYear(today.getFullYear() - 1);
    
    return `${pastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const handleNotificationClick = () => {
    alert("Notifications feature will be fully functional once connected to the backend database.");
  };

  const handleProfileClick = () => {
    alert("Profile dropdown menu will be implemented soon!");
  };

  const calculateIsCurrentlyOpen = (data: any) => {
    if (!data) return true;
    
    if (data.status_override && data.status_override !== 'NONE') {
      if (data.override_expires_at) {
        const expiresAt = new Date(data.override_expires_at);
        if (new Date() < expiresAt) {
          return data.status_override === 'OPEN';
        }
      } else {
        return data.status_override === 'OPEN';
      }
    }

    if (!data.operating_hours) return true;
    try {
      const schedule = JSON.parse(data.operating_hours);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      const todaySchedule = schedule[today];
      if (!todaySchedule || todaySchedule === 'Closed') return false;

      let openTime, closeTime;
      if (typeof todaySchedule === 'object') {
        if (!todaySchedule.active) return false;
        openTime = todaySchedule.open;
        closeTime = todaySchedule.close;
      } else {
        [openTime, closeTime] = todaySchedule.split(' - ');
      }

      if (!openTime || !closeTime) return false;

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const parseTime = (timeStr: string) => {
        if (!timeStr.includes(' ')) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + (minutes || 0);
        }
        const [time, period] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + (minutes || 0);
      };

      return currentMinutes >= parseTime(openTime) && currentMinutes <= parseTime(closeTime);
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleToggleShopStatus = async () => {
    if (!shopData) return;
    const isForceClosed = shopData.status_override === 'CLOSED';
    const isForceOpened = shopData.status_override === 'OPEN';
    
    let override = 'NONE';
    
    if (isForceClosed) {
      if (!window.confirm("Do you want to resume work and return to your normal schedule?")) return;
      override = 'NONE';
    } else if (isForceOpened) {
      if (!window.confirm("Do you want to stop your forced overtime and return to your normal closed state?")) return;
      override = 'NONE';
    } else if (isShopOpen) {
      if (!window.confirm("Do you want to force close the shop? It will stay closed until you reopen it or the next scheduled time.")) return;
      override = 'CLOSED';
    } else {
      if (!window.confirm("Your shop is normally closed right now. Do you want to force open the shop? It will last for 1 hour.")) return;
      override = 'OPEN';
    }

    const shopId = localStorage.getItem('shop_id');
    try {
      const res = await fetch(`http://localhost:8080/api/shops/${shopId}/status-override`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ override })
      });
      if (res.ok) {
        const updatedShop = await res.json();
        setShopData(updatedShop);
        setIsShopOpen(calculateIsCurrentlyOpen(updatedShop));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const vId = localStorage.getItem('vendor_id');
        if (!vId) return;
        const res = await fetch(`http://localhost:8080/api/users/${vId}`);
        if (res.ok) {
          const data = await res.json();
          setVendorName(data.full_name || 'Vendor');
        }
        const shopRes = await fetch(`http://localhost:8080/api/shops/vendor/${vId}`);
        if (shopRes.ok) {
          const shopDataRes = await shopRes.json();
          localStorage.setItem('shop_id', shopDataRes.shop_id);
          setShopData(shopDataRes);
          setIsShopOpen(calculateIsCurrentlyOpen(shopDataRes));
          if (shopDataRes.profile_picture_url) {
            setProfileUrl(shopDataRes.profile_picture_url);
          }
        }
      } catch(err) {}
    };
    fetchProfile();
  }, []);

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src="/web-logo-img.png" alt="Logo" className={styles.logo} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>PrintEase</span>
            <span className={styles.brandSub}>Vendor Dashboard</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink 
            to="/dashboard" 
            end
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink 
            to="/dashboard/orders" 
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <FileText size={20} />
            Orders
          </NavLink>
          <NavLink 
            to="/dashboard/analytics" 
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <BarChart2 size={20} />
            Analytics
          </NavLink>
          <NavLink 
            to="/dashboard/settings" 
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Settings size={20} />
            Settings
          </NavLink>
        </nav>

        <div className={styles.shopStatusCard}>
          <div className={styles.shopStatusHeader}>
            <span>Shop Status</span>
            <span className={styles.badge} style={{ backgroundColor: isShopOpen ? '#10b981' : '#64748b' }}>
              {isShopOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <p className={styles.shopStatusDesc}>
            {isShopOpen 
              ? shopData?.status_override === 'OPEN'
                ? 'Your shop is forced open (overtime). Resume work to return to closed.'
                : 'Your shop is open and receiving orders.' 
              : shopData?.status_override === 'CLOSED'
                ? 'Your shop is offline. Resume work to receive orders.'
                : 'Your shop is closed. Customers cannot place new orders.'}
          </p>
          <button className={styles.closeShopBtn} onClick={handleToggleShopStatus} style={{
            backgroundColor: shopData?.status_override === 'CLOSED' ? '#ef4444' : shopData?.status_override === 'OPEN' ? '#eab308' : ''
          }}>
            {shopData?.status_override === 'CLOSED' 
              ? 'Resume Work' 
              : shopData?.status_override === 'OPEN' 
                ? 'End Force Open' 
                : isShopOpen 
                  ? 'Force Close' 
                  : 'Force Open (1h)'}
          </button>
        </div>

        <div className={styles.userProfile} onClick={() => navigate('/dashboard/settings')} style={{ cursor: 'pointer' }}>
          <div className={styles.userProfileLeft}>
            <div className={styles.avatar} style={{ overflow: 'hidden' }}>
              {profileUrl ? (
                <img src={`http://localhost:8080${profileUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                vendorName.substring(0,2).toUpperCase()
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{vendorName}</span>
              <span className={styles.userRole}>PrintEase Shop</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Topbar */}
        {!isOrderDetailsPage && (
          <header className={styles.topbar}>
            {isAnalyticsPage ? (
              <div className={styles.headerTitles}>
                <h2>Analytics</h2>
                <p className={styles.headerSubtitle}>Track your shop performance and grow your business.</p>
              </div>
            ) : isSettingsPage ? (
              <div className={styles.headerTitles}>
                <h2>Settings</h2>
                <p className={styles.headerSubtitle}>Manage your shop settings and account preferences.</p>
              </div>
            ) : (
              <div className={styles.greeting}>
                <h2>{isOrdersPage ? 'Orders' : `Good morning, ${vendorName.split(' ')[0]}!`}</h2>
                <p>{isOrdersPage ? 'Manage and track all print orders from your customers.' : "Here's what's happening with your shop today."}</p>
              </div>
            )}
          <div className={styles.topActions}>
            {isOrdersPage && (
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', width: '300px', marginRight: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Search orders, students, or files..." 
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }} 
                  onChange={(e) => {
                    const searchParams = new URLSearchParams(location.search);
                    if (e.target.value) {
                      searchParams.set('search', e.target.value);
                    } else {
                      searchParams.delete('search');
                    }
                    navigate(`?${searchParams.toString()}`, { replace: true });
                  }}
                  defaultValue={new URLSearchParams(location.search).get('search') || ''}
                />
                <Search size={16} color="#94a3b8" />
              </div>
            )}
            
            {isAnalyticsPage && (
              <div className={styles.analyticsControls}>
                <div className={styles.datePicker}>
                  <Calendar size={16} />
                  <span>{getDisplayDateRange()}</span>
                  <ChevronDown size={14} />
                </div>
                <div className={styles.timeToggles}>
                  {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((range) => (
                    <div 
                      key={range}
                      className={`${styles.timeToggle} ${timeRange === range ? styles.timeToggleActive : ''}`}
                      onClick={() => handleTimeRangeChange(range)}
                      style={{ cursor: 'pointer' }}
                    >
                      {range}
                    </div>
                  ))}
                </div>
                <button className={styles.exportBtn} onClick={() => window.dispatchEvent(new CustomEvent('exportAnalytics'))}>
                  <Download size={16} /> Export
                </button>
              </div>
            )}

            {!isAnalyticsPage && !isOrderDetailsPage && (
              <>
                {!isSettingsPage && (
                  <div className={styles.statusToggle} onClick={handleToggleShopStatus} style={{ cursor: 'pointer' }}>
                    <div className={styles.statusToggleInfo}>
                      <span className={styles.statusToggleLabel}>Shop Status</span>
                      <span className={styles.statusToggleValue} style={{ color: isShopOpen ? '#10b981' : '#64748b' }}>
                        {!isShopOpen && <span style={{width: 6, height: 6, backgroundColor: '#64748b', borderRadius: '50%'}}></span>}
                        {isShopOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>
                    <div className={`${styles.toggleSwitch} ${!isShopOpen ? styles.closed : ''}`}></div>
                  </div>
                )}

              </>
            )}
          </div>
        </header>
        )}

        {/* Page Content */}
        <div className={styles.pageContent} style={{ padding: isOrderDetailsPage ? 0 : 32 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
