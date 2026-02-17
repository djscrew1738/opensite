import { useState } from 'react';
import { Calculator, Ruler } from 'lucide-react';
import Pricing from './Pricing';
import Takeoff from './Takeoff';

const TABS = [
  { id: 'estimates', label: 'Estimates', icon: Calculator },
  { id: 'takeoff', label: 'Takeoff', icon: Ruler },
];

export default function Plans() {
  const [activeTab, setActiveTab] = useState('estimates');

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header + Tab Bar */}
      <div className="px-6 pt-4 pb-0 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 tracking-tight">Plans</h1>
        </div>
        <nav className="flex -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'estimates' && (
          <div className="h-full overflow-y-auto">
            <Pricing />
          </div>
        )}
        {activeTab === 'takeoff' && (
          <Takeoff />
        )}
      </div>
    </div>
  );
}
