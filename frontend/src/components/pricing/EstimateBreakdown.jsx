export default function EstimateBreakdown({ estimate, analysis }) {
  if (!estimate) {
    return (
      <div className="card h-full flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Enter project details and click "Calculate Estimate" to see pricing
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Price */}
      <div className="card">
        <h3 className="text-sm text-gray-600 mb-2">Total Project Price</h3>
        <p className="text-4xl font-bold text-primary-600">
          ${estimate.total?.toLocaleString()}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Price per Unit</p>
            <p className="text-xl font-semibold text-gray-900">
              ${estimate.perUnit?.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Margin</p>
            <p className="text-xl font-semibold text-gray-900">
              {estimate.margin}
            </p>
          </div>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Breakdown</h3>
        <div className="space-y-3">
          {estimate.breakdown && Object.entries(estimate.breakdown).map(([key, phase]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{phase.name}</p>
                <p className="text-sm text-gray-500">{phase.percentage}% of project</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                ${phase.amount?.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Adjustments */}
      {estimate.adjustments && (estimate.adjustments.storyAdjustment || estimate.adjustments.bathroomDensity) && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Applied Adjustments</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            {estimate.adjustments.storyAdjustment && (
              <li>• Multi-story adjustment applied</li>
            )}
            {estimate.adjustments.bathroomDensity && (
              <li>• High bathroom density adjustment applied</li>
            )}
          </ul>
        </div>
      )}

      {/* AI Analysis */}
      {analysis && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{analysis}</p>
          </div>
        </div>
      )}
    </div>
  );
}
