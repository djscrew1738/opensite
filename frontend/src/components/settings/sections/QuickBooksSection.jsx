/**
 * QuickBooks Section
 * Accounting software integration and synchronization
 */

import { useState, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, ExternalLink, Link2, Unlink, CheckCircle2, 
  AlertCircle, Loader2, Key, Globe, ArrowRightLeft,
  ShieldCheck, RefreshCw, Save
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { api } from '../../../api/client';
import { Section, SettingsRow, Toggle, KeyInput, StatusPill } from '../primitives';
import { ConfirmDialog } from '../../shared';

export default memo(function QuickBooksSection() {
  const { settings, showToast } = useSettings();
  const [clientId, setClientId] = useState(settings?.qbo_client_id || '');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState(settings?.qbo_redirect_uri || (window.location.origin + '/api/quickbooks/callback'));
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Fetch QBO status
  const { data: qboStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['qbo-status'],
    queryFn: () => api.get('/quickbooks/status').catch(() => ({ connected: false })),
    retry: 1
  });

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await api.settings.update({
        qbo_client_id: clientId,
        qbo_client_secret: clientSecret,
        qbo_redirect_uri: redirectUri
      });
      setClientSecret('');
      showToast('QuickBooks configuration saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { url } = await api.get('/quickbooks/auth');
      window.location.href = url;
    } catch (err) {
      showToast(`Auth error: ${err.message}`, 'error');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.delete('/quickbooks/account');
      refetchStatus();
      showToast('QuickBooks disconnected');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      setShowDisconnectConfirm(false);
    }
  };

  return (
    <div className="space-y-6 page-transition-wrapper">
      <Section 
        icon={CreditCard} 
        title="QuickBooks Online"
        badge={<StatusPill connected={qboStatus?.connected} label={qboStatus?.connected ? 'Connected' : 'Disconnected'} loading={statusLoading} />}
        description="Synchronize estimates, customers, and invoices with your accounting workflow"
      >
        <div className="space-y-6 mt-4">
          {/* Connection Card */}
          <div className="p-6 rounded-2xl bg-surface-elevated border border-border-default flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                qboStatus?.connected 
                  ? 'bg-success-muted text-success-light border-success-border' 
                  : 'bg-surface-card text-text-muted border-border-muted'
              }`}>
                <RefreshCw className={`w-6 h-6 ${qboStatus?.connected ? 'animate-spin-slow' : ''}`} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary tracking-tight">
                  {qboStatus?.connected ? `Linked to ${qboStatus.companyName}` : 'Accounting Integration'}
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  {qboStatus?.connected 
                    ? 'Automated synchronization is currently active' 
                    : 'Awaiting OAuth authorization from Intuit'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {qboStatus?.connected ? (
                <button 
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="btn-secondary h-10 px-5 text-xs font-semibold uppercase tracking-widest text-danger-light border-danger-border"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </button>
              ) : (
                <button 
                  onClick={handleConnect}
                  disabled={!clientId || isConnecting}
                  className="btn-primary h-10 px-6 text-xs font-semibold uppercase tracking-widest shadow-lg shadow-accent-blue/20"
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                  Authorize Connection
                </button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Credentials */}
            <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-accent-blue" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary">OAuth Credentials</h3>
              </div>

              <KeyInput 
                label="Client ID" 
                value={clientId} 
                onChange={setClientId} 
                show={true}
                placeholder="Enter QBO Client ID"
                onSave={handleSaveConfig}
                saving={isSaving}
              />

              <div className="border-t border-border-muted pt-5">
                <KeyInput 
                  label="Client Secret" 
                  value={clientSecret} 
                  onChange={setClientSecret} 
                  show={showSecret}
                  onToggleShow={() => setShowSecret(!showSecret)}
                  placeholder={settings?.qbo_client_id ? "••••••••••••••••" : "Enter QBO Client Secret"}
                  onSave={handleSaveConfig}
                  saving={isSaving}
                />
              </div>

              <div className="border-t border-border-muted pt-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Redirect URI</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
                    <input 
                      type="text" 
                      value={redirectUri} 
                      onChange={e => setRedirectUri(e.target.value)} 
                      className="input pl-10 h-11 font-mono text-xs tracking-tight" 
                    />
                  </div>
                  <p className="text-xs text-text-muted italic px-1 mt-1">Must match the URI in your Intuit Developer portal.</p>
                </div>
              </div>
            </div>

            {/* Sync Preferences */}
            <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-1">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft className="w-4 h-4 text-warning-DEFAULT" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary">Sync Preferences</h3>
              </div>

              <SettingsRow 
                label="Auto-create Customers" 
                description="Automatically add new leads to QuickBooks"
              >
                <Toggle enabled={true} onChange={() => {}} />
              </SettingsRow>

              <SettingsRow 
                label="Real-time Invoicing" 
                description="Generate draft invoices when jobs are completed"
              >
                <Toggle enabled={false} onChange={() => {}} />
              </SettingsRow>

              <div className="mt-6 p-4 rounded-xl bg-amber-muted/10 border border-warning-border/20">
                <div className="flex gap-3">
                  <AlertCircle className="w-4 h-4 text-warning-DEFAULT shrink-0" />
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    <strong className="text-warning-DEFAULT">Sandbox Mode</strong> is active. All synchronization operations will target your Intuit developer sandbox company for testing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Disconnect Confirmation */}
      {showDisconnectConfirm && (
        <ConfirmDialog
          title="Sever QuickBooks Connection?"
          message="This will immediately revoke all access tokens and disable automated synchronization. Historical data will remain in QuickBooks but no new updates will be pushed."
          confirmLabel="Disconnect Now"
          onConfirm={handleDisconnect}
          onCancel={() => setShowDisconnectConfirm(false)}
          variant="danger"
        />
      )}
    </div>
  );
});
