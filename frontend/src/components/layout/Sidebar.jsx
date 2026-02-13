import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calculator,
  MessageSquare,
  Settings,
  Ruler,
  Hammer
} from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/leads', icon: Users, label: 'Lead Finder' },
  { path: '/pricing', icon: Calculator, label: 'Pricing' },
  { path: '/takeoff', icon: Ruler, label: 'Takeoff' },
  { path: '/ai', icon: MessageSquare, label: 'AI Assistant' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-gradient-to-b from-primary-950 to-primary-900 h-screen flex flex-col text-white shadow-2xl">
      {/* Logo & Branding */}
      <div className="p-6 border-b border-primary-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
              <Hammer className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">1stein</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-xs text-primary-300 font-medium tracking-wide uppercase pl-1">
          CTL Plumbing Intelligence
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30'
                      : 'text-primary-200 hover:bg-primary-800/50 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                      <item.icon
                        className="w-5 h-5"
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>
                    <span className={`font-semibold ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Company Info Footer */}
      <div className="p-6 border-t border-primary-800/50">
        <div className="bg-primary-800/40 backdrop-blur-sm rounded-xl p-4 border border-primary-700/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              CTL
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white">CTL Plumbing LLC</p>
              <p className="text-xs text-primary-300 mt-0.5">DFW Metroplex</p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-2xs text-primary-300 font-medium">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

