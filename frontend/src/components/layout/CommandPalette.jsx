/**
 * CommandPalette Component
 * Global command search with keyboard navigation
 * 
 * @module components/layout/CommandPalette
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  LayoutDashboard,
  Users,
  HardHat,
  Files,
  Sparkles,
  Network,
  Settings,
  Plus,
  FileText,
  Calculator,
  Box,
  Command,
  CornerDownLeft,
} from 'lucide-react';
import { prefetchRoute } from '../../routes/prefetch';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** Navigation commands */
const navigationCommands = [
  { id: 'nav-dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard, shortcut: 'G D', category: 'Navigate' },
  { id: 'nav-jobs', label: 'Jobs', path: '/jobs', icon: HardHat, shortcut: 'G J', category: 'Navigate' },
  { id: 'nav-jobs-estimating', label: 'Jobs — Estimating', path: '/jobs?tab=estimating', icon: Calculator, shortcut: 'G E', category: 'Navigate' },
  { id: 'nav-jobs-plumbing', label: 'Jobs — 4D Plumbing', path: '/jobs?tab=plumbing', icon: Box, shortcut: 'G 4', category: 'Navigate' },
  { id: 'nav-leads', label: 'Lead Finder', path: '/jobs?tab=leads', icon: Users, shortcut: 'G L', category: 'Navigate' },
  { id: 'nav-documents', label: 'Documents', path: '/documents', icon: Files, shortcut: 'G F', category: 'Navigate' },
  { id: 'nav-ai', label: 'AI Hub', path: '/ai', icon: Sparkles, shortcut: 'G A', category: 'Navigate' },
  { id: 'nav-canvas', label: 'Canvas', path: '/canvas', icon: Network, shortcut: 'G C', category: 'Navigate' },
  { id: 'nav-settings', label: 'Settings', path: '/settings', icon: Settings, shortcut: 'G S', category: 'Navigate' },
];

/** Action commands */
const actionCommands = [
  { id: 'action-add-job', label: 'Add New Job', icon: Plus, shortcut: 'N J', category: 'Actions', action: 'add-job' },
  { id: 'action-add-plan', label: 'Upload Document', icon: FileText, shortcut: 'N D', category: 'Actions', action: 'upload-document' },
  { id: 'action-search-leads', label: 'Search Leads', icon: Users, shortcut: 'S L', category: 'Actions', action: 'search-leads' },
  { id: 'action-ai-chat', label: 'Open AI Chat', icon: Sparkles, shortcut: 'A C', category: 'Actions', action: 'ai-chat' },
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Get recent items from localStorage
 * @returns {Array}
 */
const getRecentItems = () => {
  try {
    const stored = localStorage.getItem('jobpulse_recent_commands_v2');
    return stored ? JSON.parse(stored).slice(0, 5) : [];
  } catch {
    return [];
  }
};

/**
 * Save recent item to localStorage
 * @param {Object} item
 */
const saveRecentItem = (item) => {
  try {
    const recent = getRecentItems();
    const filtered = recent.filter(r => r.id !== item.id);
    const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 5);
    localStorage.setItem('jobpulse_recent_commands_v2', JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
};

// Clear old format if exists
if (localStorage.getItem('jobpulse_recent_commands')) {
  localStorage.removeItem('jobpulse_recent_commands');
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Search input with clear button
 */
const SearchInput = memo(function SearchInput({
  value,
  onChange,
  onKeyDown,
  inputRef,
}) {
  return (
    <div 
      className="flex items-center gap-3 px-4 py-4"
      style={{ borderBottom: `1px solid ${colors.border.default}` }}
    >
      <Search className="w-5 h-5 flex-shrink-0" style={{ color: colors.text.muted }} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Search commands, pages, or actions..."
        className="flex-1 bg-transparent outline-none text-base"
        style={{ color: colors.text.primary }}
        aria-label="Search commands"
      />
      {value && (
        <button
          onClick={() => {
            onChange({ target: { value: '' } });
            inputRef.current?.focus();
          }}
          className="p-1 rounded transition-colors"
          style={{ color: colors.text.muted }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.text.secondary}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <kbd 
        className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded text-xs font-mono"
        style={{ 
          background: colors.surface.primary,
          border: `1px solid ${colors.border.default}`,
          color: colors.text.muted,
        }}
      >
        ESC
      </kbd>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

/**
 * Section header for command groups
 */
const SectionHeader = memo(function SectionHeader({ label }) {
  return (
    <div
      className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
      style={{ color: colors.text.muted }}
    >
      {label}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';

/**
 * Individual command item
 */
const CommandItem = memo(function CommandItem({
  command,
  isSelected,
  onClick,
  onMouseEnter,
}) {
  const Icon = command.icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className="w-full flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-100"
      style={{
        width: 'calc(100% - 16px)',
        background: isSelected ? colors.accent.muted : 'transparent',
        color: isSelected ? colors.accent.DEFAULT : colors.text.secondary,
      }}
      aria-selected={isSelected}
    >
      <Icon 
        className="w-4 h-4 flex-shrink-0" 
        strokeWidth={isSelected ? 2.5 : 2}
      />
      <span className="flex-1 text-left text-sm font-medium">
        {command.label}
      </span>
      {command.shortcut && (
        <div className="hidden sm:flex items-center gap-1">
          {command.shortcut.split(' ').map((key, i) => (
            <kbd
              key={i}
              className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{
                background: isSelected ? `${colors.accent.DEFAULT}33` : colors.surface.primary,
                color: isSelected ? colors.accent.light : colors.text.muted,
              }}
            >
              {key}
            </kbd>
          ))}
        </div>
      )}
      {isSelected && (
        <CornerDownLeft className="w-4 h-4 opacity-50" />
      )}
    </button>
  );
});

CommandItem.displayName = 'CommandItem';

/**
 * Empty state when no commands found
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div 
      className="text-center py-12"
      style={{ color: colors.text.muted }}
    >
      <Command className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No commands found</p>
      <p className="text-xs mt-1 opacity-60">Try a different search term</p>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * Keyboard shortcuts footer
 */
const Footer = memo(function Footer() {
  return (
    <div 
      className="flex items-center justify-between px-4 py-2 text-xs"
      style={{ 
        borderTop: `1px solid ${colors.border.default}`,
        color: colors.text.muted,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline">Navigate</span>
        <span className="flex items-center gap-1">
          <kbd 
            className="px-1.5 py-0.5 rounded font-mono"
            style={{ 
              background: colors.surface.primary,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            ↑↓
          </kbd>
        </span>
        <span className="hidden sm:inline">Select</span>
        <span className="flex items-center gap-1">
          <kbd 
            className="px-1.5 py-0.5 rounded font-mono"
            style={{ 
              background: colors.surface.primary,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            ↵
          </kbd>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span>Job Pulse</span>
      </div>
    </div>
  );
});

Footer.displayName = 'Footer';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * CommandPalette - Global command search with keyboard navigation
 * 
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void
 * }} props
 */
const CommandPalette = memo(function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const executeCommand = useCallback((command) => {
    saveRecentItem(command);
    
    if (command.path) {
      prefetchRoute(command.path);
      navigate(command.path);
    } else if (command.action) {
      switch (command.action) {
        case 'add-job':
          navigate('/jobs?action=add');
          break;
        case 'upload-document':
          navigate('/documents?action=upload');
          break;
        case 'search-leads':
          navigate('/jobs?tab=leads');
          break;
        case 'ai-chat':
          navigate('/ai?focus=chat');
          break;
        default:
          break;
      }
    }
    
    onClose();
  }, [navigate, onClose]);

  // Load recent items on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setRecentItems(getRecentItems());
      setQuery('');
      setSelectedIndex(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Filter and combine commands
  const filteredCommands = useMemo(() => {
    const allCommands = [...navigationCommands, ...actionCommands];
    
    if (!query.trim()) {
      // Show recent items first, then other commands
      const recentIds = new Set(recentItems.map(r => r.id));
      const otherCommands = allCommands.filter(c => !recentIds.has(c.id));
      return [
        ...(recentItems.length > 0 ? [{ type: 'header', label: 'Recent' }] : []),
        ...recentItems.map(item => ({ ...item, type: 'recent' })),
        ...(recentItems.length > 0 ? [{ type: 'header', label: 'Commands' }] : []),
        ...otherCommands,
      ];
    }

    const lowerQuery = query.toLowerCase();
    const filtered = allCommands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.category.toLowerCase().includes(lowerQuery) ||
      cmd.shortcut?.toLowerCase().replace(/\s/g, '').includes(lowerQuery.replace(/\s/g, ''))
    );

    // Group by category
    const grouped = [];
    const byCategory = filtered.reduce((acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, commands]) => {
      grouped.push({ type: 'header', label: category });
      grouped.push(...commands);
    });

    return grouped;
  }, [query, recentItems]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const selectableItems = filteredCommands.filter(c => c.type !== 'header');

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev + 1;
          return Math.min(next, selectableItems.length - 1);
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter': {
        e.preventDefault();
        const selected = selectableItems[selectedIndex];
        if (selected) {
          executeCommand(selected);
        }
        break;
      }
      default:
        break;
    }
  }, [filteredCommands, selectedIndex, executeCommand]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: colors.surface.overlay,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.15s ease-out',
        }}
      />
      
      {/* Centered Palette */}
      <div 
        className="absolute inset-0 flex items-start justify-center pt-[15vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full max-w-xl overflow-hidden"
          style={{
            background: colors.surface.elevated,
            border: `1px solid ${colors.border.default}`,
            borderRadius: '16px',
            boxShadow: shadows.cardHover,
            animation: 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <SearchInput
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
          />

          {/* Commands List */}
          <div className="max-h-[50vh] overflow-y-auto py-2">
            {filteredCommands.length === 0 ? (
              <EmptyState />
            ) : (
              filteredCommands.map((command, index) => {
                if (command.type === 'header') {
                  return (
                    <SectionHeader
                      key={`header-${command.label}-${index}`}
                      label={command.label}
                    />
                  );
                }

                const selectableIndex = filteredCommands
                  .slice(0, index)
                  .filter(c => c.type !== 'header').length;
                const isSelected = selectableIndex === selectedIndex;

                return (
                  <CommandItem
                    key={command.id}
                    command={command}
                    isSelected={isSelected}
                    onClick={() => executeCommand(command)}
                    onMouseEnter={() => setSelectedIndex(selectableIndex)}
                  />
                );
              })
            )}
          </div>

          <Footer />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body
  );
});

CommandPalette.displayName = 'CommandPalette';

export default CommandPalette;
