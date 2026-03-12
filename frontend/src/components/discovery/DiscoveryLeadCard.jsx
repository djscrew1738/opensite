/**
 * DiscoveryLeadCard Component
 * Card display for discovered leads with tier styling and contact info
 * 
 * @module components/discovery/DiscoveryLeadCard
 */

import { 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Star, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle, 
  Sparkles 
} from 'lucide-react';
import { useState, useCallback, memo } from 'react';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Record<string, {bg: string, border: string, accent: string, text: string, badge: string, label: string, icon: string, gradient: string}>} */
const TIER_STYLES = {
  hot: { 
    bg: `linear-gradient(to bottom right, #fef2f2, #fff7ed)`, 
    border: colors.danger.border, 
    accent: colors.danger.DEFAULT,
    text: colors.danger.dark, 
    badge: `${colors.danger.muted} ${colors.danger.DEFAULT}`,
    label: 'Hot Lead',
    icon: '🔥',
    gradient: 'from-red-500 to-orange-500',
  },
  warm: { 
    bg: `linear-gradient(to bottom right, #fff7ed, #fef3c7)`, 
    border: colors.warning.border, 
    accent: colors.warning.DEFAULT,
    text: colors.warning.dark, 
    badge: `${colors.warning.muted} ${colors.warning.DEFAULT}`,
    label: 'Warm Lead',
    icon: '☀️',
    gradient: 'from-orange-400 to-amber-400',
  },
  cold: { 
    bg: `linear-gradient(to bottom right, #f8fafc, #f1f5f9)`, 
    border: colors.border.strong, 
    accent: colors.text.muted,
    text: colors.text.secondary, 
    badge: `${colors.border.default} ${colors.text.muted}`,
    label: 'Cold Lead',
    icon: '❄️',
    gradient: 'from-slate-400 to-gray-400',
  },
  unscored: { 
    bg: colors.surface.card, 
    border: colors.border.default, 
    accent: colors.border.strong,
    text: colors.text.muted, 
    badge: `${colors.border.default} ${colors.text.muted}`,
    label: 'Unscored',
    icon: '○',
    gradient: 'from-gray-300 to-gray-400',
  },
};

/** @type {Record<string, {bg: string, label: string}>} */
const STATUS_STYLES = {
  new: { bg: `${colors.info.muted} ${colors.info.DEFAULT}`, label: 'New' },
  contacted: { bg: `${colors.warning.muted} ${colors.warning.DEFAULT}`, label: 'Contacted' },
  responded: { bg: `${colors.success.muted} ${colors.success.DEFAULT}`, label: 'Responded' },
  converted: { bg: `${colors.accent.muted} ${colors.accent.DEFAULT}`, label: 'Converted' },
  dismissed: { bg: colors.border.default, label: 'Dismissed' },
};

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to manage copy to clipboard state
 * @returns {{copiedEmail: boolean, copiedPhone: boolean, copyEmail: () => void, copyPhone: () => void}}
 */
function useCopyState() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const copyEmail = useCallback(() => {
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }, []);

  const copyPhone = useCallback(() => {
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  }, []);

  return { copiedEmail, copiedPhone, copyEmail, copyPhone };
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Score badge with tier label
 * @param {{score: number, tier: typeof TIER_STYLES[keyof typeof TIER_STYLES]}} props
 */
const ScoreBadge = memo(function ScoreBadge({ score, tier }) {
  return (
    <div className="shrink-0 flex flex-col items-end">
      <div 
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm"
        style={{ 
          backgroundColor: tier.badge.split(' ')[0],
          color: tier.badge.split(' ')[1],
          boxShadow: shadows.card,
        }}
      >
        <span className="font-mono text-base">{score || '--'}</span>
        <span className="text-xs opacity-80">{tier.label}</span>
      </div>
    </div>
  );
});

ScoreBadge.displayName = 'ScoreBadge';

/**
 * Plumbing relevance indicator
 * @param {{relevance: number}} props
 */
const RelevanceIndicator = memo(function RelevanceIndicator({ relevance }) {
  if (!relevance > 0) return null;

  return (
    <span 
      className="text-2xs mt-1"
      style={{ color: colors.text.muted }}
    >
      {Math.round(relevance * 100)}% match
    </span>
  );
});

RelevanceIndicator.displayName = 'RelevanceIndicator';

/**
 * Copy button component
 * @param {{copied: boolean, onClick: () => void}} props
 */
