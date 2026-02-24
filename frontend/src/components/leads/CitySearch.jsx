import React, { useState, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Search, Building2, FileText, TrendingUp, 
  Users, ArrowRight, Filter, X, Navigation, Star,
  Briefcase, Clock, DollarSign, ChevronDown, ChevronUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Skeleton, CardSkeleton } from '../ui/Skeleton';

// Popular DFW cities for quick select
const POPULAR_CITIES = [
  'Dallas', 'Fort Worth', 'Plano', 'Frisco', 'McKinney', 
  'Irving', 'Arlington', 'Garland', 'Grand Prairie', 'Denton'
];

// City Card Component
const CityCard = ({ city, stats, onSelect, isSelected }) => {
  return (
    <Motion.div
      layout
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(city)}
      className={`cursor-pointer group ${isSelected ? 'ring-2 ring-brand-400' : ''}`}
    >
      <Card isHoverable className="h-full">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
              <MapPin className="w-6 h-6 text-brand-400" />
            </div>
            {stats?.hotPermits > 0 && (
              <Badge variant="critical" dot>{stats.hotPermits} Hot</Badge>
            )}
          </div>
          
          <h3 className="text-lg font-bold text-text-primary mb-1">{city}</h3>
          <p className="text-sm text-text-secondary">Dallas-Fort Worth Metro</p>
          
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
            <div>
              <p className="text-2xl font-bold text-text-primary font-mono">{stats?.permitCount || 0}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider">Permits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success font-mono">
                ${((stats?.totalValue || 0) / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-text-muted uppercase tracking-wider">Value</p>
            </div>
          </div>
          
          {stats?.topBuilders?.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex -space-x-2">
                {stats.topBuilders.slice(0, 3).map((builder, i) => (
                  <div 
                    key={i}
                    className="w-6 h-6 rounded-full bg-surface-600 border-2 border-surface-800 flex items-center justify-center text-[10px] font-bold text-text-secondary"
                    title={builder}
                  >
                    {builder.charAt(0)}
                  </div>
                ))}
              </div>
              <span className="text-xs text-text-muted">
                {stats.topBuilders.length} active builders
              </span>
            </div>
          )}
        </div>
      </Card>
    </Motion.div>
  );
};

