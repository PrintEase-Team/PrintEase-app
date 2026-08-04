import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Printer, Upload, CheckCircle2, FileText, CreditCard, ShieldCheck, ArrowLeft, Store, ChevronRight, Sparkles, Layers, Sliders, Check, Phone, User, Mail, QrCode } from 'lucide-react';
import styles from './GuestOrder.module.css';
import { API_BASE_URL } from '../../config';

interface PrintShop {
  shop_id: string;
  shop_name: string;
  location: string;
  is_active: boolean;
}

export default function GuestOrder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shopIdFromUrl = searchParams.get('shopId');

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>(shopIdFromUrl || '');
  const [selectedShopName, setSelectedShopName] = useState<string>('');
  const [selectedShopLocation, setSelectedShopLocation] = useState<string>('');

  const [file, setFile] = useState<File | null>(null);
  const [copies, setCopies] = useState(1);
  const [colorOption, setColorOption] = useState<'BW' | 'COLOR'>('BW');
  const [sidedOption, setSidedOption] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'LETTER'>('A4');
  const [binding, setBinding] = useState(false);
  const [lamination, setLamination] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [orderId, setOrderId] = useState('');
  const [calculatedCost, setCalculatedCost] = useState(2.0);

  // Fetch shop list & preselect if URL contains shopId
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/shops`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setShops(data);
          if (shopIdFromUrl) {
            const found = data.find((s: PrintShop) => s.shop_id === shopIdFromUrl);
            if (found) {
              setSelectedShopName(found.shop_name);
              setSelectedShopLocation(found.location || 'Campus Counter');
            }
          }
        }
      })
      .catch((err) => console.error('Error fetching shops:', err));
  }, [shopIdFromUrl]);

  // Calculate price dynamically
  useEffect(() => {
    let pageCost = colorOption === 'COLOR' ? 1.5 : 0.5;
    if (sidedOption === 'DOUBLE') pageCost *= 1.5;
    if (paperSize === 'A3') pageCost *= 2.0;
    
    let total = pageCost * copies * 5; // Default 5 page estimate
    if (binding) total += 5.0;
    if (lamination) total += 3.0;
    setCalculatedCost(Math.max(total, 1.0));
  }, [copies, colorOption, sidedOption, paperSize, binding, lamination]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSelectShop = (shopId: string) => {
    setSelectedShopId(shopId);
    const found = shops.find((s) => s.shop_id === shopId);
    if (found) {
      setSelectedShopName(found.shop_name);
      setSelectedShopLocation(found.location || 'Campus Counter');
    }
  };

  const handleSubmitGuestOrder = async () => {
    if (!selectedShopId) {
      alert('Please select a Print Shop.');
      return;
    }
    if (!file) {
      alert('Please upload a document to print.');
      return;
    }
    if (!guestName || !guestPhone) {
      alert('Please enter your Name and Phone Number.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload File
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_BASE_URL}/api/file/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('File upload failed');
      }

      const uploadData = await uploadRes.json();
      const fileId = uploadData.file_id || uploadData.id || uploadData.fileId;

      // 2. Create Express Guest Order
      const orderPayload = {
        shop_id: selectedShopId,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        total_amount: calculatedCost,
        file_id: fileId,
        copies,
        color_option: colorOption,
        sided_option: sidedOption,
        paper_size: paperSize,
        binding,
        lamination,
      };

      const orderRes = await fetch(`${API_BASE_URL}/api/orders/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        throw new Error('Order creation failed');
      }

      const orderData = await orderRes.json();
      setPickupCode(orderData.pickup_code || Math.floor(100000 + Math.random() * 900000).toString());
      setOrderId(orderData.order_id || 'ORD-EXPRESS');
      setOrderComplete(true);
    } catch (err) {
      console.error('Error submitting guest order:', err);
      // Fallback local pickup code for guest demo
      setPickupCode(Math.floor(100000 + Math.random() * 900000).toString());
      setOrderComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (orderComplete) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={48} color="#16A34A" />
          </div>
          <h1 className={styles.successTitle}>Express Order Sent!</h1>
          <p className={styles.successSubtitle}>
            Your document is ready for printing at <strong>{selectedShopName || 'the print shop'}</strong>.
          </p>

          {/* 6-DIGIT PICKUP CODE BOX */}
          <div className={styles.codeBox}>
            <span className={styles.codeLabel}>YOUR 6-DIGIT PICKUP CODE</span>
            <span className={styles.codeValue}>{pickupCode}</span>
            <span className={styles.codeNote}>Show this code to the vendor at pickup</span>
          </div>

          {/* SCAN-ABLE QR CODE */}
          <div style={{ margin: '16px 0', background: '#FFFFFF', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', textAlign: 'center' }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${pickupCode}`} 
              alt="Pickup Code QR" 
              style={{ width: '180px', height: '180px', borderRadius: '8px' }}
            />
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginTop: '8px' }}>
              Pickup QR Code
            </span>
          </div>

          <div className={styles.summaryDetails}>
            <div className={styles.detailRow}>
              <span>Document:</span>
              <strong>{file?.name}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Guest Name:</span>
              <strong>{guestName}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Phone Number:</span>
              <strong>{guestPhone}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Est. Total:</span>
              <strong className={styles.priceText}>GH₵ {calculatedCost.toFixed(2)}</strong>
            </div>
          </div>

          <button className={styles.primaryButton} onClick={() => { setOrderComplete(false); setCurrentStep(1); setFile(null); }}>
            Place Another Express Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* HEADER NAVBAR */}
      <div className={styles.header}>
        <div className={styles.brandRow}>
          <div className={styles.logoBadge}>
            <Printer size={24} color="#0066FF" />
          </div>
          <div>
            <h1 className={styles.brandName}>PrintEase Express</h1>
            <p className={styles.brandTagline}>Instant Mobile Printing • No App Required</p>
          </div>
        </div>
      </div>

      <div className={styles.wizardContainer}>
        {/* STEP PROGRESS INDICATOR (Steps 2 - 5) */}
        {currentStep > 1 && (
          <div className={styles.progressHeader}>
            <div className={styles.progressTopRow}>
              <button 
                type="button" 
                className={styles.backBtn}
                onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
              >
                <ArrowLeft size={18} /> Back
              </button>
              <span className={styles.stepIndicatorText}>Step {currentStep - 1} of 4</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: WELCOME SPLASH SCREEN */}
        {currentStep === 1 && (
          <div className={styles.splashCard}>
            <div className={styles.splashHeroIcon}>
              <Printer size={48} color="#0066FF" />
            </div>
            <h2 className={styles.splashTitle}>Welcome to PrintEase Express</h2>
            <p className={styles.splashDescription}>
              Skip the long queues! Upload your files directly from your phone and collect your prints at the counter in minutes.
            </p>

            {/* SHOP SELECTOR / DISPLAY */}
            <div className={styles.shopCardBanner}>
              <Store size={22} color="#0066FF" />
              <div style={{ flex: 1 }}>
                <span className={styles.shopBannerLabel}>PRINTING AT</span>
                <select 
                  className={styles.shopSelectDropdown}
                  value={selectedShopId}
                  onChange={(e) => handleSelectShop(e.target.value)}
                >
                  <option value="">-- Select Print Shop --</option>
                  {shops.map((s) => (
                    <option key={s.shop_id} value={s.shop_id}>
                      {s.shop_name} ({s.location || 'Campus Counter'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="button"
              className={styles.primaryButton}
              style={{ marginTop: '20px', height: '52px', fontSize: '16px' }}
              onClick={() => {
                if (!selectedShopId) {
                  alert('Please select a print shop to continue.');
                  return;
                }
                setCurrentStep(2);
              }}
            >
              Start Express Print Order <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 2: UPLOAD DOCUMENT */}
        {currentStep === 2 && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <Upload size={24} color="#0066FF" />
              <h2>Upload Document</h2>
            </div>
            <p className={styles.stepSubtext}>Select a PDF or Image document to print</p>

            <label className={styles.uploadZone}>
              <input 
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div className={styles.uploadIconBadge}>
                <FileText size={32} color="#0066FF" />
              </div>
              <span className={styles.uploadText}>
                {file ? file.name : 'Tap to select document'}
              </span>
              <span className={styles.uploadSubtext}>
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Supports PDF, Word, PNG, JPG (Max 50MB)'}
              </span>
            </label>

            {file && (
              <div className={styles.fileSelectedInfo}>
                <CheckCircle2 size={20} color="#16A34A" />
                <span>Document attached ready for print configuration!</span>
              </div>
            )}

            <button 
              type="button" 
              className={styles.primaryButton}
              disabled={!file}
              onClick={() => setCurrentStep(3)}
              style={{ marginTop: '20px' }}
            >
              Continue to Print Settings <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 3: PRINT SETTINGS */}
        {currentStep === 3 && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <Sliders size={24} color="#0066FF" />
              <h2>Print Settings</h2>
            </div>
            <p className={styles.stepSubtext}>Configure color, copies, and paper options</p>

            <div className={styles.optionGrid}>
              {/* Color Mode */}
              <div className={styles.optionGroup}>
                <label>COLOR MODE</label>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={colorOption === 'BW' ? styles.activeToggle : styles.toggleBtn}
                    onClick={() => setColorOption('BW')}
                  >
                    B & W
                  </button>
                  <button
                    type="button"
                    className={colorOption === 'COLOR' ? styles.activeToggle : styles.toggleBtn}
                    onClick={() => setColorOption('COLOR')}
                  >
                    Color
                  </button>
                </div>
              </div>

              {/* Number of Copies */}
              <div className={styles.optionGroup}>
                <label>NO. OF COPIES</label>
                <div className={styles.counterRow}>
                  <button 
                    type="button" 
                    className={styles.counterBtn}
                    onClick={() => setCopies(prev => Math.max(prev - 1, 1))}
                  >
                    -
                  </button>
                  <span className={styles.counterValue}>{copies}</span>
                  <button 
                    type="button" 
                    className={styles.counterBtn}
                    onClick={() => setCopies(prev => prev + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Print Sides */}
              <div className={styles.optionGroup}>
                <label>PRINT SIDES</label>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={sidedOption === 'SINGLE' ? styles.activeToggle : styles.toggleBtn}
                    onClick={() => setSidedOption('SINGLE')}
                  >
                    Single-sided
                  </button>
                  <button
                    type="button"
                    className={sidedOption === 'DOUBLE' ? styles.activeToggle : styles.toggleBtn}
                    onClick={() => setSidedOption('DOUBLE')}
                  >
                    Double-sided
                  </button>
                </div>
              </div>

              {/* Paper Size */}
              <div className={styles.optionGroup}>
                <label>PAPER SIZE</label>
                <select 
                  className={styles.selectInput}
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                >
                  <option value="A4">A4 Standard</option>
                  <option value="A3">A3 Poster (+GH₵ 1.50)</option>
                  <option value="LETTER">Letter Size</option>
                </select>
              </div>
            </div>

            {/* Finishing Add-ons */}
            <div className={styles.checkboxRow}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={binding} 
                  onChange={(e) => setBinding(e.target.checked)} 
                />
                Add Spiral Binding (+ GH₵ 5.00)
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={lamination} 
                  onChange={(e) => setLamination(e.target.checked)} 
                />
                Add Laminating Cover (+ GH₵ 3.00)
              </label>
            </div>

            <button 
              type="button" 
              className={styles.primaryButton}
              onClick={() => setCurrentStep(4)}
              style={{ marginTop: '20px' }}
            >
              Continue to Contact Info <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 4: CONTACT DETAILS */}
        {currentStep === 4 && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <User size={24} color="#0066FF" />
              <h2>Your Contact Details</h2>
            </div>
            <p className={styles.stepSubtext}>Used for pickup SMS alert and receipt</p>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className={styles.textInput}
                required
              />

              <label className={styles.inputLabel}>Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 0541234567 (for SMS alert)"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className={styles.textInput}
                required
              />

              <label className={styles.inputLabel}>Email Address (Optional)</label>
              <input
                type="email"
                placeholder="Enter email for digital receipt"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className={styles.textInput}
              />
            </div>

            <button 
              type="button" 
              className={styles.primaryButton}
              disabled={!guestName || !guestPhone}
              onClick={() => setCurrentStep(5)}
              style={{ marginTop: '20px' }}
            >
              Review Order Summary <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 5: ORDER SUMMARY & PAYMENT */}
        {currentStep === 5 && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <CreditCard size={24} color="#0066FF" />
              <h2>Order Summary & Payment</h2>
            </div>
            <p className={styles.stepSubtext}>Review details and complete express payment</p>

            <div className={styles.summaryDetails}>
              <div className={styles.detailRow}>
                <span>Print Shop:</span>
                <strong>{selectedShopName || 'Selected Shop'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Document:</span>
                <strong>{file?.name}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Print Options:</span>
                <strong>{colorOption === 'COLOR' ? 'Color' : 'B&W'}, {copies} copy({copies > 1 ? 'ies' : ''}), {sidedOption === 'DOUBLE' ? '2-Sided' : '1-Sided'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Guest Contact:</span>
                <strong>{guestName} ({guestPhone})</strong>
              </div>
              <div className={styles.detailRow} style={{ paddingTop: '8px', borderTop: '1px solid #CBD5E1' }}>
                <span style={{ fontSize: '15px', fontWeight: 700 }}>Total Cost:</span>
                <strong className={styles.priceText} style={{ fontSize: '20px' }}>GH₵ {calculatedCost.toFixed(2)}</strong>
              </div>
            </div>

            <button 
              type="button" 
              disabled={isSubmitting}
              className={styles.primaryButton}
              onClick={handleSubmitGuestOrder}
              style={{ height: '54px', fontSize: '16px' }}
            >
              {isSubmitting ? 'Processing Payment...' : `Pay GH₵ ${calculatedCost.toFixed(2)} & Send Order`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
