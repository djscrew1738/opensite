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
      {/* Basic Project Info */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Basic Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
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
              step="0.5"
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
        </div>
      </div>

      {/* Plumbing Fixtures */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Plumbing Fixtures
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Lavatories</label>
            <input
              type="number"
              name="lavatories"
              value={formData.lavatories}
              onChange={handleChange}
              className="input w-full"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="label">Kitchen Faucets</label>
            <input
              type="number"
              name="kitchenFaucets"
              value={formData.kitchenFaucets}
              onChange={handleChange}
              className="input w-full"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="label">Bar Sinks</label>
            <input
              type="number"
              name="barSinks"
              value={formData.barSinks}
              onChange={handleChange}
              className="input w-full"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="label">Toilets</label>
            <input
              type="number"
              name="toilets"
              value={formData.toilets}
              onChange={handleChange}
              className="input w-full"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="label">Tubs</label>
            <input
              type="number"
              name="tubs"
              value={formData.tubs}
              onChange={handleChange}
              className="input w-full"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="label">Shower Bases</label>
            <input
              type="number"
              name="showerBases"
              value={formData.showerBases}
              onChange={handleChange}
              className="input w-full"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="label">Mud Pans</label>
            <input
              type="number"
              name="mudPans"
              value={formData.mudPans}
              onChange={handleChange}
              className="input w-full"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="label">Washing Machines</label>
            <input
              type="number"
              name="washingMachines"
              value={formData.washingMachines}
              onChange={handleChange}
              className="input w-full"
              placeholder="0"
              min="0"
            />
          </div>

          <div className="col-span-2">
            <label className="label">Water Softener Pre-plumb</label>
            <input
              type="number"
              name="waterSoftenerPreplumb"
              value={formData.waterSoftenerPreplumb}
              onChange={handleChange}
              className="input w-full"
              placeholder="0"
              min="0"
            />
          </div>
        </div>
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
          disabled={isAnalyzing}
          className="btn-secondary w-full"
        >
          {isAnalyzing ? 'Analyzing...' : 'AI Deep Analysis'}
        </button>
      </div>
    </form>
  );
}
