import { useState, useRef, useCallback, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, HardHat, Files, MessageSquare,
  Network, Settings, ChevronLeft, ChevronRight, Wifi,
  Command, LogOut, User, Sparkles, BookOpen
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';
import { prefetchRoute } from '../../routes/prefetch';
import { NotificationBell } from '../notifications';
import { useAuth } from '../../hooks/useAuth';

// ═══════════════════════════════════════════════════════════════
// Navigation Configuration
// ═══════════════════════════════════════════════════════════════

const navGroups = {
  core: [
    { path: '/',          icon: LayoutDashboard, label: 'Dashboard',    shortcut: '1', badge: null },
    { path: '/jobs',      icon: HardHat,         label: 'Jobs',         shortcut: '2', badge: null },
    { path: '/documents', icon: Files,           label: 'Documents',    shortcut: '4', badge: null },
    { path: '/ai',        icon: Sparkles,        label: 'AI Assistant', shortcut: '5', badge: null },
  ],
  tools: [
    { path: '/canvas',    icon: Network,         label: 'Canvas',       shortcut: '6', badge: null },
    { path: '/knowledge', icon: BookOpen,        label: 'Knowledge',    shortcut: '7', badge: null },
  ],
};

const bottomNav = [
  { path: '/settings', icon: Settings, label: 'Settings', shortcut: '0' },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Individual navigation item
 */
const NavItem = memo(function NavItem({ item, expanded, onClick }) {
  const prefetchTimeout = useRef(null);

  const handleMouseEnter = useCallback(() => {
    prefetchTimeout.current = setTimeout(() => prefetchRoute(item.path), 100);
  }, [item.path]);

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeout.current) {
      clearTimeout(prefetchTimeout.current);
      prefetchTimeout.current = null;
    }
  }, []);

  return (
    <li>
      <NavLink
        to={item.path}
        end={item.path === '/'}
        className={({ isActive }) => `
          group/item relative flex items-center gap-3 rounded-lg transition-all duration-150
          ${expanded ? 'px-3 justify-start' : 'justify-center'}
          ${isActive ? 'bg-accent-500/10 text-accent-500' : 'text-surface-400/45 hover:text-surface-400'}
          min-h-[44px] py-2.5
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={() => prefetchRoute(item.path)}
        onFocus={() => prefetchRoute(item.path)}
        onClick={onClick}
      >
        {({ isActive }) => (
          <>
            {/* Active left indicator */}
            {isActive && (
              <div className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full bg-accent-500" />
            )}

            <item.icon
              className="w-[18px] h-[18px] flex-shrink-0"
              strokeWidth={isActive ? 2.5 : 1.75}
            />

            <span
              className={`
                text-sm font-semibold whitespace-nowrap overflow-hidden transition-opacity duration-200
                ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
              `}
              style={{ transitionDelay: expanded ? '0.07s' : '0s' }}
            >
              {item.label}
            </span>

            {/* Badge */}
            {item.badge && expanded && (
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold bg-danger-500 text-white">
                {item.badge}
              </span>
            )}

            {/* Shortcut key */}
            {expanded && (
              <span className="ml-auto font-mono text-xs px-1.5 py-0.5 rounded shrink-0 opacity-20 bg-white/[0.04] border border-white/5 text-surface-400">
                {item.shortcut}
              </span>
            )}

            {/* Tooltip when collapsed */}
            {!expanded && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 z-50 bg-surface-800/96 border border-surface-700/50 text-surface-100 shadow-xl backdrop-blur-md">
                {item.label}
              </div>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
});

NavItem.propTypes = {
  item: PropTypes.shape({
    path: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    shortcut: PropTypes.string.isRequired,
    badge: PropTypes.number,
  }).isRequired,
  expanded: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
};

NavItem.defaultProps = {
  onClick: null,
};

/**
 * Navigation group with optional header
 */
const NavGroup = memo(function NavGroup({ title, items, expanded, onItemClick }) {
  if (!expanded) {
    return (
      <ul className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.path} item={item} expanded={false} onClick={onItemClick} />
        ))}
      </ul>
    );
  }

  return (
    <div className="mb-1">
      <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-surface-400/25">
        {title}
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.path} item={item} expanded={true} onClick={onItemClick} />
        ))}
      </ul>
    </div>
  );
});

NavGroup.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  expanded: PropTypes.bool.isRequired,
  onItemClick: PropTypes.func,
};

NavGroup.defaultProps = {
  onItemClick: null,
};

/**
 * Logo component
 */
const Logo = memo(function Logo({ isExpanded }) {
  return (
    <div className="relative z-10 px-3.5 py-4 flex items-center gap-3 border-b border-surface-700">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-accent-500 to-accent-700 shadow-lg shadow-accent-500/35">
        <Command className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
      </div>

      <div
        className={`
          overflow-hidden flex-1 min-w-0 transition-all duration-200
          ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
        `}
        style={{ transitionDelay: isExpanded ? '0.06s' : '0s' }}
      >
        <h1 className="text-[15px] font-extrabold tracking-tight whitespace-nowrap leading-none text-surface-100">
          Job Pulse
        </h1>
        <p className="text-[9px] font-bold tracking-[0.22em] uppercase whitespace-nowrap mt-0.5 text-surface-400/35">
          CTL Plumbing
        </p>
      </div>
    </div>
  );
});

Logo.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
};

/**
 * Global actions bar (Command palette, Notifications)
 */
const GlobalActions = memo(function GlobalActions({ 
  isExpanded, 
  onCommandPaletteOpen, 
  onNotificationsOpen, 
  notificationCount, 
  hasUrgent 
}) {
  return (
    <div className="relative z-10 px-2 pt-3 pb-2 border-b border-surface-700">
      <div className={`flex items-center gap-2 ${isExpanded ? 'px-1' : 'justify-center'}`}>
        <button
          onClick={onCommandPaletteOpen}
          className={`
            flex items-center gap-2 rounded-lg transition-all duration-150 
            hover:bg-white/5 text-surface-400/60 min-h-[36px]
            ${isExpanded ? 'px-2.5' : 'px-2'}
          `}
          title="Command Palette (Ctrl+K)"
        >
          <Command className="w-4 h-4 flex-shrink-0" />
          {isExpanded && (
            <>
              <span className="text-xs font-medium flex-1 text-left">Command...</span>
              <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/6 text-surface-400/40">
                ⌘K
              </kbd>
            </>
          )}
        </button>
        
        <NotificationBell
          count={notificationCount}
          hasUrgent={hasUrgent}
          onClick={onNotificationsOpen}
          size="sm"
        />
      </div>
    </div>
  );
});

GlobalActions.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onCommandPaletteOpen: PropTypes.func.isRequired,
  onNotificationsOpen: PropTypes.func.isRequired,
  notificationCount: PropTypes.number.isRequired,
  hasUrgent: PropTypes.bool.isRequired,
};

/**
 * Logout button
 */
const LogoutButton = memo(function LogoutButton({ isExpanded, onLogout }) {
  return (
    <button
      onClick={onLogout}
      className={`
        group/item relative flex items-center gap-3 rounded-lg transition-all duration-150 w-full
        ${isExpanded ? 'px-3 justify-start' : 'justify-center'}
        text-surface-400/45 hover:text-danger-400 min-h-[44px] py-2.5
      `}
    >
      <LogOut
        className="w-[18px] h-[18px] flex-shrink-0 group-hover/item:text-danger-400 transition-colors"
        strokeWidth={1.75}
      />

      <span
        className={`
          text-sm font-semibold whitespace-nowrap overflow-hidden group-hover/item:text-danger-400 transition-colors
          ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
        `}
        style={{ transitionDelay: isExpanded ? '0.07s' : '0s' }}
      >
        Logout
      </span>

      {!isExpanded && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 z-50 bg-surface-800/96 border border-surface-700/50 text-surface-100 shadow-xl backdrop-blur-md">
          Logout
        </div>
      )}
    </button>
  );
});

LogoutButton.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
};

/**
 * User card in footer
 */
const UserCard = memo(function UserCard({ isExpanded, user }) {
  return (
    <div
      className={`
        mx-1 rounded-lg p-2.5 flex items-center gap-2.5 transition-all duration-200
        ${isExpanded ? 'bg-white/[0.02] border border-surface-700' : 'justify-center'}
      `}
    >
      <div
        className={`
          rounded-md flex items-center justify-center font-bold text-white flex-shrink-0
          bg-gradient-to-br from-surface-700 to-surface-900
          ${isExpanded ? 'w-7 h-7 text-[9px]' : 'w-8 h-8 text-xs'}
        `}
      >
        {user?.username?.charAt(0) || <User className="w-4 h-4" />}
      </div>
      
      {isExpanded && (
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold truncate text-surface-300">
            {user?.username || 'Guest User'}
          </p>
          <p className="text-[9px] mt-0.5 text-surface-500 capitalize">
            {user?.role || 'Viewer'}
          </p>
        </div>
      )}
    </div>
  );
});

UserCard.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    username: PropTypes.string,
    role: PropTypes.string,
  }),
};

UserCard.defaultProps = {
  user: null,
};

/**
 * Time display component
 */
const TimeDisplay = memo(function TimeDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-xs tabular-nums text-surface-400/25">
      {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
    </span>
  );
});

/**
 * Sidebar pin toggle button
 */
const PinToggle = memo(function PinToggle({ pinned, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="tap-target rounded-lg transition-colors duration-150 hover:bg-white/5 text-surface-400/40"
      title={pinned ? 'Collapse sidebar (Ctrl+B)' : 'Pin sidebar (Ctrl+B)'}
      aria-label={pinned ? 'Collapse sidebar' : 'Pin sidebar'}
      aria-pressed={pinned}
    >
      {pinned ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
  );
});

PinToggle.propTypes = {
  pinned: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

function Sidebar({ 
  onCommandPaletteOpen, 
  onNotificationsOpen, 
  onItemClick,
  notificationCount = 0,
  hasUrgent = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const isExpanded = expanded || pinned;
  const { user, logout } = useAuth();

  // Keyboard shortcut to toggle sidebar pin
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setPinned(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <aside
      onMouseEnter={() => !pinned && setExpanded(true)}
      onMouseLeave={() => !pinned && setExpanded(false)}
      className="relative h-screen flex flex-col z-40 flex-shrink-0 transition-all duration-200 ease-out"
      style={{ width: isExpanded ? '240px' : '64px' }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-900 to-surface-950 border-r border-surface-700" />

      {/* Blueprint grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.012]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Logo area */}
      <div className="relative z-10 flex items-center gap-3 border-b border-surface-700 px-3.5 py-4">
        <Logo isExpanded={isExpanded} />
        {isExpanded && <PinToggle pinned={pinned} onToggle={() => setPinned(!pinned)} />}
      </div>

      {/* Global Actions */}
      <GlobalActions
        isExpanded={isExpanded}
        onCommandPaletteOpen={onCommandPaletteOpen}
        onNotificationsOpen={onNotificationsOpen}
        notificationCount={notificationCount}
        hasUrgent={hasUrgent}
      />

      {/* Main navigation */}
      <nav className="relative z-10 flex-1 py-2 px-2 overflow-y-auto scrollbar-hide">
        <NavGroup 
          title="Core"
          items={navGroups.core}
          expanded={isExpanded}
          onItemClick={onItemClick}
        />
        
        {isExpanded && <div className="my-2 mx-2 h-px bg-surface-700" />}
        
        <NavGroup 
          title="Tools"
          items={navGroups.tools}
          expanded={isExpanded}
          onItemClick={onItemClick}
        />

        {isExpanded && <div className="my-2 mx-2 h-px bg-surface-700" />}

        {/* Settings & Logout */}
        <ul className="space-y-0.5">
          {bottomNav.map((item) => (
            <NavItem key={item.path} item={item} expanded={isExpanded} onClick={onItemClick} />
          ))}
          <li>
            <LogoutButton isExpanded={isExpanded} onLogout={logout} />
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="relative z-10 px-2 pt-2 pb-3 border-t border-surface-700">
        <div className={`flex items-center mb-2 ${isExpanded ? 'px-2 justify-between' : 'justify-center'}`}>
          <ThemeToggle compact={!isExpanded} />
          {isExpanded && (
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-emerald-500/60" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/45">
                Online
              </span>
            </div>
          )}
        </div>

        <UserCard isExpanded={isExpanded} user={user} />

        {isExpanded && (
          <div className="mt-2 px-3 text-center">
            <TimeDisplay />
          </div>
        )}
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  onCommandPaletteOpen: PropTypes.func.isRequired,
  onNotificationsOpen: PropTypes.func.isRequired,
  onItemClick: PropTypes.func,
  notificationCount: PropTypes.number,
  hasUrgent: PropTypes.bool,
};

Sidebar.defaultProps = {
  onItemClick: null,
  notificationCount: 0,
  hasUrgent: false,
};

export default Sidebar;
