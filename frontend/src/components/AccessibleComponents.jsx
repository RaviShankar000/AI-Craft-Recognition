import { forwardRef } from 'react';
import { keyboard } from '../utils/accessibility';

/**
 * AccessibleButton - Fully accessible button component
 * Supports keyboard navigation, ARIA attributes, and screen readers
 */
export const AccessibleButton = forwardRef(({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  loading = false,
  ariaLabel,
  ariaPressed,
  ariaExpanded,
  ariaControls,
  ariaDescribedBy,
  className = '',
  ...props 
}, ref) => {
  const handleKeyPress = (e) => {
    if (keyboard.isActivation(e)) {
      e.preventDefault();
      onClick?.(e);
    }
  };

  const variantStyles = {
    primary: {
      background: 'var(--primary-color, #3498db)',
      color: 'white',
    },
    secondary: {
      background: '#6b7280',
      color: 'white',
    },
    danger: {
      background: '#ef4444',
      color: 'white',
    },
    success: {
      background: '#10b981',
      color: 'white',
    },
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      onKeyPress={handleKeyPress}
      disabled={disabled || loading}
      className={`btn ${className}`}
      style={variantStyles[variant]}
      {...(ariaLabel && { 'aria-label': ariaLabel })}
      {...(ariaPressed !== undefined && { 'aria-pressed': ariaPressed })}
      {...(ariaExpanded !== undefined && { 'aria-expanded': ariaExpanded })}
      {...(ariaControls && { 'aria-controls': ariaControls })}
      {...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy })}
      {...(loading && { 'aria-busy': 'true' })}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

/**
 * AccessibleLink - Accessible link component
 */
export const AccessibleLink = ({ 
  children, 
  href, 
  external = false, 
  current = false,
  ariaLabel,
  className = '',
  ...props 
}) => (
  <a
    href={href}
    className={className}
    {...(external && { 
      target: '_blank', 
      rel: 'noopener noreferrer',
      'aria-label': `${ariaLabel || children} (opens in new window)`
    })}
    {...(current && { 'aria-current': 'page' })}
    {...(ariaLabel && !external && { 'aria-label': ariaLabel })}
    {...props}
  >
    {children}
  </a>
);

/**
 * AccessibleInput - Accessible form input
 */
export const AccessibleInput = ({ 
  label, 
  error, 
  required = false, 
  type = 'text',
  id,
  name,
  value,
  onChange,
  className = '',
  ...props 
}) => {
  const inputId = id || `input-${name}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={inputId}>
        {label}
        {required && <span aria-label="required" className="required"> *</span>}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        {...(error && { 'aria-describedby': errorId })}
        {...props}
      />
      {error && (
        <div id={errorId} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

/**
 * AccessibleModal - Accessible modal/dialog
 */
export const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  titleId = 'modal-title',
  descriptionId = 'modal-description',
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (keyboard.isEscape(e)) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyPress}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <h2 id={titleId}>{title}</h2>
        <div id={descriptionId}>
          {children}
        </div>
        <button 
          onClick={onClose}
          aria-label="Close modal"
        >
          Close
        </button>
      </div>
    </div>
  );
};

/**
 * AccessibleTabs - Accessible tab component
 */
export const AccessibleTabs = ({ tabs, activeTab, onChange }) => {
  const handleKeyPress = (e, index) => {
    if (keyboard.isArrowRight(e)) {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      onChange(nextIndex);
    } else if (keyboard.isArrowLeft(e)) {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      onChange(prevIndex);
    }
  };

  return (
    <div>
      <div role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={index === activeTab}
            aria-controls={`panel-${tab.id}`}
            tabIndex={index === activeTab ? 0 : -1}
            onClick={() => onChange(index)}
            onKeyDown={(e) => handleKeyPress(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={index !== activeTab}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

/**
 * LiveRegion - Accessible live region for dynamic content
 */
export const LiveRegion = ({ children, priority = 'polite', atomic = true }) => (
  <div
    role={priority === 'assertive' ? 'alert' : 'status'}
    aria-live={priority}
    aria-atomic={atomic}
  >
    {children}
  </div>
);

export default {
  AccessibleButton,
  AccessibleLink,
  AccessibleInput,
  AccessibleModal,
  AccessibleTabs,
  LiveRegion,
};
