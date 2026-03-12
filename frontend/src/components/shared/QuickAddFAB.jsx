/**
 * QuickAddFAB Component
 * Global floating action button with radial menu
 * 
 * Features:
 * - Radial menu with 3 options (Upload Blueprint, Manual Lead, Quick Note)
 * - Staggered animation from center
 * - Icon rotation on open
 * - Pulsing animation when unprocessed items exist
 * - Responsive positioning (avoids mobile gesture zones)
 * 
 * @module components/shared/QuickAddFAB
 */

import { useState, useRef, useCallback, useEffect, memo } from 'react';
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
import { useHaptic } from '../../hooks/useHaptic';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

// Menu item configuration with design tokens
const MENU_ITEMS = [
  {
    id: 'blueprint',
    label: 'Upload Blueprint',
    icon: FileUp,
    color: colors.info.DEFAULT,
    angle: -30,
  },
  {
    id: 'lead',
    label: 'Manual Lead',
    icon: UserPlus,
    color: colors.success.DEFAULT,
    angle: 0,
  },
  {
    id: 'note',
    label: 'Quick Note',
    icon: StickyNote,
    color: colors.warning.DEFAULT,
    angle: 30,
  },
];

// FAB primary color (orange accent)
const FAB_COLOR = '#f97316';
const FAB_COLOR_HOVER = '#fb923c';

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
    const radius = 100;
    const radian = (angle - 90) * (Math.PI / 180);
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
    transition: { duration: 0.2 },
  },
};

const labelVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { delay: 0.1, duration: 0.2 },
  },
  exit: { 
    opacity: 0, 
    x: -10,
    transition: { duration: 0.1 },
  },
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Menu button item
 * @param {{item: any, onClick: () => void}} props
 */
const MenuButton = memo(function MenuButton({ item, onClick }) {
  const Icon = item.icon;
  
  return (
    <div className="relative group">
      {/* Label - Desktop (left side) */}
      <motion.span
        variants={labelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
      >
        <span 
          className="px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg"
          style={{
            backgroundColor: colors.surface.card,
            border: `1px solid ${colors.border.default}`,
            color: colors.text.primary,
          }}
        >
          {item.label}
        </span>
      </motion.span>
      
      {/* Menu Button */}
      <button
        onClick={onClick}
        className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        style={{ 
          backgroundColor: item.color,
          boxShadow: `0 4px 15px ${item.color}40`,
        }}
        title={item.label}
      >
        <Icon style={{ width: '20px', height: '20px', color: colors.text.inverse }} />
      </button>
      
      {/* Label - Mobile (below) */}
      <motion.span
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ delay: 0.15 }}
        className="md:hidden absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap"
      >
        <span 
          className="px-2 py-0.5 rounded text-xs font-medium shadow-md"
          style={{
            backgroundColor: colors.surface.card,
            color: colors.text.primary,
          }}
        >
          {item.label}
        </span>
      </motion.span>
    </div>
  );
});

MenuButton.displayName = 'MenuButton';

/**
 * Main FAB Button
 * @param {{isOpen: boolean, hasUnprocessed: boolean, onClick: () => void}} props
 */
const MainFabButton = memo(function MainFabButton({ isOpen, hasUnprocessed, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      animate={{
        rotate: isOpen ? 45 : 0,
        scale: hasUnprocessed && !isOpen ? [1, 1.05, 1] : 1,
      }}
      transition={{
        rotate: { type: 'spring', stiffness: 300, damping: 20 },
        scale: hasUnprocessed && !isOpen ? {
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
        } : {},
      }}
      whileTap={{ scale: 0.88 }}
      className="relative w-14 h-14 rounded-full flex items-center justify-center transition-colors z-50"
      style={{
        backgroundColor: FAB_COLOR,
        boxShadow: `0 8px 30px ${FAB_COLOR}59, 0 0 0 1px ${FAB_COLOR}33`,
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = FAB_COLOR_HOVER}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = FAB_COLOR}
    >
      <Plus style={{ width: '28px', height: '28px', color: colors.text.inverse }} strokeWidth={2.5} />
      
      {/* Pulse ring for unprocessed blueprints */}
      {hasUnprocessed && !isOpen && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: FAB_COLOR }}
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
  );
});

MainFabButton.displayName = 'MainFabButton';

/**
 * Modal backdrop
 * @param {{onClick: () => void}} props
 */
const Backdrop = memo(function Backdrop({ onClick }) {
  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 z-40"
      style={{ backgroundColor: `${colors.surface.primary}66` }} // 40% opacity
      onClick={onClick}
    />
  );
});

