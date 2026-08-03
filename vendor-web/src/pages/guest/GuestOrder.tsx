import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Printer, Upload, CheckCircle2, FileText, CreditCard, ShieldCheck, ArrowLeft, Store } from 'lucide-react';
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

  const [shops, setShops] = useState<PrintShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>(shopIdFromUrl || '');
  const [selectedShopName, setSelectedShopName] = useState<string>('');

  const [file, setFile] = useState<File | null>(null);
  const [copies, setCopies] = useState(1);
  const [colorOption, setColorOption] = useState<'BW' | 'COLOR'>('BW');
  const [sidedOption, setSidedOption] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');
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

  // Fetch shops
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/shops`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setShops(data);
          if (shopIdFromUrl) {
            const found = data.find((s: PrintShop) => s.shop_id === shopIdFromUrl);
            if (found) setSelectedShopName(found.shop_name);
          }
        }
      })
      .catch((err) => console.error('Error fetching shops:', err));
  }, [shopIdFromUrl]);

  // Calculate estimated cost
  useEffect(() => {
    let pageCost = colorOption === 'COLOR' ? 1.5 : 0.5;
    if (sidedOption === 'DOUBLE') pageCost *= 1.5;
    let total = pageCost * copies * 5; // Default 5 page estimate
    if (binding) total += 5.0;
    if (lamination) total += 3.0;
    setCalculatedCost(Math.max(total, 1.0));
  }, [copies, colorOption, sidedOption, binding, lamination]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSelectShop = (shopId: string) => {
    setSelectedShopId(shopId);
    const found = shops.find((s) => s.shop_id === shopId);
    if (found) setSelectedShopName(found.shop_name);
  };

  const handleSubmitGuestOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) {
      alert('Please select a Print Shop.');
      return;
    }
    if (!file) {
      alert('Please select a document to print.');
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

      if (!uploadRes.ok) throw new Error('File upload failed');
      const uploadedFile = await uploadRes.json();

      // 2. Create Guest Order Payload
      const orderPayload = {
        shop_id: selectedShopId,
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        is_guest: true,
        files: [
          {
            file_id: uploadedFile.file_id || uploadedFile.id,
            copies: copies,
            color_option: colorOption,
            sided_option: sidedOption,
            binding: binding,
            lamination: lamination,
          },
        ],
      };

      const orderRes = await fetch(`${API_BASE_URL}/api/orders/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) throw new Error('Could not create guest order');
      const createdOrder = await orderRes.json();

      // Set pickup code and completed status
      const code = createdOrder.pickup_code || Math.floor(100000 + Math.random() * 900000).toString();
      setPickupCode(code);
      setOrderId(createdOrder.order_id || 'PRO-GUEST');
      setOrderComplete(true);
    } catch (err: any) {
      alert(err.message || 'Failed to place guest order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={48} color="#16A34A" />
          </div>
          <h1 className={styles.successTitle}>Print Order Sent!</h1>
          <p className={styles.successSubtitle}>
            Your document has been sent to <strong>{selectedShopName || 'the print shop'}</strong>.
          </p>

          <div className={styles.codeBox}>
            <span className={styles.codeLabel}>YOUR 6-DIGIT PICKUP CODE</span>
            <span className={styles.codeValue}>{pickupCode}</span>
            <span className={styles.codeNote}>Show this code to the vendor at pickup</span>
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
              <span>Phone:</span>
              <strong>{guestPhone}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Est. Total:</span>
              <strong className={styles.priceText}>GH₵ {calculatedCost.toFixed(2)}</strong>
            </div>
          </div>

          <button className={styles.primaryButton} onClick={() => window.location.reload()}>
            Place Another Express Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.brandRow}>
          <div className={styles.logoBadge}>
            <Printer size={24} color="#0066FF" />
          </div>
          <div>
            <h1 className={styles.brandName}>PrintEase Express</h1>
            <p className={styles.brandTagline}>Instant Campus Guest Printing</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitGuestOrder} className={styles.formCard}>
        {/* Step 1: Shop Selector */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Store size={20} color="#0066FF" />
            <h2>1. Select Print Shop</h2>
          </div>
          {shopIdFromUrl ? (
            <div className={styles.selectedShopBanner}>
              <Store size={18} color="#0066FF" />
              <span>Counter QR Scanned: <strong>{selectedShopName || 'Kingdom Print Shop'}</strong></span>
            </div>
          ) : (
            <select
              className={styles.selectInput}
              value={selectedShopId}
              onChange={(e) => handleSelectShop(e.target.value)}
              required
            >
              <option value="">-- Choose a Print Shop --</option>
              {shops.map((shop) => (
                <option key={shop.shop_id} value={shop.shop_id}>
                  {shop.shop_name} ({shop.location})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 2: Upload File */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Upload size={20} color="#0066FF" />
            <h2>2. Upload Document</h2>
          </div>
          <label className={styles.uploadZone}>
            <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" hidden />
            <FileText size={32} color={file ? '#0066FF' : '#94A3B8'} />
            <span className={styles.uploadText}>{file ? file.name : 'Tap to select document (PDF, Word, Images)'}</span>
            <span className={styles.uploadSubtext}>Maximum file size: 25MB</span>
          </label>
        </div>

        {/* Step 3: Print Options */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Printer size={20} color="#0066FF" />
            <h2>3. Print Settings</h2>
          </div>

          <div className={styles.optionGrid}>
            <div className={styles.optionGroup}>
              <label>Copies</label>
              <input
                type="number"
                min="1"
                max="50"
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                className={styles.numberInput}
              />
            </div>

            <div className={styles.optionGroup}>
              <label>Color</label>
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

            <div className={styles.optionGroup}>
              <label>Sides</label>
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
          </div>

          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={binding} onChange={(e) => setBinding(e.target.checked)} />
              Add Binding (+ GH₵ 5.00)
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={lamination} onChange={(e) => setLamination(e.target.checked)} />
              Add Lamination (+ GH₵ 3.00)
            </label>
          </div>
        </div>

        {/* Step 4: Guest Contact Details */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <ShieldCheck size={20} color="#0066FF" />
            <h2>4. Your Contact Details</h2>
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Full Name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className={styles.textInput}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number (for pickup SMS)"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className={styles.textInput}
              required
            />
            <input
              type="email"
              placeholder="Email (Optional)"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className={styles.textInput}
            />
          </div>
        </div>

        {/* Cost Summary & Pay Action */}
        <div className={styles.footerSection}>
          <div className={styles.costRow}>
            <span>Estimated Total:</span>
            <span className={styles.totalPrice}>GH₵ {calculatedCost.toFixed(2)}</span>
          </div>
          <button type="submit" disabled={isSubmitting} className={styles.primaryButton}>
            {isSubmitting ? 'Processing Order...' : 'Pay & Send Express Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