const CopyButton = memo(function CopyButton({ copied, onClick }) {
  return (
    <button
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md"
      style={{ 
        color: colors.text.muted,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.border.default;
        e.currentTarget.style.color = colors.text.secondary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = colors.text.muted;
      }}
      title="Copy"
      type="button"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" style={{ color: colors.success.DEFAULT }} />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
});

CopyButton.displayName = 'CopyButton';

/**
 * Email row with verification badge
 * @param {{email: string, isVerified: boolean, score: number, copied: boolean, onCopy: () => void}} props
 */
const EmailRow = memo(function EmailRow({ 
  email, 
  isVerified, 
  score, 
  copied, 
  onCopy 
}) {
  const iconBg = isVerified ? colors.success.muted : colors.border.default;
  const iconColor = isVerified ? colors.success.DEFAULT : colors.text.muted;

  return (
    <div className="flex items-center gap-2 group/email">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        <Mail className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span 
            className="text-sm truncate font-medium"
            style={{ color: colors.text.secondary }}
          >
            {email}
          </span>
          {isVerified && (
            <CheckCircle 
              className="w-3.5 h-3.5 shrink-0" 
              style={{ color: colors.success.DEFAULT }}
              title="Verified email" 
            />
          )}
        </div>
        {score > 0 && (
          <span 
            className="text-2xs"
            style={{ color: colors.text.muted }}
          >
            Quality: {score}/100
          </span>
        )}
      </div>
      <CopyButton copied={copied} onClick={onCopy} />
    </div>
  );
});

EmailRow.displayName = 'EmailRow';

/**
 * Phone row
 * @param {{phone: string, copied: boolean, onCopy: () => void}} props
 */
const PhoneRow = memo(function PhoneRow({ phone, copied, onCopy }) {
  return (
    <div className="flex items-center gap-2 group/phone">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: colors.accent.muted, color: colors.accent.DEFAULT }}
      >
        <Phone className="w-3.5 h-3.5" />
      </div>
      <span 
        className="text-sm font-medium"
        style={{ color: colors.text.secondary }}
      >
        {phone}
      </span>
      <CopyButton copied={copied} onClick={onCopy} />
    </div>
  );
});

PhoneRow.displayName = 'PhoneRow';

/**
 * Website link row
 * @param {{url: string}} props
 */
const WebsiteRow = memo(function WebsiteRow({ url }) {
  const getDomain = (url) => {
    if (!url) return '';
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: colors.accent.muted, color: colors.accent.DEFAULT }}
      >
        <Globe className="w-3.5 h-3.5" />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-sm truncate flex items-center gap-1 transition-colors"
        style={{ color: colors.accent.DEFAULT }}
        onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.light}
        onMouseLeave={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
      >
        {getDomain(url)}
        <ExternalLink className="w-3 h-3 opacity-50" />
      </a>
    </div>
  );
});

WebsiteRow.displayName = 'WebsiteRow';

/**
 * Address row
 * @param {{address: string}} props
 */
const AddressRow = memo(function AddressRow({ address }) {
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: colors.warning.muted, color: colors.warning.DEFAULT }}
      >
        <MapPin className="w-3.5 h-3.5" />
      </div>
      <span 
        className="text-sm truncate"
        style={{ color: colors.text.muted }}
      >
        {address}
      </span>
    </div>
  );
});

AddressRow.displayName = 'AddressRow';

/**
 * Rating display
 * @param {{rating: number, reviewCount: number, isEnriched: boolean}} props
 */
const RatingDisplay = memo(function RatingDisplay({ rating, reviewCount, isEnriched }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div 
        className="flex items-center gap-1 px-2 py-1 rounded-lg"
        style={{ backgroundColor: colors.warning.muted }}
      >
        <Star 
          className="w-3.5 h-3.5" 
          style={{ color: colors.warning.DEFAULT, fill: colors.warning.DEFAULT }}
        />
        <span 
          className="text-sm font-bold"
          style={{ color: colors.text.secondary }}
        >
          {rating}
        </span>
        <span 
          className="text-xs"
          style={{ color: colors.text.muted }}
        >
          ({reviewCount || 0})
        </span>
      </div>
      {isEnriched && (
        <span 
          className="text-2xs px-2 py-1 rounded-full flex items-center gap-1"
          style={{ 
            backgroundColor: colors.success.muted,
            color: colors.success.DEFAULT,
          }}
        >
          <Sparkles className="w-3 h-3" />
          Enriched
        </span>
      )}
    </div>
  );
});

RatingDisplay.displayName = 'RatingDisplay';

/**
 * Outreach preview section
 * @param {{subject: string}} props
 */
const OutreachPreview = memo(function OutreachPreview({ subject }) {
  return (
    <div 
      className="rounded-lg p-3 border"
      style={{ 
        backgroundColor: colors.surface.card,
        borderColor: colors.border.default,
      }}
    >
      <p 
        className="text-xs font-semibold mb-1"
        style={{ color: colors.text.muted }}
      >
        Suggested Outreach:
      </p>
      <p 
        className="text-sm line-clamp-2"
        style={{ color: colors.text.secondary }}
      >
        {subject}
      </p>
    </div>
  );
});

OutreachPreview.displayName = 'OutreachPreview';

/**
 * Status selector dropdown
 * @param {{value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void}} props
 */
