import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, ExternalLink, Link2, Unlink, CheckCircle2, 
  AlertCircle, Loader2, Key, Globe, ArrowRightLeft
} from 'lucide-react';
import { api } from '../../../api/client';
import ConfirmDialog from '../../shared/ConfirmDialog';

export default function SettingsQuickBooks({ settings, showToast, refetchSettings }) {
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState(window.location.origin + '/api/quickbooks/callback');
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Sync state with settings
  useEffect(() => {
    if (settings) {
      setClientId(settings.qbo_client_id || '');
      // Client secret is not usually returned for security, but we show placeholders
      if (settings.qbo_redirect_uri) setRedirectUri(settings.qbo_redirect_uri);
    }
  }, [settings]);

  // Fetch QBO status
  const { data: qboStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['qbo-status'],
    queryFn: () => api.get('/quickbooks/status'),
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
      refetchSettings();
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
    setShowDisconnectConfirm(true);
  };

  const handleConfirmDisconnect = async () => {
    try {
      await api.delete('/quickbooks/account'); // We need to implement this delete route
      refetchStatus();
      showToast('QuickBooks disconnected');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      setShowDisconnectConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="card overflow-hidden">
        <div className={`h-1.5 ${qboStatus?.connected ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-800'}`} />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                qboStatus?.connected 
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              }`}>
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">QuickBooks Online</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {qboStatus?.connected 
                    ? `Connected to ${qboStatus.companyName}` 
                    : 'Sync estimates and invoices to your accounting software'}
                </p>
              </div>
            </div>
            
            {qboStatus?.connected ? (
              <button 
                onClick={handleDisconnect}
                className="btn-outline text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </button>
            ) : (
              <button 
                onClick={handleConnect}
                disabled={!settings?.qbo_client_id || isConnecting}
                className="btn-primary"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                Connect QBO
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Credentials</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Client ID</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  placeholder="Enter QBO Client ID"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Client Secret</label>
              <div className="relative">
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <input
                  type={showSecret ? "text" : "password"}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  placeholder={settings?.qbo_client_id ? "••••••••••••••••" : "Enter QBO Client Secret"}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Redirect URI</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1 italic">
                Must match the Redirect URI in your Intuit Developer portal.
              </p>
            </div>

            <button 
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="w-full btn-primary mt-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Save Credentials
            </button>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <ArrowRightLeft className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Sync Preferences</h4>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Auto-create Customers</p>
                <p className="text-[10px] text-gray-500">Automatically add leads to QBO</p>
              </div>
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Item Mapping</p>
                <p className="text-[10px] text-gray-500">Map local phases to QBO items</p>
              </div>
              <button className="text-[10px] font-bold text-blue-500 hover:underline">Configure</button>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
              <div className="flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                  <strong>Sandbox Mode</strong> is currently active. All sync operations will target your QuickBooks Sandbox company.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation */}
      {showDisconnectConfirm && (
        <ConfirmDialog
          title="Disconnect QuickBooks?"
          message="Are you sure you want to disconnect from QuickBooks? This will remove all access tokens and prevent further synchronization of estimates and invoices."
          confirmLabel="Disconnect"
          onConfirm={handleConfirmDisconnect}
          onCancel={() => setShowDisconnectConfirm(false)}
          variant="danger"
        />
      )}
    </div>
  );
}

// Simple Eye icon for the password toggle
function Eye({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
