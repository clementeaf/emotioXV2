import React from 'react';
import type { ToggleButtonProps } from './types';

const ToggleButton: React.FC<ToggleButtonProps> = ({
  isActive = false,
  activeText,
  inactiveText,
  activeIcon,
  inactiveIcon,
  onClick,
  className = '',
  disabled = false,
  ariaLabel
}) => {
  const displayText = isActive ? activeText : inactiveText;
  const displayIcon = isActive ? activeIcon : inactiveIcon;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-1 hover:bg-gray-100 rounded transition-colors ${className}`}
      aria-label={ariaLabel}
    >
      <span className="text-gray-600 flex items-center gap-1">
        {displayIcon}
        {displayText}
      </span>
    </button>
  );
};

export default ToggleButton;
