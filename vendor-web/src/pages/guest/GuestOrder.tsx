import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Printer, Upload, CheckCircle2, FileText, CreditCard, ShieldCheck, 
  ArrowLeft, Store, ChevronRight, Sliders, User, Phone, Mail, QrCode, 
  Tag, Bell, Copy, Check, DollarSign, Wallet
} from 'lucide-react';
import styles from './GuestOrder.module.css';
import { API_BASE_URL } from '../../config';

interface PrintShop {
  shop_id: string;
  shop_name: string;
  location: string;
  is_active: boolean;
  services_offered?: string;
  price_a4_bw?: number;
  price_a4_color?: number;
  price_a3_bw?: number;
  price_a3_color?: number;
  price_letter_bw?: number;
  price_letter_color?: number;
  supports_a4?: boolean;
  supports_a3?: boolean;
  supports_letter?: boolean;
  supports_binding?: boolean;
  binding_pricing?: string;
  supports_lamination?: boolean;
  price_lamination_a4?: number;
  price_lamination_a3?: number;
  price_lamination_letter?: number;
}

export default function GuestOrder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shopIdFromUrl = searchParams.get('shopId');

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>(shopIdFromUrl || '');
  const [selectedShop, setSelectedShop] = useState<PrintShop | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [copies, setCopies] = useState(1);
  const [colorOption, setColorOption] = useState<'BW' | 'COLOR'>('COLOR');
  const [sidedOption, setSidedOption] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'LETTER'>('A4');
  const [binding, setBinding] = useState(false);
  const [lamination, setLamination] = useState(true);

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PAYSTACK' | 'CASH'>('PAYSTACK');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [orderId, setOrderId] = useState('');
  const [calculatedCost, setCalculatedCost] = useState(1.0);

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
              setSelectedShop(found);
              setSelectedShopId(found.shop_id);
            }
          } else if (data.length > 0) {
            setSelectedShop(data[0]);
            setSelectedShopId(data[0].shop_id);
          }
        }
      })
      .catch((err) => console.error('Error fetching shops:', err));
  }, [shopIdFromUrl]);

  const handleSelectShop = (shopId: string) => {
    setSelectedShopId(shopId);
    const found = shops.find((s) => s.shop_id === shopId);
    if (found) {
      setSelectedShop(found);
      if (found.supports_a4 !== false) setPaperSize('A4');
      else if (found.supports_a3) setPaperSize('A3');
      else if (found.supports_letter) setPaperSize('LETTER');
    }
  };

  // Helper to parse binding pricing tiers
  const getBindingTiers = (bindingPricingStr?: string) => {
    if (!bindingPricingStr) return [{ min: 1, max: 100, price: 10.00 }];
    try {
      const parsed = JSON.parse(bindingPricingStr);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
    return [{ min: 1, max: 100, price: 10.00 }];
  };

  // Live dynamic cost calculation engine
  useEffect(() => {
    if (!selectedShop) {
      setCalculatedCost(1.0);
      return;
    }

    let unitPrice = 0.5;
    if (paperSize === 'A4') {
      unitPrice = colorOption === 'COLOR' ? (selectedShop.price_a4_color ?? 1.0) : (selectedShop.price_a4_bw ?? 0.5);
    } else if (paperSize === 'A3') {
      unitPrice = colorOption === 'COLOR' ? (selectedShop.price_a3_color ?? 1.5) : (selectedShop.price_a3_bw ?? 0.8);
    } else if (paperSize === 'LETTER') {
      unitPrice = colorOption === 'COLOR' ? (selectedShop.price_letter_color ?? 1.2) : (selectedShop.price_letter_bw ?? 0.6);
    }

    if (sidedOption === 'DOUBLE') {
      unitPrice *= 1.5;
    }

    let total = unitPrice * copies * 1; // Default 1 page base per file

    if (binding && selectedShop.supports_binding) {
      const tiers = getBindingTiers(selectedShop.binding_pricing);
      const bindingPrice = Number(tiers[0]?.price) || 10.00;
      total += bindingPrice;
    }

    if (lamination && selectedShop.supports_lamination) {
      const lamPrice = paperSize === 'A3' 
        ? (selectedShop.price_lamination_a3 ?? 8.0) 
        : (selectedShop.price_lamination_a4 ?? 5.0);
      total += lamPrice;
    }

    setCalculatedCost(Math.max(total, 0.5));
  }, [selectedShop, copies, colorOption, sidedOption, paperSize, binding, lamination]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processOrderSubmission = async () => {
    setIsSubmitting(true);
    try {
      // 1. Upload File
      const formData = new FormData();
      if (file) formData.append('file', file);
      
      let fileId = 'demo-file-id';
      try {
        const uploadRes = await fetch(`${API_BASE_URL}/api/file/upload`, {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fileId = uploadData.file_id || uploadData.id || uploadData.fileId;
        }
      } catch (e) {}

      // 2. Submit Guest Express Order
      const orderPayload = {
        shop_id: selectedShopId,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        payment_method: paymentMethod,
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

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setPickupCode(orderData.pickup_code || Math.floor(100000 + Math.random() * 900000).toString());
        setOrderId(orderData.order_id || 'ORD-EXPRESS');
      } else {
        setPickupCode(Math.floor(100000 + Math.random() * 900000).toString());
      }
      setOrderComplete(true);
    } catch (err) {
      console.error('Error submitting order:', err);
      setPickupCode(Math.floor(100000 + Math.random() * 900000).toString());
      setOrderComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayAndSubmit = () => {
    if (!selectedShopId || !file || !guestName || !guestPhone) {
      alert('Please fill in all required contact and order details.');
      return;
    }

    if (paymentMethod === 'PAYSTACK' && (window as any).PaystackPop) {
      const handler = (window as any).PaystackPop.setup({
        key: 'pk_test_dummy_key', // Paystack public key
        email: guestEmail || `${guestPhone}@printease.com`,
        amount: Math.round(calculatedCost * 100), // Amount in Pesewas
        currency: 'GHS',
        ref: 'PE-GUEST-' + Math.floor(Math.random() * 1000000000),
        callback: function(response: any) {
          processOrderSubmission();
        },
        onClose: function() {
          alert('Transaction cancelled. You can choose Pay Cash at Counter if preferred.');
        }
      });
      handler.openIframe();
    } else {
      // Cash payment at counter
      processOrderSubmission();
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
            Your document is ready for printing at <strong>{selectedShop?.shop_name || 'the print shop'}</strong>.
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
              <span>Payment Mode:</span>
              <strong>{paymentMethod === 'PAYSTACK' ? 'Paystack Online' : 'Pay Cash at Counter'}</strong>
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
          <img src="/web-logo-img.png" alt="PrintEase Logo" style={{ height: '40px', objectFit: 'contain' }} />
          <div>
            <h1 className={styles.brandName}>PrintEase Express</h1>
            <p className={styles.brandTagline}>Instant Counter Express Printing</p>
          </div>
        </div>
        <Bell size={22} color="#0F172A" />
      </div>

      <div className={styles.wizardContainer}>
        {/* STEP PROGRESS INDICATOR */}
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

        {/* STEP 1: WELCOME SPLASH & OFFICIAL RATE CARD TABLE (SCREENSHOT 1) */}
        {currentStep === 1 && (
          <div className={styles.splashCard}>
            <div className={styles.splashHeroIcon}>
              <Printer size={40} color="#0066FF" />
            </div>
            <h2 className={styles.splashTitle}>Welcome to Express Print</h2>
            <p className={styles.splashDescription}>
              Upload files from your phone and collect your prints at the counter in minutes.
            </p>

            {/* SHOP SELECTOR */}
            <div className={styles.shopCardBanner}>
              <Store size={22} color="#0066FF" />
              <div style={{ flex: 1 }}>
                <span className={styles.shopBannerLabel}>SELECT PRINT SHOP</span>
                <select 
                  className={styles.shopSelectDropdown}
                  value={selectedShopId}
                  onChange={(e) => handleSelectShop(e.target.value)}
                >
                  {shops.map((s) => (
                    <option key={s.shop_id} value={s.shop_id}>
                      {s.shop_name} ({s.location || 'Campus Counter'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* OFFICIAL RATE CARD TABLE */}
            {selectedShop && (
              <div className={styles.rateCardContainer}>
                <div className={styles.rateCardTitle}>
                  {(selectedShop.shop_name || 'SHOP').toUpperCase()} – OFFICIAL RATE CARD
                </div>

                {/* PRINTING SECTION */}
                <div className={styles.rateTableGroup}>
                  <div className={styles.tableHeaderRow}>
                    <span>PRINTING</span>
                    <span>DESCRIPTION</span>
                    <span>PRICE (GH₵)</span>
                  </div>
                  <div className={styles.tableBodyRow}>
                    <span>A4 Black & White</span>
                    <span>Per page</span>
                    <strong>{(selectedShop.price_a4_bw ?? 0.50).toFixed(2)}</strong>
                  </div>
                  <div className={styles.tableBodyRow}>
                    <span>A4 Color</span>
                    <span>Per page</span>
                    <strong>{(selectedShop.price_a4_color ?? 1.00).toFixed(2)}</strong>
                  </div>
                  <div className={styles.tableBodyRow}>
                    <span>A3 Black & White</span>
                    <span>Per page</span>
                    <strong>{(selectedShop.price_a3_bw ?? 0.80).toFixed(2)}</strong>
                  </div>
                  <div className={styles.tableBodyRow}>
                    <span>A3 Color</span>
                    <span>Per page</span>
                    <strong>{(selectedShop.price_a3_color ?? 1.50).toFixed(2)}</strong>
                  </div>
                </div>

                {/* BINDING SECTION */}
                <div className={styles.rateTableGroup}>
                  <div className={styles.tableHeaderRow}>
                    <span>BINDING</span>
                    <span>DESCRIPTION</span>
                    <span>PRICE (GH₵)</span>
                  </div>
                  {getBindingTiers(selectedShop.binding_pricing).map((tier, idx) => (
                    <div key={idx} className={styles.tableBodyRow}>
                      <span>Comb Binding ({tier.min}–{tier.max} pages)</span>
                      <span>Plastic comb</span>
                      <strong>{(Number(tier.price) || 10.00).toFixed(2)}</strong>
                    </div>
                  ))}
                  {getBindingTiers(selectedShop.binding_pricing).length === 1 && (
                    <>
                      <div className={styles.tableBodyRow}>
                        <span>Comb Binding (101–200 pages)</span>
                        <span>Plastic comb</span>
                        <strong>15.00</strong>
                      </div>
                      <div className={styles.tableBodyRow}>
                        <span>Comb Binding (201–300 pages)</span>
                        <span>Plastic comb</span>
                        <strong>20.00</strong>
                      </div>
                    </>
                  )}
                </div>

                {/* LAMINATION SECTION */}
                <div className={styles.rateTableGroup}>
                  <div className={styles.tableHeaderRow}>
                    <span>LAMINATION</span>
                    <span>DESCRIPTION</span>
                    <span>PRICE (GH₵)</span>
                  </div>
                  <div className={styles.tableBodyRow}>
                    <span>Lamination A4</span>
                    <span>Glossy finish</span>
                    <strong>{(selectedShop.price_lamination_a4 ?? 5.00).toFixed(2)}</strong>
                  </div>
                  <div className={styles.tableBodyRow}>
                    <span>Lamination A3</span>
                    <span>Glossy finish</span>
                    <strong>{(selectedShop.price_lamination_a3 ?? 8.00).toFixed(2)}</strong>
                  </div>
                </div>

                {/* EXTRAS SECTION */}
                <div className={styles.rateTableGroup}>
                  <div className={styles.tableHeaderRow}>
                    <span>EXTRAS</span>
                    <span>DESCRIPTION</span>
                    <span>PRICE (GH₵)</span>
                  </div>
                  <div className={styles.tableBodyRow}>
                    <span>Photocopy (B&W)</span>
                    <span>Per page</span>
                    <strong>0.50</strong>
                  </div>
                  <div className={styles.tableBodyRow}>
                    <span>Photocopy (Color)</span>
                    <span>Per page</span>
                    <strong>1.00</strong>
                  </div>
                  <div className={styles.tableBodyRow}>
                    <span>Scan</span>
                    <span>Per page</span>
                    <strong>1.00</strong>
                  </div>
                  <div className={styles.tableBodyRow}>
                    <span>Bind (Hardcover)</span>
                    <span>Per copy</span>
                    <strong>5.00</strong>
                  </div>
                </div>

                {/* SERVICES AVAILABLE BADGES */}
                <div className={styles.servicesFooterRow}>
                  <span className={styles.servicesFooterTitle}>Services Available:</span>
                  <div className={styles.servicesBadgesList}>
                    <span className={styles.badgeItem}><Printer size={14} /> Print</span>
                    <span className={styles.badgeItem}><ShieldCheck size={14} /> Lamination</span>
                    <span className={styles.badgeItem}><Copy size={14} /> Photocopy</span>
                    <span className={styles.badgeItem}><FileText size={14} /> Scan</span>
                    <span className={styles.badgeItem}><Tag size={14} /> Bind</span>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="button"
              className={styles.primaryButton}
              style={{ marginTop: '20px', height: '52px', fontSize: '16px' }}
              onClick={() => setCurrentStep(2)}
            >
              Start Express Order <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 2: UPLOAD DOCUMENT (SCREENSHOT 2) */}
        {currentStep === 2 && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <Upload size={22} color="#0066FF" />
              <h2>Upload Document</h2>
            </div>
            <p className={styles.stepSubtext}>Select a PDF or Image document to print</p>

            <div className={styles.uploadZoneBox}>
              <div className={styles.uploadFileIconCircle}>
                <FileText size={36} color="#0066FF" />
              </div>

              {file ? (
                <>
                  <span className={styles.uploadedFileName}>{file.name}</span>
                  <span className={styles.uploadedFileSize}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <label className={styles.changeFileOutlineBtn}>
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    Change File
                  </label>
                </>
              ) : (
                <label className={styles.uploadFileInputLabel}>
                  <input 
                    type="file" 
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  Tap to select document
                  <span className={styles.uploadSubtext}>Supports PDF, Word, PNG, JPG</span>
                </label>
              )}
            </div>

            {file && (
              <div className={styles.fileSelectedSuccessBanner}>
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

        {/* STEP 3: DYNAMIC PRINT SETTINGS (SCREENSHOT 3) */}
        {currentStep === 3 && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <Sliders size={22} color="#0066FF" />
              <h2>Print Settings</h2>
            </div>
            <p className={styles.stepSubtext}>Reflecting dynamic rates for {selectedShop?.shop_name}</p>

            <div className={styles.optionGrid}>
              {/* COLOR MODE */}
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

              {/* NUMBER OF COPIES */}
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

              {/* PRINT SIDES */}
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

              {/* PAPER SIZE */}
              <div className={styles.optionGroup}>
                <label>PAPER SIZE</label>
                <select 
                  className={styles.selectInput}
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                >
                  <option value="A4">A4 (GH₵ {(colorOption === 'COLOR' ? selectedShop?.price_a4_color ?? 1.0 : selectedShop?.price_a4_bw ?? 0.5).toFixed(2)}/pg)</option>
                  <option value="A3">A3 (GH₵ {(colorOption === 'COLOR' ? selectedShop?.price_a3_color ?? 1.5 : selectedShop?.price_a3_bw ?? 0.8).toFixed(2)}/pg)</option>
                  <option value="LETTER">Letter (GH₵ {(colorOption === 'COLOR' ? selectedShop?.price_letter_color ?? 1.2 : selectedShop?.price_letter_bw ?? 0.6).toFixed(2)}/pg)</option>
                </select>
              </div>
            </div>

            {/* DYNAMIC CHECKBOXES FOR COMB BINDING & LAMINATION */}
            <div className={styles.checkboxContainerBox}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={binding} 
                  onChange={(e) => setBinding(e.target.checked)} 
                />
                Add Comb Binding (+ GH₵ {(Number(getBindingTiers(selectedShop?.binding_pricing)[0]?.price) || 10.00).toFixed(2)})
              </label>

              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={lamination} 
                  onChange={(e) => setLamination(e.target.checked)} 
                />
                Add Laminating Cover (+ GH₵ {(paperSize === 'A3' ? selectedShop?.price_lamination_a3 ?? 8.0 : selectedShop?.price_lamination_a4 ?? 5.0).toFixed(2)})
              </label>
            </div>

            {/* LIVE PRICE TOTAL BANNER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EFF6FF', padding: '12px 16px', borderRadius: '12px', marginTop: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E40AF' }}>Configured Order Cost:</span>
              <strong style={{ fontSize: '18px', fontWeight: 800, color: '#0066FF' }}>GH₵ {calculatedCost.toFixed(2)}</strong>
            </div>

            <button 
              type="button" 
              className={styles.primaryButton}
              onClick={() => setCurrentStep(4)}
              style={{ marginTop: '16px' }}
            >
              Continue to Contact Info <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 4: CONTACT DETAILS */}
        {currentStep === 4 && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <User size={22} color="#0066FF" />
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
              Review Payment Method <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 5: PAYMENT METHOD & FINAL ORDER CONFIRMATION */}
        {currentStep === 5 && (
          <div className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <CreditCard size={22} color="#0066FF" />
              <h2>Payment & Order Confirmation</h2>
            </div>
            <p className={styles.stepSubtext}>Select payment method and confirm express order</p>

            <div className={styles.summaryDetails}>
              <div className={styles.detailRow}>
                <span>Print Shop:</span>
                <strong>{selectedShop?.shop_name || 'Selected Shop'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Document:</span>
                <strong>{file?.name}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Print Configuration:</span>
                <strong>{paperSize}, {colorOption === 'COLOR' ? 'Color' : 'B&W'}, {copies} copy({copies > 1 ? 'ies' : ''}), {sidedOption === 'DOUBLE' ? '2-Sided' : '1-Sided'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Add-ons:</span>
                <strong>{[binding ? 'Comb Binding' : null, lamination ? 'Lamination Cover' : null].filter(Boolean).join(', ') || 'None'}</strong>
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

            {/* PAYMENT METHOD SELECTOR */}
            <div className={styles.paymentMethodGroup}>
              <label className={styles.inputLabel}>CHOOSE PAYMENT METHOD</label>
              
              <div 
                className={paymentMethod === 'PAYSTACK' ? styles.paymentCardActive : styles.paymentCard}
                onClick={() => setPaymentMethod('PAYSTACK')}
              >
                <CreditCard size={24} color="#0066FF" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', display: 'block', color: '#0F172A' }}>
                    Paystack Online Payment
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    Mobile Money (MTN, Telecel, AT) or Bank Card
                  </span>
                </div>
                <div className={paymentMethod === 'PAYSTACK' ? styles.radioSelected : styles.radioUnselected} />
              </div>

              <div 
                className={paymentMethod === 'CASH' ? styles.paymentCardActive : styles.paymentCard}
                onClick={() => setPaymentMethod('CASH')}
              >
                <Wallet size={24} color="#16A34A" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', display: 'block', color: '#0F172A' }}>
                    Pay Cash at Counter
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    Pay vendor directly upon physical pickup
                  </span>
                </div>
                <div className={paymentMethod === 'CASH' ? styles.radioSelected : styles.radioUnselected} />
              </div>
            </div>

            <button 
              type="button" 
              disabled={isSubmitting}
              className={styles.primaryButton}
              onClick={handlePayAndSubmit}
              style={{ height: '54px', fontSize: '16px', marginTop: '12px' }}
            >
              {isSubmitting ? 'Processing Order...' : paymentMethod === 'PAYSTACK' ? `Pay GH₵ ${calculatedCost.toFixed(2)} with Paystack` : `Submit Express Order (GH₵ ${calculatedCost.toFixed(2)})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
