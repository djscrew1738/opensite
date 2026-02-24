import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Menu, Search, Command } from 'lucide-react';

/**
 * Page Metadata Registry
 * Centralized page configuration
 */
export const pageMetadata = {
  '/': {
    title: 'Dashboard',
    icon: null,
    parent: null,
    description: 'Command center overview',
  },
  '/jobs': {
    title: 'Jobs',
    icon: null,
    parent: { path: '/', title: 'Home' },
    description: 'Manage active jobs',
  },
  '/leads': {
    title: 'Lead Finder',
    icon: null,
    parent: { path: '/', title: 'Home' },
    description: 'Discover and track leads',
  },
  '/documents': {
    title: 'Documents',
    icon: null,
    parent: { path: '/', title: 'Home' },
    description: 'Blueprints and files',
  },
  '/settings': {
    title: 'Settings',
    icon: null,
    parent: { path: '/', title: 'Home' },
    description: 'System configuration',
  },
  '/canvas': {
    title: 'Canvas',
    icon: null,
    parent: { path: '/', title: 'Home' },
    description: 'Visual planning tool',
  },
};

/**
 * Get page metadata by path
 */
export function getPageMeta(path) {
  // Exact match
  if (pageMetadata[path]) {
    return pageMetadata[path];
  }
  
  // Check for parent paths (e.g., /jobs/123 should match /jobs)
  const parentPath = Object.keys(pageMetadata)
    .filter(p => p !== '/')
    .sort((a, b) => b.length - a.length) // Longest first
    .find(p => path.startsWith(p));
  
  if (parentPath) {
    return pageMetadata[parentPath];
  }
  
  // Default fallback
  return {
    title: 'OpenSite',
    icon: null,
    parent: { path: '/', title: 'Home' },
    description: '',
  };
}

/**
 * PageHeaderBar - Consistent top header bar
 * 
 * Features:
 * - Page title with icon
 * - Breadcrumb navigation (optional)
 * - Page-level action slot
 * - Responsive design
 * - Adapts to mobile/desktop
 */
export default function PageHeaderBar({ 
  title: propTitle,
  actions,
  showBreadcrumb = true,
  showMobileMenu = false,
  onMobileMenuClick,
  onSearchClick,
  className = '',
}) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  // Get metadata from registry or props
  const meta = getPageMeta(location.pathname);
  const title = propTitle || meta.title;
  const parent = meta.parent;
  
  // Track scroll for glassmorphism effect
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    
    const handleScroll = () => {
      setScrolled(main.scrollTop > 10);
    };
    
    main.addEventListener('scroll', handleScroll);
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header 
      className={`
        sticky top-0 z-30 
        transition-all duration-200
        ${scrolled 
          ? 'bg-surface-primary/95 backdrop-blur-xl border-b border-border shadow-sm' 
          : 'bg-transparent border-b border-transparent'
        }
        ${className}
      `}
    >
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left: Breadcrumb + Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile menu button */}
          {showMobileMenu && (
            <button
              onClick={onMobileMenuClick}
              className="lg:hidden p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          {/* Breadcrumb */}
          {showBreadcrumb && parent && (
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-sm text-text-muted">
              <Link 
                to={parent.path}
                className="flex items-center gap-1 hover:text-text-primary transition-colors"
              >
                {parent.path === '/' ? (
                  <Home className="w-4 h-4" />
                ) : (
                  <span>{parent.title}</span>
                )}
              </Link>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </nav>
          )}
          
          {/* Title */}
          <div className="flex items-center gap-2 min-w-0">
            {meta.icon && (
              <meta.icon className="w-5 h-5 text-accent-blue flex-shrink-0" />
            )}
            <h1 className="text-lg font-semibold text-text-primary truncate">
              {title}
            </h1>
          </div>
        </div>
        
        {/* Center: Search Trigger (Desktop) */}
        {onSearchClick && (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <button
              onClick={onSearchClick}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated/50 border border-border hover:border-border-strong hover:bg-surface-elevated transition-all text-left group"
            >
              <Search className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
              <span className="flex-1 text-sm text-text-muted">Search...</span>
              <kbd className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono text-text-muted bg-surface-card border border-border">
                <Command className="w-3 h-3" />
                <span>K</span>
              </kbd>
            </button>
          </div>
        )}

        {/* Right: Actions slot */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * PageHeaderBarSkeleton - Loading state
 */
export function PageHeaderBarSkeleton() {
  return (
    <div className="h-14 px-4 lg:px-6 flex items-center gap-4 border-b border-border">
      <div className="h-5 w-24 bg-surface-elevated rounded animate-pulse" />
      <div className="flex-1" />
      <div className="h-8 w-20 bg-surface-elevated rounded animate-pulse" />
    </div>
  );
}

/**
 * Simple title-only variant for compact layouts
 */
export function PageTitle({ children, className = '' }) {
  return (
    <h1 className={`text-xl font-semibold text-text-primary ${className}`}>
      {children}
    </h1>
  );
}

/**
 * Action button for header slot
 */
export function HeaderAction({ 
  children, 
  onClick, 
  variant = 'primary',
  icon: Icon,
  ...props 
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  };
  
  return (
    <button 
      onClick={onClick}
      className={`${variants[variant]} flex items-center gap-2 text-sm`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
