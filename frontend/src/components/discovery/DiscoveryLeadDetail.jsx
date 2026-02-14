import { useState } from 'react';
import { X, Mail, Phone, Globe, MapPin, Star, Copy, Check, ExternalLink } from 'lucide-react';

export default function DiscoveryLeadDetail({ lead, onClose, onStatusUpdate }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!lead) return null;

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const tierColor = {
    hot: 'text-red-600 bg-red-50',
    warm: 'text-orange-600 bg-orange-50',
    cold: 'text-gray-600 bg-gray-50',
  }[lead.icpTier] || 'text-gray-500 bg-gray-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-concrete-200 px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-display font-bold text-gray-900 truncate">
              {lead.businessName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${tierColor}`}>
                Score: {lead.icpScore} ({lead.icpTier})
              </span>
              {lead.category && (
                <span className="text-xs text-gray-500">{lead.category}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="tap-target text-gray-400 hover:text-gray-600 shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Contact Info</h3>
            <div className="space-y-2 text-sm">
              {lead.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">{lead.address}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`tel:${lead.phone}`} className="text-accent-600 hover:underline">{lead.phone}</a>
                  <button onClick={() => handleCopy(lead.phone, 'phone')} className="text-gray-400 hover:text-accent-600">
                    {copiedField === 'phone' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
              {lead.emails?.length > 0 && lead.emails.map((email, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`mailto:${email}`} className="text-accent-600 hover:underline">{email}</a>
                  <button onClick={() => handleCopy(email, `email-${i}`)} className="text-gray-400 hover:text-accent-600">
                    {copiedField === `email-${i}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
              {lead.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline flex items-center gap-1">
                    {lead.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {lead.rating && (
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                  <span className="text-gray-700 font-bold">{lead.rating}</span>
                  <span className="text-gray-500">({lead.reviewCount || 0} reviews)</span>
                </div>
              )}
            </div>
          </section>

          {/* AI Analysis */}
          {lead.icpReasoning && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">AI Analysis</h3>
              <p className="text-sm text-gray-700 bg-concrete-50 rounded-lg p-3">
                {lead.icpReasoning}
              </p>
            </section>
          )}

          {/* About */}
          {lead.aboutSummary && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">About</h3>
              <p className="text-sm text-gray-700">{lead.aboutSummary}</p>
            </section>
          )}

          {/* Services */}
          {lead.servicesOffered?.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Services</h3>
              <div className="flex flex-wrap gap-1.5">
                {lead.servicesOffered.map((svc, i) => (
                  <span key={i} className="bg-concrete-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {svc}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Outreach Email */}
          {lead.outreachSubject && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Generated Outreach</h3>
                <button
                  onClick={() => handleCopy(`Subject: ${lead.outreachSubject}\n\n${lead.outreachBody}`, 'outreach')}
                  className="btn-secondary text-xs px-2 py-1"
                >
                  {copiedField === 'outreach' ? (
                    <><Check className="w-3 h-3 text-green-500" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy Email</>
                  )}
                </button>
              </div>
              <div className="bg-concrete-50 rounded-lg p-4 space-y-2 text-sm">
                <div>
                  <span className="font-bold text-gray-700">Subject: </span>
                  <span className="text-gray-900">{lead.outreachSubject}</span>
                </div>
                <div className="whitespace-pre-wrap text-gray-700 border-t border-concrete-200 pt-2">
                  {lead.outreachBody}
                </div>
              </div>
            </section>
          )}

          {/* Status selector */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Contact Status</h3>
            <div className="flex flex-wrap gap-2">
              {['new', 'contacted', 'responded', 'converted', 'dismissed'].map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusUpdate(lead.id, status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    lead.contactStatus === status
                      ? 'bg-accent-50 border-accent-300 text-accent-700'
                      : 'bg-white border-concrete-200 text-gray-600 hover:border-accent-300'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
