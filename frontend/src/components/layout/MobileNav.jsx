import { NavLink } from 'react-router-dom';
import { prefetchRoute } from '../../App';
import {
  LayoutDashboard,
  HardHat,
  Radar,
  Network,
  Bell,
} from 'lucide-react';

const navItems = [
  { path: '/',       icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/plans',  icon: HardHat,         label: 'Jobs'      },
  { path: '/leads',  icon: Radar,           label: 'Leads'     },
  { path: '/canvas', icon: Network,         label: 'Canvas'    },
  { path: '/alerts', icon: Bell,            label: 'Alerts'    },
];

export default function MobileNav({ alertCount = 0 }) {
  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onTouchStart={() => prefetchRoute(item.path)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-manipulation"
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon
                    className="w-[22px] h-[22px] transition-colors duration-200"
                    strokeWidth={isActive ? 2.5 : 1.75}
                    style={{
                      color: isActive ? '#3B82F6' : 'rgba(148, 163, 184, 0.5)',
                    }}
                    fill={isActive ? 'rgba(59, 130, 246, 0.15)' : 'none'}
                  />

                  {/* Alert badge */}
                  {item.path === '/alerts' && alertCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold"
                      style={{
                        width: '16px',
                        height: '16px',
                        fontSize: '9px',
                        borderRadius: '8px',
                        background: '#EF4444',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </div>

                <span
                  className="font-semibold leading-none transition-colors duration-200"
                  style={{
                    fontSize: '10px',
                    color: isActive ? '#3B82F6' : 'rgba(148, 163, 184, 0.4)',
                  }}
                >
                  {item.label}
                </span>

                {/* Active dot indicator */}
                <div
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: '3px',
                    height: '3px',
                    background: isActive ? '#3B82F6' : 'transparent',
                    transform: isActive ? 'scale(1)' : 'scale(0)',
                    boxShadow: isActive ? '0 0 6px rgba(59, 130, 246, 0.4)' : 'none',
                  }}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