Backdrop.displayName = 'Backdrop';

// ═══════════════════════════════════════════════════════════════
// Modals
// ═══════════════════════════════════════════════════════════════

/**
 * Manual Lead Form Modal
 * @param {{isOpen: boolean, onClose: () => void, onSubmit: (data: any) => void}} props
 */
const ManualLeadModal = memo(function ManualLeadModal({ isOpen, onClose, onSubmit }) {
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
          <Backdrop onClick={onClose} />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 rounded-t-3xl z-50 max-h-[90vh] overflow-auto"
            style={{
              backgroundColor: colors.surface.card,
            }}
          >
            <div className="p-6">
              {/* Handle */}
              <div className="flex justify-center mb-6">
                <div 
                  className="w-12 h-1.5 rounded-full"
                  style={{ backgroundColor: colors.surface.elevated }}
                />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 
                  className="text-xl font-bold"
                  style={{ color: colors.text.primary }}
                >
                  Add Manual Lead
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface.elevated}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X style={{ width: '20px', height: '20px', color: colors.text.secondary }} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label 
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: colors.text.secondary }}
                  >
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
                  <label 
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: colors.text.secondary }}
                  >
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
                    <label 
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: colors.text.secondary }}
                    >
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
                    <label 
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: colors.text.secondary }}
                    >
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
                  <label 
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: colors.text.secondary }}
                  >
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
                      <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                    ) : (
                      <UserPlus style={{ width: '16px', height: '16px' }} />
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
});

ManualLeadModal.displayName = 'ManualLeadModal';

/**
 * Quick Note Popover
 * @param {{isOpen: boolean, onClose: () => void, onSubmit: (note: string) => void}} props
 */
const QuickNotePopover = memo(function QuickNotePopover({ isOpen, onClose, onSubmit }) {
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
            className="fixed bottom-24 right-6 w-80 rounded-2xl p-4 z-50"
            style={{
              backgroundColor: colors.surface.card,
              boxShadow: shadows.cardHover,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 
                className="font-semibold flex items-center gap-2"
                style={{ color: colors.text.primary }}
              >
                <StickyNote style={{ width: '16px', height: '16px', color: colors.warning.DEFAULT }} />
                Quick Note
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded transition-colors"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface.elevated}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X style={{ width: '16px', height: '16px', color: colors.text.secondary }} />
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
              <span 
                className="text-xs"
                style={{ color: colors.text.muted }}
              >
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
});

QuickNotePopover.displayName = 'QuickNotePopover';

// ═══════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * File Upload Handler Hook
 * @param {{onUpload: (file: File) => void}} props
 */
function useFileUpload(onUpload) {
  const fileInputRef = useRef(null);
  const { success, error } = useToast();

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      error('Please upload a PDF, PNG, or JPG file');
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      error('File too large. Maximum size is 50MB.');
      return;
    }

    onUpload?.(file);
    success(`Selected: ${file.name}`);
    
    e.target.value = '';
  }, [onUpload, success, error]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return { fileInputRef, handleFileSelect, triggerFileInput };
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * QuickAddFAB - Global floating action button with radial menu
 * @param {{
 *   onUpload?: (file: File) => void;
 *   onAddLead?: (data: any) => void;
 *   onAddNote?: (note: string) => void;
 *   hasUnprocessedBlueprints?: boolean;
 *   className?: string;
 *   bottomOffset?: string;
 * }} props
 */
export const QuickAddFAB = memo(function QuickAddFAB({ 
  onUpload, 
  onAddLead, 
  onAddNote,
  hasUnprocessedBlueprints = false,
  className = '',
  bottomOffset
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const fabRef = useRef(null);
  const haptic = useHaptic();
  
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

  const handleLeadSubmit = useCallback(async (formData) => {
    await onAddLead?.(formData);
  }, [onAddLead]);

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
        {isOpen && <Backdrop onClick={() => setIsOpen(false)} />}
      </AnimatePresence>

      {/* FAB Container */}
      <div 
        ref={fabRef}
        className={`fixed bottom-6 right-6 md:bottom-6 md:right-6 z-50 ${className}`}
        style={{ 
          bottom: bottomOffset || 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Radial Menu Items */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {MENU_ITEMS.map((item, index) => (
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
                  <MenuButton 
                    item={item} 
                    onClick={() => handleMenuItemClick(item.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <MainFabButton
          isOpen={isOpen}
          hasUnprocessed={hasUnprocessedBlueprints}
          onClick={() => { haptic.select(); setIsOpen(!isOpen); }}
        />
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
});

QuickAddFAB.displayName = 'QuickAddFAB';

export default QuickAddFAB;
