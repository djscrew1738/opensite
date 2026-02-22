import { useState, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, MessageSquare,
  Settings, Clock, ScanEye, HardHat, Box, Files,
  Network, ChevronLeft, ChevronRight, Wifi, WifiOff,
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';
import { prefetchRoute } from '../../App';

const mainNav = [
  { path: '/',          icon: LayoutDashboard, label: 'Dashboard',    shortcut: '1' },
  { path: '/leads',     icon: Users,           label: 'Lead Finder',  shortcut: '2' },
  { path: '/plans',     icon: ClipboardList,   label: 'Plans',        shortcut: '3' },
  { path: '/ai',        icon: MessageSquare,   label: 'AI Assistant', shortcut: '4' },
  { path: '/history',   icon: Clock,           label: 'History',      shortcut: '5' },
  { path: '/vision',    icon: ScanEye,         label: 'Vision',       shortcut: '6' },
  { path: '/documents', icon: Files,           label: 'Documents',    shortcut: '7' },
  { path: '/plumbing',  icon: Box,             label: '4D Plumbing',  shortcut: '8' },
  { path: '/canvas',    icon: Network,         label: 'Canvas',       shortcut: '9' },
];

const bottomNav = [
  { path: '/settings', icon: Settings, label: 'Settings', shortcut: '0' },
];

function NavItem({ item, expanded }) {
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
        className="group/item relative flex items-center gap-3 rounded-lg transition-all duration-150"
        style={({ isActive }) => ({
          padding: expanded ? '10px 12px' : '10px 0',
          justifyContent: expanded ? 'flex-start' : 'center',
          background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          color: isActive ? '#3B82F6' : 'rgba(148, 163, 184, 0.45)',
          minHeight: '40px',
        })}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={() => prefetchRoute(item.path)}
        onFocus={() => prefetchRoute(item.path)}
      >
        {({ isActive }) => (
          <>
            {/* Active left indicator */}
            {isActive && (
              <div
                className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full"
                style={{ background: '#3B82F6' }}
              />
            )}

            <item.icon
              className="w-[18px] h-[18px] flex-shrink-0"
              strokeWidth={isActive ? 2.5 : 1.75}
            />

            <span
              className="text-sm font-semibold whitespace-nowrap overflow-hidden"
              style={{
                opacity: expanded ? 1 : 0,
                width: expanded ? 'auto' : 0,
                transition: 'opacity 0.2s ease',
                transitionDelay: expanded ? '0.07s' : '0s',
              }}
            >
              {item.label}
            </span>

            {expanded && (
              <span
                className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0"
                style={{
                  opacity: 0.18,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'rgba(148, 163, 184, 0.6)',
                }}
              >
                {item.shortcut}
              </span>
            )}

            {!expanded && (
              <div
                className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 z-50"
                style={{
                  background: 'rgba(24, 28, 36, 0.96)',
                  border: '1px solid rgba(45, 53, 72, 0.5)',
                  color: '#F1F5F9',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {item.label}
              </div>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const location = useLocation();
  const isExpanded = expanded || pinned;

  return (
    <aside
      onMouseEnter={() => !pinned && setExpanded(true)}
      onMouseLeave={() => !pinned && setExpanded(false)}
      className="relative h-screen flex flex-col z-40 flex-shrink-0"
      style={{
        width: isExpanded ? '240px' : '64px',
        transition: 'width 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0C0D10 0%, #0A0B0D 100%)',
          borderRight: '1px solid #1F2430',
        }}
      />

      {/* Blueprint grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.012,
        }}
      />

      {/* Logo area */}
      <div
        className="relative z-10 px-3.5 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid #1F2430' }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
            boxShadow: '0 2px 10px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          <HardHat className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
        </div>

        <div
          className="overflow-hidden flex-1 min-w-0"
          style={{
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            transitionDelay: isExpanded ? '0.06s' : '0s',
          }}
        >
          <h1
            className="text-[15px] font-extrabold tracking-tight whitespace-nowrap leading-none"
            style={{ color: '#F1F5F9' }}
          >
            Job Pulse
          </h1>
          <p
            className="text-[9px] font-bold tracking-[0.22em] uppercase whitespace-nowrap mt-0.5"
            style={{ color: 'rgba(148,163,184,0.35)' }}
          >
            CTL Plumbing
          </p>
        </div>

        {/* Pin/collapse toggle */}
        {isExpanded && (
          <button
            onClick={() => setPinned(!pinned)}
            className="tap-target rounded-lg transition-colors duration-150 hover:bg-white/5"
            style={{ color: 'rgba(148, 163, 184, 0.4)' }}
            title={pinned ? 'Collapse sidebar' : 'Pin sidebar'}
          >
            {pinned ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Main navigation */}
      <nav className="relative z-10 flex-1 py-2 px-2 overflow-y-auto scrollbar-hide">
        <ul className="space-y-0.5">
          {mainNav.map((item) => (
            <NavItem key={item.path} item={item} expanded={isExpanded} />
          ))}
        </ul>

        <div className="my-2 mx-2 h-px" style={{ background: '#1F2430' }} />

        <ul className="space-y-0.5">
          {bottomNav.map((item) => (
            <NavItem key={item.path} item={item} expanded={isExpanded} />
          ))}
        </ul>
      </nav>

      {/* Footer — status + theme */}
      <div className="relative z-10 px-2 pt-2 pb-3" style={{ borderTop: '1px solid #1F2430' }}>
        <div className={`flex items-center mb-2 ${isExpanded ? 'px-2 justify-between' : 'justify-center'}`}>
          <ThemeToggle compact={!isExpanded} />
          {isExpanded && (
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" style={{ color: 'rgba(16,185,129,0.6)' }} />
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'rgba(16,185,129,0.45)' }}
              >
                Online
              </span>
            </div>
          )}
        </div>

        {/* Company card (expanded only) */}
        {isExpanded && (
          <div
            className="mx-1 rounded-lg p-2.5 flex items-center gap-2.5"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid #1F2430',
            }}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              }}
            >
              CTL
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold truncate" style={{ color: 'rgba(241,245,249,0.6)' }}>
                CTL Plumbing LLC
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: 'rgba(148,163,184,0.3)' }}>
                DFW Metroplex
              </p>
            </div>
          </div>
        )}

        {/* Current time */}
        {isExpanded && (
          <div className="mt-2 px-3 text-center">
            <TimeDisplay />
          </div>
        )}
      </div>
    </aside>
  );
}

function TimeDisplay() {
  const [time, setTime] = useState(new Date());

  useState(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  });

  return (
    <span className="font-mono text-[10px] tabular-nums" style={{ color: 'rgba(148,163,184,0.25)' }}>
      {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
    </span>
  );
}
