import { NavLink } from 'react-router-dom';
import { prefetchRoute } from '../../App';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ScanEye,
  Settings,
} from 'lucide-react';

const navItems = [
  { path: '/',         icon: LayoutDashboard, label: 'Home'     },
  { path: '/leads',    icon: Users,           label: 'Leads'    },
  { path: '/plans',    icon: ClipboardList,   label: 'Plans'    },
  { path: '/vision',   icon: ScanEye,         label: 'Vision'   },
  { path: '/settings', icon: Settings,        label: 'Settings' },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-10 right-10 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,53,148,0.22), transparent)',
        }}
      />

      <div className="flex items-center justify-around px-1 pt-1.5 pb-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onTouchStart={() => prefetchRoute(item.path)}
            className="tap-target flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
          >
            {({ isActive }) => (
              <>
                <div className="relative mb-0.5">
                  {isActive && (
                    <div
                      className="absolute -inset-1.5 rounded-full pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle, rgba(0,53,148,0.09), transparent)',
                      }}
                    />
                  )}
                  <item.icon
                    className="w-5 h-5 relative transition-all duration-200"
                    strokeWidth={isActive ? 2.5 : 1.75}
                    style={{ color: isActive ? '#003594' : 'rgba(160,155,147,0.52)' }}
                  />
                </div>

                <span
                  className="text-[9px] font-bold tracking-wide leading-none transition-all duration-200"
                  style={{ color: isActive ? '#003594' : 'rgba(160,155,147,0.42)' }}
                >
                  {item.label}
                </span>

                {/* Active dot */}
                <div
                  className="w-[3px] h-[3px] rounded-full mt-0.5 transition-all duration-200"
                  style={{
                    background: isActive ? '#003594' : 'transparent',
                    transform: isActive ? 'scale(1)' : 'scale(0)',
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
