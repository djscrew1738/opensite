import { AccessibleCard } from './AccessibleCard';
import { Building2, Users, FileText, ArrowRight } from 'lucide-react';

export default {
  title: 'UI/AccessibleCard',
  component: AccessibleCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isInteractive: {
      control: 'boolean',
      description: 'Makes the card clickable with keyboard support',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for interactive cards',
    },
  },
};

const Template = (args) => (
  <div style={{ width: '320px' }}>
    <AccessibleCard {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  children: (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-slate-100">Card Title</h3>
      <p className="text-sm text-slate-400 mt-1">This is a basic accessible card component.</p>
    </div>
  ),
};

export const Interactive = Template.bind({});
Interactive.args = {
  isInteractive: true,
  ariaLabel: 'View job details: Project Alpha',
  onClick: () => {},
  children: (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Building2 className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate">Project Alpha</h3>
          <p className="text-xs text-slate-400 mt-0.5">DR Horton • Celina, TX</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500" />
      </div>
    </div>
  ),
};

export const WithHoverEffect = () => (
  <div style={{ width: '320px' }}>
    <AccessibleCard
      isInteractive
      ariaLabel="Select lead: Horizon Homes"
      className="group"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-100">Horizon Homes</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Hot
              </span>
              <span className="text-xs text-slate-400">Score: 85</span>
            </div>
          </div>
        </div>
      </div>
    </AccessibleCard>
  </div>
);

export const CardGrid = () => (
  <div className="grid grid-cols-2 gap-4" style={{ width: '480px' }}>
    {[
      { icon: Building2, label: 'Jobs', count: 24, color: 'blue' },
      { icon: Users, label: 'Leads', count: 12, color: 'emerald' },
      { icon: FileText, label: 'Documents', count: 48, color: 'amber' },
    ].map((item) => (
      <AccessibleCard
        key={item.label}
        isInteractive
        ariaLabel={`${item.label}: ${item.count}`}
        className="group"
      >
        <div className="p-4 text-center">
          <div className={`inline-flex p-3 rounded-xl bg-${item.color}-500/10 group-hover:bg-${item.color}-500/20 transition-colors mb-3`}>
            <item.icon className={`w-6 h-6 text-${item.color}-400`} />
          </div>
          <div className="text-2xl font-bold text-slate-100">{item.count}</div>
          <div className="text-sm text-slate-400">{item.label}</div>
        </div>
      </AccessibleCard>
    ))}
  </div>
);

export const KeyboardNavigationDemo = () => {
  const [selected, setSelected] = React.useState(null);
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Use Tab to navigate, Enter or Space to select. Focus indicator is visible.
      </p>
      <div className="space-y-2" style={{ width: '320px' }}>
        {['Option A', 'Option B', 'Option C'].map((opt) => (
          <AccessibleCard
            key={opt}
            isInteractive
            ariaLabel={`Select ${opt}`}
            onClick={() => setSelected(opt)}
            className={selected === opt ? 'ring-2 ring-blue-500' : ''}
          >
            <div className="p-3 flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                selected === opt 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-slate-500'
              }`} />
              <span className="text-sm text-slate-200">{opt}</span>
            </div>
          </AccessibleCard>
        ))}
      </div>
      {selected && (
        <p className="text-sm text-emerald-400">Selected: {selected}</p>
      )}
    </div>
  );
};
