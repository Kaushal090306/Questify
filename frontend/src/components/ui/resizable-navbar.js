"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../layout/NavbarEffects.css';
import './NavbarHoverEffects.css';
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

// Custom hook for scroll detection
const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const position = window.pageYOffset;
      setScrollPosition(position);
      setIsScrolled(position > 50); // Trigger resize after 50px scroll
    };

    window.addEventListener('scroll', updatePosition);
    updatePosition();

    return () => window.removeEventListener('scroll', updatePosition);
  }, []);

  return { scrollPosition, isScrolled };
};

// Main Navbar Component with Horizontal Resize
export const Navbar = ({ children, className = "" }) => {
  const { isScrolled } = useScrollPosition();
  
  return (
    <nav className={`
      brutalist-navbar 
      fixed 
      top-0 
      z-50 
      bg-black 
      border-b-4 
      border-white
      shadow-[0_6px_0_#2e2e2e]
      transition-all
      duration-500
      ease-in-out
      ${isScrolled 
        ? 'left-8 right-8 mt-3 border-4 border-white shadow-[6px_6px_0_#e1e1e1] py-2' 
        : 'left-0 right-0 mt-0 py-0.5'
      }
      ${className}
    `}>
      {children}
    </nav>
  );
};

// Nav Body for Desktop with Horizontal Resize
export const NavBody = ({ children, className = "" }) => {
  const { isScrolled } = useScrollPosition();
  
  return (
    <div className={`
      mx-auto 
      px-4 
      sm:px-6 
      lg:px-8 
      flex 
      justify-between 
      items-center 
      transition-all
      duration-500
      ease-in-out
      ${isScrolled ? 'max-w-5xl h-10' : 'max-w-7xl h-14'}
      ${className}
    `}>
      {children}
    </div>
  );
};

// Navbar Logo with Horizontal Resize
export const NavbarLogo = ({ className = "" }) => {
  const { isScrolled } = useScrollPosition();
  
  return (
    <Link 
      to="/" 
      className={`
        flex 
        items-center 
        nav-logo 
        transform 
        hover:-translate-y-1 
        transition-all 
        duration-500
        ${isScrolled ? 'space-x-2 scale-90' : 'space-x-3 scale-100'}
        ${className}
      `}
    >
      <div className={`
        bg-white 
        border-4 
        border-white 
        flex 
        items-center 
        justify-center
        shadow-[4px_4px_0_#e1e1e1]
        transform 
        hover:shadow-[6px_6px_0_#e1e1e1]
        transition-all
        duration-500
        ${isScrolled ? 'w-6 h-6' : 'w-10 h-10'}
      `}>
        <AcademicCapIcon className={`text-black transition-all duration-500 ${isScrolled ? 'w-3 h-3' : 'w-6 h-6'}`} />
      </div>
      <span className={`
        text-white 
        font-black 
        uppercase 
        tracking-[3px]
        font-['Space_Grotesk']
        transform 
        hover:scale-105 
        transition-all
        duration-500
        ${isScrolled ? 'text-base' : 'text-xl'}
      `}>
        QuestiFy
      </span>
    </Link>
  );
};

