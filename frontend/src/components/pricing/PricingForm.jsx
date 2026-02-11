export default function PricingForm({ formData, onChange, onCalculate, onAnalyze, isAnalyzing }) {
  const handleChange = (e) => {
    onChange({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCalculate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Square Footage</label>
        <input
          type="number"
          name="sqft"
          value={formData.sqft}
          onChange={handleChange}
          required
          className="input w-full"
          placeholder="2000"
          min="0"
        />
      </div>

      <div>
        <label className="label">Number of Bathrooms</label>
        <input
          type="number"
          name="bathrooms"
          value={formData.bathrooms}
          onChange={handleChange}
          required
          className="input w-full"
          placeholder="8"
          min="0"
        />
      </div>

      <div>
        <label className="label">Number of Units</label>
        <input
          type="number"
          name="units"
          value={formData.units}
          onChange={handleChange}
          required
          className="input w-full"
          placeholder="4"
          min="1"
        />
      </div>

      <div>
        <label className="label">Number of Stories</label>
        <input
          type="number"
          name="stories"
          value={formData.stories}
          onChange={handleChange}
          required
          className="input w-full"
          placeholder="2"
          min="1"
        />
      </div>

      <div>
        <label className="label">Pricing Tier</label>
        <select
          name="tier"
          value={formData.tier}
          onChange={handleChange}
          required
          className="input w-full"
        >
          <option value="">Select tier...</option>
          <option value="production">Production ($5,600/unit)</option>
          <option value="custom">Custom ($7,200/unit)</option>
          <option value="premium">Premium ($10,200/unit)</option>
        </select>
      </div>

      <div className="space-y-2 pt-4">
        <button
          type="submit"
          className="btn-primary w-full"
        >
          Calculate Estimate
        </button>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing || !formData.tier}
          className="btn-secondary w-full"
        >
          {isAnalyzing ? 'Analyzing...' : 'AI Deep Analysis'}
        </button>
      </div>
    </form>
  );
}
