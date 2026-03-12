import { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { 
  X, Mail, Phone, Globe, MapPin, Star, Copy, Check, ExternalLink, 
  Shield, Sparkles, CheckCircle2 
} from 'lucide-react';
import { colors, shadows, radius } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Record<string, { label: string; backgroundColor: string; color: string; borderColor: string; icon: string }>} */
const STATUS_CONFIG = {
  new: { 
    label: 'New', 
    backgroundColor: colors.info.muted, 
    color: colors.info.DEFAULT, 
    borderColor: colors.info.border,
    icon: '●' 
  },
  contacted: { 
    label: 'Contacted', 
    backgroundColor: colors.warning.muted, 
    color: colors.warning.DEFAULT, 
    borderColor: colors.warning.border,
    icon: '✉' 
  },
  responded: { 
    label: 'Responded', 
    backgroundColor: colors.success.muted, 
    color: colors.success.DEFAULT, 
    borderColor: colors.success.border,
    icon: '↩' 
  },
  converted: { 
    label: 'Converted', 
    backgroundColor: colors.accent.muted, 
    color: colors.accent.purple, 
    borderColor: 'rgba(139, 92, 246, 0.2)',
    icon: '✓' 
  },
  dismissed: { 
    label: 'Dismissed', 
    backgroundColor: colors.surface.elevated, 
    color: colors.text.muted, 
    borderColor: colors.border.default,
    icon: '✕' 
  },
};

/** @type {Record<string, { gradient: string; backgroundColor: string; color: string; label: string }>} */
const TIER_CONFIG = {
  hot: { 
    gradient: 'linear-gradient(90deg, #EF4444, #F97316)', 
    backgroundColor: colors.danger.muted, 
    color: colors.danger.DEFAULT, 
    label: 'Hot Lead' 
  },
  warm: { 
    gradient: 'linear-gradient(90deg, #F97316, #FBBF24)', 
    backgroundColor: colors.warning.muted, 
    color: colors.warning.DEFAULT, 
    label: 'Warm Lead' 
  },
  cold: { 
    gradient: 'linear-gradient(90deg, #64748B, #94A3B8)', 
    backgroundColor: colors.surface.elevated, 
    color: colors.text.secondary, 
    label: 'Cold Lead' 
  },
};

// ═══════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} Lead
 * @property {string} id - Lead identifier
 * @property {string} businessName - Business name
 * @property {number} icpScore - ICP score (0-100)
 * @property {string} icpTier - Tier classification (hot/warm/cold)
 * @property {string} [icpReasoning] - AI reasoning for score
 * @property {string} [enrichmentStatus] - Enrichment status
 * @property {string} [category] - Business category
 * @property {number} [plumbingRelevance] - Plumbing relevance score (0-1)
 * @property {string[]} [emails] - List of emails
 * @property {string} [bestEmail] - Best verified email
 * @property {number} [bestEmailScore] - Email verification score
 * @property {string} [emailVerificationStatus] - Email verification status
 * @property {Array<{email: string; score: number}>} [verifiedEmails] - Verified emails with scores
 * @property {string} [phone] - Phone number
 * @property {string} [website] - Website URL
 * @property {string} [address] - Physical address
 * @property {number} [rating] - Business rating
 * @property {number} [reviewCount] - Number of reviews
 * @property {string} [contactStatus] - Current contact status
 * @property {string} [aboutSummary] - Business description
 * @property {string[]} [servicesOffered] - List of services
 * @property {string} [outreachSubject] - Generated outreach subject
 * @property {string} [outreachBody] - Generated outreach body
 */

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook for clipboard copy functionality
 * @returns {{ copiedField: string | null; copy: (text: string, field: string) => void }}
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
 * @param {Object} props
 * @param {() => void} props.onClose - Close handler
 * @param {React.ReactNode} props.children - Child elements
 */
const ModalOverlay = memo(function ModalOverlay({ onClose, children }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
      style={{ backgroundColor: colors.surface.overlay }}
      onClick={onClose}
      role="presentation"
      aria-label="Modal overlay"
    >
      {children}
    </div>
  );
});

ModalOverlay.displayName = 'ModalOverlay';

ModalOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

/**
 * Modal content container
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements
 * @param {(e: React.MouseEvent) => void} props.onClick - Click handler
 */