const StatusSelector = memo(function StatusSelector({ value, onChange }) {
  const status = STATUS_STYLES[value] || STATUS_STYLES.new;

  return (
    <select
      value={value}
      onChange={onChange}
      className="text-xs font-semibold rounded-lg px-3 py-1.5 border-0 ring-1 ring-inset cursor-pointer hover:ring-2 transition-all"
      style={{ 
        backgroundColor: status.bg.split(' ')[0],
        color: status.bg.split(' ')[1],
      }}
    >
      {Object.entries(STATUS_STYLES).map(([val, config]) => (
        <option key={val} value={val}>{config.label}</option>
      ))}
    </select>
  );
});

StatusSelector.displayName = 'StatusSelector';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DiscoveryLeadCard - Card display for discovered leads
 * @param {{lead: Record<string, any>, onViewDetail?: (lead: any) => void, onStatusUpdate?: (id: string, status: string) => void}} props
 */
export default function DiscoveryLeadCard({ lead, onViewDetail, onStatusUpdate }) {
  const [isHovered, setIsHovered] = useState(false);
  const { copiedEmail, copiedPhone, copyEmail, copyPhone } = useCopyState();
  
  const tier = TIER_STYLES[lead.icpTier] || TIER_STYLES.unscored;
  const hasVerifiedEmail = lead.emailVerificationStatus === 'verified' && lead.bestEmailScore >= 80;
  const hasEmail = lead.emails?.length > 0;
  const primaryEmail = lead.bestEmail || lead.emails?.[0];

  const handleCopyEmail = useCallback((e) => {
    e.stopPropagation();
    if (primaryEmail) {
      navigator.clipboard.writeText(primaryEmail);
      copyEmail();
    }
  }, [primaryEmail, copyEmail]);

  const handleCopyPhone = useCallback((e) => {
    e.stopPropagation();
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone);
      copyPhone();
    }
  }, [lead.phone, copyPhone]);

  const handleStatusChange = useCallback((e) => {
    e.stopPropagation();
    onStatusUpdate?.(lead.id, e.target.value);
  }, [lead.id, onStatusUpdate]);

  return (
    <div
      onClick={() => onViewDetail?.(lead)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-xl border border-l-4 shadow-sm transition-all duration-300 cursor-pointer"
      style={{ 
        backgroundColor: colors.surface.card,
        borderColor: tier.border,
        borderLeftColor: tier.accent,
        boxShadow: isHovered ? shadows.cardHover : shadows.card,
      }}
    >
      {/* Tier accent bar at top */}
      <div 
        className="h-1 w-full"
        style={{ 
          background: tier.gradient 
            ? `linear-gradient(to right, ${tier.gradient.replace('from-', '').replace(' to-', ', ')})`
            : tier.accent,
        }}
      />
      
      <div className="p-4 space-y-3">
        {/* Header: Score badge + Business Name */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 
              className="font-bold truncate text-lg transition-colors"
              style={{ color: colors.text.primary }}
            >
              {lead.businessName}
            </h3>
            {lead.category && (
              <p 
                className="text-xs truncate mt-0.5"
                style={{ color: colors.text.muted }}
              >
                {lead.category}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            <ScoreBadge score={lead.icpScore} tier={tier} />
            <RelevanceIndicator relevance={lead.plumbingRelevance} />
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="space-y-2">
          {hasEmail && (
            <EmailRow 
              email={primaryEmail}
              isVerified={hasVerifiedEmail}
              score={lead.bestEmailScore}
              copied={copiedEmail}
              onCopy={handleCopyEmail}
            />
          )}

          {lead.phone && (
            <PhoneRow 
              phone={lead.phone}
              copied={copiedPhone}
              onCopy={handleCopyPhone}
            />
          )}

          {lead.website && <WebsiteRow url={lead.website} />}
          {lead.address && <AddressRow address={lead.address} />}
        </div>

        {/* Rating & Reviews */}
        {lead.rating && (
          <RatingDisplay 
            rating={lead.rating}
            reviewCount={lead.reviewCount}
            isEnriched={lead.enrichmentStatus === 'enriched'}
          />
        )}

        {/* Outreach Preview */}
        {lead.outreachSubject && (
          <OutreachPreview subject={lead.outreachSubject} />
        )}

        {/* Footer: Status selector + Meta */}
        <div 
          className="flex items-center justify-between pt-3"
          style={{ borderTop: `1px solid ${colors.border.default}` }}
        >
          <StatusSelector 
            value={lead.contactStatus} 
            onChange={handleStatusChange}
          />
          
          <span 
            className="text-2xs"
            style={{ color: colors.text.muted }}
          >
            {lead.servicesOffered?.length > 0 && `${lead.servicesOffered.length} services detected`}
          </span>
        </div>
      </div>

      {/* Hover overlay hint */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ 
          backgroundColor: `${colors.accent.DEFAULT}05`,
          opacity: isHovered ? 1 : 0,
        }}
      />
    </div>
  );
}

DiscoveryLeadCard.displayName = 'DiscoveryLeadCard';
