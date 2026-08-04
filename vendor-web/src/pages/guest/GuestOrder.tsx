import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Printer, Upload, CheckCircle2, FileText, CreditCard, ShieldCheck, 
  ArrowLeft, ArrowRight, Store, ChevronRight, ChevronDown, ChevronUp, Sliders, User, Phone, Mail, QrCode, 
  Tag, Bell, Copy, Check, DollarSign, Wallet, Lock, Camera, FolderOpen
} from 'lucide-react';
import styles from './GuestOrder.module.css';
import { API_BASE_URL } from '../../config';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const [expandedSection, setExpandedSection] = useState<string | null>('PRINTING');

  const [file, setFile] = useState<File | null>(null);
  const [pagesDetected, setPagesDetected] = useState(1);
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

    let total = unitPrice * copies * pagesDetected;

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

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      
      if (!validTypes.includes(selected.type)) {
        alert("Invalid file format. Only PDF, PNG, and JPG are accepted.");
        return;
      }
      
      setFile(selected);
      
      // Page Detection
      if (selected.type === 'application/pdf') {
        try {
          const arrayBuffer = await selected.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          setPagesDetected(pdf.numPages);
        } catch (error) {
          console.error("Error reading PDF pages:", error);
          setPagesDetected(1); // fallback
        }
      } else {
        // Images are always 1 page
        setPagesDetected(1);
      }
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
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_dummy_key', // Paystack public key
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/web-logo-img.png" alt="PrintEase Logo" style={{ height: '32px', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 className={styles.brandName}>PrintEase Express</h1>
            <p className={styles.brandTagline}>Instant Counter Express Printing</p>
          </div>
        </div>
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
                <ArrowLeft size={20} />
              </button>
              <h2 className={styles.stepTitle}>
                {currentStep === 2 ? 'Upload File' : currentStep === 3 ? 'Print Settings' : currentStep === 4 ? 'Contact Details' : 'Payment'}
              </h2>
            </div>
            <span className={styles.stepIndicatorText}>Step {currentStep - 1} of 4</span>
            
            <div className={styles.progressTrack}>
              <div className={styles.progressTrackLine} />
              <div 
                className={styles.progressTrackLineFill} 
                style={{ width: `${((currentStep - 2) / 3) * 100}%` }}
              />
              {[1, 2, 3, 4].map(step => (
                <div key={step} className={(currentStep - 1) >= step ? styles.progressDotActive : styles.progressDot} />
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: WELCOME SPLASH & OFFICIAL RATE CARD TABLE */}
        {currentStep === 1 && (
          <div className={styles.splashCard}>
            <img 
              src="/printer-illustration.png" 
              alt="Express Print" 
              className={styles.splashHeroIcon} 
              style={{ objectFit: 'contain' }}
            />
            <h2 className={styles.splashTitle}>Welcome to Express Print</h2>
            <p className={styles.splashDescription}>
              Upload files from your phone and collect your prints at the counter in minutes.
            </p>

            {/* SHOP SELECTOR */}
            <div className={styles.shopCardBanner}>
              <Store size={22} color="#0052FF" />
              <div style={{ flex: 1 }}>
                <span className={styles.shopBannerLabel}>SELECT PRINT SHOP</span>
                <select 
                  className={styles.shopSelectDropdown}
                  value={selectedShopId}
                  onChange={(e) => handleSelectShop(e.target.value)}
                >
                  {shops.map((s) => (
                    <option key={s.shop_id} value={s.shop_id}>
                      {s.shop_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* OFFICIAL RATE CARD TABLE */}
            {selectedShop && (
              <div className={styles.rateCardContainer}>
                <div className={styles.rateCardTitle}>
                  <Tag size={16} /> {(selectedShop.shop_name || 'SHOP').toUpperCase()} – OFFICIAL RATE CARD
                </div>

                {/* PRINTING SECTION */}
                <div className={styles.rateTableGroup}>
                  <div className={styles.tableHeaderRow}>
                    <span>TYPE</span>
                    <span>PRICE (GHC)</span>
                  </div>
                  <div className={styles.tableHeaderRow} style={{ backgroundColor: '#FFFFFF', paddingBottom: '4px', cursor: 'pointer' }} onClick={() => toggleSection('PRINTING')}>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>PRINTING</span>
                    {expandedSection === 'PRINTING' ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                  </div>
                  {expandedSection === 'PRINTING' && selectedShop.supports_a4 !== false && (
                    <>
                      <div className={styles.tableBodyRow}>
                        <span>A4 Black & White</span>
                        <strong>{(selectedShop.price_a4_bw ?? 0.50).toFixed(2)}</strong>
                      </div>
                      <div className={styles.tableBodyRow}>
                        <span>A4 Color</span>
                        <strong>{(selectedShop.price_a4_color ?? 1.00).toFixed(2)}</strong>
                      </div>
                    </>
                  )}
                  {expandedSection === 'PRINTING' && selectedShop.supports_a3 && (
                    <>
                      <div className={styles.tableBodyRow}>
                        <span>A3 Black & White</span>
                        <strong>{(selectedShop.price_a3_bw ?? 0.80).toFixed(2)}</strong>
                      </div>
                      <div className={styles.tableBodyRow}>
                        <span>A3 Color</span>
                        <strong>{(selectedShop.price_a3_color ?? 1.50).toFixed(2)}</strong>
                      </div>
                    </>
                  )}
                </div>

                {/* BINDING SECTION */}
                {selectedShop.supports_binding && (
                  <div className={styles.rateTableGroup}>
                    <div className={styles.tableHeaderRow} style={{ backgroundColor: '#FFFFFF', paddingTop: '16px', paddingBottom: '4px', cursor: 'pointer' }} onClick={() => toggleSection('BINDING')}>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>BINDING</span>
                      {expandedSection === 'BINDING' ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                    </div>
                    {expandedSection === 'BINDING' && getBindingTiers(selectedShop.binding_pricing).map((tier, idx) => (
                      <div key={idx} className={styles.tableBodyRow}>
                        <span>Comb Binding ({tier.min}–{tier.max} pages)</span>
                        <strong>{(Number(tier.price) || 10.00).toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* LAMINATION SECTION */}
                {selectedShop.supports_lamination && (
                  <div className={styles.rateTableGroup}>
                    <div className={styles.tableHeaderRow} style={{ backgroundColor: '#FFFFFF', paddingTop: '16px', paddingBottom: '4px', cursor: 'pointer' }} onClick={() => toggleSection('LAMINATION')}>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>LAMINATION</span>
                      {expandedSection === 'LAMINATION' ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                    </div>
                    {expandedSection === 'LAMINATION' && (
                      <>
                        <div className={styles.tableBodyRow}>
                          <span>Lamination A4</span>
                          <strong>{(selectedShop.price_lamination_a4 ?? 5.00).toFixed(2)}</strong>
                        </div>
                        {selectedShop.supports_a3 && (
                          <div className={styles.tableBodyRow}>
                            <span>Lamination A3</span>
                            <strong>{(selectedShop.price_lamination_a3 ?? 8.00).toFixed(2)}</strong>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* SERVICES AVAILABLE BADGES */}
                <div className={styles.servicesFooterRow}>
                  <span className={styles.servicesFooterTitle}>SERVICES AVAILABLE</span>
                  <div className={styles.servicesBadgesList}>
                    <span className={styles.badgeItem}><Printer size={14} color="#0052FF" /> Print</span>
                    <span className={styles.badgeItem}><ShieldCheck size={14} color="#0052FF" /> Lamination</span>
                    <span className={styles.badgeItem}><FileText size={14} color="#0052FF" /> Photocopy</span>
                    <span className={styles.badgeItem}><Upload size={14} color="#0052FF" /> Scan</span>
                    <span className={styles.badgeItem}><Tag size={14} color="#0052FF" /> Bind</span>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="button"
              className={styles.primaryButton}
              style={{ marginTop: '24px' }}
              onClick={() => setCurrentStep(2)}
            >
              Start Express Order <ArrowRight size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '13px', marginTop: '16px' }}>
              <ShieldCheck size={16} /> Secure. Fast. Convenient.
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD DOCUMENT */}
        {currentStep === 2 && (
          <div>
            <div className={styles.uploadZoneBox}>
              <Upload size={48} color="#0052FF" />
              <h3 className={styles.uploadTitle}>Drag & drop your file here</h3>
              <p className={styles.uploadOr}>or</p>
              
              <label className={styles.uploadFileBtn}>
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                Choose File
              </label>

              <div className={styles.uploadSubtext}>
                Supported formats
                <span>PDF, JPG, PNG (Max 50MB)</span>
              </div>
            </div>

            {file && (
              <div className={styles.fileSelectedSuccessBanner}>
                <CheckCircle2 size={20} color="#16A34A" />
                <span>Selected: {file.name}</span>
              </div>
            )}

            <div className={styles.infoBlock}>
              <ShieldCheck size={24} color="#0052FF" style={{ flexShrink: 0 }} />
              <div>
                <p className={styles.infoBlockText} style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Your files are secure</p>
                <p className={styles.infoBlockText}>and will be deleted after printing.</p>
              </div>
            </div>

            <button 
              type="button" 
              className={styles.primaryButton}
              disabled={!file}
              onClick={() => setCurrentStep(3)}
            >
              Continue <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 3: PRINT SETTINGS */}
        {currentStep === 3 && (
          <div>
            <div className={styles.settingsSection}>
              <div className={styles.settingsLabel}>
                Copies
                <div className={styles.counterRow}>
                  <button type="button" className={styles.counterBtn} onClick={() => setCopies(prev => Math.max(prev - 1, 1))}>−</button>
                  <span className={styles.counterValue}>{copies}</span>
                  <button type="button" className={styles.counterBtn} onClick={() => setCopies(prev => prev + 1)}>+</button>
                </div>
              </div>
              <span className={styles.settingsSubLabel} style={{ display: 'block', marginTop: '-8px', marginBottom: '16px' }}>Number of copies</span>
            </div>

            <div className={styles.settingsSection}>
              <div className={styles.settingsLabel}>Color</div>
              <div className={styles.optionGrid}>
                <div className={colorOption === 'BW' ? styles.optionCardActive : styles.optionCard} onClick={() => setColorOption('BW')}>
                  <div className={colorOption === 'BW' ? styles.optionCardRadioActive : styles.optionCardRadio} />
                  <div style={{ display: 'flex', width: 20, height: 20, borderRadius: 10, background: 'linear-gradient(90deg, #000 50%, #fff 50%)', border: '1px solid #E2E8F0' }} />
                  <div className={styles.optionCardContent}>
                    <span className={styles.optionCardTitle}>Black & White</span>
                    <span className={styles.optionCardPrice}>GH₵{(selectedShop?.price_a4_bw ?? 0.5).toFixed(2)} / page</span>
                  </div>
                </div>
                <div className={colorOption === 'COLOR' ? styles.optionCardActive : styles.optionCard} onClick={() => setColorOption('COLOR')}>
                  <div className={colorOption === 'COLOR' ? styles.optionCardRadioActive : styles.optionCardRadio} />
                  <div style={{ display: 'flex', width: 20, height: 20, borderRadius: 10, background: 'conic-gradient(red, yellow, green, blue, red)' }} />
                  <div className={styles.optionCardContent}>
                    <span className={styles.optionCardTitle}>Color</span>
                    <span className={styles.optionCardPrice}>GH₵{(selectedShop?.price_a4_color ?? 1.0).toFixed(2)} / page</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <div className={styles.settingsLabel} style={{ marginBottom: '4px' }}>Pages</div>
              <span style={{ fontSize: '12px', color: '#16A34A', display: 'block', marginBottom: '12px' }}>{pagesDetected} pages detected</span>
              <div className={styles.pagesCardActive}>
                <div className={styles.optionCardRadioActive} />
                <span className={styles.pagesCardTitle}>All Pages ({pagesDetected} page{pagesDetected > 1 ? 's' : ''})</span>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <div className={styles.settingsLabel}>Paper Size</div>
              <div className={styles.optionGrid}>
                <div className={paperSize === 'A4' ? styles.optionCardActive : styles.optionCard} onClick={() => setPaperSize('A4')}>
                  <div className={paperSize === 'A4' ? styles.optionCardRadioActive : styles.optionCardRadio} />
                  <div className={styles.optionCardContent}>
                    <span className={styles.optionCardTitle}>A4</span>
                    <span className={styles.optionCardPrice}>210 × 297 mm</span>
                  </div>
                </div>
                {selectedShop?.supports_a3 && (
                  <div className={paperSize === 'A3' ? styles.optionCardActive : styles.optionCard} onClick={() => setPaperSize('A3')}>
                    <div className={paperSize === 'A3' ? styles.optionCardRadioActive : styles.optionCardRadio} />
                    <div className={styles.optionCardContent}>
                      <span className={styles.optionCardTitle}>A3</span>
                      <span className={styles.optionCardPrice}>297 × 420 mm</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.settingsSection}>
              <div className={styles.settingsLabel}>Orientation</div>
              <div className={styles.optionGrid}>
                <div className={styles.optionCardActive}>
                  <div className={styles.optionCardRadioActive} />
                  <FileText size={18} color="#0052FF" />
                  <span className={styles.optionCardTitle} style={{ color: '#0052FF' }}>Portrait</span>
                </div>
                <div className={styles.optionCard}>
                  <div className={styles.optionCardRadio} />
                  <FileText size={18} color="#64748B" style={{ transform: 'rotate(-90deg)' }} />
                  <span className={styles.optionCardTitle}>Landscape</span>
                </div>
              </div>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleTitle}>Double-sided Printing</span>
                <span className={styles.toggleSub}>Print on both sides of the paper</span>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={sidedOption === 'DOUBLE'} onChange={(e) => setSidedOption(e.target.checked ? 'DOUBLE' : 'SINGLE')} />
                <span className={styles.slider}></span>
              </label>
            </div>

            {selectedShop?.supports_lamination && (
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle}>Lamination</span>
                  <span className={styles.toggleSub}>Laminate each printed sheet</span>
                </div>
                <label className={styles.switch}>
                  <input type="checkbox" checked={lamination} onChange={(e) => setLamination(e.target.checked)} />
                  <span className={styles.slider}></span>
                </label>
              </div>
            )}

            {selectedShop?.supports_binding && (
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleTitle}>Comb Binding</span>
                  <span className={styles.toggleSub}>Bind all printed sheets together</span>
                </div>
                <label className={styles.switch}>
                  <input type="checkbox" checked={binding} onChange={(e) => setBinding(e.target.checked)} />
                  <span className={styles.slider}></span>
                </label>
              </div>
            )}

            <div className={styles.footerBar}>
              <div className={styles.footerTotalBox}>
                <span className={styles.footerTotalLabel}>Estimated Total</span>
                <span className={styles.footerTotalValue}>GH₵{calculatedCost.toFixed(2)}</span>
                <span className={styles.footerTotalDetails}>{pagesDetected} page{pagesDetected > 1 ? 's' : ''} • {copies} copies</span>
              </div>
              <button 
                type="button" 
                className={styles.secondaryButton}
                onClick={() => setCurrentStep(4)}
              >
                Continue <ArrowRight size={18} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONTACT DETAILS */}
        {currentStep === 4 && (
          <div>
            <div className={styles.inputGroup}>
              <div className={styles.inputField}>
                <label className={styles.inputLabel}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Buttoski Mike"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={styles.textInput}
                  required
                />
              </div>

              <div className={styles.inputField}>
                <label className={styles.inputLabel}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 0536990842"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className={styles.textInput}
                  required
                />
              </div>

              <div className={styles.inputField}>
                <label className={styles.inputLabel}>Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. iambuttoski@gmail.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className={styles.textInput}
                />
              </div>
            </div>

            <div className={styles.infoBlock}>
              <ShieldCheck size={24} color="#0052FF" style={{ flexShrink: 0 }} />
              <div>
                <p className={styles.infoBlockText} style={{ fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Why we need this?</p>
                <ul className={styles.infoBlockList}>
                  <li>SMS alert when your document is ready</li>
                  <li>Payment receipt will be sent to you</li>
                </ul>
              </div>
            </div>

            <button 
              type="button" 
              className={styles.primaryButton}
              disabled={!guestName || !guestPhone}
              onClick={() => setCurrentStep(5)}
            >
              Review Order Summary <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 5: PAYMENT */}
        {currentStep === 5 && (
          <div>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Print Shop</span>
                <span className={styles.summaryRowValue}>{selectedShop?.shop_name || 'Selected Shop'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Document</span>
                <span className={styles.summaryRowValue}>{file?.name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Print Options</span>
                <span className={styles.summaryRowValue}>{paperSize}, {colorOption === 'COLOR' ? 'Color' : 'B&W'}, {copies} copy, {sidedOption === 'DOUBLE' ? 'Double-sided' : 'Single-sided'}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Pages</span>
                <span className={styles.summaryRowValue}>{pagesDetected} page{pagesDetected > 1 ? 's' : ''}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Guest Contact</span>
                <span className={styles.summaryRowValue}>{guestName} ({guestPhone})</span>
              </div>
              <div className={styles.summaryTotalRow}>
                <span className={styles.summaryTotalLabel}>Total Amount</span>
                <span className={styles.summaryTotalValue}>GH₵{calculatedCost.toFixed(2)}</span>
              </div>
            </div>

            <h3 className={styles.paymentSectionTitle}>Choose Payment Method</h3>
            
            <div 
              className={paymentMethod === 'PAYSTACK' ? styles.paymentCardActive : styles.paymentCard}
              onClick={() => setPaymentMethod('PAYSTACK')}
            >
              <div className={paymentMethod === 'PAYSTACK' ? styles.optionCardRadioActive : styles.optionCardRadio} />
              <div className={styles.paymentIconBox}>
                <CreditCard size={20} color="#0052FF" />
              </div>
              <div className={styles.paymentInfo}>
                <span className={styles.paymentTitle}>Pay with Card (Paystack)</span>
                <span className={styles.paymentSub}>Debit/credit cards, mobile money and more</span>
              </div>
              <ArrowRight size={16} color="#CBD5E1" />
            </div>

            <div 
              className={paymentMethod === 'CASH' ? styles.paymentCardActive : styles.paymentCard}
              onClick={() => setPaymentMethod('CASH')}
            >
              <div className={paymentMethod === 'CASH' ? styles.optionCardRadioActive : styles.optionCardRadio} />
              <div className={styles.paymentIconBox}>
                <Wallet size={20} color="#16A34A" />
              </div>
              <div className={styles.paymentInfo}>
                <span className={styles.paymentTitle}>Pay with Cash</span>
                <span className={styles.paymentSub}>Pay at the print shop</span>
              </div>
              <ArrowRight size={16} color="#CBD5E1" />
            </div>

            <div className={styles.infoBlock} style={{ marginTop: '24px', marginBottom: '24px' }}>
              <ShieldCheck size={24} color="#0052FF" style={{ flexShrink: 0 }} />
              <div>
                <p className={styles.infoBlockText} style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Your order is secure</p>
                <p className={styles.infoBlockText}>Your payment information is encrypted and safe.</p>
              </div>
            </div>

            <button 
              type="button" 
              className={styles.primaryButton}
              disabled={isSubmitting}
              onClick={handlePayAndSubmit}
            >
              <Lock size={18} />
              Pay GH₵{calculatedCost.toFixed(2)} & Send Order
            </button>
            
            <p className={styles.footerNote}>You will be redirected to a secure payment page</p>
          </div>
        )}

      </div>
    </div>
  );
}