const ModalContent = memo(function ModalContent({ children, onClick }) {
  return (
    <div
      className="animate-slide-up overflow-hidden"
      style={{ 
        backgroundColor: colors.surface.card,
        borderRadius: radius.xl,
        boxShadow: shadows.card,
        border: `1px solid ${colors.border.default}`,
        maxWidth: '48rem',
        width: '100%',
        maxHeight: '90vh'
      }}
      onClick={onClick}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
});

ModalContent.displayName = 'ModalContent';

ModalContent.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
};

/**
 * Modal header with gradient bar
 * @param {Object} props
 * @param {Lead} props.lead - Lead data
 * @param {Object} props.tier - Tier configuration
 * @param {() => void} props.onClose - Close handler
 */
const ModalHeader = memo(function ModalHeader({ 
  lead, 
  tier, 
  onClose 
}) {
  return (
    <>
      <div 
        className="h-2" 
        style={{ background: tier.gradient }}
        aria-hidden="true"
      />
      <div 
        className="sticky top-0 px-6 py-4 flex items-start justify-between"
        style={{ 
          backgroundColor: colors.surface.card,
          borderBottom: `1px solid ${colors.border.default}`
        }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 
              className="text-xl font-bold truncate"
              style={{ color: colors.text.primary }}
            >
              {lead.businessName}
            </h2>
            {lead.enrichmentStatus === 'enriched' && (
              <span 
                className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium"
                style={{ 
                  backgroundColor: colors.success.muted, 
                  color: colors.success.DEFAULT 
                }}
              >
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                Enriched
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ring-1"
              style={{ 
                backgroundColor: tier.backgroundColor, 
                color: tier.color,
                borderColor: tier.backgroundColor
              }}
            >
              <span className="font-mono">{lead.icpScore}</span>
              <span className="text-xs opacity-80">{tier.label}</span>
            </span>
            
            {lead.category && (
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  color: colors.text.secondary, 
                  backgroundColor: colors.surface.elevated 
                }}
              >
                {lead.category}
              </span>
            )}
            
            {lead.plumbingRelevance > 0 && (
              <span style={{ color: colors.text.secondary, fontSize: '0.75rem' }}>
                {Math.round(lead.plumbingRelevance * 100)}% plumbing match
              </span>
            )}
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="shrink-0 p-2 rounded-lg transition-colors"
          style={{ color: colors.text.muted }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface.elevated}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </>
  );
});

ModalHeader.displayName = 'ModalHeader';

ModalHeader.propTypes = {
  lead: PropTypes.object.isRequired,
  tier: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

/**
 * Quick action buttons (Email, Phone, Website)
 * @param {Object} props
 * @param {Lead} props.lead - Lead data
 */
const QuickActions = memo(function QuickActions({ lead }) {
  const hasEmail = lead.emails?.length > 0 || lead.bestEmail;

  return (
    <div className="flex flex-wrap gap-2">
      {hasEmail && (
        <a
          href={`mailto:${lead.bestEmail || lead.emails[0]}`}
          className="btn-primary text-sm gap-2"
          style={{ 
            backgroundColor: colors.accent.DEFAULT,
            color: colors.text.inverse,
            borderRadius: radius.btn
          }}
          aria-label="Send email"
        >
          <Mail className="w-4 h-4" aria-hidden="true" />
          Send Email
        </a>
      )}
      {lead.phone && (
        <a
          href={`tel:${lead.phone}`}
          className="btn-secondary text-sm gap-2"
          style={{ 
            backgroundColor: colors.surface.elevated,
            color: colors.text.primary,
            borderRadius: radius.btn
          }}
          aria-label="Call phone number"
        >
          <Phone className="w-4 h-4" aria-hidden="true" />
          Call
        </a>
      )}
      {lead.website && (
        <a
          href={lead.website}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm gap-2"
          style={{ 
            backgroundColor: colors.surface.elevated,
            color: colors.text.primary,
            borderRadius: radius.btn
          }}
          aria-label="Visit website"
        >
          <Globe className="w-4 h-4" aria-hidden="true" />
          Visit Website
        </a>
      )}
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

QuickActions.propTypes = {
  lead: PropTypes.object.isRequired,
};

/**
 * Info card for contact details
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icon component
 * @param {string} props.iconColor - Icon color
 * @param {string} props.label - Card label
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} [props.verifiedBadge] - Verified badge
 */
const InfoCard = memo(function InfoCard({ 
  icon: Icon, 
  iconColor,
  label, 
  children,
  verifiedBadge = null,
}) {
  return (
    <div 
      className="rounded-xl p-4"
      style={{ backgroundColor: colors.surface.elevated }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: iconColor }} aria-hidden="true" />
        <span 
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: colors.text.muted }}
        >
          {label}
        </span>
        {verifiedBadge}
      </div>
      {children}
    </div>
  );
});

InfoCard.displayName = 'InfoCard';

InfoCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  iconColor: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  verifiedBadge: PropTypes.node,
};

InfoCard.defaultProps = {
  verifiedBadge: null,
};

/**
 * Email list with copy buttons
 * @param {Object} props
 * @param {Array<string | {email: string; score: number}>} props.emails - Email list
 * @param {Array<{email: string; score: number}>} [props.verifiedEmails] - Verified emails
 * @param {string | null} props.copiedField - Currently copied field
 * @param {(text: string, field: string) => void} props.onCopy - Copy handler
 */
const EmailList = memo(function EmailList({ 
  emails, 
  verifiedEmails, 
  copiedField, 
  onCopy 
}) {
  const displayEmails = verifiedEmails || emails;

  const getScoreStyle = (score) => {
    if (score >= 80) return { backgroundColor: colors.success.muted, color: colors.success.DEFAULT };
    if (score >= 50) return { backgroundColor: colors.warning.muted, color: colors.warning.DEFAULT };
    return { backgroundColor: colors.surface.elevated, color: colors.text.muted };
  };

  return (
    <div className="space-y-2">
      {displayEmails.slice(0, 3).map((email, i) => {
        const emailStr = typeof email === 'string' ? email : email.email;
        const score = typeof email === 'object' ? email.score : null;
        
        return (
          <div key={i} className="flex items-center gap-2 group">
            <a 
              href={`mailto:${emailStr}`} 
              className="text-sm hover:underline truncate flex-1"
              style={{ color: colors.accent.DEFAULT }}
            >
              {emailStr}
            </a>
            {score !== null && (
              <span 
                className="text-2xs px-1.5 py-0.5 rounded"
                style={getScoreStyle(score)}
              >
                {score}
              </span>
            )}
            <button 
              onClick={() => onCopy(emailStr, `email-${i}`)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
              style={{ backgroundColor: colors.surface.elevated }}
              aria-label={`Copy email ${emailStr}`}
            >
              {copiedField === `email-${i}` ? (
                <Check className="w-3.5 h-3.5" style={{ color: colors.success.DEFAULT }} aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" style={{ color: colors.text.muted }} aria-hidden="true" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
});

EmailList.displayName = 'EmailList';

EmailList.propTypes = {
  emails: PropTypes.array.isRequired,
  verifiedEmails: PropTypes.array,
  copiedField: PropTypes.string,
  onCopy: PropTypes.func.isRequired,
};

EmailList.defaultProps = {
  verifiedEmails: null,
  copiedField: null,
};

/**
 * Contact info grid section
 * @param {Object} props
 * @param {Lead} props.lead - Lead data
 * @param {string | null} props.copiedField - Currently copied field
 * @param {(text: string, field: string) => void} props.onCopy - Copy handler
 */
const ContactInfoGrid = memo(function ContactInfoGrid({ 
  lead, 
  copiedField, 
  onCopy 
}) {
  const hasEmail = lead.emails?.length > 0 || lead.bestEmail;
  const hasVerifiedEmail = lead.emailVerificationStatus === 'verified' && lead.bestEmailScore >= 80;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Contact information">
      {hasEmail && (
        <InfoCard 
          icon={Mail} 
          iconColor={colors.text.muted}
          label="Email"
          verifiedBadge={hasVerifiedEmail && (
            <span 
              className="ml-auto inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full"
              style={{ color: colors.success.DEFAULT, backgroundColor: colors.success.muted }}
            >
              <Shield className="w-3 h-3" aria-hidden="true" />
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
        <InfoCard icon={Phone} iconColor={colors.text.muted} label="Phone">
          <div className="flex items-center gap-2">
            <a 
              href={`tel:${lead.phone}`} 
              className="text-sm font-medium"
              style={{ color: colors.text.primary }}
            >
              {lead.phone}
            </a>
            <button 
              onClick={() => onCopy(lead.phone, 'phone')}
              className="p-1 rounded"
              style={{ backgroundColor: colors.surface.elevated }}
              aria-label="Copy phone number"
            >
              {copiedField === 'phone' ? (
                <Check className="w-3.5 h-3.5" style={{ color: colors.success.DEFAULT }} aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" style={{ color: colors.text.muted }} aria-hidden="true" />
              )}
            </button>
          </div>
        </InfoCard>
      )}

      {lead.website && (
        <InfoCard icon={Globe} iconColor={colors.text.muted} label="Website">
          <a 
            href={lead.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm hover:underline flex items-center gap-1"
            style={{ color: colors.accent.DEFAULT }}
            aria-label="Open website in new tab"
          >
            {lead.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </InfoCard>
      )}

      {lead.address && (
        <InfoCard icon={MapPin} iconColor={colors.text.muted} label="Address">
          <p className="text-sm" style={{ color: colors.text.primary }}>
            {lead.address}
          </p>
        </InfoCard>
      )}

      {lead.rating && (
        <InfoCard icon={Star} iconColor={colors.warning.DEFAULT} label="Rating">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: colors.text.primary }}>{lead.rating}</span>
            <span className="text-sm" style={{ color: colors.text.secondary }}>/ 5</span>
            <span className="text-sm" style={{ color: colors.text.muted }}>({lead.reviewCount || 0} reviews)</span>
          </div>
        </InfoCard>
      )}
    </section>
  );
});

ContactInfoGrid.displayName = 'ContactInfoGrid';

ContactInfoGrid.propTypes = {
  lead: PropTypes.object.isRequired,
  copiedField: PropTypes.string,
  onCopy: PropTypes.func.isRequired,
};

ContactInfoGrid.defaultProps = {
  copiedField: null,
};

/**
 * AI Analysis section
 * @param {Object} props
 * @param {string} [props.reasoning] - AI reasoning text
 */
const AIAnalysisSection = memo(function AIAnalysisSection({ reasoning }) {
  if (!reasoning) return null;

  return (
    <section 
      className="rounded-xl p-4 border"
      style={{ 
        background: `linear-gradient(135deg, ${colors.accent.muted}, rgba(139, 92, 246, 0.08))`,
        borderColor: colors.accent.muted
      }}
      aria-label="AI Analysis"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4" style={{ color: colors.accent.purple }} aria-hidden="true" />
        <span 
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: colors.accent.purple }}
        >
          AI Analysis
        </span>
      </div>
      <p className="text-sm" style={{ color: colors.text.primary }}>
        {reasoning}
      </p>
    </section>
  );
});

AIAnalysisSection.displayName = 'AIAnalysisSection';

AIAnalysisSection.propTypes = {
  reasoning: PropTypes.string,
};

AIAnalysisSection.defaultProps = {
  reasoning: null,
};

/**
 * About and Services section
 * @param {Object} props
 * @param {string} [props.aboutSummary] - About text
 * @param {string[]} [props.servicesOffered] - Services list
 */
const AboutServicesSection = memo(function AboutServicesSection({ 
  aboutSummary, 
  servicesOffered 
}) {
  if (!aboutSummary && !servicesOffered?.length) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="About and services">
      {aboutSummary && (
        <div>
          <h3 
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: colors.text.muted }}
          >
            About
          </h3>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: colors.text.primary }}
          >
            {aboutSummary}
          </p>
        </div>
      )}
      
      {servicesOffered?.length > 0 && (
        <div>
          <h3 
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: colors.text.muted }}
          >
            Services Detected
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {servicesOffered.map((svc, i) => (
              <span 
                key={i} 
                className="text-xs font-medium px-2.5 py-1 rounded-lg"
                style={{ 
                  backgroundColor: colors.surface.elevated,
                  color: colors.text.primary
                }}
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

AboutServicesSection.displayName = 'AboutServicesSection';

AboutServicesSection.propTypes = {
  aboutSummary: PropTypes.string,
  servicesOffered: PropTypes.arrayOf(PropTypes.string),
};

AboutServicesSection.defaultProps = {
  aboutSummary: null,
  servicesOffered: null,
};

/**
 * Outreach email section
 * @param {Object} props
 * @param {string} [props.subject] - Email subject
 * @param {string} [props.body] - Email body
 * @param {string | null} props.copied - Currently copied field
 * @param {(text: string, field: string) => void} props.onCopy - Copy handler
 */
const OutreachSection = memo(function OutreachSection({ 
  subject, 
  body, 
  copied, 
  onCopy 
}) {
  if (!subject) return null;

  return (
    <section 
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: colors.border.default }}
      aria-label="Generated outreach email"
    >
      <div 
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ 
          backgroundColor: colors.surface.elevated,
          borderColor: colors.border.default
        }}
      >
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" style={{ color: colors.text.muted }} aria-hidden="true" />
          <span 
            className="text-sm font-bold"
            style={{ color: colors.text.primary }}
          >
            Generated Outreach
          </span>
        </div>
        <button
          onClick={() => onCopy(`Subject: ${subject}\n\n${body}`, 'outreach')}
          className="text-xs font-medium flex items-center gap-1 transition-colors"
          style={{ color: colors.accent.DEFAULT }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.hover}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
          aria-label="Copy outreach email"
        >
          {copied === 'outreach' ? (
            <><Check className="w-3.5 h-3.5" aria-hidden="true" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copy</>
          )}
        </button>
      </div>
      <div className="p-4 space-y-3" style={{ backgroundColor: colors.surface.card }}>
        <div>
          <span 
            className="text-xs font-semibold"
            style={{ color: colors.text.muted }}
          >
            Subject:
          </span>
          <p 
            className="text-sm font-medium mt-0.5"
            style={{ color: colors.text.primary }}
          >
            {subject}
          </p>
        </div>
        <div 
          className="border-t pt-3"
          style={{ borderColor: colors.border.muted }}
        >
          <span 
            className="text-xs font-semibold"
            style={{ color: colors.text.muted }}
          >
            Body:
          </span>
          <p 
            className="text-sm mt-1 whitespace-pre-wrap leading-relaxed"
            style={{ color: colors.text.primary }}
          >
            {body}
          </p>
        </div>
      </div>
    </section>
  );
});

OutreachSection.displayName = 'OutreachSection';

OutreachSection.propTypes = {
  subject: PropTypes.string,
  body: PropTypes.string,
  copied: PropTypes.string,
  onCopy: PropTypes.func.isRequired,
};

OutreachSection.defaultProps = {
  subject: null,
  body: null,
  copied: null,
};

/**
 * Status update buttons
 * @param {Object} props
 * @param {string} props.currentStatus - Current status
 * @param {(status: string) => void} props.onUpdate - Status update handler
 */
const StatusSelector = memo(function StatusSelector({ currentStatus, onUpdate }) {
  const getButtonStyle = (value, config) => {
    const isActive = currentStatus === value;
    if (isActive) {
      return {
        backgroundColor: config.backgroundColor,
        color: config.color,
        borderColor: 'transparent',
        boxShadow: shadows.card,
      };
    }
    return {
      backgroundColor: colors.surface.card,
      color: colors.text.secondary,
      borderColor: colors.border.default,
    };
  };

  return (
    <section aria-label="Update lead status">
      <h3 
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: colors.text.muted }}
      >
        Update Status
      </h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
          <button
            key={value}
            onClick={() => onUpdate(value)}
            className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all"
            style={getButtonStyle(value, config)}
            onMouseEnter={(e) => {
              if (currentStatus !== value) {
                e.currentTarget.style.borderColor = colors.border.strong;
              }
            }}
            onMouseLeave={(e) => {
              if (currentStatus !== value) {
                e.currentTarget.style.borderColor = colors.border.default;
              }
            }}
            aria-pressed={currentStatus === value}
            aria-label={`Set status to ${config.label}`}
          >
            <span className="mr-1.5">{config.icon}</span>
            {config.label}
          </button>
        ))}
      </div>
    </section>
  );
});

