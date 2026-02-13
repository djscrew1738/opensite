import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useModelPreference } from '../../hooks/useModelPreference';

/**
 * Reusable model selector dropdown component
 *
 * Features:
 * - Fetches and displays available Ollama models
 * - Shows model sizes (e.g., "llama3.1 (4.7GB)")
 * - Highlights user's default model with "(Default)" badge
 * - Handles loading and error states gracefully
 *
 * @param {Object} props
 * @param {string} props.value - Currently selected model name
 * @param {Function} props.onChange - Change handler (receives event)
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @param {boolean} props.showSizes - Whether to display model sizes (default: true)
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <ModelSelector
 *   value={selectedModel}
 *   onChange={(e) => setSelectedModel(e.target.value)}
 *   disabled={isStreaming}
 *   showSizes={true}
 * />
 */
export default function ModelSelector({
  value,
  onChange,
  disabled = false,
  showSizes = true,
  className = ''
}) {
  const { defaultModel } = useModelPreference();

  // Fetch available models
  const { data: modelsData, isLoading, error } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    retry: false
  });

  const availableModels = modelsData?.models || [];

  // Format model size for display
  const formatSize = (sizeInBytes) => {
    const sizeInGB = sizeInBytes / (1024 ** 3);
    return `${sizeInGB.toFixed(1)}GB`;
  };

  // Format model option label
  const getModelLabel = (model) => {
    const parts = [];

    // Model name
    parts.push(model.name);

    // Size (if enabled)
    if (showSizes && model.size) {
      parts.push(`(${formatSize(model.size)})`);
    }

    // Default badge
    if (model.name === defaultModel) {
      parts.push('(Default)');
    }

    return parts.join(' ');
  };

  // Handle loading state
  if (isLoading) {
    return (
      <select
        disabled
        className={`input ${className}`}
      >
        <option>Loading models...</option>
      </select>
    );
  }

  // Handle error state
  if (error) {
    return (
      <select
        disabled
        className={`input ${className}`}
      >
        <option>Error loading models</option>
      </select>
    );
  }

  // Handle no models available
  if (availableModels.length === 0) {
    return (
      <select
        disabled
        className={`input ${className}`}
      >
        <option>No models available</option>
      </select>
    );
  }

  // Render model selector
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`input ${className}`}
    >
      {availableModels.map((model) => (
        <option key={model.name} value={model.name}>
          {getModelLabel(model)}
        </option>
      ))}
    </select>
  );
}
