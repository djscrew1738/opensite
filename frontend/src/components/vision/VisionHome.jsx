/**
 * VisionHome Component
 * Blueprint command center dashboard with AI analysis
 * 
 * @module components/vision/VisionHome
 */

import { useMemo, memo, useCallback } from 'react';
import { 
  ScanEye, Upload, FileImage, Layers, Sparkles, Clock,
  CheckCircle2, AlertCircle, TrendingUp, Zap, ChevronRight,
  Maximize2, RotateCw, BarChart3, Cpu, FolderOpen,
  FileText, Image, MoreHorizontal
} from 'lucide-react';
import { visionApi } from '../../api/vision';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Record<string, { icon: any; color: string; bg: string }>} */
const FILE_TYPE_ICONS = {
  'pdf': { icon: FileText, color: colors.danger.DEFAULT, bg: colors.danger.muted },
  'png': { icon: Image, color: colors.info.DEFAULT, bg: colors.info.muted },
  'jpg': { icon: Image, color: colors.info.DEFAULT, bg: colors.info.muted },
  'jpeg': { icon: Image, color: colors.info.DEFAULT, bg: colors.info.muted },
  'tiff': { icon: Image, color: colors.accent.purple, bg: `${colors.accent.purple}20` },
  'tif': { icon: Image, color: colors.accent.purple, bg: `${colors.accent.purple}20` },
  'webp': { icon: Image, color: colors.success.DEFAULT, bg: colors.success.muted },
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Quick action button
 * @param {{ icon: any; label: string; onClick: () => void; color?: string; badge?: number | null; disabled?: boolean; description?: string }} props
 */
const QuickAction = memo(function QuickAction({ icon: Icon, label, onClick, color, badge = null, disabled = false, description }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 min-w-[90px]"
      style={{
        backgroundColor: colors.surface.card,
        borderColor: colors.border.default,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = colors.accent.DEFAULT;
          e.currentTarget.style.boxShadow = shadows.card;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = colors.border.default;
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div className="relative">
        <Icon style={{ color, width: '24px', height: '24px' }} />
        {badge && (
          <span 
            className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full text-xs font-semibold flex items-center justify-center px-1"
            style={{ backgroundColor: colors.danger.DEFAULT, color: colors.text.inverse }}
          >
            {badge}
          </span>
        )}
      </div>
      <span style={{ color: colors.text.secondary, fontSize: '12px', fontWeight: 500 }}>{label}</span>
      {description && <span style={{ color: colors.text.muted, fontSize: '10px' }}>{description}</span>}
    </button>
  );
});

QuickAction.displayName = 'QuickAction';

/**
 * Alert card for notifications
 * @param {{ type: 'urgent' | 'warning' | 'success' | 'info'; title: string; message: string; action?: string; onAction?: () => void; count?: number }} props
 */
const AlertCard = memo(function AlertCard({ type, title, message, action, onAction, count }) {
  const styles = {
    urgent: { border: colors.danger.border, bg: colors.danger.muted, icon: AlertCircle, iconColor: colors.danger.DEFAULT },
    warning: { border: colors.warning.border, bg: colors.warning.muted, icon: Clock, iconColor: colors.warning.DEFAULT },
    success: { border: colors.success.border, bg: colors.success.muted, icon: CheckCircle2, iconColor: colors.success.DEFAULT },
    info: { border: colors.info.border, bg: colors.info.muted, icon: Sparkles, iconColor: colors.info.DEFAULT },
  }[type];
  const Icon = styles.icon;

  return (
    <div 
      className="flex items-start gap-3 p-4 rounded-xl border"
      style={{ 
        borderColor: styles.border, 
        backgroundColor: styles.bg,
      }}
    >
      <Icon style={{ color: styles.iconColor, width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 style={{ color: colors.text.primary, fontSize: '14px', fontWeight: 600 }}>{title}</h4>
          {count > 0 && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: colors.surface.card, color: colors.text.secondary }}
            >
              {count}
            </span>
          )}
        </div>
        <p style={{ color: colors.text.secondary, fontSize: '12px', lineHeight: 1.5 }}>{message}</p>
        {action && (
          <button
            onClick={onAction}
            className="mt-2 text-xs font-semibold flex items-center gap-1"
            style={{ color: colors.accent.DEFAULT }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
          >
            {action} <ChevronRight style={{ width: '12px', height: '12px' }} />
          </button>
        )}
      </div>
    </div>
  );
});

AlertCard.displayName = 'AlertCard';

/**
 * Stat card for dashboard metrics
 * @param {{ label: string; value: string | number; subtext?: string; icon: any; color?: string; trend?: number | null; onClick?: () => void }} props
 */
const StatCard = memo(function StatCard({ label, value, subtext, icon: Icon, color, trend = null, onClick }) {
  const colorMap = {
    'text-primary-600': colors.accent.DEFAULT,
    'text-blue-600': colors.info.DEFAULT,
    'text-violet-600': colors.accent.purple,
    'text-amber-600': colors.warning.DEFAULT,
    'text-emerald-600': colors.success.DEFAULT,
  };

  const colorValue = colorMap[color] || colors.accent.DEFAULT;

  return (
    <div 
      onClick={onClick}
      className="p-4 rounded-xl border transition-all cursor-pointer"
      style={{ 
        backgroundColor: colors.surface.card,
        borderColor: colors.border.default,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.accent.DEFAULT;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border.default;
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${colorValue}1A` }}
        >
          <Icon style={{ color: colorValue, width: '16px', height: '16px' }} />
        </div>
        {trend && (
          <span 
            className="text-xs font-semibold"
            style={{ color: trend > 0 ? colors.success.DEFAULT : colors.danger.DEFAULT }}
          >
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div style={{ color: colors.text.primary, fontSize: '24px', fontWeight: 700 }}>{value}</div>
      <div style={{ color: colors.text.secondary, fontSize: '12px', fontWeight: 500 }}>{label}</div>
      {subtext && <div style={{ color: colors.text.muted, fontSize: '12px', marginTop: '4px' }}>{subtext}</div>}
    </div>
  );
});

StatCard.displayName = 'StatCard';

/**
 * Project card for recent projects list
 * @param {{ project: any; onClick: () => void }} props
 */
const ProjectCard = memo(function ProjectCard({ project, onClick }) {
  const fileType = project.fileType?.toLowerCase() || 'png';
  const fileConfig = FILE_TYPE_ICONS[fileType] || FILE_TYPE_ICONS.png;
  const FileIcon = fileConfig.icon;

  const hasLayers = project.layerCount > 0 || project.hasAnalysis;
  const analysisStatus = project.analysisStatus || (hasLayers ? 'completed' : 'pending');

  const getStatusColor = () => {
    if (analysisStatus === 'completed') return colors.success.DEFAULT;
    if (analysisStatus === 'analyzing') return colors.warning.DEFAULT;
    return colors.text.muted;
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer"
      style={{ 
        backgroundColor: colors.surface.card,
        borderColor: colors.border.default,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.accent.DEFAULT;
        e.currentTarget.style.boxShadow = shadows.card;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border.default;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Thumbnail */}
      <div className="shrink-0">
        <div 
          className="w-16 h-16 rounded-xl overflow-hidden relative"
          style={{ backgroundColor: colors.surface.elevated }}
        >
          <img
            src={visionApi.getThumbnailUrl(project.id)}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: fileConfig.bg, color: fileConfig.color }}
          >
            <FileIcon style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 style={{ color: colors.text.primary, fontWeight: 600 }} className="truncate">
            {project.name}
          </h4>
          {hasLayers && (
            <span 
              className="px-2 py-0.5 rounded-full text-2xs font-medium flex items-center gap-1"
              style={{ backgroundColor: `${colors.accent.purple}20`, color: colors.accent.purple }}
            >
              <Layers style={{ width: '12px', height: '12px' }} />
              {project.layerCount || 'AI'}
            </span>
          )}
        </div>
        <p style={{ color: colors.text.secondary, fontSize: '14px' }}>
          {project.width && project.height 
            ? `${project.width.toLocaleString()} × ${project.height.toLocaleString()} px`
            : fileType.toUpperCase()
          }
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span 
            className="flex items-center gap-1 text-xs"
            style={{ color: getStatusColor() }}
          >
            {analysisStatus === 'completed' ? (
              <><CheckCircle2 style={{ width: '12px', height: '12px' }} /> Analyzed</>
            ) : analysisStatus === 'analyzing' ? (
              <><Clock style={{ width: '12px', height: '12px' }} /> Analyzing...</>
            ) : (
              <><Sparkles style={{ width: '12px', height: '12px' }} /> Ready for AI</>
            )}
          </span>
          <span style={{ color: colors.text.muted, fontSize: '12px' }}>
            {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight style={{ color: colors.border.strong, width: '20px', height: '20px' }} />
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

/**
 * Activity item for timeline
 * @param {{ icon: any; text: string; time: string; type?: 'neutral' | 'success' | 'warning' | 'info' }} props
 */
const ActivityItem = memo(function ActivityItem({ icon: Icon, text, time, type = 'neutral' }) {
  const typeColors = {
    neutral: colors.text.muted,
    success: colors.success.DEFAULT,
    warning: colors.warning.DEFAULT,
    info: colors.info.DEFAULT,
  };
  
  return (
    <div 
      className="flex items-center gap-3 py-3 last:border-0"
      style={{ borderBottom: `1px solid ${colors.border.default}` }}
    >
      <div 
        className="p-2 rounded-lg"
        style={{ backgroundColor: colors.surface.elevated, color: typeColors[type] }}
      >
        <Icon style={{ width: '16px', height: '16px' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: colors.text.secondary, fontSize: '14px' }} className="truncate">{text}</p>
      </div>
      <span style={{ color: colors.text.muted, fontSize: '12px', whiteSpace: 'nowrap' }}>{time}</span>
    </div>
  );
});

ActivityItem.displayName = 'ActivityItem';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * VisionHome - Blueprint vision dashboard
 * @param {{ projects?: any[]; onUpload?: () => void; onViewProject?: (project: any) => void; isLoading?: boolean }} props
 */
const VisionHome = memo(function VisionHome({ 
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

    if (pendingProjects.length > 0) {
      list.push({
        type: 'info',
        title: 'Projects Ready for Analysis',
        message: `${pendingProjects.length} blueprint${pendingProjects.length > 1 ? 's' : ''} haven't been analyzed yet`,
        action: 'Analyze Now',
        count: pendingProjects.length,
        onAction: () => onViewProject?.(pendingProjects[0]),
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

  const handleUpload = useCallback(() => onUpload?.(), [onUpload]);
  const handleViewProject = useCallback((project) => onViewProject?.(project), [onViewProject]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div 
              key={i} 
              className="h-24 rounded-xl" 
              style={{ backgroundColor: colors.surface.elevated }}
            />
          ))}
        </div>
        <div 
          className="h-40 rounded-xl" 
          style={{ backgroundColor: colors.surface.elevated }}
        />
        <div 
          className="h-60 rounded-xl" 
          style={{ backgroundColor: colors.surface.elevated }}
        />
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
        <h3 
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: colors.text.muted }}
        >
          Quick Actions
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <QuickAction 
            icon={Upload} 
            label="Upload" 
            onClick={handleUpload}
            color={colors.accent.DEFAULT}
            description="Blueprint"
          />
          <QuickAction 
            icon={ScanEye} 
            label="View All" 
            onClick={() => handleViewProject(projects[0])}
            color={colors.info.DEFAULT}
            description="Projects"
            disabled={projects.length === 0}
          />
          <QuickAction 
            icon={Sparkles} 
            label="Analyze" 
            onClick={() => handleViewProject(projects.find(p => !p.layerCount) || projects[0])}
            color={colors.accent.purple}
            description="AI"
            disabled={projects.length === 0}
          />
          <QuickAction 
            icon={FolderOpen} 
            label="Export" 
            onClick={() => {}}
            color={colors.success.DEFAULT}
            description="Layers"
            disabled={projects.length === 0}
          />
          <QuickAction 
            icon={Cpu} 
            label="AI Models" 
            onClick={() => {}}
            color={colors.warning.DEFAULT}
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
          onClick={() => projects.length > 0 && handleViewProject(projects[0])}
        />
        <StatCard
          label="Analyzed"
          value={stats.analyzed}
          subtext="With AI layers"
          icon={Layers}
          color="text-violet-600"
          onClick={() => {
            const analyzed = projects.find(p => p.layerCount > 0 || p.hasAnalysis);
            if (analyzed) handleViewProject(analyzed);
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
            if (pending) handleViewProject(pending);
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
          <h3 
            className="text-sm font-bold flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <ScanEye style={{ color: colors.accent.DEFAULT, width: '16px', height: '16px' }} />
            Recent Projects
          </h3>
          {projects.length > 5 && (
            <button 
              onClick={() => handleViewProject(projects[0])}
              className="text-xs font-medium"
              style={{ color: colors.accent.DEFAULT }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.hover}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
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
                onClick={() => handleViewProject(project)}
              />
            ))
          ) : (
            <div 
              className="text-center py-12 rounded-xl border border-dashed"
              style={{ backgroundColor: colors.surface.card, borderColor: colors.border.strong }}
            >
              <FileImage style={{ color: colors.border.strong, width: '48px', height: '48px' }} className="mx-auto mb-3" />
              <p style={{ color: colors.text.secondary, fontSize: '14px' }}>No blueprints yet</p>
              <p style={{ color: colors.text.muted, fontSize: '12px', marginTop: '4px', marginBottom: '16px' }}>Upload your first blueprint to get started</p>
              <button 
                onClick={handleUpload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ backgroundColor: colors.accent.DEFAULT, color: colors.text.inverse }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
              >
                <Upload style={{ width: '16px', height: '16px' }} />
                Upload Blueprint
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* File Types Distribution */}
        <div 
          className="p-5 rounded-xl border"
          style={{ backgroundColor: colors.surface.card, borderColor: colors.border.default }}
        >
          <h3 
            className="text-sm font-bold mb-4 flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <BarChart3 style={{ color: colors.text.muted, width: '16px', height: '16px' }} />
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
              const typeColors = {
                'PDF': colors.danger.DEFAULT,
                'PNG/JPG': colors.info.DEFAULT,
                'TIFF': colors.accent.purple,
              };
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: colors.text.secondary, fontSize: '14px' }}>{type}</span>
                    <span style={{ color: colors.text.primary, fontSize: '14px', fontWeight: 700 }}>{count}</span>
                  </div>
                  <div 
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: colors.surface.elevated }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: typeColors[type] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div 
          className="p-5 rounded-xl border"
          style={{ backgroundColor: colors.surface.card, borderColor: colors.border.default }}
        >
          <h3 
            className="text-sm font-bold mb-4 flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <Clock style={{ color: colors.text.muted, width: '16px', height: '16px' }} />
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
      <div 
        className="p-5 rounded-xl border"
        style={{ 
          background: `linear-gradient(to bottom right, ${colors.accent.purple}15, ${colors.info.DEFAULT}15)`,
          borderColor: colors.border.default,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="p-2 rounded-xl"
            style={{ backgroundColor: colors.accent.purple, color: colors.text.inverse }}
          >
            <Sparkles style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <h3 style={{ color: colors.text.primary, fontSize: '14px', fontWeight: 700 }}>AI Analysis</h3>
            <p style={{ color: colors.text.secondary, fontSize: '12px' }}>Powered by GPT-4 Vision & Gemini</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Layers, label: 'Room Detection', desc: 'Auto-identify spaces' },
            { icon: Zap, label: 'Fixture Finding', desc: 'Locate plumbing fixtures' },
            { icon: Maximize2, label: 'Measurements', desc: 'Scale calibration' },
            { icon: RotateCw, label: 'Multi-angle', desc: 'Various orientations' },
          ].map((feature) => (
            <div 
              key={feature.label} 
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: `${colors.surface.card}CC` }}
            >
              <feature.icon style={{ color: colors.accent.purple, width: '20px', height: '20px', margin: '0 auto 8px' }} />
              <p style={{ color: colors.text.primary, fontSize: '12px', fontWeight: 600 }}>{feature.label}</p>
              <p style={{ color: colors.text.muted, fontSize: '10px' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VisionHome.displayName = 'VisionHome';

export default VisionHome;
