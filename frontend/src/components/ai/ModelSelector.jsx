import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useModelPreference } from '../../hooks/useModelPreference';

export default function ModelSelector({
  value,
  onChange,
  disabled = false,
  showSizes = true,
  className = ''
}) {
  const { defaultModel } = useModelPreference();

  const { data: modelsData, isLoading, error } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    retry: false
  });

  const availableModels = modelsData?.models || [];
  const provider = modelsData?.provider || 'ollama';

  const formatSize = (sizeInBytes) => {
    if (!sizeInBytes) return null;
    const sizeInGB = sizeInBytes / (1024 ** 3);
    return `${sizeInGB.toFixed(1)}GB`;
  };

  const getModelLabel = (model) => {
    const parts = [];
    parts.push(model.label || model.name);

    if (showSizes && model.size) {
      parts.push(`(${formatSize(model.size)})`);
    }

    // For Groq models, show context window instead of size
    if (provider === 'groq' && model.context && !model.size) {
      const ctxK = Math.round(model.context / 1000);
      parts.push(`(${ctxK}k ctx)`);
    }

    if (model.name === defaultModel) {
      parts.push('(Default)');
    }

    return parts.join(' ');
  };

  if (isLoading) {
    return (
      <select disabled className={`input select-arrow ${className}`}>
        <option>Loading models...</option>
      </select>
    );
  }

  if (error) {
    return (
      <select disabled className={`input select-arrow ${className}`}>
        <option>Error loading models</option>
      </select>
    );
  }

  if (availableModels.length === 0) {
    return (
      <select disabled className={`input select-arrow ${className}`}>
        <option>No models available</option>
      </select>
    );
  }

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`input select-arrow ${className}`}
    >
      {availableModels.map((model) => (
        <option key={model.name} value={model.name}>
          {getModelLabel(model)}
        </option>
      ))}
    </select>
  );
}
