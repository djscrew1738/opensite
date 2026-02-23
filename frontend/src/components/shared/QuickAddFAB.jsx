import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileUp, 
  UserPlus, 
  StickyNote,
  X,
  Loader2
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

/**
 * QuickAddFAB - Global floating action button with radial menu
 * 
 * Features:
 * - Radial menu with 3 options (Upload Blueprint, Manual Lead, Quick Note)
 * - Staggered animation from center
 * - Icon rotation on open
 * - Pulsing animation when unprocessed items exist
 * - Responsive positioning (avoids mobile gesture zones)
 */

// Menu item configuration
const MENU_ITEMS = [
  {
    id: 'blueprint',
    label: 'Upload Blueprint',
    icon: FileUp,
    color: 'bg-blue-500',
    angle: -30, // degrees from vertical
  },
  {
    id: 'lead',
    label: 'Manual Lead',
    icon: UserPlus,
    color: 'bg-emerald-500',
    angle: 0, // straight up
  },
  {
    id: 'note',
    label: 'Quick Note',
    icon: StickyNote,
    color: 'bg-amber-500',
    angle: 30, // degrees from vertical
  },
];

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const menuItemVariants = {
  hidden: { 
    scale: 0.5, 
    opacity: 0,
    x: 0,
    y: 0,
  },
  visible: (angle) => {
    const radius = 100; // Distance from center
    const radian = (angle - 90) * (Math.PI / 180); // -90 to start from top
    return {
      scale: 1,
      opacity: 1,
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    };
  },
  exit: { 
    scale: 0.5, 
    opacity: 0,
    x: 0,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

const labelVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      delay: 0.1,
      duration: 0.2,
    },
  },
  exit: { 
    opacity: 0, 
    x: -10,
    transition: {
      duration: 0.1,
    },
  },
};

