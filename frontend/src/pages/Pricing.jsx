import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import PricingForm from '../components/pricing/PricingForm';
import EstimateBreakdown from '../components/pricing/EstimateBreakdown';
import TierComparison from '../components/pricing/TierComparison';
import BlueprintUpload from '../components/pricing/BlueprintUpload';

export default function Pricing() {
  const [formData, setFormData] = useState({
    sqft: '',
    bathrooms: '',
    units: '',
    stories: '',
    tier: ''
  });
  const [estimate, setEstimate] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');

  const { data: tiersData } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: () => api.estimates.getTiers()
  });

  const { data: modelsData } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    retry: false
  });

  const availableModels = modelsData?.models || [];
  const defaultModel = modelsData?.defaultModel || '';

  const calculateMutation = useMutation({
    mutationFn: (data) => api.estimates.calculate(data),
    onSuccess: (data) => {
      setEstimate(data);
      setAnalysis(null); // Clear previous analysis
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: (data) => api.estimates.analyze(data),
    onSuccess: (data) => {
      setEstimate(data);
      setAnalysis(data.analysis);
    }
  });

  const handleCalculate = () => {
    const data = {
      sqft: Number(formData.sqft),
      bathrooms: Number(formData.bathrooms),
      units: Number(formData.units),
      stories: Number(formData.stories),
      tier: formData.tier
    };
    calculateMutation.mutate(data);
  };

  const handleAnalyze = () => {
    const data = {
      sqft: Number(formData.sqft),
      bathrooms: Number(formData.bathrooms),
      units: Number(formData.units),
      stories: Number(formData.stories),
      tier: formData.tier
    };
    analyzeMutation.mutate(data);
  };

  const handleBlueprintAnalysis = (result) => {
    // Auto-fill form with extracted data
    if (result.extractedData) {
      setFormData({
        sqft: result.extractedData.sqft || '',
        bathrooms: result.extractedData.bathrooms || '',
        units: result.extractedData.units || '',
        stories: result.extractedData.stories || '',
        tier: formData.tier || 'custom'
      });
    }

    // Set estimate and analysis from blueprint
    if (result.estimate) {
      setEstimate(result.estimate);
    }
    if (result.aiAnalysis) {
      setAnalysis(result.aiAnalysis);
    }
  };

  const tiers = tiersData?.tiers || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pricing Calculator</h1>

        {/* Model Selector */}
        {availableModels.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">AI Model:</label>
            <select
              value={selectedModel || defaultModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="input text-sm py-1"
            >
              {availableModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tier Comparison */}
      <TierComparison tiers={tiers} selectedTier={formData.tier} />

      {/* Blueprint Upload */}
      <div className="mb-6">
        <BlueprintUpload
          onAnalysisComplete={handleBlueprintAnalysis}
          tier={formData.tier}
          selectedModel={selectedModel || defaultModel}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Project Details
          </h2>
          <PricingForm
            formData={formData}
            onChange={setFormData}
            onCalculate={handleCalculate}
            onAnalyze={handleAnalyze}
            isAnalyzing={analyzeMutation.isPending}
          />
        </div>

        {/* Right: Estimate Display */}
        <div>
          <EstimateBreakdown estimate={estimate} analysis={analysis} />
        </div>
      </div>
    </div>
  );
}
