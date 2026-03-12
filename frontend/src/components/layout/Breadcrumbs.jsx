/**
 * Breadcrumbs Component
 * Navigation breadcrumbs with page title integration
 * 
 * @module components/layout/Breadcrumbs
 */

import { useMemo, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { colors } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Record<string, {title: string, icon: React.ComponentType | null}>} */
const routeTitles = {
  '/': { title: 'Dashboard', icon: null },
  '/plans': { title: 'Plans', icon: null },
  '/leads': { title: 'Lead Finder', icon: null },
  '/ai': { title: 'AI Assistant', icon: null },
  '/documents': { title: 'Documents', icon: null },
  '/vision': { title: 'Vision', icon: null },
  '/plumbing': { title: '4D Plumbing', icon: null },
  '/canvas': { title: 'Canvas', icon: null },
  '/history': { title: 'History', icon: null },
  '/settings': { title: 'Settings', icon: null },
  '/alerts': { title: 'Alerts', icon: null },
};

/** @type {Record<string, string[]>} */
const routeHierarchy = {
  '/plans': ['/'],
  '/leads': ['/'],
  '/ai': ['/'],
  '/documents': ['/'],
  '/vision': ['/'],
  '/plumbing': ['/'],
  '/canvas': ['/'],
  '/history': ['/'],
  '/settings': ['/'],
  '/alerts': ['/'],
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Individual breadcrumb item
 */
const BreadcrumbItem = memo(function BreadcrumbItem({ 
  crumb, 
  isLast, 
  showSeparator 
}) {
  const Icon = crumb.icon;
  
  return (
    <div className="flex items-center gap-1.5">
      {showSeparator && (
        <ChevronRight 
          className="w-3.5 h-3.5 flex-shrink-0" 
          style={{ color: `${colors.text.secondary}4D` }} // 30% opacity
        />
      )}
      
      {isLast ? (
        <span 
          className="font-semibold truncate max-w-[200px]"
          style={{ color: colors.text.primary }}
          aria-current="page"
        >
          {Icon && <Icon className="w-4 h-4 inline mr-1.5" />}
          {crumb.label}
        </span>
      ) : (
        <Link
          to={crumb.path}
          className="flex items-center gap-1.5 transition-colors hover:text-brand-400 truncate max-w-[150px]"
          style={{ color: colors.text.secondary }}
        >
          {Icon && <Icon className="w-4 h-4" />}
          <span>{crumb.label}</span>
        </Link>
      )}
    </div>
  );
});

BreadcrumbItem.displayName = 'BreadcrumbItem';

// ═══════════════════════════════════════════════════════════════
// Main Components
// ═══════════════════════════════════════════════════════════════

/**
 * Breadcrumbs - Full breadcrumb navigation trail
 * 
 * @param {{
 *   customItems?: Array<{label: string, path: string, icon?: React.ComponentType}>,
 *   className?: string
 * }} props
 */
export default function Breadcrumbs({ customItems, className = '' }) {
  const location = useLocation();
  
  const breadcrumbs = useMemo(() => {
    if (customItems) return customItems;
    
    const currentPath = location.pathname;
    const currentRoute = routeTitles[currentPath];
    
    if (!currentRoute) return [];
    
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
    return null;
  }

  return (
    <nav 
      className={`flex items-center gap-1.5 text-sm ${className}`}
      aria-label="Breadcrumbs"
    >
      {breadcrumbs.map((crumb, index) => (
        <BreadcrumbItem
          key={crumb.path}
          crumb={crumb}
          isLast={index === breadcrumbs.length - 1}
          showSeparator={index > 0}
        />
      ))}
    </nav>
  );
}

/**
 * CompactBreadcrumbs - Mobile/back navigation
 * 
 * @param {{className?: string}} props
 */
export const CompactBreadcrumbs = memo(function CompactBreadcrumbs({ className = '' }) {
  const location = useLocation();
  const currentRoute = routeTitles[location.pathname];
  
  if (!currentRoute || location.pathname === '/') {
    return null;
  }

  return (
    <Link
      to="/"
      className={`flex items-center gap-1.5 text-sm transition-colors ${className}`}
      style={{ color: colors.text.secondary }}
    >
      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
      <span>Back to Dashboard</span>
    </Link>
  );
});

CompactBreadcrumbs.displayName = 'CompactBreadcrumbs';

/**
 * PageTitle - Page title with breadcrumb integration
 * 
 * @param {{
 *   title?: string,
 *   subtitle?: string,
 *   action?: React.ReactNode,
 *   breadcrumbs?: boolean
 * }} props
 */
export const PageTitle = memo(function PageTitle({ 
  title, 
  subtitle, 
  action, 
  breadcrumbs: showBreadcrumbs = true 
}) {
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
            style={{ color: colors.text.primary }}
          >
            {displayTitle}
          </h1>
          {subtitle && (
            <p 
              className="text-sm mt-0.5"
              style={{ color: colors.text.secondary }}
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
});

PageTitle.displayName = 'PageTitle';
