import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useBodyScrollLock } from '../../hooks/useScrollLock';

export const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  title,
  description,
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  id,
}) => {
  // Trap focus within modal when open
  const focusTrapRef = useFocusTrap(isOpen, closeOnEscape ? onClose : null);
  
  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />
          
          {/* Modal */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            role="presentation"
          >
            <motion.div
              ref={focusTrapRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              className={`w-full ${sizeClasses[size]} pointer-events-auto`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? `${id || 'modal'}-title` : undefined}
              aria-describedby={description ? `${id || 'modal'}-description` : undefined}
            >
              <div className="bg-surface-700 border border-border-medium rounded-2xl shadow-dark-xl overflow-hidden">
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
                    <div className="flex-1 min-w-0">
                      {title && (
                        <h2 
                          id={`${id || 'modal'}-title`}
                          className="text-lg font-semibold text-text-primary"
                        >
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p 
                          id={`${id || 'modal'}-description`}
                          className="text-sm text-text-secondary mt-1"
                        >
                          {description}
                        </p>
                      )}
                    </div>
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-600 transition-colors flex-shrink-0"
                        aria-label={`Close ${title || 'modal'}`}
                      >
                        <X className="w-5 h-5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* Body */}
                <div className="px-6 py-4">
                  {children}
                </div>
                
                {/* Footer */}
                {footer && (
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-800/50">
                    {footer}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

// Confirmation Modal
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    />
  );
};

// Drawer (slide-in panel)
export const Drawer = ({
  isOpen,
  onClose,
  children,
  side = 'right',
  size = 'md',
  title,
  footer,
}) => {
  const sizeClasses = {
    sm: side === 'left' || side === 'right' ? 'w-80' : 'h-80',
    md: side === 'left' || side === 'right' ? 'w-96' : 'h-96',
    lg: side === 'left' || side === 'right' ? 'w-[32rem]' : 'h-[32rem]',
    xl: side === 'left' || side === 'right' ? 'w-[40rem]' : 'h-[40rem]',
    full: side === 'left' || side === 'right' ? 'w-full' : 'h-full',
  };
  
  const positionClasses = {
    left: 'left-0 top-0 bottom-0 h-full',
    right: 'right-0 top-0 bottom-0 h-full',
    top: 'top-0 left-0 right-0 w-full',
    bottom: 'bottom-0 left-0 right-0 w-full',
  };
  
  const slideVariants = {
    left: { x: '-100%', opacity: 0 },
    right: { x: '100%', opacity: 0 },
    top: { y: '-100%', opacity: 0 },
    bottom: { y: '100%', opacity: 0 },
  };
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={slideVariants[side]}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={slideVariants[side]}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className={`fixed z-50 ${positionClasses[side]} ${sizeClasses[size]} bg-surface-700 border-border shadow-dark-xl flex flex-col`}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-600 transition-colors"
                  aria-label={`Close ${title}`}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            )}
            
            {/* Body */}
            <div className="flex-1 overflow-auto p-6">
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-border bg-surface-800/50">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
