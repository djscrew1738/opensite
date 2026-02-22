import { useState } from 'react';
import { 
  Wrench, 
  ClipboardList, 
  TrendingUp, 
  Building2, 
  Download, 
  ChevronDown, 
  ChevronUp,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Home,
  Layers
} from 'lucide-react';

export default function AnalysisResults({ 
  result, 
  onUploadAnother,
  onExport,
  isPartial = false 
}) {
  const [takeoffExpanded, setTakeoffExpanded] = useState(true);
  const [takeoffFilter, setTakeoffFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('overview');

  if (!result) return null;

  const { 
    fileName, 
    extractedData, 
    aiAnalysis, 
    aiAnalysisText, 
    estimate, 
    modelUsed,
    warnings = []
  } = result;

  // Helper to format currency
  const formatCurrency = (val) => {
    if (val == null) return '$0';
    return '$' + val.toLocaleString();
  };

  // Get fixture data from extracted or AI
  const fixtures = aiAnalysis?.fixtures || extractedData || {};
  const totalFixtures = fixtures.total || 
    (fixtures.toilets || 0) + 
    (fixtures.lavatories || 0) + 
    (fixtures.kitchenFaucets || 0) + 
    (fixtures.barSinks || 0) + 
    (fixtures.tubs || 0) + 
    (fixtures.showerBases || 0) + 
    (fixtures.mudPans || 0) + 
    (fixtures.washingMachines || 0);

  // Get takeoff data
  const takeoff = aiAnalysis?.materialTakeoff || [];
  const categories = ['All', ...new Set(takeoff.map(m => m.category).filter(Boolean))];
  const filteredTakeoff = takeoffFilter === 'All' 
    ? takeoff 
    : takeoff.filter(m => m.category === takeoffFilter);
  const grandTotal = filteredTakeoff.reduce((sum, m) => sum + (m.totalCost || 0), 0);

  // Handle CSV export
  const handleExportCSV = () => {
    const rows = [['Item', 'Category', 'Description', 'Qty', 'Unit', 'Unit Cost', 'Total Cost']];
    takeoff.forEach(m => rows.push([
      m.item, 
      m.category, 
      m.description, 
      m.quantity, 
      m.unit, 
      m.unitCost, 
      m.totalCost
    ]));
    rows.push([]);
    rows.push(['', '', '', '', '', 'GRAND TOTAL', takeoff.reduce((s, m) => s + (m.totalCost || 0), 0)]);
    
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `takeoff-${fileName?.replace(/\.[^/.]+$/, '') || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    onExport?.('csv');
  };

  // Tabs configuration
  const tabs = [
    { key: 'overview', label: 'Overview', icon: Home },
    { key: 'fixtures', label: 'Fixtures', icon: Wrench },
    { key: 'takeoff', label: 'Material Takeoff', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`
        rounded-xl p-4 flex items-center gap-4
        ${isPartial 
          ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' 
          : 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
        }
      `}>
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${isPartial 
            ? 'bg-blue-100 dark:bg-blue-900/50' 
            : 'bg-green-100 dark:bg-green-900/50'
          }
        `}>
          {isPartial ? (
            <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`
            font-semibold
            ${isPartial ? 'text-blue-900 dark:text-blue-300' : 'text-green-900 dark:text-green-300'}
          `}>
            {isPartial ? 'Extracted Data Ready' : 'Analysis Complete'}
          </h4>
          <p className={`
            text-sm truncate
            ${isPartial ? 'text-blue-700 dark:text-blue-400' : 'text-green-700 dark:text-green-400'}
          `}>
            {fileName}
            {isPartial && ' — AI analysis in progress...'}
          </p>
        </div>
        {modelUsed && !isPartial && (
          <span className="text-xs text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
            {modelUsed}
          </span>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && !isPartial && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-800 dark:text-amber-300">{w}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Stats */}
      {!isPartial && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">{fileName}</h3>
              <p className="text-blue-200 text-sm">
                {extractedData?.sqft?.toLocaleString()} sq ft • {extractedData?.units} units • {extractedData?.stories} stories
              </p>
            </div>
            {estimate?.total > 0 && (
              <div className="text-right">
                <p className="text-xs text-blue-300 uppercase tracking-wider">Total Estimate</p>
                <p className="text-3xl font-bold">{formatCurrency(estimate.total)}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {estimate?.materialTotal > 0 && (
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-blue-300 uppercase">Material</p>
                <p className="text-xl font-bold">{formatCurrency(estimate.materialTotal)}</p>
              </div>
            )}
            {aiAnalysis?.totals?.laborMultiplier && (
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-blue-300 uppercase">Labor Multiplier</p>
                <p className="text-xl font-bold">{aiAnalysis.totals.laborMultiplier}x</p>
              </div>
            )}
            {totalFixtures > 0 && (
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-blue-300 uppercase">Fixtures</p>
                <p className="text-xl font-bold">{totalFixtures}</p>
              </div>
            )}
            {extractedData?.bathrooms > 0 && (
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-blue-300 uppercase">Bathrooms</p>
                <p className="text-xl font-bold">{extractedData.bathrooms}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {aiAnalysis?.notes?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {aiAnalysis.notes.map((note, i) => (
                <span 
                  key={i} 
                  className="text-xs px-2 py-1 bg-white/10 rounded-full text-blue-100"
                >
                  {note}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === key 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: 'Square Feet', value: extractedData?.sqft, icon: Building2 },
                { label: 'Units', value: extractedData?.units, icon: Home },
                { label: 'Stories', value: extractedData?.stories, icon: Layers },
                { label: 'Bathrooms', value: extractedData?.bathrooms, icon: Wrench },
                { label: 'Total Fixtures', value: totalFixtures, icon: CheckCircle2 },
                { label: 'Complexity', value: aiAnalysis?.projectComplexity, icon: TrendingUp },
              ].filter(item => item.value != null).map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </p>
                </div>
              ))}
            </div>

            {/* Phase Breakdown */}
            {estimate?.breakdown && (
              <div className="card p-5">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  Phase Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'roughIn', label: 'Rough-in', percent: 50, color: 'bg-blue-500' },
                    { key: 'topOut', label: 'Top-out', percent: 30, color: 'bg-amber-500' },
                    { key: 'trim', label: 'Trim', percent: 20, color: 'bg-green-500' },
                  ].map(({ key, label, percent, color }) => {
                    const amount = estimate.breakdown?.[key]?.amount || Math.round(estimate.total * percent / 100);
                    return (
                      <div key={key} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                          <span className="text-xs text-gray-500">{percent}%</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
                          <div className={`${color} h-1.5 rounded-full`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fixtures Tab */}
        {activeTab === 'fixtures' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { key: 'toilets', label: 'Toilets' },
              { key: 'lavatories', label: 'Lavatories' },
              { key: 'kitchenFaucets', label: 'Kitchen Faucets' },
              { key: 'barSinks', label: 'Bar Sinks' },
              { key: 'tubs', label: 'Tubs' },
              { key: 'showerBases', label: 'Showers' },
              { key: 'mudPans', label: 'Mud Pans' },
              { key: 'washingMachines', label: 'Washing Machines' },
              { key: 'waterSoftener', label: 'Water Softener' },
              { key: 'waterSoftenerPreplumb', label: 'WS Pre-plumb' },
            ].map(({ key, label }) => {
              const count = fixtures[key] || extractedData?.[key] || 0;
              if (count === 0 && !isPartial) return null;
              return (
                <div key={key} className={`
                  rounded-xl p-4 border text-center
                  ${count > 0 
                    ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                    : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-50'
                  }
                `}>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Takeoff Tab */}
        {activeTab === 'takeoff' && (
          <div className="space-y-4">
            {/* Takeoff Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Material Takeoff
                </h4>
                <span className="text-sm text-gray-500">({takeoff.length} items)</span>
              </div>
              <div className="flex items-center gap-2">
                {takeoff.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                )}
                <button
                  onClick={() => setTakeoffExpanded(!takeoffExpanded)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  {takeoffExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Category Filter */}
            {takeoffExpanded && categories.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTakeoffFilter(cat)}
                    className={`
                      text-xs px-3 py-1.5 rounded-full font-medium transition-colors
                      ${takeoffFilter === cat 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }
                    `}
                  >
                    {cat} ({cat === 'All' ? takeoff.length : takeoff.filter(m => m.category === cat).length})
                  </button>
                ))}
              </div>
            )}

            {/* Takeoff Table */}
            {takeoffExpanded && takeoff.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-semibold">Item</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-semibold hidden sm:table-cell">Category</th>
                        <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-semibold">Qty</th>
                        <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-semibold hidden sm:table-cell">Unit</th>
                        <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-semibold hidden md:table-cell">Each</th>
                        <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-gray-500 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredTakeoff.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.item}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{item.quantity?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">{item.unit}</td>
                          <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell">
                            ${item.unitCost?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                            ${item.totalCost?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 dark:bg-gray-800 font-bold border-t-2 border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100" colSpan={2}>Material Total</td>
                        <td colSpan={3} className="hidden sm:table-cell"></td>
                        <td className="px-4 py-3 text-right text-lg text-blue-600 dark:text-blue-400">
                          {formatCurrency(grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Category Breakdown */}
                {takeoffFilter === 'All' && categories.length > 2 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Category Breakdown</h5>
                    {categories.filter(c => c !== 'All').map(cat => {
                      const catTotal = takeoff.filter(m => m.category === cat).reduce((s, m) => s + (m.totalCost || 0), 0);
                      const pct = grandTotal > 0 ? (catTotal / grandTotal * 100) : 0;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700 dark:text-gray-300">{cat}</span>
                            <span className="text-gray-500">{formatCurrency(catTotal)} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {takeoff.length === 0 && !isPartial && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No material takeoff available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Raw AI Response (fallback) */}
      {aiAnalysisText && !aiAnalysis?.materialTakeoff?.length && !aiAnalysis?.overview && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">AI Response</h4>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {aiAnalysisText}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onUploadAnother}
          className="btn-secondary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Another Blueprint
        </button>
        {takeoff.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Takeoff
          </button>
        )}
      </div>
    </div>
  );
}
