import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  X, Edit3, Copy, Trash2, Star, Package, DollarSign,
  Clock, Hash, TrendingUp, TrendingDown, Minus,
  BarChart3, FileText, ExternalLink, Calendar
} from 'lucide-react';

const CATEGORY_LABELS = {
  pipe: 'Pipe',
  fittings: 'Fittings',
  fixtures: 'Fixtures',
  valves: 'Valves',
  water_heater: 'Water Heaters',
  gas: 'Gas',
  misc: 'Miscellaneous'
};

const CATEGORY_COLORS = {
  pipe: '#2563eb',
  fittings: '#7c3aed',
  fixtures: '#0891b2',
  valves: '#dc2626',
  water_heater: '#ea580c',
  gas: '#ca8a04',
  misc: '#6b7280'
};

export default function MaterialDetailModal({ materialId, onClose, onEdit, onDuplicate, onDelete }) {
  const queryClient = useQueryClient();

  const { data: material, isLoading } = useQuery({
    queryKey: ['material', materialId],
    queryFn: () => api.takeoff.getMaterial(materialId),
    enabled: !!materialId
  });

  const { data: historyData } = useQuery({
    queryKey: ['price-history', materialId],
    queryFn: () => api.takeoff.getPriceHistory(materialId, 20),
    enabled: !!materialId
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id) => api.takeoff.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', materialId] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-stats'] });
    }
  });

  const history = historyData?.history || [];
  const priceWithMarkup = material?.markup
    ? material.unitCost * (1 + material.markup / 100)
    : null;

  // Compute price trend from history
  const priceDirection = history.length > 0
    ? history[0].newPrice > history[0].oldPrice ? 'up'
      : history[0].newPrice < history[0].oldPrice ? 'down'
      : 'flat'
    : null;

  const lastPriceChange = history.length > 0 ? history[0] : null;

  if (!materialId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {isLoading ? (
          <div className="px-6 py-8">
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ) : material ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: (CATEGORY_COLORS[material.category] || '#6b7280') + '15',
                        color: CATEGORY_COLORS[material.category] || '#6b7280'
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[material.category] || '#6b7280' }}
                      />
                      {CATEGORY_LABELS[material.category] || material.category}
                    </span>
                    {material.usageCount > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Used {material.usageCount} time{material.usageCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{material.name}</h2>
                  {material.description && (
                    <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => toggleFavoriteMutation.mutate(material.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      material.isFavorite
                        ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                        : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                    }`}
                    title={material.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className="w-5 h-5" fill={material.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Price Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Unit Cost</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        ${Number(material.unitCost).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">per {material.unit}</span>
                    </div>
                    {priceWithMarkup && (
                      <p className="text-sm text-green-600 mt-1">
                        With {material.markup}% markup: <strong>${priceWithMarkup.toFixed(2)}</strong>/{material.unit}
                      </p>
                    )}
                  </div>
                  {priceDirection && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                      priceDirection === 'up' ? 'bg-red-100 text-red-700' :
                      priceDirection === 'down' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {priceDirection === 'up' && <TrendingUp className="w-4 h-4" />}
                      {priceDirection === 'down' && <TrendingDown className="w-4 h-4" />}
                      {priceDirection === 'flat' && <Minus className="w-4 h-4" />}
                      {lastPriceChange && (
                        <span>
                          {priceDirection === 'up' ? '+' : ''}
                          {((lastPriceChange.newPrice - lastPriceChange.oldPrice) / lastPriceChange.oldPrice * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  icon={Package}
                  label="Supplier"
                  value={material.supplier || 'Not specified'}
                />
                <DetailItem
                  icon={Hash}
                  label="Part Number"
                  value={material.partNumber || 'Not specified'}
                  mono
                />
                <DetailItem
                  icon={BarChart3}
                  label="Usage Count"
                  value={`${material.usageCount || 0} times in takeoffs`}
                />
                <DetailItem
                  icon={DollarSign}
                  label="Markup"
                  value={material.markup ? `${material.markup}%` : 'None set'}
                />
                <DetailItem
                  icon={Calendar}
                  label="Created"
                  value={formatDate(material.createdAt)}
                />
                <DetailItem
                  icon={Clock}
                  label="Last Updated"
                  value={formatDate(material.updatedAt)}
                />
                {material.lastUsedAt && (
                  <DetailItem
                    icon={Clock}
                    label="Last Used"
                    value={formatDate(material.lastUsedAt)}
                  />
                )}
              </div>

              {/* Notes */}
              {material.notes && (
                <div>
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Notes
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {material.notes}
                  </div>
                </div>
              )}

              {/* Price History */}
              {history.length > 0 && (
                <div>
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Price History
                  </h4>

                  {/* Mini chart */}
                  <PriceHistoryChart history={history} currentPrice={material.unitCost} />

                  {/* History table */}
                  <div className="mt-3 bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Date</th>
                          <th className="text-right px-3 py-2 text-gray-600 font-medium">Old Price</th>
                          <th className="text-right px-3 py-2 text-gray-600 font-medium">New Price</th>
                          <th className="text-right px-3 py-2 text-gray-600 font-medium">Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {history.slice(0, 10).map((entry) => {
                          const change = entry.newPrice - entry.oldPrice;
                          const pctChange = entry.oldPrice > 0
                            ? (change / entry.oldPrice * 100)
                            : 0;

                          return (
                            <tr key={entry.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-600">
                                {formatDate(entry.changedAt)}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-500">
                                ${entry.oldPrice.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">
                                ${entry.newPrice.toFixed(2)}
                              </td>
                              <td className={`px-3 py-2 text-right font-medium ${
                                change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-500'
                              }`}>
                                {change > 0 ? '+' : ''}{pctChange.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {history.length > 10 && (
                      <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 text-center">
                        Showing 10 of {history.length} price changes
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => onDelete(material.id, material.name)}
                className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => onDuplicate(material.id)}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => onEdit(material)}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Material
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Material not found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value, mono }) {
  const IconComponent = icon;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <IconComponent className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function PriceHistoryChart({ history }) {
  if (history.length === 0) return null;

  // Build price points from history (oldest first)
  const reversed = [...history].reverse();
  const prices = reversed.map(h => h.newPrice);
  // Add the initial old price from the oldest entry
  prices.unshift(reversed[0].oldPrice);

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const width = 400;
  const height = 80;
  const padding = { top: 8, bottom: 8, left: 8, right: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = prices.map((price, i) => {
    const x = padding.left + (i / (prices.length - 1)) * chartW;
    const y = padding.top + chartH - ((price - min) / range) * chartH;
    return { x, y, price };
  });

  // Create SVG path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Gradient fill path
  const fillD = pathD +
    ` L ${points[points.length - 1].x} ${height - padding.bottom}` +
    ` L ${points[0].x} ${height - padding.bottom} Z`;

  const isUp = prices[prices.length - 1] >= prices[0];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? '#fca5a5' : '#86efac'} stopOpacity="0.4" />
            <stop offset="100%" stopColor={isUp ? '#fca5a5' : '#86efac'} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#priceGrad)" />
        <path d={pathD} fill="none" stroke={isUp ? '#dc2626' : '#16a34a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Price dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="white"
            stroke={isUp ? '#dc2626' : '#16a34a'}
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
        <span>${prices[0].toFixed(2)}</span>
        <span className="text-gray-400">{prices.length} data points</span>
        <span className="font-medium text-gray-900">${prices[prices.length - 1].toFixed(2)}</span>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
