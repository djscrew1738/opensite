const pageImports = {
  dashboard: () => import('../pages/Dashboard'),
  leads: () => import('../pages/LeadFinder'),
  jobs: () => import('../pages/Jobs'),
  jobDetail: () => import('../pages/JobDetail'),
  plans: () => import('../pages/Plans'),
  history: () => import('../pages/History'),
  vision: () => import('../pages/Vision'),
  settings: () => import('../pages/Settings'),
  plumbing: () => import('../plumbing-visualizer/PlumbingVisualizer'),
  documents: () => import('../pages/Documents'),
  canvas: () => import('../pages/Canvas'),
  alerts: () => import('../pages/Alerts'),
  ai: () => import('../pages/AIAssistant'),
  knowledge: () => import('../pages/KnowledgeBase'),
};

const routePrefetchMap = {
  '/': 'dashboard',
  '/leads': 'leads',
  '/jobs': 'jobs',
  '/plans': 'plans',
  '/history': 'history',
  '/vision': 'vision',
  '/settings': 'settings',
  '/plumbing': 'plumbing',
  '/documents': 'documents',
  '/canvas': 'canvas',
  '/alerts': 'alerts',
  '/ai': 'ai',
  '/knowledge': 'knowledge',
};

const prefetched = new Set();

const prefetchRoute = (path) => {
  const key = routePrefetchMap[path];
  if (!key || prefetched.has(key)) return;
  prefetched.add(key);
  pageImports[key]?.();
};

const eagerPrefetch = (path) => {
  prefetchRoute(path);
};

export { pageImports, routePrefetchMap, prefetchRoute, eagerPrefetch };
