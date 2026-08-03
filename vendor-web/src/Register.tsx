import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sun, Moon, User, Phone } from 'lucide-react';
import styles from './Login.module.css'; // Reusing Login styles for consistency
import { API_BASE_URL } from './config';

export default function Register() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showPassword, setShowPassword] = useState(false);
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullname, email, password, phoneNumber, role: 'Admin' }),
      });

      if (response.ok) {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        try {
          const errorJson = await response.json();
          setError(errorJson.message || 'Registration failed. Please try again.');
        } catch {
          setError('Registration failed. Please try again or use a different email.');
        }
      }
    } catch (err) {
      console.error('Registration failed:', err);
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

      {/* Right Registration Panel */}
      <div className={styles.rightPanel}>
        <button className={styles.themeSelector} onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'light' ? 'Light' : 'Dark'}
        </button>

        <div className={styles.loginWrapper}>
          <div className={styles.loginHeader}>
            <h2>Create an account</h2>
            <p>Sign up to become a PrintEase Vendor</p>
          </div>

          <form onSubmit={handleRegister}>
            {error && <div style={{ color: '#EF4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
            
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <div className={styles.inputWrapper}>
                <User className={styles.inputIcon} />
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  className={styles.inputField}
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required 
                />
              </div>
            </div>

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

            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <div className={styles.inputWrapper}>
                <Phone className={styles.inputIcon} />
                <input 
                  type="text" 
                  placeholder="Enter your phone number" 
                  className={styles.inputField}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Create a password" 
                  className={styles.inputField}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className={styles.formGroup}>
              <label>Confirm Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Confirm your password" 
                  className={styles.inputField}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className={styles.primaryButton} disabled={isLoading} style={{ marginTop: '24px' }}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className={styles.footer}>
            Already have an account? 
            <Link to="/login" className={styles.contactAdmin}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
