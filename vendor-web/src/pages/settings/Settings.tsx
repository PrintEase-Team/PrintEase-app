import React, { useState, useEffect } from 'react';
import { User, Store, Clock, Shield, Bell, Check, AlertTriangle, Phone, Mail, MapPin, CheckCircle2, Search, Navigation, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import styles from './Settings.module.css';
import { jwtDecode } from 'jwt-decode';
// Leaflet map dependencies removed

export default function Settings() {
  const [activeTab, setActiveTab] = useState('shop');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [phone, setPhone] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [priceA4Bw, setPriceA4Bw] = useState<number>(0.5);
  const [priceA4Color, setPriceA4Color] = useState<number>(1.0);
  const [priceA3Bw, setPriceA3Bw] = useState<number>(1.0);
  const [priceA3Color, setPriceA3Color] = useState<number>(2.0);
  const [priceLetterBw, setPriceLetterBw] = useState<number>(0.6);
  const [priceLetterColor, setPriceLetterColor] = useState<number>(1.2);
  const [supportsA4, setSupportsA4] = useState<boolean>(true);
  const [supportsA3, setSupportsA3] = useState<boolean>(false);
  const [supportsLetter, setSupportsLetter] = useState<boolean>(false);
  const [supportsBinding, setSupportsBinding] = useState<boolean>(false);
  const [bindingPricing, setBindingPricing] = useState<any[]>([{ min: 1, max: 100, price: 12.00 }]);
  const [supportsLamination, setSupportsLamination] = useState<boolean>(false);
  const [priceLaminationA4, setPriceLaminationA4] = useState<number>(5.0);
  const [priceLaminationA3, setPriceLaminationA3] = useState<number>(8.0);
  const [priceLaminationLetter, setPriceLaminationLetter] = useState<number>(5.0);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [pinnedLocationName, setPinnedLocationName] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hours, setHours] = useState<any>({
    Monday: { active: true, open: '08:00', close: '18:00' },
    Tuesday: { active: true, open: '08:00', close: '18:00' },
    Wednesday: { active: true, open: '08:00', close: '18:00' },
    Thursday: { active: true, open: '08:00', close: '18:00' },
    Friday: { active: true, open: '08:00', close: '18:00' },
    Saturday: { active: false, open: '10:00', close: '14:00' },
    Sunday: { active: false, open: '10:00', close: '14:00' },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [statusOverride, setStatusOverride] = useState<string>('NONE');

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const token = localStorage.getItem('vendor_token');
        const vId = localStorage.getItem('vendor_id');
        if (!token || !vId) return;
        setVendorId(vId);

        const userResponse = await fetch(`${API_BASE_URL}/api/users/${vId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setVendorName(userData.full_name || '');
          setVendorEmail(userData.email || '');
        }

        const response = await fetch(`${API_BASE_URL}/api/shops/vendor/${vId}`);
        if (response.ok) {
          const data = await response.json();
          setShopId(data.shop_id);
          setShopName(data.shop_name || '');
          setLocation(data.location || '');
          setPhone(data.phone_number || '');
          setLatitude(data.latitude || null);
          setLongitude(data.longitude || null);
          setAdditionalDetails(data.additional_location_details || '');
          setEstablishedYear(data.established_year || '');
          setPriceA4Bw(data.price_a4_bw ?? 0.5);
          setPriceA4Color(data.price_a4_color ?? 1.0);
          setPriceA3Bw(data.price_a3_bw ?? 1.0);
          setPriceA3Color(data.price_a3_color ?? 2.0);
          setPriceLetterBw(data.price_letter_bw ?? 0.6);
          setPriceLetterColor(data.price_letter_color ?? 1.2);
          setSupportsA4(data.supports_a4 !== undefined ? data.supports_a4 : true);
          setSupportsA3(data.supports_a3 !== undefined ? data.supports_a3 : false);
          setSupportsLetter(data.supports_letter !== undefined ? data.supports_letter : false);
          setSupportsBinding(data.supports_binding !== undefined ? data.supports_binding : false);
          if (data.binding_pricing) {
            try { setBindingPricing(JSON.parse(data.binding_pricing)); } catch(e) {}
          }
          setSupportsLamination(data.supports_lamination !== undefined ? data.supports_lamination : false);
          setPriceLaminationA4(data.price_lamination_a4 ?? 5.0);
          setPriceLaminationA3(data.price_lamination_a3 ?? 8.0);
          setPriceLaminationLetter(data.price_lamination_letter ?? 5.0);
          if (data.services_offered) {
            try { setServicesOffered(JSON.parse(data.services_offered)); } catch(e) {}
          }
          setProfileUrl(data.profile_picture_url || null);
          setBannerUrl(data.banner_picture_url || null);
          if (data.operating_hours && data.operating_hours !== '{}') {
            setHours(JSON.parse(data.operating_hours));
          }
          setStatusOverride(data.status_override || 'NONE');
        }
      } catch (err) {
        console.error('Failed to fetch shop', err);
      }
    };
    fetchShop();
  }, []);

  const handleUpdateOverride = async (overrideValue: string) => {
    if (!shopId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/shops/${shopId}/status-override`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ override: overrideValue })
      });
      if (res.ok) {
        setStatusOverride(overrideValue);
        alert(`Shop status updated to ${overrideValue.replace('_', ' ')}!`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status override.');
    }
  };

  const handleSaveShop = async () => {
    if (!vendorId) return;
    setIsSaving(true);
    try {
      await fetch(`${API_BASE_URL}/api/shops/vendor/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shopName,
          location: location,
          phone_number: phone,
          operating_hours: JSON.stringify(hours),
          is_active: true,
          latitude: latitude,
          longitude: longitude,
          additional_location_details: additionalDetails,
          established_year: establishedYear,
          price_a4_bw: priceA4Bw,
          price_a4_color: priceA4Color,
          price_a3_bw: priceA3Bw,
          price_a3_color: priceA3Color,
          price_letter_bw: priceLetterBw,
          price_letter_color: priceLetterColor,
          supports_a4: supportsA4,
          supports_a3: supportsA3,
          supports_letter: supportsLetter,
          supports_binding: supportsBinding,
          binding_pricing: JSON.stringify(bindingPricing),
          supports_lamination: supportsLamination,
          price_lamination_a4: priceLaminationA4,
          price_lamination_a3: priceLaminationA3,
          price_lamination_letter: priceLaminationLetter,
          services_offered: JSON.stringify(servicesOffered)
        })
      });
      alert('Shop details saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save shop details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    if (!e.target.files || !e.target.files[0] || !vendorId) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/shops/vendor/${vendorId}/upload-image?type=${type}`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        if (type === 'profile') setProfileUrl(data.profile_picture_url);
        if (type === 'banner') setBannerUrl(data.banner_picture_url);
        alert('Image uploaded successfully!');
      } else {
        alert('Failed to upload image');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading image');
    }
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      const delayDebounceFn = setTimeout(async () => {
        setIsSearching(true);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          setSearchResults(data || []);
          setShowDropdown(true);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            if (data && data.display_name) {
              const nameParts = data.display_name.split(',');
              setLocation(nameParts[0]);
              setPinnedLocationName(data.display_name);
            } else {
              setLocation('Current Location');
              setPinnedLocationName('GPS Coordinates captured');
            }
          } catch (e) {
            setLocation('Current Location');
            setPinnedLocationName('GPS Coordinates captured');
          }
        },
        (error) => alert('Error getting location: ' + error.message)
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  // Removed LocationPicker and handleSearchLocation

  // Helper for rendering days
  const formatTime12Hour = (time24h: string) => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const TimePicker = ({ value, onChange }: { value: string, onChange: (e: any) => void }) => (
    <div className={styles.timeInputWrapper}>
      <Clock size={16} color="#3b82f6" />
      <span className={styles.timeText}>{formatTime12Hour(value)}</span>
      <ChevronDown size={16} color="#64748b" />
      <input 
        type="time" 
        value={value} 
        onChange={onChange} 
        className={styles.hiddenTimeInput} 
      />
    </div>
  );

  const renderHourRow = (day: string) => {
    const isActive = hours[day]?.active;
    const openTime = hours[day]?.open || '08:00';
    const closeTime = hours[day]?.close || '18:00';

    const toggleActive = () => {
      setHours((prev: any) => ({
        ...prev,
        [day]: { ...prev[day], active: !isActive }
      }));
    };

    const updateTime = (field: 'open'|'close', val: string) => {
      setHours((prev: any) => ({
        ...prev,
        [day]: { ...prev[day], [field]: val }
      }));
    };

    return (
      <div className={styles.hourRow} key={day}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className={`${styles.toggleSwitch} ${!isActive ? styles.disabled : ''}`} onClick={toggleActive} style={{ cursor: 'pointer' }}>
            <div className={styles.toggleKnob}></div>
          </div>
          <span className={styles.hourDay} style={{ color: isActive ? '#0f172a' : '#94a3b8' }}>{day}</span>
        </div>
        
        {isActive ? (
          <div className={styles.hourInputs}>
            <TimePicker value={openTime} onChange={(e) => updateTime('open', e.target.value)} />
            <span style={{ color: '#94a3b8', fontSize: 14, margin: '0 8px' }}>to</span>
            <TimePicker value={closeTime} onChange={(e) => updateTime('close', e.target.value)} />
          </div>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', paddingRight: 40 }}>Closed</span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.settingsPage}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Settings</h3>
        <nav className={styles.navMenu}>
          <button 
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profile
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'shop' ? styles.active : ''}`}
            onClick={() => setActiveTab('shop')}
          >
            <Store size={18} /> Shop Details
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'hours' ? styles.active : ''}`}
            onClick={() => setActiveTab('hours')}
          >
            <Clock size={18} /> Operating Hours
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'pricing' ? styles.active : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <Store size={18} /> Pricing Strategy
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'security' ? styles.active : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} /> Security
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={styles.content}>
        
        {/* FORCE CLOSE BANNER */}
        <div style={{
          backgroundColor: statusOverride === 'CLOSED' ? '#fee2e2' : '#f8fafc',
          border: `1px solid ${statusOverride === 'CLOSED' ? '#ef4444' : '#e2e8f0'}`,
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: statusOverride === 'CLOSED' ? '#b91c1c' : '#0f172a', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold' }}>
              {statusOverride === 'CLOSED' ? '⚠️ YOUR SHOP IS CURRENTLY FORCE CLOSED' : 'Force Close Shop'}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: statusOverride === 'CLOSED' ? '#991b1b' : '#64748b' }}>
              {statusOverride === 'CLOSED' 
                ? 'Your shop is offline. Toggle the switch to resume work now.' 
                : 'Instantly close your shop for the rest of your shift if you have too many orders.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {statusOverride === 'CLOSED' && (
              <span style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c' }}>Resume Work Now &rarr;</span>
            )}
            <div 
              className={`${styles.toggleSwitch} ${statusOverride !== 'CLOSED' ? styles.disabled : ''}`} 
              onClick={() => handleUpdateOverride(statusOverride === 'CLOSED' ? 'NONE' : 'CLOSED')} 
              style={{ 
                cursor: 'pointer', 
                backgroundColor: statusOverride === 'CLOSED' ? '#ef4444' : '' 
              }}
            >
              <div className={styles.toggleKnob}></div>
            </div>
          </div>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Profile Information</h2>
              <p className={styles.sectionSubtitle}>Manage your personal account details and preferences.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Personal Details</h4>
                <p className={styles.cardDescription}>This information will be displayed privately on your account.</p>
              </div>

              <div className={styles.avatarSection}>
                <div className={styles.avatarCircle} style={{ overflow: 'hidden' }}>
                  {profileUrl ? (
                    <img src={profileUrl.startsWith('http') ? profileUrl : `${API_BASE_URL}${profileUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    vendorName ? vendorName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'VN'
                  )}
                </div>
                <div className={styles.avatarActions}>
                  <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                    <button className={styles.btnSecondary}>Change Avatar</button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'profile')} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                  </div>
                  <button className={styles.btnSecondary} style={{ color: '#ef4444', borderColor: '#fecaca' }}>Remove</button>
                </div>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Full Name</label>
                  <div className={styles.inputIconWrapper}>
                    <User size={16} className={styles.inputIconLeft} />
                    <input className={styles.input} type="text" value={vendorName || 'Loading...'} disabled />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Email Address</label>
                  <div className={styles.inputIconWrapper}>
                    <Mail size={16} className={styles.inputIconLeft} />
                    <input className={styles.input} type="email" value={vendorEmail || 'Loading...'} disabled />
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnPrimary}>Save Changes</button>
              </div>
            </div>
          </>
        )}

        {/* SHOP DETAILS TAB */}
        {activeTab === 'shop' && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Shop Details</h2>
              <p className={styles.sectionSubtitle}>Update your business information visible to students.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Public Information</h4>
                <p className={styles.cardDescription}>Students will see these details when placing an order.</p>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Shop Name</label>
                  <div className={styles.inputIconWrapper}>
                    <Store size={16} className={styles.inputIconLeft} />
                    <input className={styles.input} type="text" value={shopName} onChange={e => setShopName(e.target.value)} />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <div className={styles.inputIconWrapper}>
                    <Phone size={16} className={styles.inputIconLeft} />
                    <input className={styles.input} type="text" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Established Year</label>
                  <div className={styles.inputIconWrapper}>
                    <Clock size={16} className={styles.inputIconLeft} />
                    <input className={styles.input} type="text" placeholder="e.g. 2010" value={establishedYear} onChange={e => setEstablishedYear(e.target.value)} />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Shop Profile Picture</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {profileUrl ? (
                      <img src={profileUrl.startsWith('http') ? profileUrl : `${API_BASE_URL}${profileUrl}`} alt="Profile" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Store size={20} color="#94a3b8" />
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} style={{ fontSize: 13 }} />
                  </div>
                </div>
                <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Shop Banner Image</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {bannerUrl ? (
                      <img src={bannerUrl.startsWith('http') ? bannerUrl : `${API_BASE_URL}${bannerUrl}`} alt="Banner" style={{ width: '100%', height: 160, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: 160, borderRadius: 8, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>No banner uploaded</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={20} color="#005CE6" />
                  <h4 className={styles.cardTitle} style={{ margin: 0 }}>Shop Location</h4>
                  <span className={styles.verifiedBadge}>Verified</span>
                </div>
              </div>
              <p className={styles.cardDescription} style={{ padding: '0 24px' }}>Help students find your shop easily.</p>

              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {/* Left Column: Search */}
                  <div>
                    <h5 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>1. Search for your location</h5>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Start typing your location and select from the suggestions.</p>
                    
                    <div style={{ position: 'relative' }}>
                      <div className={styles.inputIconWrapper} style={{ marginTop: 0 }}>
                        <Search size={16} className={styles.inputIconLeft} color="#005CE6" />
                        <input 
                          className={styles.input} 
                          type="text" 
                          placeholder="Search for your shop location..." 
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.length === 0) setShowDropdown(false);
                          }}
                          style={{ borderColor: showDropdown ? '#005CE6' : '#e2e8f0' }}
                        />
                      </div>
                      
                      {showDropdown && searchResults.length > 0 && (
                        <div className={styles.searchDropdown}>
                          {searchResults.map((result: any, index: number) => {
                            const nameParts = result.display_name.split(',');
                            const title = nameParts[0];
                            const subtitle = nameParts.slice(1).join(',').trim();
                            return (
                              <div 
                                key={index} 
                                className={`${styles.searchDropdownItem} ${location === title ? styles.active : ''}`}
                                onClick={() => {
                                  setLocation(title);
                                  setPinnedLocationName(result.display_name);
                                  setLatitude(parseFloat(result.lat));
                                  setLongitude(parseFloat(result.lon));
                                  setShowDropdown(false);
                                  setSearchQuery('');
                                }}
                              >
                                <div style={{ marginTop: 2 }}>
                                  {location === title ? <CheckCircle2 size={16} color="#005CE6" /> : <MapPin size={16} color="#94a3b8" />}
                                </div>
                                <div>
                                  <div className={styles.searchDropdownTitle}>{title}</div>
                                  <div className={styles.searchDropdownSubtitle}>{subtitle}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Selected Location Display */}
                  <div>
                    <div className={styles.selectedLocationBox}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>Selected Location</span>
                        {latitude && longitude && <CheckCircle2 size={16} color="#16a34a" />}
                      </div>
                      
                      {latitude && longitude ? (
                        <>
                          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <MapPin size={16} color="#005CE6" />
                            </div>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{location || 'Location Set'}</div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{pinnedLocationName || 'Coordinates set manually'}</div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span className={styles.verifiedBadge} style={{ marginLeft: 0 }}>GPS Verified</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>Coordinates captured automatically.</span>
                          </div>
                          
                          <button 
                            className={styles.btnSecondary} 
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 'auto', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#005CE6' }}
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank')}
                          >
                            <Navigation size={14} /> Open in Google Maps
                          </button>
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                          <MapPin size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                          <span style={{ fontSize: 13 }}>No location selected yet.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Finding Instructions */}
                <div style={{ marginTop: 24 }}>
                  <h5 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>2. Finding Instructions <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span></h5>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Add helpful directions so students can easily find your shop.</p>
                  
                  <div style={{ position: 'relative' }}>
                    <textarea 
                      className={styles.input} 
                      placeholder="e.g. Next to Paa Joe Stadium, second floor, room 12, opposite the pharmacy." 
                      value={additionalDetails} 
                      onChange={e => setAdditionalDetails(e.target.value.substring(0, 200))} 
                      style={{ minHeight: 80, resize: 'vertical', padding: '12px 16px', paddingBottom: 28, backgroundColor: '#f8fafc' }}
                    />
                    <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                      {additionalDetails.length}/200
                    </div>
                  </div>
                </div>

                {/* Use Current Location Footer Box */}
                <div className={styles.locationFooterBox}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <Navigation size={20} className={styles.locationFooterIcon} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Can't find your exact location?</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Use your current location to set it automatically.</div>
                    </div>
                  </div>
                  <button 
                    className={styles.btnSecondary} 
                    onClick={(e) => {
                      e.preventDefault();
                      handleGetCurrentLocation();
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#005CE6' }}
                  >
                    <Navigation size={16} /> Use My Current Location
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Services Offered</h4>
                <p className={styles.cardDescription}>Select all the printing services you currently provide.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', padding: '16px 24px' }}>
                {['Print', 'Photocopy', 'Scan', 'Bind', 'Lamination'].map(service => (
                  <label key={service} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={servicesOffered.includes(service)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setServicesOffered([...servicesOffered, service]);
                        } else {
                          setServicesOffered(servicesOffered.filter(s => s !== service));
                        }
                      }}
                      style={{ width: 18, height: 18, accentColor: '#005CE6', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 15, color: '#1e293b' }}>{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Legal & Compliance</h4>
                <p className={styles.cardDescription}>Optional registration details for verification purposes.</p>
              </div>

              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Business Registration No.</label>
                  <input className={styles.input} type="text" defaultValue="GCB-123456789" />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Tax ID (TIN)</label>
                  <input className={styles.input} type="text" defaultValue="P0012345678" />
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnPrimary} onClick={handleSaveShop} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Update Shop Details'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* OPERATING HOURS TAB */}
        {activeTab === 'hours' && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Operating Hours</h2>
              <p className={styles.sectionSubtitle}>Define when your shop is open to automatically accept orders.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Weekly Schedule</h4>
                <p className={styles.cardDescription}>Toggle days on/off and set specific times.</p>
              </div>

              <div className={styles.hoursList}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => renderHourRow(day))}
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnPrimary} onClick={handleSaveShop} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pricing Strategy</h2>
              <p className={styles.sectionSubtitle}>Configure your costs per physical printed sheet (leaf).</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Sheet Pricing</h4>
                <p className={styles.cardDescription}>These prices apply per physical sheet of paper used.</p>
              </div>

              <div className={styles.inputGrid}>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                  <h5 style={{ fontSize: 14, color: '#0f172a', margin: 0 }}>A4 Paper Size</h5>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#475569' }}>
                    <input type="checkbox" checked={supportsA4} onChange={(e) => setSupportsA4(e.target.checked)} style={{ accentColor: '#005CE6', width: 16, height: 16 }} />
                    Enable A4
                  </label>
                </div>
                {supportsA4 && (
                  <>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Black & White (GH¢)</label>
                      <input 
                        className={styles.input} 
                        type="number" step="0.1" min="0"
                        value={priceA4Bw} onChange={e => setPriceA4Bw(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Color (GH¢)</label>
                      <input 
                        className={styles.input} 
                        type="number" step="0.1" min="0"
                        value={priceA4Color} onChange={e => setPriceA4Color(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                  </>
                )}

                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                  <h5 style={{ fontSize: 14, color: '#0f172a', margin: 0 }}>A3 Paper Size</h5>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#475569' }}>
                    <input type="checkbox" checked={supportsA3} onChange={(e) => setSupportsA3(e.target.checked)} style={{ accentColor: '#005CE6', width: 16, height: 16 }} />
                    Enable A3
                  </label>
                </div>
                {supportsA3 && (
                  <>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Black & White (GH¢)</label>
                      <input 
                        className={styles.input} 
                        type="number" step="0.1" min="0"
                        value={priceA3Bw} onChange={e => setPriceA3Bw(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Color (GH¢)</label>
                      <input 
                        className={styles.input} 
                        type="number" step="0.1" min="0"
                        value={priceA3Color} onChange={e => setPriceA3Color(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                  </>
                )}

                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                  <h5 style={{ fontSize: 14, color: '#0f172a', margin: 0 }}>Letter Paper Size</h5>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#475569' }}>
                    <input type="checkbox" checked={supportsLetter} onChange={(e) => setSupportsLetter(e.target.checked)} style={{ accentColor: '#005CE6', width: 16, height: 16 }} />
                    Enable Letter
                  </label>
                </div>
                {supportsLetter && (
                  <>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Black & White (GH¢)</label>
                      <input 
                        className={styles.input} 
                        type="number" step="0.1" min="0"
                        value={priceLetterBw} onChange={e => setPriceLetterBw(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Color (GH¢)</label>
                      <input 
                        className={styles.input} 
                        type="number" step="0.1" min="0"
                        value={priceLetterColor} onChange={e => setPriceLetterColor(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                  </>
                )}
              </div>

              <div className={styles.inputGrid} style={{ marginTop: 24 }}>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                  <h5 style={{ fontSize: 14, color: '#0f172a', margin: 0 }}>Binding Service</h5>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#475569' }}>
                    <input type="checkbox" checked={supportsBinding} onChange={(e) => setSupportsBinding(e.target.checked)} style={{ accentColor: '#005CE6', width: 16, height: 16 }} />
                    Enable Binding
                  </label>
                </div>
                {supportsBinding && (
                  <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <label className={styles.label} style={{ marginBottom: 0 }}>Comb Binding Pricing Tiers (by sheets)</label>
                      <button 
                        className={styles.btnSecondary} 
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => setBindingPricing([...bindingPricing, { min: bindingPricing.length > 0 ? bindingPricing[bindingPricing.length - 1].max + 1 : 1, max: bindingPricing.length > 0 ? bindingPricing[bindingPricing.length - 1].max + 100 : 100, price: 10.00 }])}
                      >
                        + Add Tier
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {bindingPricing.map((tier, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#64748b', marginBottom: 4, display: 'block' }}>Min Sheets</label>
                            <input className={styles.input} type="number" value={tier.min} onChange={(e) => {
                              const newTiers = [...bindingPricing];
                              newTiers[index].min = parseInt(e.target.value) || 0;
                              setBindingPricing(newTiers);
                            }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#64748b', marginBottom: 4, display: 'block' }}>Max Sheets</label>
                            <input className={styles.input} type="number" value={tier.max} onChange={(e) => {
                              const newTiers = [...bindingPricing];
                              newTiers[index].max = parseInt(e.target.value) || 0;
                              setBindingPricing(newTiers);
                            }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#64748b', marginBottom: 4, display: 'block' }}>Price (GH¢)</label>
                            <input className={styles.input} type="number" step="0.5" value={tier.price} onChange={(e) => {
                              const newTiers = [...bindingPricing];
                              newTiers[index].price = parseFloat(e.target.value) || 0;
                              setBindingPricing(newTiers);
                            }} />
                          </div>
                          <div style={{ marginTop: 18 }}>
                            <button 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 8 }}
                              onClick={() => {
                                const newTiers = [...bindingPricing];
                                newTiers.splice(index, 1);
                                setBindingPricing(newTiers);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      {bindingPricing.length === 0 && (
                        <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13, border: '1px dashed #cbd5e1', borderRadius: 8 }}>
                          No binding tiers added. Add a tier to offer binding.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                  <h5 style={{ fontSize: 14, color: '#0f172a', margin: 0 }}>Lamination Service</h5>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#475569' }}>
                    <input type="checkbox" checked={supportsLamination} onChange={(e) => setSupportsLamination(e.target.checked)} style={{ accentColor: '#005CE6', width: 16, height: 16 }} />
                    Enable Lamination
                  </label>
                </div>
                {supportsLamination && (
                  <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 8 }}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>A4 Lamination (GH¢)</label>
                      <input 
                        className={styles.input} 
                        type="number" step="0.5" min="0"
                        value={priceLaminationA4} onChange={e => setPriceLaminationA4(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>A3 Lamination (GH¢)</label>
                      <input 
                        className={styles.input} 
                        type="number" step="0.5" min="0"
                        value={priceLaminationA3} onChange={e => setPriceLaminationA3(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Letter Lamination (GH¢)</label>
                      <input 
                        className={styles.input} 
                        type="number" step="0.5" min="0"
                        value={priceLaminationLetter} onChange={e => setPriceLaminationLetter(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnPrimary} onClick={handleSaveShop} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Pricing'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Account Security</h2>
              <p className={styles.sectionSubtitle}>Manage your password and secure your account.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>Change Password</h4>
                <p className={styles.cardDescription}>Ensure your account is using a long, random password to stay secure.</p>
              </div>

              <div className={styles.inputGroup} style={{ maxWidth: 400 }}>
                <label className={styles.label}>Current Password</label>
                <input className={styles.input} type="password" placeholder="••••••••" />
              </div>
              
              <div className={styles.inputGroup} style={{ maxWidth: 400 }}>
                <label className={styles.label}>New Password</label>
                <input className={styles.input} type="password" placeholder="Create a new password" />
              </div>

              <div className={styles.passwordReqs}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Password must contain:</span>
                <div className={styles.reqList}>
                  <div className={styles.reqItem}><CheckCircle2 size={16} color="#10b981" /> 8 characters minimum</div>
                  <div className={styles.reqItem}><CheckCircle2 size={16} color="#10b981" /> One uppercase character</div>
                  <div className={styles.reqItem}><CheckCircle2 size={16} color="#10b981" /> One number</div>
                  <div className={styles.reqItem}><CheckCircle2 size={16} color="#10b981" /> One special character</div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnPrimary}>Update Password</button>
              </div>
            </div>

            <div className={`${styles.card} ${styles.dangerCard}`}>
              <div className={`${styles.cardHeader} ${styles.dangerCardHeader}`}>
                <h4 className={styles.cardTitle}>Danger Zone</h4>
                <p className={styles.cardDescription}>Destructive actions that will immediately affect your shop's availability.</p>
              </div>

              <div className={styles.dangerRow}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: 14, color: '#0f172a' }}>Temporarily Close Shop</h5>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Stop receiving new orders instantly. You can reopen anytime.</p>
                </div>
                <button className={styles.btnDanger}>Close Shop Now</button>
              </div>

              <div style={{ height: 1, background: '#fecaca', margin: '16px 0' }}></div>

              <div className={styles.dangerRow}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: 14, color: '#0f172a' }}>Sign Out</h5>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>End your current session on this device.</p>
                </div>
                <button className={styles.btnSecondary} style={{ color: '#0f172a' }}>Sign Out</button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
