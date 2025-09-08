import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import AnimatedCheckbox from '../components/ui/AnimatedCheckbox';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-brutalist text-4xl font-black text-black mb-2" style={{
            fontFamily: 'var(--font-family-display, "Space Grotesk")',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Welcome Back
          </h2>
          <p className="mt-2 text-night-rider font-medium" style={{
            fontFamily: 'var(--font-family-secondary, "Inter")',
            color: 'var(--night-rider, #2e2e2e)'
          }}>
            Sign in to your account to continue learning
          </p>
        </div>

        <Card className="brutalist-card p-8" variant="default">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="brutalist-form-group">
              <label className="brutalist-label" style={{
                fontFamily: 'var(--font-family-display, "Space Grotesk")',
                fontWeight: '600',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--black, #000000)',
                marginBottom: '8px',
                display: 'block'
              }}>
                Email Address
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                className="brutalist-input"
                style={{
                  fontFamily: 'var(--font-family-primary, "JetBrains Mono")',
                  border: '3px solid var(--black, #000000)',
                  backgroundColor: 'var(--white, #ffffff)',
                  boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
                }}
              />
            </div>

            <div className="brutalist-form-group">
              <label className="brutalist-label" style={{
                fontFamily: 'var(--font-family-display, "Space Grotesk")',
                fontWeight: '600',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--black, #000000)',
                marginBottom: '8px',
                display: 'block'
              }}>
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  className="brutalist-input"
                  style={{
                    fontFamily: 'var(--font-family-primary, "JetBrains Mono")',
                    border: '3px solid var(--black, #000000)',
                    backgroundColor: 'var(--white, #ffffff)',
                    boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-night-rider hover:text-black transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{color: 'var(--night-rider, #2e2e2e)'}}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AnimatedCheckbox
                  id="remember-me"
                  name="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-medium" style={{
                  fontFamily: 'var(--font-family-secondary, "Inter")',
                  color: 'var(--night-rider, #2e2e2e)'
                }}>
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm font-bold uppercase tracking-wide text-black hover:text-night-rider transition-colors"
                style={{
                  fontFamily: 'var(--font-family-display, "Space Grotesk")',
                  color: 'var(--black, #000000)'
                }}
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.749.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.17-1.507-.402-2.45-1.618-2.45-3.106 0-3.778 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.125-2.6 7.442-6.204 7.442-1.211 0-2.35-.63-2.738-1.378 0 0-.599 2.282-.744 2.84-.282 1.084-1.064 2.456-1.549 3.235C9.584 23.815 10.77 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
                GitHub
              </Button>
            </div>
          </div> */}

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up for free
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
