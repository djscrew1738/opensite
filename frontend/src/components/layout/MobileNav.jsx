import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  MessageSquare,
  Settings
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/leads', icon: Users, label: 'Leads' },
  { path: '/plans', icon: ClipboardList, label: 'Plans' },
  { path: '/ai', icon: MessageSquare, label: 'AI' },
  { path: '/settings', icon: Settings, label: 'More' }
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      {/* Copper accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 53, 148, 0.2), transparent)',
        }}
      />

      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className="tap-target flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200"
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  {/* Active glow — reduced intensity */}
                  {isActive && (
                    <div
                      className="absolute -inset-1 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(0, 53, 148, 0.1), transparent)',
                      }}
                    />
                  )}
                  <item.icon
                    className="w-5 h-5 relative transition-all duration-200"
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{
                      color: isActive ? '#003594' : 'rgba(160, 155, 147, 0.6)',
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-semibold transition-all duration-200"
                  style={{
                    color: isActive ? '#003594' : 'rgba(160, 155, 147, 0.5)',
                  }}
                >
                  {item.label}
                </span>

                {/* Active dot indicator — smaller */}
                {isActive && (
                  <div
                    className="w-0.5 h-0.5 rounded-full -mt-0.5"
                    style={{
                      background: '#003594',
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
