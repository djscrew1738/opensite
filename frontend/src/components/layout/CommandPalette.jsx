import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Bell,
  Plus,
  FileText,
  Calculator,
  Box,
  Command,
  CornerDownLeft,
  ChevronRight,
} from 'lucide-react';
import { prefetchRoute } from '../../routes/prefetch';

// Updated navigation commands - simplified structure
const navigationCommands = [
  { id: 'nav-dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard, shortcut: 'G D', category: 'Navigate' },
  { id: 'nav-jobs', label: 'Jobs', path: '/jobs', icon: HardHat, shortcut: 'G J', category: 'Navigate' },
  { id: 'nav-jobs-estimating', label: 'Jobs — Estimating', path: '/jobs?tab=estimating', icon: Calculator, shortcut: 'G E', category: 'Navigate' },
  { id: 'nav-jobs-plumbing', label: 'Jobs — 4D Plumbing', path: '/jobs?tab=plumbing', icon: Box, shortcut: 'G 4', category: 'Navigate' },
  { id: 'nav-leads', label: 'Lead Finder', path: '/leads', icon: Users, shortcut: 'G L', category: 'Navigate' },
  { id: 'nav-documents', label: 'Documents', path: '/documents', icon: Files, shortcut: 'G F', category: 'Navigate' },
  { id: 'nav-ai', label: 'AI Hub', path: '/ai', icon: Sparkles, shortcut: 'G A', category: 'Navigate' },
  { id: 'nav-canvas', label: 'Canvas', path: '/canvas', icon: Network, shortcut: 'G C', category: 'Navigate' },
  { id: 'nav-settings', label: 'Settings', path: '/settings', icon: Settings, shortcut: 'G S', category: 'Navigate' },
];

// Action commands
const actionCommands = [
  { id: 'action-add-job', label: 'Add New Job', icon: Plus, shortcut: 'N J', category: 'Actions', action: 'add-job' },
  { id: 'action-add-plan', label: 'Upload Document', icon: FileText, shortcut: 'N D', category: 'Actions', action: 'upload-document' },
  { id: 'action-search-leads', label: 'Search Leads', icon: Users, shortcut: 'S L', category: 'Actions', action: 'search-leads' },
  { id: 'action-ai-chat', label: 'Open AI Chat', icon: Sparkles, shortcut: 'A C', category: 'Actions', action: 'ai-chat' },
];

// Recent items (persisted in localStorage)
const getRecentItems = () => {
  try {
    const stored = localStorage.getItem('jobpulse_recent_commands_v2');
    return stored ? JSON.parse(stored).slice(0, 5) : [];
  } catch {
    return [];
  }
};

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

export default function CommandPalette({ isOpen, onClose }) {
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
          navigate('/leads?focus=search');
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
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
            background: '#181C24',
            border: '1px solid #1F2430',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Search Input */}
          <div 
            className="flex items-center gap-3 px-4 py-4"
            style={{ borderBottom: '1px solid #1F2430' }}
          >
            <Search className="w-5 h-5 flex-shrink-0" style={{ color: '#64748B' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search commands, pages, or actions..."
              className="flex-1 bg-transparent outline-none text-base"
              style={{ color: '#F1F5F9' }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded transition-colors"
                style={{ color: '#64748B' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#94A3B8'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd 
              className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded text-xs font-mono"
              style={{ 
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#64748B',
              }}
            >
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <div 
            className="max-h-[50vh] overflow-y-auto py-2"
          >
            {filteredCommands.length === 0 ? (
              <div 
                className="text-center py-12"
                style={{ color: '#64748B' }}
              >
                <Command className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No commands found</p>
                <p className="text-xs mt-1 opacity-60">Try a different search term</p>
              </div>
            ) : (
              filteredCommands.map((command, index) => {
                if (command.type === 'header') {
                  return (
                    <div
                      key={`header-${command.label}-${index}`}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'rgba(148, 163, 184, 0.4)' }}
                    >
                      {command.label}
                    </div>
                  );
                }

                const selectableIndex = filteredCommands
                  .slice(0, index)
                  .filter(c => c.type !== 'header').length;
                const isSelected = selectableIndex === selectedIndex;
                const Icon = command.icon;

                return (
                  <button
                    key={command.id}
                    onClick={() => executeCommand(command)}
                    onMouseEnter={() => setSelectedIndex(selectableIndex)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-100"
                    style={{
                      width: 'calc(100% - 16px)',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: isSelected ? '#3B82F6' : '#94A3B8',
                    }}
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
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                            style={{
                              background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.04)',
                              color: isSelected ? '#60A5FA' : '#64748B',
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
              })
            )}
          </div>

          {/* Footer */}
          <div 
            className="flex items-center justify-between px-4 py-2 text-xs"
            style={{ 
              borderTop: '1px solid #1F2430',
              color: '#64748B',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Navigate</span>
              <span className="flex items-center gap-1">
                <kbd 
                  className="px-1.5 py-0.5 rounded font-mono"
                  style={{ 
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
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
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
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
}