// Nav Items Component with Custom Hover Effects
export const NavItems = ({ items, className = "" }) => {
  const location = useLocation();
  const { isScrolled } = useScrollPosition();
  const isActive = (path) => location.pathname === path;

  return (
    <div className={`hidden md:flex items-center transition-all duration-500 ${isScrolled ? 'space-x-1' : 'space-x-2'} ${className}`}>
      {items.map((item, idx) => (
        <Link
          key={`nav-item-${idx}`}
          to={item.link}
          className={`
            nav-link-custom
            font-black
            uppercase
            tracking-[2px]
            transition-all
            duration-500
            font-['Space_Grotesk']
            ${isScrolled ? 'px-2 py-1 text-xs tracking-[1px]' : 'px-4 py-2 text-sm'}
            ${isActive(item.link)
              ? 'text-black bg-white active'
              : 'text-white'
            }
          `}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
};

// Navbar Button Component with Horizontal Resize
export const NavbarButton = ({ 
  children, 
  variant = "primary", 
  className = "",
  onClick,
  ...props 
}) => {
  const { isScrolled } = useScrollPosition();
  
  const baseClasses = `
    font-black
    uppercase
    transition-all
    duration-500
    border-4
    transform
    hover:-translate-x-1
    hover:-translate-y-1
    font-['Space_Grotesk']
    ${isScrolled ? 'px-2 py-1 text-xs tracking-[1px]' : 'px-4 py-2 text-sm tracking-[1px]'}
  `;

  const variants = {
    primary: `
      bg-white
      text-black
      border-white
      shadow-[4px_4px_0_#e1e1e1]
      hover:shadow-[6px_6px_0_#e1e1e1]
    `,
    secondary: `
      bg-transparent
      text-white
      border-white
      shadow-[4px_4px_0_#ffffff]
      hover:bg-white
      hover:text-black
      hover:shadow-[6px_6px_0_#e1e1e1]
    `,
    danger: `
      bg-red-500
      text-white
      border-red-500
      shadow-[4px_4px_0_#dc2626]
      hover:shadow-[6px_6px_0_#dc2626]
    `
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Mobile Navigation Components
export const MobileNav = ({ children, className = "" }) => {
  return (
    <div className={`md:hidden ${className}`}>
      {children}
    </div>
  );
};

export const MobileNavHeader = ({ children, className = "" }) => {
  return (
    <div className={`
      flex 
      justify-between 
      items-center 
      h-16 
      px-4 
      ${className}
    `}>
      {children}
    </div>
  );
};

export const MobileNavToggle = ({ isOpen, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`
        p-2
        text-white
        border-4
        border-white
        bg-transparent
        hover:bg-white
        hover:text-black
        transition-all
        duration-300
        transform
        hover:-translate-y-1
        shadow-[3px_3px_0_#ffffff]
        hover:shadow-[4px_4px_0_#e1e1e1]
        ${className}
      `}
    >
      {isOpen ? (
        <XMarkIcon className="w-6 h-6" />
      ) : (
        <Bars3Icon className="w-6 h-6" />
      )}
    </button>
  );
};

export const MobileNavMenu = ({ isOpen, onClose, children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className={`
      fixed
      top-16
      left-0
      right-0
      bg-black
      border-b-4
      border-white
      shadow-[0_6px_0_#2e2e2e]
      transform
      transition-all
      duration-300
      ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      ${className}
    `}>
      <div className="px-4 py-6 space-y-4">
        {children}
      </div>
    </div>
  );
};

// User Menu Component for Authenticated Users
export const UserMenu = ({ user, onLogout, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex 
          items-center 
          space-x-2 
          px-4 
          py-2 
          text-sm 
          font-black 
          uppercase 
          tracking-wide 
          text-white 
          hover:text-black 
          hover:bg-white 
          border-4 
          border-transparent 
          hover:border-white 
          transition-all 
          duration-300
          transform
          hover:-translate-y-1
          shadow-[3px_3px_0_transparent]
          hover:shadow-[4px_4px_0_#e1e1e1]
          font-['Space_Grotesk']
        "
      >
        <UserIcon className="w-5 h-5" />
        <span>{user?.first_name || user?.email?.split('@')[0]}</span>
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="
            absolute 
            right-0 
            mt-2 
            w-56 
            bg-white 
            border-4 
            border-black 
            shadow-[6px_6px_0_#000000] 
            z-50
            transform
            animate-in
            slide-in-from-top-2
            duration-200
          ">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="
                flex 
                items-center 
                space-x-3 
                px-6 
                py-4 
                text-sm 
                font-bold 
                text-black 
                hover:bg-black
                hover:text-white 
                border-b-3 
                border-black 
                nav-link-spacing 
                uppercase 
                tracking-wide
                transition-all
                duration-200
                font-['Space_Grotesk']
              "
            >
              <UserIcon className="w-5 h-5" />
              <span>Profile</span>
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="
                flex 
                items-center 
                space-x-3 
                px-6 
                py-4 
                text-sm 
                font-bold 
                text-black 
                hover:bg-black
                hover:text-white 
                border-b-3 
                border-black 
                nav-link-spacing 
                uppercase 
                tracking-wide
                transition-all
                duration-200
                font-['Space_Grotesk']
              "
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="
                flex 
                items-center 
                space-x-3 
                px-6 
                py-4 
                text-sm 
                font-bold 
                text-black 
                hover:bg-red-500
                hover:text-white 
                w-full 
                text-left
                nav-link-spacing 
                uppercase 
                tracking-wide
                transition-all
                duration-200
                font-['Space_Grotesk']
              "
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
