import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './Login.module.css';
import { API_BASE_URL } from './config';

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const navigate = useNavigate();

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const val = text.replace(/[^0-9]/g, '');
    if (!val) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const digit = val[val.length - 1];
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: code }),
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError(null);
    setSuccess(null);
    try {
      await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSuccess('Verification code resent!');
      setTimer(60);
    } catch (err) {
      setError('Failed to resend code.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.brandHeader}>
          <img src="/web-logo-login-img.png" alt="PrintEase Logo" style={{ height: 84, objectFit: 'contain' }} />
          <span className={styles.brandName}>Print<span className={styles.brandNameLight}>Ease</span></span>
        </div>
        <div className={styles.brandText}>
          <h1>Verify your email</h1>
          <p>We've sent a 6-digit verification code to <strong>{email}</strong>.</p>
        </div>
        <div className={styles.illustrationContainer}>
          <img src="/printer.png" alt="3D Printer Illustration" className={styles.illustration} />
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.loginWrapper}>
          <div className={styles.loginHeader}>
            <h2>Email Verification</h2>
            <p>Enter the 6-digit code sent to your email</p>
          </div>

          {error && <div style={{ color: '#EF4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
          {success && <div style={{ color: '#10B981', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: '#D1FAE5', padding: '10px', borderRadius: '8px' }}>{success}</div>}

          <form onSubmit={handleVerify}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '24px 0' }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(e.target.value, i)}
                  onKeyDown={e => handleKeyDown(e, i)}
                  style={{
                    width: '44px',
                    height: '52px',
                    textAlign: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    outline: 'none',
                  }}
                />
              ))}
            </div>

            <button type="submit" className={styles.primaryButton} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
            Didn't receive code?{' '}
            <button
              onClick={handleResend}
              disabled={timer > 0}
              style={{ background: 'none', border: 'none', color: timer > 0 ? '#94A3B8' : '#0066FF', fontWeight: 600, cursor: timer > 0 ? 'default' : 'pointer' }}
            >
              {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
            </button>
          </div>

          <div className={styles.footer} style={{ marginTop: '24px' }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
