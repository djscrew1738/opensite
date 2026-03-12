import { Mail, Phone, MapPin, Sparkles, Edit2, Trash2, Copy, Check, Building2 } from 'lucide-react';
import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useLeadScoring } from '../../hooks/useLeadScoring';
import { LeadCardSkeleton } from '../shared/LoadingStates';
import { colors } from '../../styles/tokens';

const TIER_CONFIG = {
  hot: {
    color: colors.danger.DEFAULT,
    glow: colors.danger.glow,
    label: 'High Priority'
  },
  warm: {
    color: colors.warning.DEFAULT,
    glow: colors.warning.glow,
    label: 'Warm Lead'
  },
  cold: {
    color: colors.text.muted,
    glow: 'transparent',
    label: 'Standard'
  },
  unscored: {
    color: colors.border.strong,
    glow: 'transparent',
    label: 'Pending Score'
  }
};

const LeadCard = memo(function LeadCard({
  lead,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  selectionMode,
  isLoading = false
}) {
  // All hooks unconditionally before early return
  const scoreLead = useLeadScoring();
  const [copied, setCopied] = useState(false);

  const tier = TIER_CONFIG[(lead || {}).status] || TIER_CONFIG.unscored;
  const hasScore = lead && lead.score !== null && lead.score !== undefined;

  if (isLoading) return <LeadCardSkeleton count={1} />;

  const handleCopyEmail = useCallback((e) => {
    e.stopPropagation();
    if (lead?.email) {
      navigator.clipboard.writeText(lead.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [lead?.email]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`group relative overflow-hidden rounded-[22px] border transition-all duration-300 ${isSelected ? 'border-accent-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'border-white/5'}`}
      style={{
        backgroundColor: 'rgba(17, 19, 24, 0.6)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top tier indicator */}
      <div 
        className="h-1 w-full opacity-60" 
        style={{ background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)` }} 
      />
      
      <div className="p-5 space-y-5">
        {/* Selection mode checkbox */}
        {selectionMode && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSelect?.(lead.id); }}
            className={`absolute top-4 left-4 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-accent-500 border-accent-500' : 'bg-white/5 border-white/10'}`}
          >
            {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
          </button>
        )}

        {/* Header */}
        <div className={`flex items-start justify-between gap-3 ${selectionMode ? 'pl-8' : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-surface-50 truncate tracking-tight">
                {lead.name}
              </h3>
              {lead.isAIGenerated && <Sparkles size={12} className="text-accent-500" />}
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 size={12} className="text-surface-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-surface-500 truncate">
                {lead.company || 'Private Party'}
              </p>
            </div>
          </div>
          
          {hasScore && (
            <div className="text-right">
              <div 
                className="text-3xl font-mono font-bold tabular-nums tracking-tighter"
                style={{ color: tier.color, textShadow: `0 0 15px ${tier.glow}` }}
              >
                {lead.score}
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-surface-500 mt-0.5">
                {tier.label}
              </p>
            </div>
          )}
        </div>

        {/* Contact Strip */}
        <div className="grid grid-cols-1 gap-2.5">
          {lead.email && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 group/contact transition-colors hover:border-white/10">
              <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-accent-500">
                <Mail size={14} />
              </div>
              <span className="text-sm font-medium text-surface-200 truncate flex-1">{lead.email}</span>
              <button onClick={handleCopyEmail} className="text-surface-500 hover:text-white transition-colors">
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          )}
          
          <div className="flex gap-2.5">
            {lead.phone && (
              <div className="flex-1 flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-emerald-500">
                  <Phone size={14} />
                </div>
                <span className="text-xs font-bold text-surface-200">{lead.phone}</span>
              </div>
            )}
            
            {lead.location && (
              <div className="flex-1 flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-blue-500">
                  <MapPin size={14} />
                </div>
                <span className="text-xs font-bold text-surface-200 truncate">{lead.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Project Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {lead.projectType && (
            <span className="px-3 py-1 rounded-full bg-surface-elevated border border-white/5 text-[10px] font-bold uppercase tracking-widest text-surface-400">
              {lead.projectType}
            </span>
          )}
          {lead.value > 0 && (
            <span className="px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-[10px] font-bold uppercase tracking-widest text-accent-500">
              Est. ${lead.value.toLocaleString()}
            </span>
          )}
        </div>

        {/* Actions Bar */}
        {!selectionMode && (
          <div className="flex items-center gap-2 pt-4 border-t border-white/5">
            <motion.button
              onClick={() => scoreLead.mutate(lead.id)}
              disabled={scoreLead.isPending}
              whileTap={scoreLead.isPending ? {} : { scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 600, damping: 30 }}
              className="flex-1 h-10 rounded-xl bg-surface-elevated border border-white/5 flex items-center justify-center gap-2 text-xs font-bold text-surface-200 hover:bg-white/5 transition-colors"
            >
              {scoreLead.isPending ? (
                <div className="w-4 h-4 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={14} className="text-accent-500" />
                  <span>AI ANALYSIS</span>
                </>
              )}
            </motion.button>

            <motion.button
              onClick={() => onEdit?.(lead)}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
              className="w-10 h-10 rounded-xl bg-surface-elevated border border-white/5 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
            >
              <Edit2 size={16} />
            </motion.button>

            <motion.button
              onClick={() => onDelete?.(lead.id)}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
              className="w-10 h-10 rounded-xl bg-surface-elevated border border-white/5 flex items-center justify-center text-surface-500 hover:text-danger-500 hover:bg-danger-500/10 transition-colors"
            >
              <Trash2 size={16} />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default LeadCard;
