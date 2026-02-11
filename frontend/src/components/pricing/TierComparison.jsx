export default function TierComparison({ tiers, selectedTier }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={`card ${
            selectedTier === tier.id
              ? 'ring-2 ring-primary-500 bg-primary-50'
              : ''
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {tier.name}
          </h3>
          <p className="text-2xl font-bold text-primary-600 mb-2">
            ${tier.pricePerUnit?.toLocaleString()}/unit
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Margin: {tier.marginRange}
          </p>
          <p className="text-xs text-gray-500">
            {tier.description}
          </p>
        </div>
      ))}
    </div>
  );
}
