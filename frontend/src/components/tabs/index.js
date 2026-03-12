/**
 * Tab System - Unified tab components for the entire application
 * 
 * This module provides a consistent, accessible tab interface with:
 * - Multiple visual variants (default, pills, underline, minimal, filter)
 * - Directional animations between tabs
 * - Keyboard navigation support
 * - Persistence and URL sync options
 * - Full accessibility (ARIA) compliance
 * 
 * @example
 * import { TabSystem, Tab } from './components/tabs';
 * 
 * <TabSystem defaultTab="overview" variant="default" animation="directional">
 *   <Tab id="overview" label="Overview" icon={LayoutDashboard}>
 *     <OverviewContent />
 *   </Tab>
 *   <Tab id="details" label="Details" icon={FileText} badge={3}>
 *     <DetailsContent />
 *   </Tab>
 * </TabSystem>
 */

export { TabSystem, Tab, TabList, TabPanel } from './TabSystem';
export { useTabAnimation, useTabKeyboardNav } from './useTabAnimation';
export { MobileTabBar, ResponsiveTabs } from './MobileTabBar';
