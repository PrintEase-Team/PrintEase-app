import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import styles from './Login.module.css';
import { API_BASE_URL } from './config';

export default function Login() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('vendor_token', data.token);
        localStorage.setItem('vendor_id', data.userId || data.user_id);
        // Assuming vendor roles will be handled by the backend
        navigate('/dashboard');
      } else {
        const errorData = await response.text();
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login failed:', err);
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
          {/* Note: User must place their 3D printer illustration as printer.png in the public folder */}
          <img src="/printer.png" alt="3D Printer Illustration" className={styles.illustration} />
        </div>
      </div>

      {/* Right Login Panel */}
      <div className={styles.rightPanel}>
        <button className={styles.themeSelector} onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'light' ? 'Light' : 'Dark'}
        </button>

        <div className={styles.loginWrapper}>
          <div className={styles.loginHeader}>
            <h2>Welcome back!</h2>
            <p>Sign in to your PrintEase Vendor account</p>
          </div>

          <form onSubmit={handleLogin}>
            {error && <div style={{ color: '#EF4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
            
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
              <label>Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Enter your password" 
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

            <div className={styles.formOptions}>
              <label className={styles.checkboxWrapper}>
                <input type="checkbox" className={styles.checkbox} />
                Remember me
              </label>
              <Link to="/forgot-password" className={styles.forgotPassword}>Forgot password?</Link>
            </div>

            <button type="submit" className={styles.primaryButton} disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className={styles.footer}>
            Don't have an account? 
            <Link to="/register" className={styles.contactAdmin}>Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
