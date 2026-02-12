import StatCard from '../shared/StatCard';
import { Home, Building2, Bath, Layers, Activity } from 'lucide-react';

/**
 * ProjectOverviewCard - Hero section displaying key project metrics
 * @param {object} extractedData - Data extracted from blueprint
 * @param {object} aiAnalysis - Structured AI analysis data
 * @param {object} estimate - Pricing estimate
 */
export default function ProjectOverviewCard({ extractedData, aiAnalysis, estimate }) {
  if (!extractedData && !aiAnalysis) {
    return null;
  }

  const complexityScore = aiAnalysis?.complexityScore || 0;
  const complexityLevel = aiAnalysis?.projectComplexity || 'medium';

  const getComplexityColor = (level) => {
    switch (level) {
      case 'simple':
        return 'text-green-600 bg-green-50';
      case 'complex':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getComplexityLabel = (level) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Overview Summary */}
      {aiAnalysis?.overview && (
        <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Overview</h3>
          <p className="text-gray-700 leading-relaxed">{aiAnalysis.overview}</p>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {extractedData?.sqft && (
          <StatCard
            title="Square Footage"
            value={extractedData.sqft}
            subtitle="sq ft"
            icon={Home}
            animated={true}
          />
        )}

        {extractedData?.units && (
          <StatCard
            title="Units"
            value={extractedData.units}
            subtitle={extractedData.units === 1 ? 'unit' : 'units'}
            icon={Building2}
            animated={true}
          />
        )}

        {extractedData?.bathrooms && (
          <StatCard
            title="Bathrooms"
            value={extractedData.bathrooms}
            subtitle="total"
            icon={Bath}
            animated={true}
          />
        )}

        {extractedData?.stories && (
          <StatCard
            title="Stories"
            value={extractedData.stories}
            subtitle={extractedData.stories === 1 ? 'story' : 'stories'}
            icon={Layers}
            animated={true}
          />
        )}
      </div>

      {/* Complexity Indicator */}
      {aiAnalysis && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Project Complexity</h3>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-out ${
                      complexityLevel === 'simple'
                        ? 'bg-green-500'
                        : complexityLevel === 'complex'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${complexityScore}%` }}
                  />
                </div>
                <span className="text-2xl font-bold text-gray-900 w-12 text-right">
                  {complexityScore}
                </span>
              </div>
            </div>
            <div className={`ml-6 px-4 py-2 rounded-lg font-semibold ${getComplexityColor(complexityLevel)}`}>
              {getComplexityLabel(complexityLevel)}
            </div>
          </div>

          {/* Complexity Factors */}
          {aiAnalysis.complexityFactors && aiAnalysis.complexityFactors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Key Factors:</p>
              <div className="flex flex-wrap gap-2">
                {aiAnalysis.complexityFactors.map((factor, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Total Estimate (if available) */}
      {estimate && (
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Project Cost</p>
              <p className="text-4xl font-bold text-green-700">
                ${estimate.total?.toLocaleString()}
              </p>
            </div>
            {estimate.perUnit && (
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Per Unit</p>
                <p className="text-2xl font-semibold text-green-600">
                  ${estimate.perUnit?.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
