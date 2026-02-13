import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calculator,
  Ruler,
  Settings
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/leads', icon: Users, label: 'Leads' },
  { path: '/pricing', icon: Calculator, label: 'Price' },
  { path: '/takeoff', icon: Ruler, label: 'Takeoff' },
  { path: '/settings', icon: Settings, label: 'More' }
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `tap-target flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-accent-600'
                  : 'text-gray-500 active:bg-concrete-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <item.icon
                    className={`w-6 h-6 transition-all ${
                      isActive ? 'stroke-[2.5]' : 'stroke-[2]'
                    }`}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-600 rounded-full" />
                  )}
                </div>
                <span
                  className={`text-2xs font-semibold transition-all ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
