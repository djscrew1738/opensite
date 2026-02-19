import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, MessageSquare,
  Settings, Clock, ScanEye, Hammer, Zap,
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';
import { prefetchRoute } from '../../App';

const mainNav = [
  { path: '/',        icon: LayoutDashboard, label: 'Dashboard',    shortcut: '1' },
  { path: '/leads',   icon: Users,           label: 'Lead Finder',  shortcut: '2' },
  { path: '/plans',   icon: ClipboardList,   label: 'Plans',        shortcut: '3' },
  { path: '/ai',      icon: MessageSquare,   label: 'AI Assistant', shortcut: '4' },
  { path: '/history', icon: Clock,           label: 'History',      shortcut: '5' },
  { path: '/vision',  icon: ScanEye,         label: 'Vision',       shortcut: '6' },
];

const bottomNav = [
  { path: '/settings', icon: Settings, label: 'Settings', shortcut: '7' },
];

function NavItem({ item, expanded, isActive }) {
  return (
    <li>
      <NavLink
        to={item.path}
        end={item.path === '/'}
        onMouseOver={() => prefetchRoute(item.path)}
        className="group/item relative flex items-center gap-3 rounded-xl transition-all duration-150"
        style={({ isActive: a }) => ({
          padding: expanded ? '9px 12px' : '9px 0',
          justifyContent: expanded ? 'flex-start' : 'center',
          background: a ? 'rgba(0,53,148,0.11)' : 'transparent',
          color: a ? '#4a8ae6' : 'rgba(200,197,191,0.45)',
        })}
        onMouseEnter={(e) => {
          const active = e.currentTarget.style.background !== 'transparent';
          if (!active) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = 'rgba(226,224,220,0.72)';
          }
        }}
        onMouseLeave={(e) => {
          const a = e.currentTarget.getAttribute('aria-current') === 'page';
          if (!a) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(200,197,191,0.45)';
          }
        }}
      >
        {({ isActive: a }) => (
          <>
            {/* Active left bar */}
            {a && (
              <div
                className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full"
                style={{ background: '#4a8ae6' }}
              />
            )}

            <item.icon
              className="w-[18px] h-[18px] flex-shrink-0"
              strokeWidth={a ? 2.5 : 1.75}
            />

            {/* Label */}
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

            {/* Shortcut key */}
            {expanded && (
              <span
                className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0"
                style={{
                  opacity: 0.18,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'rgba(200,197,191,0.6)',
                  transitionDelay: '0.12s',
                }}
              >
                {item.shortcut}
              </span>
            )}

            {/* Tooltip (collapsed only) */}
            {!expanded && (
              <div
                className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 z-50"
                style={{
                  background: 'rgba(16,14,12,0.96)',
                  border: '1px solid rgba(50,47,44,0.5)',
                  color: '#e2e0dc',
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
  const location = useLocation();

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="relative h-screen flex flex-col z-40 flex-shrink-0"
      style={{
        width: expanded ? '252px' : '64px',
        transition: 'width 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(10,9,8,0.99) 0%, rgba(11,10,9,0.99) 100%)',
          borderRight: '1px solid rgba(38,35,32,0.7)',
          backdropFilter: 'blur(20px)',
        }}
      />

      {/* Blueprint grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,53,148,0.5) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(0,53,148,0.5) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.011,
        }}
      />

      {/* Right edge highlight */}
      <div
        className="absolute top-0 right-0 bottom-0 w-px pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,53,148,0.06), transparent 40%, transparent 60%, rgba(0,53,148,0.06))',
        }}
      />

      {/* Logo area */}
      <div
        className="relative z-10 px-3.5 py-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(38,35,32,0.5)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #003594 0%, #001a52 100%)',
            boxShadow: '0 2px 10px rgba(0,53,148,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          <Hammer className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
        </div>

        <div
          className="overflow-hidden flex-1 min-w-0"
          style={{
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
            transitionDelay: expanded ? '0.08s' : '0s',
          }}
        >
          <h1 className="text-[15px] font-display font-extrabold text-white tracking-tight whitespace-nowrap leading-none">
            Opensite
          </h1>
          <p
            className="text-[9px] font-bold tracking-[0.22em] uppercase whitespace-nowrap mt-0.5"
            style={{ color: 'rgba(160,155,147,0.38)' }}
          >
            CTL Intelligence
          </p>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="relative z-10 flex-1 py-2.5 px-2 overflow-y-auto scrollbar-hide">
        <ul className="space-y-0.5">
          {mainNav.map((item) => (
            <NavItem key={item.path} item={item} expanded={expanded} />
          ))}
        </ul>

        {/* Separator before settings */}
        <div
          className="my-2 mx-2 h-px"
          style={{ background: 'rgba(38,35,32,0.6)' }}
        />

        <ul className="space-y-0.5">
          {bottomNav.map((item) => (
            <NavItem key={item.path} item={item} expanded={expanded} />
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className="relative z-10 px-2 pt-2.5 pb-4"
        style={{ borderTop: '1px solid rgba(38,35,32,0.5)' }}
      >
        <div
          className={`flex items-center mb-2.5 ${
            expanded ? 'px-2 justify-between' : 'justify-center'
          }`}
        >
          <ThemeToggle compact={!expanded} />
          {expanded && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'rgba(52,211,153,0.45)' }}
              >
                Online
              </span>
            </div>
          )}
        </div>

        {/* Company card (expanded only) */}
        {expanded && (
          <div
            className="mx-1 rounded-xl p-2.5 flex items-center gap-2.5"
            style={{
              background: 'rgba(255,255,255,0.024)',
              border: '1px solid rgba(38,35,32,0.55)',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #243b53 0%, #1a2e40 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              CTL
            </div>
            <div className="min-w-0">
              <p
                className="text-[11px] font-semibold truncate"
                style={{ color: 'rgba(226,224,220,0.65)' }}
              >
                CTL Plumbing LLC
              </p>
              <p
                className="text-[9px] mt-0.5"
                style={{ color: 'rgba(160,155,147,0.32)' }}
              >
                DFW Metroplex
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
