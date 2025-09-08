import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import './NavbarEffects.css';
import {
  AcademicCapIcon,
  UserIcon,
  ChartBarIcon,
  TrophyIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: ChartBarIcon },
    { name: 'Generate Quiz', path: '/generate', icon: AcademicCapIcon },
    { name: 'Create Room', path: '/create-room', icon: AcademicCapIcon },
    { name: 'Join Room', path: '/join-room', icon: UserIcon },
    { name: 'Analytics', path: '/analytics', icon: ChartBarIcon },
  ];

  return (
    <nav className="brutalist-navbar bg-black border-b-4 border-black shadow-lg" style={{boxShadow: '0 6px 0 var(--night-rider, #2e2e2e)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 nav-logo">
            <div className="w-10 h-10 bg-white border-3 border-white flex items-center justify-center" style={{boxShadow: '3px 3px 0 var(--chinese-white, #e1e1e1)'}}>
              <AcademicCapIcon className="w-6 h-6 text-black" />
            </div>
            <span className="brutalist-navbar-brand text-white font-black text-xl uppercase tracking-widest">
              QuestiFy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated && (
              <div className="flex items-center space-x-6">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`brutalist-nav-link flex items-center space-x-2 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all nav-main-link ${
                      isActive(item.path)
                        ? 'bg-white text-black border-2 border-white'
                        : 'text-white hover:text-black hover:bg-white border-2 border-transparent hover:border-white'
                    }`}
                    style={{
                      border: isActive(item.path) ? '2px solid var(--white, #ffffff)' : '2px solid transparent',
                      boxShadow: isActive(item.path) ? '3px 3px 0 var(--chinese-white, #e1e1e1)' : 'none'
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="brutalist-nav-link flex items-center space-x-2 px-3 py-2 text-sm font-bold uppercase tracking-wide text-white hover:text-black hover:bg-white border-2 border-transparent hover:border-white transition-all">
                    <UserIcon className="w-5 h-5" />
                    <span>{user?.first_name || user?.email?.split('@')[0]}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white border-4 border-black opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50" style={{boxShadow: '6px 6px 0 var(--black, #000000)'}}>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-black hover:bg-chinese-white border-b-2 border-black nav-link-spacing uppercase tracking-wide"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-black hover:bg-chinese-white border-b-2 border-black nav-link-spacing uppercase tracking-wide"
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 w-full text-left nav-link-spacing uppercase tracking-wide"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">  
                    <Button variant="primary" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white hover:text-chinese-white hover:bg-night-rider transition-all"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black border-t-4 border-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated && (
              <>
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 text-base font-bold uppercase tracking-wide nav-mobile-link border-2 transition-all ${
                      isActive(item.path)
                        ? 'bg-white text-black border-white'
                        : 'text-white hover:text-black hover:bg-white border-transparent hover:border-white'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      boxShadow: isActive(item.path) ? '3px 3px 0 var(--chinese-white, #e1e1e1)' : 'none'
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
                <div className="border-t-4 border-white pt-4">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-3 py-2 text-base font-bold uppercase tracking-wide text-white hover:text-black hover:bg-white border-2 border-transparent hover:border-white transition-all nav-mobile-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-3 py-2 text-base font-bold uppercase tracking-wide text-white bg-red-600 hover:bg-red-700 w-full text-left nav-mobile-link border-2 border-red-600"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
            
            {!isAuthenticated && (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-base font-bold uppercase tracking-wide text-white hover:text-black hover:bg-white border-2 border-transparent hover:border-white transition-all nav-mobile-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 text-base font-bold uppercase tracking-wide bg-white text-black hover:bg-chinese-white border-2 border-white nav-mobile-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{boxShadow: '3px 3px 0 var(--chinese-white, #e1e1e1)'}}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
