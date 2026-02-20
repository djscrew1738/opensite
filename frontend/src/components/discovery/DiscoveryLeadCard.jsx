import { Mail, Phone, Globe, MapPin, Star, ExternalLink, Copy, Check, CheckCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';

const TIER_STYLES = {
  hot: { 
    bg: 'bg-gradient-to-br from-red-50 to-orange-50', 
    border: 'border-red-200', 
    accent: 'border-l-red-500',
    text: 'text-red-700', 
    badge: 'bg-red-100 text-red-700 ring-red-200',
    label: 'Hot Lead',
    icon: '🔥'
  },
  warm: { 
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50', 
    border: 'border-orange-200', 
    accent: 'border-l-orange-500',
    text: 'text-orange-700', 
    badge: 'bg-orange-100 text-orange-700 ring-orange-200',
    label: 'Warm Lead',
    icon: '☀️'
  },
  cold: { 
    bg: 'bg-gradient-to-br from-slate-50 to-gray-50', 
    border: 'border-slate-200', 
    accent: 'border-l-slate-400',
    text: 'text-slate-600', 
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    label: 'Cold Lead',
    icon: '❄️'
  },
  unscored: { 
    bg: 'bg-surface-50', 
    border: 'border-surface-200', 
    accent: 'border-l-surface-300',
    text: 'text-surface-500', 
    badge: 'bg-surface-100 text-surface-500',
    label: 'Unscored',
    icon: '○'
  },
};

const STATUS_STYLES = {
  new: { bg: 'bg-blue-50 text-blue-700 ring-blue-200', label: 'New' },
  contacted: { bg: 'bg-amber-50 text-amber-700 ring-amber-200', label: 'Contacted' },
  responded: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: 'Responded' },
  converted: { bg: 'bg-purple-50 text-purple-700 ring-purple-200', label: 'Converted' },
  dismissed: { bg: 'bg-gray-100 text-gray-500', label: 'Dismissed' },
};

export default function DiscoveryLeadCard({ lead, onViewDetail, onStatusUpdate }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const tier = TIER_STYLES[lead.icpTier] || TIER_STYLES.unscored;
  const status = STATUS_STYLES[lead.contactStatus] || STATUS_STYLES.new;
  
  // Email verification indicator
  const hasVerifiedEmail = lead.emailVerificationStatus === 'verified' && lead.bestEmailScore >= 80;
  const hasEmail = lead.emails?.length > 0;
  const primaryEmail = lead.bestEmail || lead.emails?.[0];

  const handleCopy = async (type, value) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    onStatusUpdate?.(lead.id, e.target.value);
  };

  const getWebsiteDomain = (url) => {
    if (!url) return '';
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
  };

  return (
    <div
      onClick={() => onViewDetail?.(lead)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden rounded-xl border ${tier.border} ${tier.accent} border-l-4 bg-white dark:bg-surface-800 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer`}
    >
      {/* Tier accent bar at top */}
      <div className={`h-1 w-full bg-gradient-to-r ${tier.icpTier === 'hot' ? 'from-red-500 to-orange-500' : tier.icpTier === 'warm' ? 'from-orange-400 to-amber-400' : 'from-slate-300 to-gray-300'}`} />
      
      <div className="p-4 space-y-3">
        {/* Header: Score badge + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-surface-900 dark:text-surface-100 truncate text-lg group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
              {lead.businessName}
            </h3>
            {lead.category && (
              <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">
                {lead.category}
              </p>
            )}
          </div>
          
          {/* Score Badge */}
          <div className={`shrink-0 flex flex-col items-end`}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ring-1 ${tier.badge} shadow-sm`}>
              <span className="font-mono text-base">{lead.icpScore || '--'}</span>
              <span className="text-xs opacity-80">{tier.label}</span>
            </div>
            {lead.plumbingRelevance > 0 && (
              <span className="text-2xs text-surface-400 mt-1">
                {Math.round(lead.plumbingRelevance * 100)}% match
              </span>
            )}
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="space-y-2">
          {/* Email with verification badge */}
          {hasEmail && (
            <div className="flex items-center gap-2 group/email">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${hasVerifiedEmail ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-100 text-surface-500'}`}>
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-surface-700 dark:text-surface-300 truncate font-medium">
                    {primaryEmail}
                  </span>
                  {hasVerifiedEmail && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Verified email" />
                  )}
                </div>
                {lead.bestEmailScore > 0 && (
                  <span className="text-2xs text-surface-400">
                    Quality: {lead.bestEmailScore}/100
                  </span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy('email', primaryEmail); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-surface-100 text-surface-400 hover:text-surface-600"
                title="Copy email"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Phone */}
          {lead.phone && (
            <div className="flex items-center gap-2 group/phone">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm text-surface-700 dark:text-surface-300 font-medium">
                {lead.phone}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy('phone', lead.phone); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-surface-100 text-surface-400 hover:text-surface-600"
                title="Copy phone"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Website */}
          {lead.website && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-accent-600 hover:text-accent-700 hover:underline truncate flex items-center gap-1"
              >
                {getWebsiteDomain(lead.website)}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            </div>
          )}

          {/* Address */}
          {lead.address && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm text-surface-600 dark:text-surface-400 truncate">
                {lead.address}
              </span>
            </div>
          )}
        </div>

        {/* Rating & Reviews */}
        {lead.rating && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold text-surface-700">{lead.rating}</span>
              <span className="text-xs text-surface-500">({lead.reviewCount || 0})</span>
            </div>
            {lead.enrichmentStatus === 'enriched' && (
              <span className="text-2xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Enriched
              </span>
            )}
          </div>
        )}

        {/* Outreach Preview */}
        {lead.outreachSubject && (
          <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3 border border-surface-100 dark:border-surface-600">
            <p className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">
              Suggested Outreach:
            </p>
            <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-2">
              {lead.outreachSubject}
            </p>
          </div>
        )}

        {/* Footer: Status selector + Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-700">
          <select
            value={lead.contactStatus}
            onChange={handleStatusChange}
            onClick={(e) => e.stopPropagation()}
            className={`text-xs font-semibold rounded-lg px-3 py-1.5 border-0 ring-1 ring-inset cursor-pointer hover:ring-2 transition-all ${status.bg} ${status.ring || 'ring-transparent'}`}
          >
            {Object.entries(STATUS_STYLES).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>
          
          <span className="text-2xs text-surface-400">
            {lead.servicesOffered?.length > 0 && `${lead.servicesOffered.length} services detected`}
          </span>
        </div>
      </div>

      {/* Hover overlay hint */}
      <div className={`absolute inset-0 bg-accent-500/5 pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}
