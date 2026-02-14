import { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

export default function DiscoverySearchForm({ onSubmit, isRunning }) {
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim() && city.trim() && !isRunning) {
      onSubmit(keyword.trim(), city.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="card-body p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Business type (e.g., property management)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input pl-12"
              disabled={isRunning}
            />
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="City (e.g., Fort Worth TX)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="input pl-12"
              disabled={isRunning}
            />
          </div>
          <button
            type="submit"
            disabled={!keyword.trim() || !city.trim() || isRunning}
            className="btn-primary shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="hidden sm:inline">Running...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Discover Leads</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
