import { useMemo } from 'react';
import { 
  ScanEye, Upload, FileImage, Layers, Sparkles, Clock,
  CheckCircle2, AlertCircle, TrendingUp, Zap, ChevronRight,
  Maximize2, RotateCw, BarChart3, Cpu, FolderOpen,
  FileText, Image, MoreHorizontal
} from 'lucide-react';
import { visionApi } from '../../api/vision';

/* ================================================================
   VISION HOME v2 - Enhanced Blueprint Command Center
   - Smart alerts for analysis status
   - Quick action dock
   - Visual stats dashboard
   - Recent projects preview
   - AI analysis insights
   ================================================================ */

const FILE_TYPE_ICONS = {
  'pdf': { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
  'png': { icon: Image, color: 'text-blue-500', bg: 'bg-blue-50' },
  'jpg': { icon: Image, color: 'text-blue-500', bg: 'bg-blue-50' },
  'jpeg': { icon: Image, color: 'text-blue-500', bg: 'bg-blue-50' },
  'tiff': { icon: Image, color: 'text-violet-500', bg: 'bg-violet-50' },
  'tif': { icon: Image, color: 'text-violet-500', bg: 'bg-violet-50' },
  'webp': { icon: Image, color: 'text-green-500', bg: 'bg-green-50' },
};

/* -- COMPONENTS -- */

const QuickAction = ({ icon: Icon, label, onClick, color = 'text-accent-600', badge = null, disabled = false, description }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 transition-all duration-200 min-w-[90px] ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-300 hover:shadow-md active:scale-95'
    }`}
  >
    <div className="relative">
      <Icon className={`w-6 h-6 ${color}`} />
      {badge && (
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </div>
    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{label}</span>
    {description && <span className="text-[10px] text-surface-400">{description}</span>}
  </button>
);

const AlertCard = ({ type, title, message, action, onAction, count }) => {
  const styles = {
    urgent: { border: 'border-red-300', bg: 'bg-red-50/80', icon: AlertCircle, iconColor: 'text-red-500' },
    warning: { border: 'border-amber-300', bg: 'bg-amber-50/80', icon: Clock, iconColor: 'text-amber-500' },
    success: { border: 'border-emerald-300', bg: 'bg-emerald-50/80', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    info: { border: 'border-blue-300', bg: 'bg-blue-50/80', icon: Sparkles, iconColor: 'text-blue-500' },
  }[type];
  const Icon = styles.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles.border} ${styles.bg} dark:bg-opacity-10`}>
      <Icon className={`w-5 h-5 ${styles.iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-surface-900 dark:text-surface-100 text-sm">{title}</h4>
          {count > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white dark:bg-surface-800 text-xs font-bold text-surface-600">
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">{message}</p>
        {action && (
          <button
            onClick={onAction}
            className="mt-2 text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
          >
            {action} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subtext, icon: Icon, color = 'text-accent-600', trend = null, onClick }) => (
  <div 
    onClick={onClick}
    className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-accent-300 transition-all cursor-pointer group"
  >
    <div className="flex items-start justify-between mb-2">
      <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      {trend && (
        <span className={`text-xs font-bold ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-surface-900 dark:text-surface-100">{value}</div>
    <div className="text-xs text-surface-500 dark:text-surface-400 font-medium">{label}</div>
    {subtext && <div className="text-xs text-surface-400 mt-1">{subtext}</div>}
  </div>
);

