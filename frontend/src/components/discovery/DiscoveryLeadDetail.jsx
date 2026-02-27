import { useState, useCallback, memo } from 'react';
import { 
  X, Mail, Phone, Globe, MapPin, Star, Copy, Check, ExternalLink, 
  Shield, Sparkles, CheckCircle2 
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-50 text-blue-700 ring-blue-200', icon: '●' },
  contacted: { label: 'Contacted', color: 'bg-amber-50 text-amber-700 ring-amber-200', icon: '✉' },
  responded: { label: 'Responded', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: '↩' },
  converted: { label: 'Converted', color: 'bg-purple-50 text-purple-700 ring-purple-200', icon: '✓' },
  dismissed: { label: 'Dismissed', color: 'bg-gray-100 text-gray-500', icon: '✕' },
};

const TIER_CONFIG = {
  hot: { gradient: 'from-red-500 to-orange-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Hot Lead' },
  warm: { gradient: 'from-orange-400 to-amber-400', bg: 'bg-orange-50', text: 'text-orange-700', label: 'Warm Lead' },
  cold: { gradient: 'from-slate-400 to-gray-400', bg: 'bg-slate-50', text: 'text-slate-600', label: 'Cold Lead' },
};

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook for clipboard copy functionality
 */
function useClipboard() {
  const [copiedField, setCopiedField] = useState(null);

  const copy = useCallback((text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  return { copiedField, copy };
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Modal overlay with click-to-close
 */
const ModalOverlay = memo(function ModalOverlay({ onClose, children }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
      onClick={onClose}
    >
      {children}
    </div>
  );
});

/**
 * Modal content container
 */
const ModalContent = memo(function ModalContent({ children, onClick }) {
  return (
    <div
      className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-surface-200 dark:border-surface-700 animate-slide-up"
      onClick={onClick}
    >
      {children}
    </div>
  );
});

/**
 * Modal header with gradient bar
 */
const ModalHeader = memo(function ModalHeader({ 
  lead, 
  tier, 
  onClose 
}) {
  return (
    <>
      <div className={`h-2 bg-gradient-to-r ${tier.gradient}`} />
      <div className="sticky top-0 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-6 py-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-display font-bold text-surface-900 dark:text-surface-100 truncate">
              {lead.businessName}
            </h2>
            {lead.enrichmentStatus === 'enriched' && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium bg-emerald-50 text-emerald-700">
                <Sparkles className="w-3 h-3" />
                Enriched
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ring-1 ${tier.bg} ${tier.text} ring-opacity-50`}>
              <span className="font-mono">{lead.icpScore}</span>
              <span className="text-xs opacity-80">{tier.label}</span>
            </span>
            
            {lead.category && (
              <span className="text-xs text-surface-500 bg-surface-100 px-2 py-1 rounded-full">
                {lead.category}
              </span>
            )}
            
            {lead.plumbingRelevance > 0 && (
              <span className="text-xs text-surface-500">
                {Math.round(lead.plumbingRelevance * 100)}% plumbing match
              </span>
            )}
          </div>
        </div>
        
        <button 
          onClick={onClose} 
          className="shrink-0 p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </>
  );
});

/**
 * Quick action buttons (Email, Phone, Website)
 */
const QuickActions = memo(function QuickActions({ lead }) {
  const hasEmail = lead.emails?.length > 0 || lead.bestEmail;

  return (
    <div className="flex flex-wrap gap-2">
      {hasEmail && (
        <a
          href={`mailto:${lead.bestEmail || lead.emails[0]}`}
          className="btn-primary text-sm gap-2"
        >
          <Mail className="w-4 h-4" />
          Send Email
        </a>
      )}
      {lead.phone && (
        <a
          href={`tel:${lead.phone}`}
          className="btn-secondary text-sm gap-2"
        >
          <Phone className="w-4 h-4" />
          Call
        </a>
      )}
      {lead.website && (
        <a
          href={lead.website}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm gap-2"
        >
          <Globe className="w-4 h-4" />
          Visit Website
        </a>
      )}
    </div>
  );
});

/**
 * Info card for contact details
 */
const InfoCard = memo(function InfoCard({ 
  icon: Icon, 
  iconColor,
  label, 
  children,
  verifiedBadge = null,
}) {
  return (
    <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
          {label}
        </span>
        {verifiedBadge}
      </div>
      {children}
    </div>
  );
});

/**
 * Email list with copy buttons
 */
const EmailList = memo(function EmailList({ 
  emails, 
  verifiedEmails, 
  copiedField, 
  onCopy 
}) {
  const displayEmails = verifiedEmails || emails;

  return (
    <div className="space-y-2">
      {displayEmails.slice(0, 3).map((email, i) => {
        const emailStr = typeof email === 'string' ? email : email.email;
        const score = typeof email === 'object' ? email.score : null;
        
        return (
          <div key={i} className="flex items-center gap-2 group">
            <a href={`mailto:${emailStr}`} className="text-sm text-accent-600 hover:underline truncate flex-1">
              {emailStr}
            </a>
            {score !== null && (
              <span className={`text-2xs px-1.5 py-0.5 rounded ${
                score >= 80 ? 'bg-emerald-50 text-emerald-600' : 
                score >= 50 ? 'bg-amber-50 text-amber-600' : 
                'bg-surface-100 text-surface-500'
              }`}>
                {score}
              </span>
            )}
            <button 
              onClick={() => onCopy(emailStr, `email-${i}`)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-200"
            >
              {copiedField === `email-${i}` ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-surface-400" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
});

/**
 * Contact info grid section
 */
const ContactInfoGrid = memo(function ContactInfoGrid({ 
  lead, 
  copiedField, 
  onCopy 
}) {
  const hasEmail = lead.emails?.length > 0 || lead.bestEmail;
  const hasVerifiedEmail = lead.emailVerificationStatus === 'verified' && lead.bestEmailScore >= 80;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hasEmail && (
        <InfoCard 
          icon={Mail} 
          iconColor="text-surface-400"
          label="Email"
          verifiedBadge={hasVerifiedEmail && (
            <span className="ml-auto inline-flex items-center gap-1 text-2xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" />
              Verified {lead.bestEmailScore && `(${lead.bestEmailScore}/100)`}
            </span>
          )}
        >
          <EmailList 
            emails={lead.emails}
            verifiedEmails={lead.verifiedEmails}
            copiedField={copiedField}
            onCopy={onCopy}
          />
        </InfoCard>
      )}

      {lead.phone && (
        <InfoCard icon={Phone} iconColor="text-surface-400" label="Phone">
          <div className="flex items-center gap-2">
            <a href={`tel:${lead.phone}`} className="text-sm text-surface-700 dark:text-surface-300 font-medium">
              {lead.phone}
            </a>
            <button 
              onClick={() => onCopy(lead.phone, 'phone')}
              className="p-1 rounded hover:bg-surface-200"
            >
              {copiedField === 'phone' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-surface-400" />
              )}
            </button>
          </div>
        </InfoCard>
      )}

      {lead.website && (
        <InfoCard icon={Globe} iconColor="text-surface-400" label="Website">
          <a 
            href={lead.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-accent-600 hover:underline flex items-center gap-1"
          >
            {lead.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            <ExternalLink className="w-3 h-3" />
          </a>
        </InfoCard>
      )}

      {lead.address && (
        <InfoCard icon={MapPin} iconColor="text-surface-400" label="Address">
          <p className="text-sm text-surface-700 dark:text-surface-300">
            {lead.address}
          </p>
        </InfoCard>
      )}

      {lead.rating && (
        <InfoCard icon={Star} iconColor="text-yellow-500" label="Rating">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-surface-900">{lead.rating}</span>
            <span className="text-sm text-surface-500">/ 5</span>
            <span className="text-sm text-surface-400">({lead.reviewCount || 0} reviews)</span>
          </div>
        </InfoCard>
      )}
    </section>
  );
});

/**
 * AI Analysis section
 */
const AIAnalysisSection = memo(function AIAnalysisSection({ reasoning }) {
  if (!reasoning) return null;

  return (
    <section className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-xl p-4 border border-violet-100 dark:border-violet-900/30">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <span className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide">
          AI Analysis
        </span>
      </div>
      <p className="text-sm text-surface-700 dark:text-surface-300">
        {reasoning}
      </p>
    </section>
  );
});

/**
 * About and Services section
 */
const AboutServicesSection = memo(function AboutServicesSection({ 
  aboutSummary, 
  servicesOffered 
}) {
  if (!aboutSummary && !servicesOffered?.length) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {aboutSummary && (
        <div>
          <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wide mb-2">
            About
          </h3>
          <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
            {aboutSummary}
          </p>
        </div>
      )}
      
      {servicesOffered?.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wide mb-2">
            Services Detected
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {servicesOffered.map((svc, i) => (
              <span 
                key={i} 
                className="bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-xs font-medium px-2.5 py-1 rounded-lg"
              >
                {svc}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});

/**
 * Outreach email section
 */
const OutreachSection = memo(function OutreachSection({ 
  subject, 
  body, 
  copied, 
  onCopy 
}) {
  if (!subject) return null;

  return (
    <section className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <div className="bg-surface-50 dark:bg-surface-800 px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-surface-400" />
          <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
            Generated Outreach
          </span>
        </div>
        <button
          onClick={() => onCopy(`Subject: ${subject}\n\n${body}`, 'outreach')}
          className="text-xs font-medium text-accent-600 hover:text-accent-700 flex items-center gap-1"
        >
          {copied === 'outreach' ? (
            <><Check className="w-3.5 h-3.5" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy</>
          )}
        </button>
      </div>
      <div className="p-4 space-y-3 bg-white dark:bg-surface-900">
        <div>
          <span className="text-xs font-semibold text-surface-500">Subject:</span>
          <p className="text-sm font-medium text-surface-900 dark:text-surface-100 mt-0.5">
            {subject}
          </p>
        </div>
        <div className="border-t border-surface-100 dark:border-surface-800 pt-3">
          <span className="text-xs font-semibold text-surface-500">Body:</span>
          <p className="text-sm text-surface-700 dark:text-surface-300 mt-1 whitespace-pre-wrap leading-relaxed">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
});

/**
 * Status update buttons
 */
const StatusSelector = memo(function StatusSelector({ currentStatus, onUpdate }) {
  return (
    <section>
      <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wide mb-3">
        Update Status
      </h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
          <button
            key={value}
            onClick={() => onUpdate(value)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
              currentStatus === value
                ? `${config.color} border-transparent shadow-sm`
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-surface-300'
            }`}
          >
            <span className="mr-1.5">{config.icon}</span>
            {config.label}
          </button>
        ))}
      </div>
    </section>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function DiscoveryLeadDetail({ lead, onClose, onStatusUpdate }) {
  const { copiedField, copy } = useClipboard();
  const tier = lead ? TIER_CONFIG[lead.icpTier] || TIER_CONFIG.cold : null;

  const handleStatusUpdate = useCallback((status) => {
    onStatusUpdate?.(lead?.id, status);
  }, [lead?.id, onStatusUpdate]);

  if (!lead) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader lead={lead} tier={tier} onClose={onClose} />

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            <QuickActions lead={lead} />
            
            <ContactInfoGrid 
              lead={lead}
              copiedField={copiedField}
              onCopy={copy}
            />

            <AIAnalysisSection reasoning={lead.icpReasoning} />

            <AboutServicesSection 
              aboutSummary={lead.aboutSummary}
              servicesOffered={lead.servicesOffered}
            />

            <OutreachSection 
              subject={lead.outreachSubject}
              body={lead.outreachBody}
              copied={copiedField}
              onCopy={copy}
            />

            <StatusSelector 
              currentStatus={lead.contactStatus}
              onUpdate={handleStatusUpdate}
            />
          </div>
        </div>
      </ModalContent>
    </ModalOverlay>
  );
}