// Manual Lead Form Modal
function ManualLeadModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    builderName: '',
    address: '',
    permitNumber: '',
    phase: 'underground',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      onClose();
      setFormData({
        builderName: '',
        address: '',
        permitNumber: '',
        phase: 'underground',
        notes: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Slide-up Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-surface-card rounded-t-3xl z-50 max-h-[90vh] overflow-auto"
          >
            <div className="p-6">
              {/* Handle */}
              <div className="flex justify-center mb-6">
                <div className="w-12 h-1.5 bg-surface-600 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">Add Manual Lead</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-surface-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Builder Name
                  </label>
                  <input
                    type="text"
                    value={formData.builderName}
                    onChange={(e) => setFormData(d => ({ ...d, builderName: e.target.value }))}
                    className="input w-full"
                    placeholder="e.g., Lennar Homes"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(d => ({ ...d, address: e.target.value }))}
                    className="input w-full"
                    placeholder="e.g., 1234 Main St, Dallas, TX"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Permit #
                    </label>
                    <input
                      type="text"
                      value={formData.permitNumber}
                      onChange={(e) => setFormData(d => ({ ...d, permitNumber: e.target.value }))}
                      className="input w-full"
                      placeholder="e.g., BP-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Phase
                    </label>
                    <select
                      value={formData.phase}
                      onChange={(e) => setFormData(d => ({ ...d, phase: e.target.value }))}
                      className="input w-full"
                    >
                      <option value="underground">Underground</option>
                      <option value="rough-in">Rough-In</option>
                      <option value="top-out">Top-Out</option>
                      <option value="trim">Trim</option>
                      <option value="final">Final</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(d => ({ ...d, notes: e.target.value }))}
                    className="input w-full h-24 resize-none"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Add Lead
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Quick Note Popover
function QuickNotePopover({ isOpen, onClose, onSubmit }) {
  const [note, setNote] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (note.trim()) {
      onSubmit?.(note.trim());
      setNote('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="fixed bottom-24 right-6 w-80 bg-surface-card rounded-2xl shadow-2xl border border-border p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                Quick Note
              </h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-surface-700 rounded transition-colors"
              >
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input w-full h-32 resize-none text-sm"
              placeholder="Type your note here..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-text-muted">
                Press Cmd+Enter to save
              </span>
              <button
                onClick={handleSubmit}
                disabled={!note.trim()}
                className="btn-primary text-sm px-4 py-2"
              >
                Save Note
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// File Upload Handler
function useFileUpload(onUpload) {
  const fileInputRef = useRef(null);
  const { success, error } = useToast();

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      error('Please upload a PDF, PNG, or JPG file');
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      error('File too large. Maximum size is 50MB.');
      return;
    }

    onUpload?.(file);
    success(`Selected: ${file.name}`);
    
    // Reset input
    e.target.value = '';
  }, [onUpload, success, error]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return { fileInputRef, handleFileSelect, triggerFileInput };
}

// Main FAB Component
export function QuickAddFAB({ 
  onUpload, 
  onAddLead, 
  onAddNote,
  hasUnprocessedBlueprints = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'lead' | 'note' | null
  const fabRef = useRef(null);
  
  const { fileInputRef, handleFileSelect, triggerFileInput } = useFileUpload(onUpload);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fabRef.current && !fabRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle menu item click
  const handleMenuItemClick = useCallback((itemId) => {
    setIsOpen(false);
    
    switch (itemId) {
      case 'blueprint':
        triggerFileInput();
        break;
      case 'lead':
        setActiveModal('lead');
        break;
      case 'note':
        setActiveModal('note');
        break;
      default:
        break;
    }
  }, [triggerFileInput]);

  // Handle lead submission
  const handleLeadSubmit = useCallback(async (formData) => {
    await onAddLead?.(formData);
  }, [onAddLead]);

  // Handle note submission
  const handleNoteSubmit = useCallback((note) => {
    onAddNote?.(note);
  }, [onAddNote]);

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div 
        ref={fabRef}
        className={`fixed bottom-6 right-6 md:bottom-6 md:right-6 z-50 ${className}`}
        style={{ 
          // Mobile safe area inset to avoid system gestures
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Radial Menu Items */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {MENU_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    custom={item.angle}
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ delay: index * 0.05 }}
                    className="absolute pointer-events-auto"
                  >
                    <div className="relative group">
                      {/* Label - Desktop (left side) */}
                      <motion.span
                        variants={labelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
                      >
                        <span className="px-3 py-1.5 bg-surface-card border border-border rounded-lg text-sm font-medium text-text-primary shadow-lg">
                          {item.label}
                        </span>
                      </motion.span>
                      
                      {/* Menu Button */}
                      <button
                        onClick={() => handleMenuItemClick(item.id)}
                        className={`w-11 h-11 rounded-full ${item.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}
                        title={item.label}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </button>
                      
                      {/* Label - Mobile (below) */}
                      <motion.span
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        className="md:hidden absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap"
                      >
                        <span className="px-2 py-0.5 bg-surface-card rounded text-xs font-medium text-text-primary shadow-md">
                          {item.label}
                        </span>
                      </motion.span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          animate={{
            rotate: isOpen ? 45 : 0,
            scale: hasUnprocessedBlueprints && !isOpen ? [1, 1.05, 1] : 1,
          }}
          transition={{
            rotate: { type: 'spring', stiffness: 300, damping: 20 },
            scale: hasUnprocessedBlueprints && !isOpen ? {
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut',
            } : {},
          }}
          className={`
            relative w-14 h-14 rounded-full 
            bg-orange-500 
            flex items-center justify-center
            shadow-lg shadow-orange-500/25
            hover:bg-orange-400
            active:scale-95
            transition-colors
            z-50
          `}
          style={{
            boxShadow: '0 8px 30px rgba(249, 115, 22, 0.35), 0 0 0 1px rgba(249, 115, 22, 0.2)',
          }}
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          
          {/* Pulse ring for unprocessed blueprints */}
          {hasUnprocessedBlueprints && !isOpen && (
            <motion.span
              className="absolute inset-0 rounded-full bg-orange-500"
              animate={{
                scale: [1, 1.4, 1.4],
                opacity: [0.5, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          )}
        </motion.button>
      </div>

      {/* Manual Lead Modal */}
      <ManualLeadModal
        isOpen={activeModal === 'lead'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleLeadSubmit}
      />

      {/* Quick Note Popover */}
      <QuickNotePopover
        isOpen={activeModal === 'note'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleNoteSubmit}
      />
    </>
  );
}

export default QuickAddFAB;
