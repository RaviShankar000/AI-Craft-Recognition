/**
 * Accessibility Utilities
 * ARIA labels, keyboard navigation, and screen reader support
 */

import { useEffect, useRef, useState } from 'react';

/**
 * useFocusTrap - Trap focus within a modal or dialog
 * @param {boolean} isActive - Whether focus trap is active
 */
export const useFocusTrap = (isActive) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      containerRef.current?.removeEventListener('keydown', handleTab);
    };
  }, [isActive]);

  return containerRef;
};

/**
 * useKeyboardNavigation - Handle keyboard shortcuts
 * @param {Object} keyMap - Map of keys to handlers
 */
export const useKeyboardNavigation = (keyMap) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      const handler = keyMap[e.key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keyMap]);
};

/**
 * useEscapeKey - Handle Escape key press
 * @param {Function} handler - Function to call on Escape
 */
export const useEscapeKey = (handler) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handler();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handler]);
};

/**
 * useArrowNavigation - Navigate list with arrow keys
 * @param {Array} items - Array of items
 * @param {Function} onSelect - Called when Enter is pressed
 */
export const useArrowNavigation = (items, onSelect) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(items[selectedIndex]);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedIndex, items, onSelect]);

  return selectedIndex;
};

/**
 * SR_ONLY - Screen reader only text (visually hidden)
 */
export const SR_ONLY = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * Screen reader announcement
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.cssText = Object.entries(SR_ONLY)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}:${value}`)
    .join(';');
  announcement.textContent = message;

  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * ARIA Attributes Helper
 */
export const aria = {
  // Button attributes
  button: (label, pressed) => ({
    role: 'button',
    'aria-label': label,
    ...(pressed !== undefined && { 'aria-pressed': pressed }),
    tabIndex: 0,
  }),

  // Link attributes
  link: (label, current = false) => ({
    'aria-label': label,
    ...(current && { 'aria-current': 'page' }),
  }),

  // Modal/Dialog attributes
  dialog: (labelId, descId) => ({
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': labelId,
    'aria-describedby': descId,
  }),

  // Menu attributes
  menu: () => ({
    role: 'menu',
  }),

  menuItem: (label) => ({
    role: 'menuitem',
    'aria-label': label,
    tabIndex: -1,
  }),

  // Form attributes
  input: (label, required = false, invalid = false, describedBy) => ({
    'aria-label': label,
    'aria-required': required,
    'aria-invalid': invalid,
    ...(describedBy && { 'aria-describedby': describedBy }),
  }),

  // Loading state
  loading: (label = 'Loading') => ({
    'aria-busy': 'true',
    'aria-label': label,
  }),

  // Hidden from screen readers
  hidden: () => ({
    'aria-hidden': 'true',
  }),

  // Expanded/collapsed state
  expanded: (isExpanded) => ({
    'aria-expanded': isExpanded,
  }),

  // Selected state
  selected: (isSelected) => ({
    'aria-selected': isSelected,
  }),

  // Checked state
  checked: (isChecked) => ({
    'aria-checked': isChecked,
  }),

  // Disabled state
  disabled: () => ({
    'aria-disabled': 'true',
  }),

  // Label by ID
  labelledBy: (id) => ({
    'aria-labelledby': id,
  }),

  // Described by ID
  describedBy: (id) => ({
    'aria-describedby': id,
  }),

  // Live region
  liveRegion: (priority = 'polite') => ({
    'aria-live': priority,
    'aria-atomic': 'true',
  }),

  // Progress bar
  progress: (value, valueText) => ({
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    ...(valueText && { 'aria-valuetext': valueText }),
  }),

  // Alert
  alert: () => ({
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true',
  }),

  // Status
  status: () => ({
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  }),

  // Tab attributes
  tab: (id, selected, controls) => ({
    role: 'tab',
    id,
    'aria-selected': selected,
    'aria-controls': controls,
    tabIndex: selected ? 0 : -1,
  }),

  tabPanel: (id, labelledBy) => ({
    role: 'tabpanel',
    id,
    'aria-labelledby': labelledBy,
    tabIndex: 0,
  }),
};

/**
 * Keyboard event helpers
 */
export const keyboard = {
  isEnter: (e) => e.key === 'Enter' || e.keyCode === 13,
  isSpace: (e) => e.key === ' ' || e.keyCode === 32,
  isEscape: (e) => e.key === 'Escape' || e.keyCode === 27,
  isTab: (e) => e.key === 'Tab' || e.keyCode === 9,
  isArrowUp: (e) => e.key === 'ArrowUp' || e.keyCode === 38,
  isArrowDown: (e) => e.key === 'ArrowDown' || e.keyCode === 40,
  isArrowLeft: (e) => e.key === 'ArrowLeft' || e.keyCode === 37,
  isArrowRight: (e) => e.key === 'ArrowRight' || e.keyCode === 39,
  
  // Check if activation key (Enter or Space)
  isActivation: (e) => keyboard.isEnter(e) || keyboard.isSpace(e),
};

/**
 * Focus management
 */
export const focus = {
  // Set focus to element by selector
  set: (selector) => {
    const element = document.querySelector(selector);
    element?.focus();
  },

  // Set focus to first focusable element in container
  setFirst: (containerSelector) => {
    const container = document.querySelector(containerSelector);
    const focusable = container?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  },

  // Trap focus in modal
  trap: (containerSelector) => {
    const container = document.querySelector(containerSelector);
    const focusableElements = container?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement.focus();

    return () => container.removeEventListener('keydown', handleTab);
  },
};

/**
 * SkipLink component for keyboard navigation
 */
export const SkipLink = ({ href = '#main-content', children = 'Skip to main content' }) => (
  <a
    href={href}
    style={{
      position: 'absolute',
      left: '-9999px',
      zIndex: 999,
      padding: '1rem',
      background: '#000',
      color: '#fff',
      textDecoration: 'none',
      '&:focus': {
        left: '0',
        top: '0',
      },
    }}
    className="skip-link"
  >
    {children}
  </a>
);

export default {
  useFocusTrap,
  useKeyboardNavigation,
  useEscapeKey,
  useArrowNavigation,
  SR_ONLY,
  announceToScreenReader,
  aria,
  keyboard,
  focus,
  SkipLink,
};
