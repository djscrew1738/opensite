import { Mail, Phone, Globe, MapPin, Star, ChevronRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const TIER_STYLES = {
  hot: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'badge-hot', label: 'Hot' },
  warm: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'badge-warm', label: 'Warm' },
  cold: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', badge: 'badge-cool', label: 'Cold' },
  unscored: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', badge: '', label: 'Unscored' },
};

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  responded: 'Responded',
  converted: 'Converted',
  dismissed: 'Dismissed',
};

export default function DiscoveryLeadCard({ lead, onViewDetail, onStatusUpdate }) {
  const [copied, setCopied] = useState(false);
  const tier = TIER_STYLES[lead.icpTier] || TIER_STYLES.unscored;

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    const email = lead.emails?.[0];
    if (email) {
      navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    onStatusUpdate(lead.id, e.target.value);
  };

  return (
    <div
      onClick={() => onViewDetail(lead)}
      className={`card card-hover cursor-pointer border-l-4 ${tier.border}`}
    >
      <div className="card-body p-4 space-y-3">
        {/* Header: Name + Score */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-gray-900 dark:text-gray-100 truncate">
              {lead.businessName}
            </h3>
            {lead.category && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.category}</p>
            )}
          </div>
          <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${tier.bg} ${tier.text}`}>
            <span className="font-mono">{lead.icpScore}</span>
            <span>{tier.label}</span>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
          {lead.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{lead.address}</span>
            </div>
          )}
          {lead.emails?.length > 0 && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{lead.emails[0]}</span>
              <button
                onClick={handleCopyEmail}
                className="ml-auto shrink-0 text-gray-400 hover:text-accent-600 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="truncate text-accent-600 hover:underline"
              >
                {lead.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            </div>
          )}
        </div>

        {/* Rating */}
        {lead.rating && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold">{lead.rating}</span>
            <span>({lead.reviewCount || 0} reviews)</span>
          </div>
        )}

        {/* Outreach preview */}
        {lead.outreachSubject && (
          <div className="bg-concrete-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-bold text-gray-700 dark:text-gray-300">Outreach: </span>
            {lead.outreachSubject}
          </div>
        )}

        {/* Footer: Status + Detail arrow */}
        <div className="flex items-center justify-between pt-1 border-t border-concrete-100 dark:border-gray-700">
          <select
            value={lead.contactStatus}
            onChange={handleStatusChange}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-bold bg-transparent dark:text-gray-300 border border-concrete-200 dark:border-gray-600 rounded-md px-2 py-1 focus:ring-1 focus:ring-accent-500"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
