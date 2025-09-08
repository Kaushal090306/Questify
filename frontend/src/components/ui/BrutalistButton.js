import React from 'react';
import styled from 'styled-components';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  loading = false, 
  disabled = false, 
  ...props 
}) => {
  return (
    <StyledButton 
      className={`brutalist-btn brutalist-btn--${variant} brutalist-btn--${size} ${className}`}
      disabled={disabled || loading}
      $variant={variant}
      $size={size}
      {...props}
    >
      {loading && (
        <svg className="btn-spinner" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </StyledButton>
  );
};

const StyledButton = styled.button`
  /* Base Brutalist Button Styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-decoration: none;
  border: 3px solid var(--black, #000000);
  background-color: var(--white, #ffffff);
  color: var(--black, #000000);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 6px 6px 0 var(--black, #000000);
  position: relative;
  overflow: hidden;

  /* Size Variations */
  ${props => props.$size === 'sm' && `
    padding: 8px 16px;
    font-size: 0.85rem;
    box-shadow: 4px 4px 0 var(--black, #000000);
  `}
  
  ${props => props.$size === 'md' && `
    padding: 12px 24px;
    font-size: 0.95rem;
    box-shadow: 6px 6px 0 var(--black, #000000);
  `}
  
  ${props => props.$size === 'lg' && `
    padding: 16px 32px;
    font-size: 1.1rem;
    box-shadow: 8px 8px 0 var(--black, #000000);
  `}

  /* Variant Styles */
  ${props => props.$variant === 'primary' && `
    background-color: var(--black, #000000);
    color: var(--white, #ffffff);
    border-color: var(--black, #000000);
    
    &:hover {
      background-color: var(--eerie-black, #1b1b1b);
    }
  `}
  
  ${props => props.$variant === 'secondary' && `
    background-color: var(--chinese-white, #e1e1e1);
    color: var(--black, #000000);
    border-color: var(--night-rider, #2e2e2e);
    box-shadow: 6px 6px 0 var(--night-rider, #2e2e2e);
    
    &:hover {
      background-color: var(--anti-flash-white, #f3f3f3);
    }
  `}
  
  ${props => props.$variant === 'danger' && `
    background-color: #ff0000;
    color: var(--white, #ffffff);
    border-color: #cc0000;
    box-shadow: 6px 6px 0 #cc0000;
    
    &:hover {
      background-color: #cc0000;
      box-shadow: 8px 8px 0 #800000;
    }
  `}
  
  ${props => props.$variant === 'success' && `
    background-color: #4caf50;
    color: var(--white, #ffffff);
    border-color: #2e7d32;
    box-shadow: 6px 6px 0 #2e7d32;
    
    &:hover {
      background-color: #2e7d32;
    }
  `}

  ${props => props.$variant === 'outline' && `
    background-color: transparent;
    color: var(--black, #000000);
    border-color: var(--black, #000000);
    box-shadow: 6px 6px 0 var(--black, #000000);
    
    &:hover {
      background-color: var(--black, #000000);
      color: var(--white, #ffffff);
    }
  `}

  /* Shine Effect */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: all 0.6s;
  }

  &:hover::before {
    left: 100%;
  }

  /* Hover and Active States */
  &:hover {
    transform: translate(-2px, -2px);
  }

  &:active {
    transform: translate(3px, 3px);
    box-shadow: 3px 3px 0 var(--black, #000000);
  }

  /* Disabled State */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      transform: none;
    }
  }

  /* Spinner Animation */
  .btn-spinner {
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default Button;
