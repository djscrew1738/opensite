import { memo } from 'react';
import SettingsHome from '../SettingsHome';

function SettingsOverview({
  settings,
  metrics,
  config,
  activeProvider,
  connected,
  availableModels,
  themePreference,
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
      themePreference={themePreference}
      onTabChange={onTabChange}
      onRefreshMetrics={onRefreshMetrics}
      isLoading={!settingsData}
    />
  );
}

export default memo(SettingsOverview);
