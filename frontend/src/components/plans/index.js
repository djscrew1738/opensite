/**
 * Plans Feature Components
 * 
 * Comprehensive plumbing estimation and blueprint analysis components.
 * All components follow the Dark Forge design system with semantic Tailwind tokens.
 * 
 * @example
 * import { 
 *   PlansCommandHeader, 
 *   PlansActionBar,
 *   FixtureGrid,
 *   PricingDashboard 
 * } from '@/components/plans';
 */

// Main Components
export { default as PlansCommandHeader } from './PlansCommandHeader';
export { default as PlansActionBar } from './PlansActionBar';
export { default as FixtureGrid } from './FixtureGrid';
export { default as FixtureCard } from './FixtureCard';
export { default as PricingDashboard } from './PricingDashboardLazy';
export { default as ProjectInfoPanel } from './ProjectInfoPanel';
export { default as AIAnalysisSection } from './AIAnalysisSection';
export { default as TakeoffPanel } from './TakeoffPanel';

// Constants & Configuration
export {
  FIXTURE_PRICE,
  QUALIFYING_FIXTURES,
  NON_QUALIFYING_FIXTURES,
  PHASE_CONFIG,
  DEFAULT_FIXTURES,
  DEFAULT_PROJECT_INFO,
} from './constants';
