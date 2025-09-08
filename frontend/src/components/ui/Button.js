import React from 'react';
import styled, { css, keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const shine = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const StyledButton = styled.button`
  /* Base brutalist styling */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family-display, 'Space Grotesk'), sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 3px solid var(--black, #000000);
  background-color: var(--white, #ffffff);
  color: var(--black, #000000);
  cursor: pointer;
  transition: all 0.15s ease;
  overflow: hidden;
  
  /* Remove default button styles */
  outline: none;
  text-decoration: none;
  
  /* Hover effects */
  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--chinese-black, #141414);
  }
  
  &:active:not(:disabled) {
    transform: translate(0, 0);
    box-shadow: 2px 2px 0 var(--chinese-black, #141414);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  /* Loading state */
  ${props => props.loading && css`
    pointer-events: none;
    opacity: 0.8;
  `}
  
  /* Size variants */
  ${props => props.size === 'xs' && css`
    padding: 6px 12px;
    font-size: 0.75rem;
    min-height: 28px;
  `}
  
  ${props => props.size === 'sm' && css`
    padding: 8px 16px;
    font-size: 0.875rem;
    min-height: 36px;
  `}
  
  ${props => props.size === 'lg' && css`
    padding: 16px 32px;
    font-size: 1.125rem;
    min-height: 56px;
  `}
  
  ${props => !props.size && css`
    padding: 12px 24px;
    font-size: 1rem;
    min-height: 44px;
  `}
  
  /* Variant styles */
  ${props => props.variant === 'primary' && css`
    background-color: var(--black, #000000);
    color: var(--white, #ffffff);
    box-shadow: 4px 4px 0 var(--chinese-black, #141414);
    
    &:hover:not(:disabled) {
      background-color: var(--eerie-black, #1b1b1b);
      box-shadow: 6px 6px 0 var(--chinese-black, #141414);
    }
  `}
  
  ${props => props.variant === 'secondary' && css`
    background-color: var(--anti-flash-white, #f3f3f3);
    color: var(--black, #000000);
    border-color: var(--night-rider, #2e2e2e);
    box-shadow: 4px 4px 0 var(--night-rider, #2e2e2e);
    
    &:hover:not(:disabled) {
      background-color: var(--gainsboro, #e1e1e1);
      box-shadow: 6px 6px 0 var(--night-rider, #2e2e2e);
    }
  `}
  
  ${props => props.variant === 'danger' && css`
    background-color: #dc2626;
    color: var(--white, #ffffff);
    border-color: #991b1b;
    box-shadow: 4px 4px 0 #7f1d1d;
    
    &:hover:not(:disabled) {
      background-color: #b91c1c;
      box-shadow: 6px 6px 0 #7f1d1d;
    }
  `}
  
  ${props => props.variant === 'outline' && css`
    background-color: transparent;
    color: var(--black, #000000);
    border-color: var(--black, #000000);
    box-shadow: 4px 4px 0 var(--chinese-black, #141414);
    
    &:hover:not(:disabled) {
      background-color: var(--black, #000000);
      color: var(--white, #ffffff);
      box-shadow: 6px 6px 0 var(--chinese-black, #141414);
    }
  `}
  
  /* Full width */
  ${props => props.fullWidth && css`
    width: 100%;
  `}
  
  /* Shine effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-right: 8px;
`;

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <StyledButton
      ref={ref}
      type={type}
      variant={variant}
      size={size}
      loading={loading}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {children}
    </StyledButton>
  );
});

Button.displayName = 'Button';

export default Button;
