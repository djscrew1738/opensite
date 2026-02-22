/**
 * Overview Section
 * Settings home/dashboard view
 */

import { useSettings } from '../SettingsContext';
import SettingsHome from '../SettingsHome';

export default function OverviewSection() {
  const { 
    handleTabChange, 
    settings, 
    metrics, 
    config, 
    activeProvider, 
    connected, 
    availableModels,
    refetchMetrics 
  } = useSettings();
  
  return (
    <SettingsHome 
      settings={settings}
      metrics={metrics}
      config={config}
      activeProvider={activeProvider}
      connected={connected}
      availableModels={availableModels}
      onTabChange={handleTabChange}
      onRefreshMetrics={refetchMetrics}
      isLoading={!settings}
    />
  );
}