StatusSelector.displayName = 'StatusSelector';

StatusSelector.propTypes = {
  currentStatus: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DiscoveryLeadDetail - Modal component for displaying lead details
 * @param {Object} props
 * @param {Lead | null} props.lead - Lead data to display
 * @param {() => void} props.onClose - Close handler
 * @param {(id: string, status: string) => void} [props.onStatusUpdate] - Status update handler
 */
function DiscoveryLeadDetail({ lead, onClose, onStatusUpdate }) {
  const { copiedField, copy } = useClipboard();
  const tier = lead ? TIER_CONFIG[lead.icpTier] || TIER_CONFIG.cold : null;

  const handleStatusUpdate = useCallback((status) => {
    onStatusUpdate?.(lead?.id, status);
  }, [lead?.id, onStatusUpdate]);

  const handleModalContentClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!lead) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalContent onClick={handleModalContentClick}>
        <ModalHeader lead={lead} tier={tier} onClose={onClose} />

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
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

DiscoveryLeadDetail.displayName = 'DiscoveryLeadDetail';

DiscoveryLeadDetail.propTypes = {
  lead: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onStatusUpdate: PropTypes.func,
};

DiscoveryLeadDetail.defaultProps = {
  lead: null,
  onStatusUpdate: null,
};

export default DiscoveryLeadDetail;