// Permit List Item
const PermitListItem = ({ permit, onClick }) => {
  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-surface-800 rounded-xl border border-border hover:border-brand-400/30 cursor-pointer transition-colors"
      onClick={() => onClick(permit)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-text-primary truncate">{permit.contractor || 'Unknown Contractor'}</h4>
            {permit.leadScore >= 80 && <Badge variant="critical" size="sm">Hot</Badge>}
          </div>
          <p className="text-sm text-text-secondary truncate">{permit.address || permit.projectAddress}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-text-muted flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {permit.permitType || 'Building Permit'}
            </span>
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(permit.issuedDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-text-primary font-mono">
            ${(permit.estimatedCost || 0).toLocaleString()}
          </p>
          <span className="text-xs text-success">{permit.leadScore || 0} Score</span>
        </div>
      </div>
    </Motion.div>
  );
};

// Main City Search Component
export const CitySearch = ({ onViewPermit, onSwitchToBuilders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [sortBy, setSortBy] = useState('value'); // value, permits, date
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minValue: '',
    maxValue: '',
    permitType: '',
    status: '',
  });

  // Fetch all permits for city aggregation
  const { data: allPermits, isLoading: permitsLoading } = useQuery({
    queryKey: ['permits', 'all'],
    queryFn: () => api.permits.getAll({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch permits for selected city
  const { data: cityPermits, isLoading: cityLoading } = useQuery({
    queryKey: ['permits', 'city', selectedCity],
    queryFn: () => api.permits.getAll({ city: selectedCity, limit: 100 }),
    enabled: !!selectedCity,
    staleTime: 60 * 1000,
  });

  const permits = allPermits?.permits || [];

  // Aggregate stats by city
  const cityStats = useMemo(() => {
    const stats = {};
    
    permits.forEach(permit => {
      const city = permit.city || 'Unknown';
      if (!stats[city]) {
        stats[city] = {
          city,
          permitCount: 0,
          totalValue: 0,
          hotPermits: 0,
          builders: new Set(),
          topBuilders: [],
          recentDate: null,
        };
      }
      
      stats[city].permitCount++;
      stats[city].totalValue += permit.estimatedCost || 0;
      stats[city].builders.add(permit.contractor);
      
      if (permit.leadScore >= 80) {
        stats[city].hotPermits++;
      }
      
      const permitDate = new Date(permit.issuedDate);
      if (!stats[city].recentDate || permitDate > stats[city].recentDate) {
        stats[city].recentDate = permitDate;
      }
    });
    
    // Convert Sets to Arrays and get top builders
    Object.values(stats).forEach(stat => {
      stat.topBuilders = Array.from(stat.builders).slice(0, 5);
    });
    
    return stats;
  }, [permits]);

  // Filter and sort cities
  const filteredCities = useMemo(() => {
    let cities = Object.values(cityStats);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      cities = cities.filter(c => c.city.toLowerCase().includes(query));
    }
    
    // Apply value filters
    if (filters.minValue) {
      cities = cities.filter(c => c.totalValue >= parseInt(filters.minValue) * 1000000);
    }
    if (filters.maxValue) {
      cities = cities.filter(c => c.totalValue <= parseInt(filters.maxValue) * 1000000);
    }
    
    // Sort
    cities.sort((a, b) => {
      if (sortBy === 'value') return b.totalValue - a.totalValue;
      if (sortBy === 'permits') return b.permitCount - a.permitCount;
      if (sortBy === 'date') return (b.recentDate || 0) - (a.recentDate || 0);
      return 0;
    });
    
    return cities;
  }, [cityStats, searchQuery, sortBy, filters]);

  const handleCitySelect = (city) => {
    setSelectedCity(city === selectedCity ? null : city);
  };

  const clearFilters = () => {
    setFilters({ minValue: '', maxValue: '', permitType: '', status: '' });
    setSearchQuery('');
  };

  const hasActiveFilters = searchQuery || filters.minValue || filters.maxValue;

  // Loading state
  if (permitsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton width={300} height={48} />
          <Skeleton width={120} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Search by City</h2>
          <p className="text-text-secondary mt-1">
            Explore permits and leads across DFW metroplex cities
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search city (e.g., Plano, Frisco...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-border rounded-xl text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand-400/50 focus:ring-2 focus:ring-brand-400/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 bg-surface-800 border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-brand-400/50"
          >
            <option value="value">Sort by Value</option>
            <option value="permits">Sort by Permits</option>
            <option value="date">Sort by Recent</option>
          </select>
          
          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? 'ring-2 ring-brand-400' : ''}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Quick City Chips */}
      {!searchQuery && !selectedCity && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-text-muted py-1">Popular:</span>
          {POPULAR_CITIES.map(city => (
            <button
              key={city}
              onClick={() => setSearchQuery(city)}
              className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 border border-border hover:border-brand-400/30 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-surface-800/50">
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Min Value</label>
                  <select
                    value={filters.minValue}
                    onChange={(e) => setFilters(f => ({ ...f, minValue: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-900 border border-border rounded-lg text-text-primary text-sm"
                  >
                    <option value="">Any</option>
                    <option value="1">$1M+</option>
                    <option value="5">$5M+</option>
                    <option value="10">$10M+</option>
                    <option value="50">$50M+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Max Value</label>
                  <select
                    value={filters.maxValue}
                    onChange={(e) => setFilters(f => ({ ...f, maxValue: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-900 border border-border rounded-lg text-text-primary text-sm"
                  >
                    <option value="">Any</option>
                    <option value="10">Under $10M</option>
                    <option value="50">Under $50M</option>
                    <option value="100">Under $100M</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex items-end">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Selected City Detail View */}
      <AnimatePresence mode="wait">
        {selectedCity ? (
          <Motion.div
            key="city-detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Back Button & City Header */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setSelectedCity(null)} leftIcon={<ArrowRight className="w-4 h-4 rotate-180" />}>
                Back to Cities
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={onSwitchToBuilders} leftIcon={<Building2 className="w-4 h-4" />}>
                  View Builders
                </Button>
              </div>
            </div>

            {/* City Stats Hero */}
            <Card className="bg-gradient-to-br from-surface-800 to-surface-900 border-brand-500/20">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-text-primary">{selectedCity}</h2>
                    <p className="text-text-secondary mt-1">Dallas-Fort Worth Metro</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-brand-400" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                  <div>
                    <p className="text-3xl font-bold text-text-primary font-mono">
                      {cityStats[selectedCity]?.permitCount || 0}
                    </p>
                    <p className="text-sm text-text-muted uppercase tracking-wider">Total Permits</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-success font-mono">
                      ${((cityStats[selectedCity]?.totalValue || 0) / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-sm text-text-muted uppercase tracking-wider">Total Value</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-warning font-mono">
                      {cityStats[selectedCity]?.hotPermits || 0}
                    </p>
                    <p className="text-sm text-text-muted uppercase tracking-wider">Hot Leads</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-info font-mono">
                      {cityStats[selectedCity]?.builders?.size || 0}
                    </p>
                    <p className="text-sm text-text-muted uppercase tracking-wider">Active Builders</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Permits List */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Permits in {selectedCity}
                {cityLoading && <span className="ml-2 text-sm text-text-muted">(Loading...)</span>}
              </h3>
              
              {cityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} height={80} />)}
                </div>
              ) : cityPermits?.length > 0 ? (
                <div className="space-y-3">
                  {cityPermits.map(permit => (
                    <PermitListItem 
                      key={permit.id} 
                      permit={permit} 
                      onClick={onViewPermit}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <h4 className="text-lg font-medium text-text-primary">No permits found</h4>
                  <p className="text-text-secondary mt-1">No permits available for this city</p>
                </Card>
              )}
            </div>
          </Motion.div>
        ) : (
          <Motion.div
            key="city-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-text-secondary">
                Found <span className="text-text-primary font-semibold">{filteredCities.length}</span> cities
              </p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>

            {/* City Grid */}
            {filteredCities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCities.map(cityStat => (
                  <CityCard
                    key={cityStat.city}
                    city={cityStat.city}
                    stats={cityStat}
                    onSelect={handleCitySelect}
                    isSelected={selectedCity === cityStat.city}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Search className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">No cities found</h3>
                <p className="text-text-secondary max-w-md mx-auto">
                  Try adjusting your search or filters to find more cities
                </p>
                {hasActiveFilters && (
                  <Button variant="primary" className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </Card>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CitySearch;
