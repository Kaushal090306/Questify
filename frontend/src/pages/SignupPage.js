import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import AnimatedCheckbox from '../components/ui/AnimatedCheckbox';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

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

    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await register({
        ...formData,
        role: 'student'
      });
      if (result.success) {
        navigate('/login', { 
          state: { message: 'Account created successfully! Please sign in.' }
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
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
            Join QuestiFy
          </h2>
          <p className="mt-2 text-night-rider font-medium" style={{
            fontFamily: 'var(--font-family-secondary, "Inter")',
            color: 'var(--night-rider, #2e2e2e)'
          }}>
            Create your account and start learning with AI-powered quizzes
          </p>
        </div>

        <Card className="brutalist-card p-8" variant="default">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
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
                  First Name
                </label>
                <Input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={errors.first_name}
                  className="brutalist-input"
                  style={{
                    fontFamily: 'var(--font-family-primary, "JetBrains Mono")',
                    border: '3px solid var(--black, #000000)',
                    backgroundColor: 'var(--white, #ffffff)',
                    boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
                  }}
                  placeholder="John"
                  autoComplete="given-name"
                  required
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
                  Last Name
                </label>
                <Input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={errors.last_name}
                  className="brutalist-input"
                  style={{
                    fontFamily: 'var(--font-family-primary, "JetBrains Mono")',
                    border: '3px solid var(--black, #000000)',
                    backgroundColor: 'var(--white, #ffffff)',
                    boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
                  }}
                  placeholder="Doe"
                  autoComplete="family-name"
                  required
                />
              </div>
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
                placeholder="john@example.com"
                autoComplete="email"
                required
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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  error={errors.password_confirm}
                  className="brutalist-input"
                  style={{
                    fontFamily: 'var(--font-family-primary, "JetBrains Mono")',
                    border: '3px solid var(--black, #000000)',
                    backgroundColor: 'var(--white, #ffffff)',
                    boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
                  }}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-night-rider hover:text-black transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{color: 'var(--night-rider, #2e2e2e)'}}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <AnimatedCheckbox
                id="terms"
                name="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm font-medium" style={{
                fontFamily: 'var(--font-family-secondary, "Inter")',
                color: 'var(--night-rider, #2e2e2e)'
              }}>
                I agree to the{' '}
                <Link to="/terms" className="text-black font-bold hover:text-night-rider transition-colors" style={{
                  fontFamily: 'var(--font-family-display, "Space Grotesk")',
                  textDecoration: 'underline'
                }}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-black font-bold hover:text-night-rider transition-colors" style={{
                  fontFamily: 'var(--font-family-display, "Space Grotesk")',
                  textDecoration: 'underline'
                }}>
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full brutalist-button"
              loading={loading}
              style={{
                fontFamily: 'var(--font-family-display, "Space Grotesk")',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                border: '3px solid var(--black, #000000)',
                backgroundColor: 'var(--black, #000000)',
                color: 'var(--white, #ffffff)',
                boxShadow: '6px 6px 0 var(--chinese-black, #141414)',
                borderRadius: '0'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm font-medium" style={{
            fontFamily: 'var(--font-family-secondary, "Inter")',
            color: 'var(--night-rider, #2e2e2e)'
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-black hover:text-night-rider transition-colors"
              style={{
                fontFamily: 'var(--font-family-display, "Space Grotesk")',
                textDecoration: 'underline',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