const ProjectCard = ({ project, onClick }) => {
  const fileType = project.fileType?.toLowerCase() || 'png';
  const fileConfig = FILE_TYPE_ICONS[fileType] || FILE_TYPE_ICONS.png;
  const FileIcon = fileConfig.icon;

  const hasLayers = project.layerCount > 0 || project.hasAnalysis;
  const analysisStatus = project.analysisStatus || (hasLayers ? 'completed' : 'pending');

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-accent-300 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="shrink-0">
        <div className="w-16 h-16 rounded-xl bg-surface-100 dark:bg-surface-700 overflow-hidden relative">
          <img
            src={visionApi.getThumbnailUrl(project.id)}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className={`absolute inset-0 flex items-center justify-center ${fileConfig.bg} ${fileConfig.color}`}>
            <FileIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
            {project.name}
          </h4>
          {hasLayers && (
            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-2xs font-medium flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {project.layerCount || 'AI'}
            </span>
          )}
        </div>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {project.width && project.height 
            ? `${project.width.toLocaleString()} × ${project.height.toLocaleString()} px`
            : fileType.toUpperCase()
          }
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className={`flex items-center gap-1 text-xs ${
            analysisStatus === 'completed' ? 'text-emerald-600' : 
            analysisStatus === 'analyzing' ? 'text-amber-600' : 'text-slate-400'
          }`}>
            {analysisStatus === 'completed' ? (
              <><CheckCircle2 className="w-3 h-3" /> Analyzed</>
            ) : analysisStatus === 'analyzing' ? (
              <><Clock className="w-3 h-3" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-3 h-3" /> Ready for AI</>
            )}
          </span>
          <span className="text-xs text-surface-400">
            {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-accent-500 transition-colors" />
    </div>
  );
};

