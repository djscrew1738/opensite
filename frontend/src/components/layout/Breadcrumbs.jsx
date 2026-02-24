import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Route title mappings
const routeTitles = {
  '/': { title: 'Dashboard', icon: null },
  '/plans': { title: 'Plans', icon: null },
  '/ai': { title: 'AI Assistant', icon: null },
  '/documents': { title: 'Documents', icon: null },
  '/vision': { title: 'Vision', icon: null },
  '/plumbing': { title: '4D Plumbing', icon: null },
  '/canvas': { title: 'Canvas', icon: null },
  '/history': { title: 'History', icon: null },
  '/settings': { title: 'Settings', icon: null },
  '/alerts': { title: 'Alerts', icon: null },
};

// Route hierarchy for nested breadcrumbs
const routeHierarchy = {
  '/plans': ['/'],
  '/ai': ['/'],
  '/documents': ['/'],
  '/vision': ['/'],
  '/plumbing': ['/'],
  '/canvas': ['/'],
  '/history': ['/'],
  '/settings': ['/'],
  '/alerts': ['/'],
};

export default function Breadcrumbs({ customItems, className = '' }) {
  const location = useLocation();
  
  const breadcrumbs = useMemo(() => {
    // If custom items provided, use those
    if (customItems) return customItems;
    
    const currentPath = location.pathname;
    const currentRoute = routeTitles[currentPath];
    
    if (!currentRoute) return [];
    
    // Build breadcrumb trail
    const trail = [];
    
    // Always start with home
    trail.push({
      label: 'Home',
      path: '/',
      icon: Home,
      isActive: currentPath === '/',
    });
    
    // Add parent routes from hierarchy
    const parents = routeHierarchy[currentPath] || [];
    parents.forEach(parentPath => {
      if (parentPath !== '/' && routeTitles[parentPath]) {
        trail.push({
          label: routeTitles[parentPath].title,
          path: parentPath,
          icon: routeTitles[parentPath].icon,
          isActive: false,
        });
      }
    });
    
    // Add current page
    if (currentPath !== '/') {
      trail.push({
        label: currentRoute.title,
        path: currentPath,
        icon: currentRoute.icon,
        isActive: true,
      });
    }
    
    return trail;
  }, [location.pathname, customItems]);

  if (breadcrumbs.length <= 1) {
    // Don't show breadcrumbs on home page
    return null;
  }

  return (
    <nav 
      className={`flex items-center gap-1.5 text-sm ${className}`}
      aria-label="Breadcrumbs"
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const Icon = crumb.icon;
        
        return (
          <div key={crumb.path} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight 
                className="w-3.5 h-3.5 flex-shrink-0" 
                style={{ color: 'rgba(148, 163, 184, 0.3)' }}
              />
            )}
            
            {isLast ? (
              <span 
                className="font-semibold truncate max-w-[200px]"
                style={{ color: '#F1F5F9' }}
                aria-current="page"
              >
                {Icon && <Icon className="w-4 h-4 inline mr-1.5" />}
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="flex items-center gap-1.5 transition-colors hover:text-brand-400 truncate max-w-[150px]"
                style={{ color: '#94A3B8' }}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{crumb.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Compact breadcrumb for mobile or constrained spaces
export function CompactBreadcrumbs({ className = '' }) {
  const location = useLocation();
  const currentRoute = routeTitles[location.pathname];
  
  if (!currentRoute || location.pathname === '/') {
    return null;
  }

  return (
    <Link
      to="/"
      className={`flex items-center gap-1.5 text-sm transition-colors ${className}`}
      style={{ color: '#94A3B8' }}
    >
      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
      <span>Back to Dashboard</span>
    </Link>
  );
}

// Page title with breadcrumb integration
export function PageTitle({ title, subtitle, action, breadcrumbs: showBreadcrumbs = true }) {
  const location = useLocation();
  const currentRoute = routeTitles[location.pathname];
  const displayTitle = title || currentRoute?.title || 'Page';
  
  return (
    <div className="space-y-2">
      {showBreadcrumbs && <Breadcrumbs className="mb-2" />}
      
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 
            className="text-xl sm:text-2xl font-bold tracking-tight"
            style={{ color: '#F1F5F9' }}
          >
            {displayTitle}
          </h1>
          {subtitle && (
            <p 
              className="text-sm mt-0.5"
              style={{ color: '#94A3B8' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
