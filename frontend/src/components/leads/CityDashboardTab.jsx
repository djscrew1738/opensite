import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { MapPin, Search, ChevronRight } from 'lucide-react';
import CityStatsPanel from './CityStatsPanel';

export default function CityDashboardTab({ onViewPermit, onSwitchToBuilders }) {
  const [selectedCity, setSelectedCity] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['permit-cities'],
    queryFn: () => api.permits.getCities(),
  });

  const { data: cityStats, isLoading: statsLoading } = useQuery({
    queryKey: ['city-stats', selectedCity],
    queryFn: () => api.permits.getCityStats(selectedCity),
    enabled: !!selectedCity,
  });

  // Auto-select first city
  useEffect(() => {
    if (cities.length > 0 && !selectedCity) {
      const timer = setTimeout(() => setSelectedCity(cities[0].city), 0);
      return () => clearTimeout(timer);
    }
  }, [cities, selectedCity]);

  const filteredCities = citySearch
    ? cities.filter(c => c.city.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* City List Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          {/* Search */}
          <div className="card">
            <div className="card-body p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Filter cities..."
                  className="input pl-10 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* City List */}
          <div className="card">
            <div className="card-body p-2">
              {citiesLoading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="skeleton h-12 rounded-lg" />
                  ))}
                </div>
              ) : filteredCities.length > 0 ? (
                <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
                  {filteredCities.map(city => (
                    <button
                      key={city.city}
                      onClick={() => setSelectedCity(city.city)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        selectedCity === city.city
                          ? 'bg-blue-50 dark:bg-copper-950/20 ring-1 ring-copper-200 dark:ring-blue-800'
                          : 'hover:bg-concrete-50 dark:hover:bg-surface-800'
                      }`}
                    >
                      <MapPin className={`w-4 h-4 shrink-0 ${
                        selectedCity === city.city ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${
                          selectedCity === city.city
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {city.city}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 tabular-nums">{city.permitCount} permits</span>
                          {city.hotCount > 0 && (
                            <span className="text-2xs font-bold text-hot-500 tabular-nums">{city.hotCount} hot</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${
                        selectedCity === city.city ? 'text-blue-400' : 'text-gray-300 dark:text-gray-600'
                      }`} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500">No cities found</p>
                  {citySearch && (
                    <button onClick={() => setCitySearch('')} className="text-xs text-blue-500 mt-1 hover:underline">
                      Clear filter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Total summary */}
          {cities.length > 0 && (
            <div className="px-3 text-xs text-gray-400 font-medium">
              {cities.length} cities · {cities.reduce((s, c) => s + c.permitCount, 0)} total permits
            </div>
          )}
        </div>

        {/* City Stats Main Area */}
        <div className="lg:col-span-8 xl:col-span-9">
          {!selectedCity ? (
            <div className="card">
              <div className="card-body text-center py-20">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">Select a City</h3>
                <p className="text-sm text-gray-500">Choose a city from the list to see permit intelligence</p>
              </div>
            </div>
          ) : statsLoading ? (
            <div className="space-y-4">
              <div className="skeleton h-8 w-48" />
              <div className="grid grid-cols-3 gap-3">
                <div className="skeleton h-24 rounded-xl" />
                <div className="skeleton h-24 rounded-xl" />
                <div className="skeleton h-24 rounded-xl" />
              </div>
              <div className="skeleton h-40 rounded-xl" />
            </div>
          ) : cityStats ? (
            <CityStatsPanel
              stats={cityStats}
              onViewBuilder={(name) => onSwitchToBuilders?.(name)}
              onViewPermit={onViewPermit}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