const ActivityItem = ({ icon: Icon, text, time, type = 'neutral' }) => {
  const colors = {
    neutral: 'text-surface-400',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-surface-100 dark:border-surface-700 last:border-0">
      <div className={`p-2 rounded-lg bg-surface-50 dark:bg-surface-800 ${colors[type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-700 dark:text-surface-300 truncate">{text}</p>
      </div>
      <span className="text-xs text-surface-400 whitespace-nowrap">{time}</span>
    </div>
  );
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function VisionHome({ 
  projects = [],
  onUpload,
  onViewProject,
  isLoading = false
}) {
  // Compute statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const analyzed = projects.filter(p => p.layerCount > 0 || p.hasAnalysis).length;
    const pending = projects.filter(p => !p.layerCount && !p.hasAnalysis).length;
    const totalArea = projects.reduce((sum, p) => sum + (p.width * p.height || 0), 0);

    return { total, analyzed, pending, totalArea };
  }, [projects]);

  // Generate smart alerts
  const alerts = useMemo(() => {
    const list = [];
    const pendingProjects = projects.filter(p => !p.layerCount && !p.hasAnalysis);
    const recentProjects = projects.slice(0, 3);

    if (pendingProjects.length > 0) {
      list.push({
        type: 'info',
        title: 'Projects Ready for Analysis',
        message: `${pendingProjects.length} blueprint${pendingProjects.length > 1 ? 's' : ''} haven't been analyzed yet`,
        action: 'Analyze Now',
        count: pendingProjects.length,
        onAction: () => onViewProject(pendingProjects[0]),
      });
    }

    if (projects.length === 0) {
      list.push({
        type: 'success',
        title: 'Welcome to Vision',
        message: 'Upload your first blueprint to get AI-powered analysis',
        action: 'Upload Blueprint',
        onAction: onUpload,
      });
    }

    return list;
  }, [projects, onUpload, onViewProject]);

  // Recent projects (last 5)
  const recentProjects = useMemo(() => {
    return projects
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [projects]);

  // Recent activity (mock data - would come from API)
  const recentActivity = [
    { icon: Sparkles, text: 'AI analysis completed for Horizon Tower', time: '5m ago', type: 'success' },
    { icon: Upload, text: 'Blueprint uploaded: Floor Plan A-12', time: '15m ago', type: 'info' },
    { icon: CheckCircle2, text: 'Layer annotations updated', time: '1h ago', type: 'neutral' },
    { icon: ScanEye, text: 'Deep-zoom tiles generated', time: '2h ago', type: 'info' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-surface-200 rounded-xl" />)}
        </div>
        <div className="h-40 bg-surface-200 rounded-xl" />
        <div className="h-60 bg-surface-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <AlertCard key={i} {...alert} />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <QuickAction 
            icon={Upload} 
            label="Upload" 
            onClick={onUpload}
            color="text-primary-600"
            description="Blueprint"
          />
          <QuickAction 
            icon={ScanEye} 
            label="View All" 
            onClick={() => onViewProject(projects[0])}
            color="text-blue-600"
            description="Projects"
            disabled={projects.length === 0}
          />
          <QuickAction 
            icon={Sparkles} 
            label="Analyze" 
            onClick={() => onViewProject(projects.find(p => !p.layerCount) || projects[0])}
            color="text-violet-600"
            description="AI"
            disabled={projects.length === 0}
          />
          <QuickAction 
            icon={FolderOpen} 
            label="Export" 
            onClick={() => {}}
            color="text-emerald-600"
            description="Layers"
            disabled={projects.length === 0}
          />
          <QuickAction 
            icon={Cpu} 
            label="AI Models" 
            onClick={() => {}}
            color="text-amber-600"
            description="Settings"
          />
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={stats.total}
          subtext="Blueprints"
          icon={FileImage}
          color="text-primary-600"
          onClick={() => projects.length > 0 && onViewProject(projects[0])}
        />
        <StatCard
          label="Analyzed"
          value={stats.analyzed}
          subtext="With AI layers"
          icon={Layers}
          color="text-violet-600"
          onClick={() => {
            const analyzed = projects.find(p => p.layerCount > 0 || p.hasAnalysis);
            if (analyzed) onViewProject(analyzed);
          }}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          subtext="Ready for analysis"
          icon={Clock}
          color="text-amber-600"
          onClick={() => {
            const pending = projects.find(p => !p.layerCount && !p.hasAnalysis);
            if (pending) onViewProject(pending);
          }}
        />
        <StatCard
          label="Total Pixels"
          value={stats.totalArea > 1000000 
            ? `${(stats.totalArea / 1000000).toFixed(1)}M` 
            : stats.totalArea.toLocaleString()}
          subtext="Blueprint area"
          icon={Maximize2}
          color="text-emerald-600"
        />
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <ScanEye className="w-4 h-4 text-primary-500" />
            Recent Projects
          </h3>
          {projects.length > 5 && (
            <button 
              onClick={() => onViewProject(projects[0])}
              className="text-xs text-accent-600 hover:text-accent-700 font-medium"
            >
              View All →
            </button>
          )}
        </div>

        <div className="space-y-3">
          {recentProjects.length > 0 ? (
            recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onViewProject(project)}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-surface-50 dark:bg-surface-800 rounded-xl border border-dashed border-surface-300">
              <FileImage className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 dark:text-surface-400 text-sm">No blueprints yet</p>
              <p className="text-surface-400 text-xs mt-1 mb-4">Upload your first blueprint to get started</p>
              <button 
                onClick={onUpload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Blueprint
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* File Types Distribution */}
        <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-surface-400" />
            File Types
          </h3>
          <div className="space-y-4">
            {['PDF', 'PNG/JPG', 'TIFF'].map((type) => {
              const count = projects.filter(p => {
                const ft = p.fileType?.toLowerCase() || '';
                if (type === 'PDF') return ft === 'pdf';
                if (type === 'PNG/JPG') return ['png', 'jpg', 'jpeg', 'webp'].includes(ft);
                if (type === 'TIFF') return ['tiff', 'tif'].includes(ft);
                return false;
              }).length;
              const total = projects.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors = {
                'PDF': 'bg-red-500',
                'PNG/JPG': 'bg-blue-500',
                'TIFF': 'bg-violet-500',
              };
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-surface-700 dark:text-surface-300">{type}</span>
                    <span className="text-sm font-bold text-surface-900">{count}</span>
                  </div>
                  <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${colors[type]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-surface-400" />
            Recent Activity
          </h3>
          <div className="space-y-1">
            {recentActivity.map((activity, i) => (
              <ActivityItem key={i} {...activity} />
            ))}
          </div>
        </div>
      </div>

      {/* AI Capabilities */}
      <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/10 dark:to-blue-900/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-violet-500 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">AI Analysis</h3>
            <p className="text-xs text-surface-500">Powered by GPT-4 Vision & Gemini</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Layers, label: 'Room Detection', desc: 'Auto-identify spaces' },
            { icon: Zap, label: 'Fixture Finding', desc: 'Locate plumbing fixtures' },
            { icon: Maximize2, label: 'Measurements', desc: 'Scale calibration' },
            { icon: RotateCw, label: 'Multi-angle', desc: 'Various orientations' },
          ].map((feature) => (
            <div key={feature.label} className="p-3 rounded-lg bg-white/80 dark:bg-surface-800/80 text-center">
              <feature.icon className="w-5 h-5 text-violet-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-surface-800">{feature.label}</p>
              <p className="text-[10px] text-surface-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
