import React from 'react';
import styled from 'styled-components';

const BrutalistCheckbox = ({ checked, onChange, ...props }) => {
  return (
    <StyledWrapper>
      <label className="container">
        <input 
          type="checkbox" 
          checked={checked}
          onChange={onChange}
          {...props}
        />
        <div className="checkmark" />
      </label>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .container {
    position: relative;
    cursor: pointer;
    font-size: 12px;
    width: 8px;
    height: 8px;
    user-select: none;
    border: 2px solid black;
    display: block;
  }

  .checkmark {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .checkmark:after {
    content: '';
    position: absolute;
    top: 25%;
    left: 25%;
    background-color: black;
    width: 50%;
    height: 50%;
    transform: scale(0);
    transition: .1s ease;
  }

  .container input:checked ~ .checkmark:after {
    transform: scale(1);
  }
`;

export default BrutalistCheckbox;
