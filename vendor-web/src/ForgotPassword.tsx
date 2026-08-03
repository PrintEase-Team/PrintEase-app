import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sun, Moon, ArrowLeft, KeyRound } from 'lucide-react';
import { API_BASE_URL } from './config';
import styles from './Login.module.css'; // Reuse Login styles

export default function ForgotPassword() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess('Reset code sent! Check your email.');
        setStep(2);
      } else {
        setError('Failed to send reset code. Verify your email.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      if (response.ok) {
        setSuccess('Password reset successfully!');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Invalid or expired reset code.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Branding Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.brandHeader}>
          <img src="/web-logo-login-img.png" alt="PrintEase Logo" style={{ height: 84, objectFit: 'contain' }} />
          <span className={styles.brandName}>
            Print<span className={styles.brandNameLight}>Ease</span>
          </span>
        </div>
        
        <div className={styles.brandText}>
          <h1>Manage your print shop with ease</h1>
          <p>Accept orders, track print progress, manage customers, and grow your business—all in one place.</p>
        </div>

        <div className={styles.illustrationContainer}>
          <img src="/printer.png" alt="3D Printer Illustration" className={styles.illustration} />
        </div>
      </div>

      {/* Right Reset Panel */}
      <div className={styles.rightPanel}>
        <button className={styles.themeSelector} onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'light' ? 'Light' : 'Dark'}
        </button>

        <div className={styles.loginWrapper}>
          <div className={styles.loginHeader}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', marginBottom: 20, fontSize: 14 }}>
              <ArrowLeft size={16} /> Back to login
            </Link>
            <h2>Reset Password</h2>
            <p>{step === 1 ? 'Enter your email to receive a reset code.' : 'Enter the code sent to your email.'}</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRequestOtp}>
              {error && <div style={{ color: '#EF4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
              {success && <div style={{ color: '#10B981', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: '#D1FAE5', padding: '10px', borderRadius: '8px' }}>{success}</div>}
              
              <div className={styles.formGroup}>
                <label>Email address</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} />
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className={styles.inputField}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <button type="submit" className={styles.primaryButton} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              {error && <div style={{ color: '#EF4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
              {success && <div style={{ color: '#10B981', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: '#D1FAE5', padding: '10px', borderRadius: '8px' }}>{success}</div>}
              
              <div className={styles.formGroup}>
                <label>6-Digit Reset Code</label>
                <div className={styles.inputWrapper}>
                  <KeyRound className={styles.inputIcon} />
                  <input 
                    type="text" 
                    placeholder="000000" 
                    className={styles.inputField}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required 
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>New Password</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Enter new password" 
                    className={styles.inputField}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                  />
                  <button 
                    type="button" 
                    className={styles.eyeIcon}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.primaryButton} disabled={isLoading || success !== null}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
