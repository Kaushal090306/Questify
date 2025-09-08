import React from 'react';
import styled from 'styled-components';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = false,
  clickable = false,
  ...props 
}) => {
  return (
    <StyledCard 
      className={`brutalist-card brutalist-card--${variant} ${className}`}
      $hover={hover}
      $clickable={clickable}
      $variant={variant}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

const StyledCard = styled.div`
  /* Base Brutalist Card Styles */
  border: 4px solid var(--black, #000000);
  background-color: var(--white, #ffffff);
  box-shadow: 10px 10px 0 var(--black, #000000);
  padding: 1.5rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  /* Variant Styles */
  ${props => props.$variant === 'dark' && `
    background-color: var(--eerie-black, #1b1b1b);
    color: var(--white, #ffffff);
    border-color: var(--white, #ffffff);
    box-shadow: 10px 10px 0 var(--white, #ffffff);
  `}

  ${props => props.$variant === 'warning' && `
    background-color: #ffeb3b;
    border-color: #f57c00;
    color: var(--black, #000000);
    box-shadow: 10px 10px 0 #f57c00;
  `}

  ${props => props.$variant === 'error' && `
    background-color: #ff5252;
    border-color: #c62828;
    color: var(--white, #ffffff);
    box-shadow: 10px 10px 0 #c62828;
  `}

  ${props => props.$variant === 'success' && `
    background-color: #4caf50;
    border-color: #2e7d32;
    color: var(--white, #ffffff);
    box-shadow: 10px 10px 0 #2e7d32;
  `}

  /* Clickable styles */
  ${props => props.$clickable && `
    cursor: pointer;
    
    &:hover {
      transform: translate(-2px, -2px);
      box-shadow: 12px 12px 0 var(--black, #000000);
    }
    
    &:active {
      transform: translate(5px, 5px);
      box-shadow: 5px 5px 0 var(--black, #000000);
    }
  `}

  /* Hover effect for non-clickable cards */
  ${props => props.$hover && !props.$clickable && `
    &:hover {
      transform: translate(-1px, -1px);
      box-shadow: 11px 11px 0 var(--black, #000000);
    }
  `}

  /* Shine effect */
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
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: all 0.6s;
    pointer-events: none;
  }

  ${props => (props.$hover || props.$clickable) && `
    &:hover::before {
      left: 100%;
    }
  `}

  /* Responsive adjustments */
  @media (max-width: 768px) {
    padding: 1rem;
    box-shadow: 6px 6px 0 var(--black, #000000);
    
    ${props => props.$clickable && `
      &:hover {
        box-shadow: 8px 8px 0 var(--black, #000000);
      }
      
      &:active {
        box-shadow: 3px 3px 0 var(--black, #000000);
      }
    `}
  }
`;

export default Card;
