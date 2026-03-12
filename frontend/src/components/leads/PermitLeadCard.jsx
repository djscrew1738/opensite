import { formatCurrency, formatDate } from '../../utils/format';
import { Building2, MapPin, Calendar, DollarSign, Home, ArrowUpRight, CheckCircle2, Clock, Phone, Mail, FileText, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { memo, useCallback } from 'react';
import StatusProgressBar from './StatusProgressBar';
import { colors } from '../../styles/tokens';

const TIER_STYLES = {
  hot: {
    color: colors.danger.DEFAULT,
    glow: colors.danger.glow,
    label: 'High Potential'
  },
  warm: {
    color: colors.warning.DEFAULT,
    glow: colors.warning.glow,
    label: 'Warm Target'
  },
  cold: {
    color: colors.text.muted,
    glow: 'transparent',
    label: 'Cold'
  },
  unscored: {
    color: colors.border.strong,
    glow: 'transparent',
    label: 'No Score'
  }
};

function formatPermitType(type) {
  if (!type) return 'Building Permit';
  return type
    .replace(/Permit/g, '')
    .replace(/Building/g, 'Bldg')
    .replace(/Residential/g, 'Res')
    .replace(/Commercial/g, 'Com')
    .trim();
}

const PermitLeadCard = memo(function PermitLeadCard({ permit, onStatusUpdate, onViewDetails, onViewBuilder }) {
  const tier = TIER_STYLES[permit.leadTier] || TIER_STYLES.unscored;

  const handleStatusChange = useCallback((status) => onStatusUpdate?.(permit.id, status), [permit.id, onStatusUpdate]);
  const handleViewDetails = useCallback(() => onViewDetails?.(permit), [permit, onViewDetails]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-[22px] border border-white/5 shadow-sm transition-all duration-300"
      style={{
        backgroundColor: 'rgba(17, 19, 24, 0.6)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top indicator bar */}
      <div 
        className="h-1 w-full opacity-60" 
        style={{ background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)` }} 
      />
      
      <div className="p-5 space-y-4">
        {/* Header: Score + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div 
                className="text-3xl font-mono font-bold tabular-nums tracking-tighter"
                style={{ color: tier.color, textShadow: `0 0 15px ${tier.glow}` }}
              >
                {permit.leadScore || '--'}
              </div>
              <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-surface-500">
                  {tier.label}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-elevated border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-surface-200">
              {permit.leadStatus || 'New'}
            </span>
          </div>
        </div>

        {/* Contractor Info */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-lg font-bold text-surface-50 truncate tracking-tight">
              {permit.contractorName || 'Unknown Contractor'}
            </h3>
            {onViewBuilder && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewBuilder(permit.contractorName); }}
                className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
              >
                <Building2 size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-accent-500/10 border border-accent-500/20 text-[9px] font-bold uppercase tracking-widest text-accent-500">
              {formatPermitType(permit.permitType)}
            </span>
            <span className="text-[10px] font-mono text-surface-500">#{permit.permitNumber}</span>
          </div>
        </div>

        {/* Technical Specs Strip */}
        <div className="grid grid-cols-3 gap-2">
          <SpecItem icon={DollarSign} value={formatCurrency(permit.estimatedCost)} label="Est. Value" color="text-emerald-500" />
          <SpecItem icon={Home} value={permit.units || 0} label="Units" color="text-violet-500" />
          <SpecItem icon={Zap} value={permit.squareFootage?.toLocaleString() || 0} label="Sq Ft" color="text-amber-500" />
        </div>

        {/* Location & Context */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <MapPin size={14} className="text-surface-500 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-surface-200 truncate">{permit.address}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-500">{permit.city}, TX</p>
            </div>
          </div>

          {permit.description && (
            <div className="p-3 rounded-xl bg-surface-elevated/50 border border-white/5">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText size={12} className="text-surface-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-surface-500 text-[9px]">Permit Details</span>
              </div>
              <p className="text-xs text-surface-400 leading-relaxed line-clamp-2">
                {permit.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-surface-500">
            <Calendar size={12} />
            <span>Issued {formatDate(permit.issuedDate)}</span>
          </div>
        </div>

        {/* Status Control */}
        <div className="pt-2">
          <StatusProgressBar
            currentStatus={permit.leadStatus || 'new'}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Details CTA */}
        <motion.button
          onClick={handleViewDetails}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 700, damping: 35 }}
          className="w-full h-11 rounded-xl bg-surface-elevated border border-white/5 flex items-center justify-center gap-2 text-xs font-bold text-surface-200 hover:bg-white/5 transition-colors group/cta"
        >
          <span>VIEW SYSTEM DETAILS</span>
          <ArrowUpRight size={14} className="text-surface-500 group-hover/cta:text-accent-500 transition-colors" />
        </motion.button>
      </div>
    </motion.div>
  );
});

function SpecItem({ icon: Icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-card/50 border border-white/5">
      <Icon size={14} className={`${color} mb-1`} />
      <span className="text-xs font-bold text-surface-100 tabular-nums">{value}</span>
      <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-surface-500">{label}</span>
    </div>
  );
}

export default PermitLeadCard;
