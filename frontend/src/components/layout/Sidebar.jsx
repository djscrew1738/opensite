import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  MessageSquare,
  Settings,
  Hammer,
  ChevronRight,
  Zap
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', shortcut: '1' },
  { path: '/leads', icon: Users, label: 'Lead Finder', shortcut: '2' },
  { path: '/plans', icon: ClipboardList, label: 'Plans', shortcut: '3' },
  { path: '/ai', icon: MessageSquare, label: 'AI Assistant', shortcut: '4' },
  { path: '/settings', icon: Settings, label: 'Settings', shortcut: '5' }
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="group relative h-screen flex flex-col z-40"
      style={{
        width: expanded ? '260px' : '72px',
        transition: 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Background layer — deeper with vertical gradient */}
      <div
        className="absolute inset-0 border-r"
        style={{
          background: 'linear-gradient(180deg, rgba(10,9,8,0.98) 0%, rgba(14,13,12,0.98) 100%)',
          borderColor: 'rgba(61, 57, 53, 0.15)',
          backdropFilter: 'blur(20px) saturate(1.5)',
        }}
      />

      {/* Subtle grid pattern overlay — reduced opacity */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 53, 148, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 53, 148, 0.5) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Inner highlight edge */}
      <div
        className="absolute top-0 right-0 bottom-0 w-px pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0, 53, 148, 0.08), transparent 30%, transparent 70%, rgba(0, 53, 148, 0.08))',
        }}
      />

      {/* Logo area */}
      <div className="relative z-10 px-4 py-5 flex items-center gap-3 border-b border-white/[0.04]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #003594 0%, #002266 100%)',
            boxShadow: '0 4px 12px rgba(0, 53, 148, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          }}
        >
          <Hammer className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>

        <div
          className="overflow-hidden flex-1 min-w-0"
          style={{
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            transitionDelay: expanded ? '0.1s' : '0s',
          }}
        >
          <h1 className="text-lg font-display font-extrabold text-white tracking-tight whitespace-nowrap">
            Opensite
          </h1>
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase whitespace-nowrap"
            style={{ color: 'rgba(200, 197, 191, 0.5)' }}>
            CTL Plumbing
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 py-3 px-2 overflow-y-auto scrollbar-hide">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className="relative flex items-center gap-3 rounded-xl transition-all duration-200 group/item"
                  style={{
                    padding: expanded ? '10px 14px' : '10px 0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    background: isActive
                      ? 'rgba(0, 53, 148, 0.08)'
                      : 'transparent',
                    color: isActive ? '#003594' : 'rgba(200, 197, 191, 0.5)',
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.color = 'rgba(226, 224, 220, 0.85)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(200, 197, 191, 0.5)';
                    }
                  }}
                >
                  {/* Active indicator — left bar, 2px width, no glow */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                      style={{
                        background: '#003594',
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div className="w-5 h-5 flex-shrink-0 transition-transform duration-200">
                    <item.icon
                      className="w-5 h-5"
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className="text-sm font-semibold whitespace-nowrap overflow-hidden"
                    style={{
                      opacity: expanded ? 1 : 0,
                      width: expanded ? 'auto' : '0',
                      transition: 'opacity 0.2s ease',
                      transitionDelay: expanded ? '0.08s' : '0s',
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Keyboard shortcut hint — subtler */}
                  {expanded && (
                    <span
                      className="ml-auto text-[10px] font-mono rounded px-1.5 py-0.5 whitespace-nowrap"
                      style={{
                        opacity: expanded ? 0.25 : 0,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        color: 'rgba(200, 197, 191, 0.4)',
                        transition: 'opacity 0.2s ease',
                        transitionDelay: '0.15s',
                      }}
                    >
                      {item.shortcut}
                    </span>
                  )}

                  {/* Tooltip (collapsed state) — with backdrop-blur */}
                  {!expanded && (
                    <div
                      className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-150"
                      style={{
                        background: 'rgba(26, 24, 22, 0.95)',
                        border: '1px solid rgba(61, 57, 53, 0.3)',
                        color: '#e2e0dc',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      {item.label}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="relative z-10 px-2 pb-4 space-y-3">
        {/* Theme toggle row */}
        <div className={`flex items-center ${expanded ? 'px-2 justify-between' : 'justify-center'}`}>
          <ThemeToggle compact={!expanded} />
          {expanded && (
            <div className="flex items-center gap-1.5" style={{ opacity: 0.4 }}>
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Online</span>
            </div>
          )}
        </div>

        {/* Company card — tighter proportions */}
        {expanded && (
          <div
            className="mx-1 rounded-xl p-3 transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(61, 57, 53, 0.12)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #334e68, #243b53)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              >
                CTL
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/80 truncate">CTL Plumbing LLC</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(200, 197, 191, 0.4)' }}>
                  DFW Metroplex
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
