import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import PricingForm from '../components/pricing/PricingForm';
import EstimateBreakdown from '../components/pricing/EstimateBreakdown';
import BlueprintUpload from '../components/pricing/BlueprintUpload';
import { useFormPersistence } from '../hooks/useFormPersistence';

export default function Pricing() {
  const [formData, setFormData] = useState({
    sqft: '',
    bathrooms: '',
    units: '',
    stories: '',
    lavatories: '',
    barSinks: '',
    tubs: '',
    showerBases: '',
    mudPans: '',
    washingMachines: '',
    toilets: '',
    waterSoftenerPreplumb: '',
    kitchenFaucets: ''
  });
  const [estimate, setEstimate] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');

  // Auto-save form data to localStorage
  const { clearSaved } = useFormPersistence('pricing-calculator', formData, setFormData, {
    shouldSave: (data) => {
      // Only save if at least one field has a value
      return Object.values(data).some(val => val !== '' && val !== null && val !== undefined);
    },
    onRestore: () => {
      console.log('Pricing form data restored from auto-save');
    }
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
      clearSaved(); // Clear auto-saved form data after successful calculation
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: (data) => api.estimates.analyze(data),
    onSuccess: (data) => {
      setEstimate(data);
      setAnalysis(data.analysis);
      clearSaved(); // Clear auto-saved form data after successful analysis
    }
  });

  const handleCalculate = () => {
    const data = {
      sqft: Number(formData.sqft),
      bathrooms: Number(formData.bathrooms),
      units: Number(formData.units),
      stories: Number(formData.stories),
      lavatories: Number(formData.lavatories) || 0,
      barSinks: Number(formData.barSinks) || 0,
      tubs: Number(formData.tubs) || 0,
      showerBases: Number(formData.showerBases) || 0,
      mudPans: Number(formData.mudPans) || 0,
      washingMachines: Number(formData.washingMachines) || 0,
      toilets: Number(formData.toilets) || 0,
      waterSoftenerPreplumb: Number(formData.waterSoftenerPreplumb) || 0,
      kitchenFaucets: Number(formData.kitchenFaucets) || 0
    };
    calculateMutation.mutate(data);
  };

  const handleAnalyze = () => {
    const data = {
      sqft: Number(formData.sqft),
      bathrooms: Number(formData.bathrooms),
      units: Number(formData.units),
      stories: Number(formData.stories),
      lavatories: Number(formData.lavatories) || 0,
      barSinks: Number(formData.barSinks) || 0,
      tubs: Number(formData.tubs) || 0,
      showerBases: Number(formData.showerBases) || 0,
      mudPans: Number(formData.mudPans) || 0,
      washingMachines: Number(formData.washingMachines) || 0,
      toilets: Number(formData.toilets) || 0,
      waterSoftenerPreplumb: Number(formData.waterSoftenerPreplumb) || 0,
      kitchenFaucets: Number(formData.kitchenFaucets) || 0
    };
    analyzeMutation.mutate(data);
  };

  const handleBlueprintAnalysis = (result) => {
    // Auto-fill form with extracted data
    if (result.extractedData) {
      const extracted = result.extractedData;
      setFormData({
        sqft: extracted.sqft || '',
        bathrooms: extracted.bathrooms || '',
        units: extracted.units || '',
        stories: extracted.stories || '',
        lavatories: extracted.lavatories || '',
        barSinks: extracted.barSinks || '',
        tubs: extracted.tubs || '',
        showerBases: extracted.showerBases || '',
        mudPans: extracted.mudPans || '',
        washingMachines: extracted.washingMachines || '',
        toilets: extracted.toilets || '',
        waterSoftenerPreplumb: extracted.waterSoftenerPreplumb || '',
        kitchenFaucets: extracted.kitchenFaucets || ''
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

      {/* Blueprint Upload */}
      <div className="mb-6">
        <BlueprintUpload
          onAnalysisComplete={handleBlueprintAnalysis}
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
