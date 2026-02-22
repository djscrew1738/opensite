import { memo } from 'react';
import SettingsHome from '../SettingsHome';

function SettingsOverview({
  settings,
  metrics,
  config,
  activeProvider,
  connected,
  availableModels,
  onTabChange,
  onRefreshMetrics,
  settingsData,
}) {
  return (
    <SettingsHome
      settings={settings}
      metrics={metrics}
      config={config}
      activeProvider={activeProvider}
      connected={connected}
      availableModels={availableModels}
      onTabChange={onTabChange}
      onRefreshMetrics={onRefreshMetrics}
      isLoading={!settingsData}
    />
  );
}

export default memo(SettingsOverview);
