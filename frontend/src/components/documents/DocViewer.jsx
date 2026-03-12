import { useState, useMemo, memo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronLeft,
  BookOpen,
  Tags,
  MessageSquare,
  FileText,
  Hash,
  Type,
  BrainCircuit,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { colors, shadows } from '../../styles/tokens';
import { formatFileSize } from '../../hooks/useDocuments';
import { DocumentProvider, useDocument } from '../../contexts/DocumentContext';
import { visionApi } from '../../api/vision';
import DocSummary from './DocSummary';
import DocEntities from './DocEntities';
import DocChat from './DocChat';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/**
 * Sub-tab configuration for document viewer
 * @type {Array<{key: string, label: string, icon: import('lucide-react').LucideIcon}>}
 */
const SUB_TABS = [
  { key: 'summary', label: 'Summary', icon: BookOpen },
  { key: 'entities', label: 'Entities', icon: Tags },
  { key: 'chat', label: 'Chat', icon: MessageSquare },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Model Selector for choosing AI provider/model
 */
const ModelSelector = memo(function ModelSelector() {
  const { selectedModel, setSelectedModel } = useDocument();
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Use general AI models endpoint via visionApi helper or direct fetch
      fetch('/api/ai/models', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      })
        .then(res => res.json())
        .then(res => setModels(res.data?.models || []))
        .catch(err => console.error('Failed to fetch AI models:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const activeModelName = useMemo(() => {
    if (selectedModel === 'auto') return 'Auto-select';
    const found = models.find(m => m.id === selectedModel);
    return found ? found.name : selectedModel;
  }, [selectedModel, models]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded border border-surface-700 hover:border-accent-default transition-colors"
        style={{ color: colors.text.secondary, backgroundColor: colors.surface.elevated }}
      >
        <BrainCircuit size={14} className="text-accent-default" />
        <span className="text-xs font-medium max-w-[80px] truncate">{activeModelName}</span>
        <ChevronDown size={10} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-1 w-56 p-1.5 rounded-lg z-50 flex flex-col gap-0.5 shadow-2xl overflow-hidden"
          style={{ 
            backgroundColor: colors.surface.card,
            border: `1px solid ${colors.border.default}`,
            boxShadow: shadows.cardHover,
          }}
        >
          <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-surface-500 border-b border-surface-700 mb-1">
            Intelligence Model
          </div>

          <button
            onClick={() => { setSelectedModel('auto'); setIsOpen(false); }}
            className={`w-full flex items-center gap-2 p-1.5 rounded text-left text-xs transition-colors ${selectedModel === 'auto' ? 'bg-accent-muted text-accent-default' : 'hover:bg-surface-700 text-surface-300'}`}
          >
            <Sparkles size={12} />
            <span>Auto-select Best</span>
          </button>

          <div className="max-h-48 overflow-y-auto mt-1 pt-1 border-t border-surface-700">
            {isLoading ? (
              <div className="p-2 text-center text-xs text-surface-500">Loading models...</div>
            ) : models.map(model => (
              <button
                key={model.id}
                onClick={() => { setSelectedModel(model.id); setIsOpen(false); }}
                className={`w-full flex flex-col p-1.5 rounded text-left transition-colors ${selectedModel === model.id ? 'bg-accent-muted' : 'hover:bg-surface-700'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-medium ${selectedModel === model.id ? 'text-accent-default' : 'text-white'}`}>
                    {model.name}
                  </span>
                  {model.provider === 'ollama' && (
                    <span className="text-[8px] px-0.5 rounded bg-blue-500/10 text-blue-400">LOCAL</span>
                  )}
                </div>
                <span className="text-[9px] text-surface-500">{model.provider}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ModelSelector.displayName = 'ModelSelector';

/**
 * Document metadata pill displaying an icon and label
 * 
 * @param {Object} props - Component props
 * @param {import('lucide-react').LucideIcon} props.icon - Icon component to display
 * @param {string} props.label - Text label to display
 * @returns {JSX.Element} Metadata pill component
 */
const MetadataPill = memo(function MetadataPill({ icon: Icon, label }) {
  return (
    <span 
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ 
        backgroundColor: colors.surface.elevated,
        color: colors.text.muted 
      }}
    >
      <Icon size={12} />
      {label}
    </span>
  );
});

MetadataPill.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
};

MetadataPill.displayName = 'MetadataPill';

/**
 * Document header with back button and metadata
 * 
 * @param {Object} props - Component props
 * @param {Object} props.document - Document data
 * @param {string} props.document.original_name - Original file name
 * @param {number} [props.document.word_count] - Word count
 * @param {number} [props.document.page_count] - Page count
 * @param {number} [props.document.file_size] - File size in bytes
 * @param {Function} props.onBack - Callback when back button is clicked
 * @returns {JSX.Element} Document header component
 */
const DocumentHeader = memo(function DocumentHeader({ document, onBack }) {
  /**
   * Memoized metadata pills based on document properties
   * @type {Array<{icon: import('lucide-react').LucideIcon, label: string}>}
   */
  const metadataPills = useMemo(() => {
    const pills = [];
    if (document.word_count) {
      pills.push({
        icon: Type,
        label: `${document.word_count.toLocaleString()} words`,
      });
    }
    if (document.page_count) {
      pills.push({
        icon: FileText,
        label: `${document.page_count} ${document.page_count === 1 ? 'page' : 'pages'}`,
      });
    }
    if (document.file_size) {
      pills.push({
        icon: Hash,
        label: formatFileSize(document.file_size),
      });
    }
    return pills;
  }, [document.word_count, document.page_count, document.file_size]);

  /**
   * Handles back button click
   */
  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 border-b"
      style={{ 
        borderColor: colors.border.default,
        backgroundColor: colors.surface.card 
      }}
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors shrink-0 focus:outline-none focus:ring-2"
        style={{ 
          color: colors.text.secondary,
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.surface.elevated;
          e.currentTarget.style.color = colors.text.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.text.secondary;
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent.muted}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
        aria-label="Go back to document list"
        title="Go back"
        type="button"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Document info */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2
            className="text-sm font-semibold truncate"
            style={{ color: colors.text.primary }}
            title={document.original_name}
          >
            {document.original_name}
          </h2>
          <ModelSelector />
        </div>

        {/* Metadata pills */}
        {metadataPills.length > 0 && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {metadataPills.map((pill, i) => (
              <MetadataPill key={i} icon={pill.icon} label={pill.label} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

DocumentHeader.propTypes = {
  document: PropTypes.shape({
    original_name: PropTypes.string.isRequired,
    word_count: PropTypes.number,
    page_count: PropTypes.number,
    file_size: PropTypes.number,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
};

DocumentHeader.displayName = 'DocumentHeader';

/**
 * Sub-tab navigation bar
 * 
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active tab key
 * @param {Function} props.onTabChange - Callback when tab is changed
 * @returns {JSX.Element} Sub-tab bar component
 */
const SubTabBar = memo(function SubTabBar({ activeTab, onTabChange }) {
  /**
   * Handles tab change
   * @param {string} tabKey - Tab key to activate
   */
  const handleTabChange = useCallback((tabKey) => {
    onTabChange(tabKey);
  }, [onTabChange]);

  return (
    <div 
      className="flex border-b"
      style={{ 
        borderColor: colors.border.default,
        backgroundColor: colors.surface.card 
      }}
      role="tablist"
      aria-label="Document view tabs"
    >
      {SUB_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 text-xs font-medium transition-colors relative"
            style={{ 
              color: isActive ? colors.accent.DEFAULT : colors.text.muted 
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = colors.text.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = colors.text.muted;
              }
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tab-panel-${tab.key}`}
            id={`tab-${tab.key}`}
            type="button"
          >
            <Icon size={14} />
            {tab.label}
            {isActive && (
              <span 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: colors.accent.DEFAULT }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
});

SubTabBar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

SubTabBar.displayName = 'SubTabBar';

/**
 * Tab content area with active panel
 * 
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active tab key
 * @returns {JSX.Element} Tab content component
 */
const TabContent = memo(function TabContent({ activeTab }) {
  const {
    document,
    chatHistory,
    isAiLoading,
    isDocumentReady,
    handleSummarize,
    handleExtract,
    handleChat,
    handleClearChat,
  } = useDocument();

  return (
    <div 
      className="flex-1 min-h-0 overflow-y-auto p-4"
      style={{ backgroundColor: colors.surface.primary }}
    >
      {/* Summary Tab */}
      <div
        role="tabpanel"
        id="tab-panel-summary"
        aria-labelledby="tab-summary"
        hidden={activeTab !== 'summary'}
      >
        {activeTab === 'summary' && (
          <DocSummary
            document={document}
            onSummarize={handleSummarize}
            isLoading={isAiLoading}
            isDocumentReady={isDocumentReady}
          />
        )}
      </div>
      
      {/* Entities Tab */}
      <div
        role="tabpanel"
        id="tab-panel-entities"
        aria-labelledby="tab-entities"
        hidden={activeTab !== 'entities'}
      >
        {activeTab === 'entities' && (
          <DocEntities
            document={document}
            onExtract={handleExtract}
            isLoading={isAiLoading}
            isDocumentReady={isDocumentReady}
          />
        )}
      </div>
      
      {/* Chat Tab */}
      <div
        role="tabpanel"
        id="tab-panel-chat"
        aria-labelledby="tab-chat"
        hidden={activeTab !== 'chat'}
      >
        {activeTab === 'chat' && (
          <DocChat
            document={document}
            onChat={handleChat}
            onClearChat={handleClearChat}
            chatHistory={chatHistory}
            isLoading={isAiLoading}
            isDocumentReady={isDocumentReady}
          />
        )}
      </div>
    </div>
  );
});

TabContent.propTypes = {
  activeTab: PropTypes.string.isRequired,
};

TabContent.displayName = 'TabContent';

// ═══════════════════════════════════════════════════════════════
// Inner Component (uses context)
// ═══════════════════════════════════════════════════════════════

/**
 * Inner document viewer component that uses DocumentContext
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onBack - Callback when back button is clicked
 * @returns {JSX.Element|null} Document viewer inner component
 */
const DocViewerInner = memo(function DocViewerInner({ onBack }) {
  const [activeSubTab, setActiveSubTab] = useState('summary');
  const { document, fetchChatHistory } = useDocument();

  /**
   * Handles tab change
   * @param {string} tabKey - Tab key to activate
   */
  const handleTabChange = useCallback((tabKey) => {
    setActiveSubTab(tabKey);
  }, []);

  // Fetch chat history when component mounts
  useEffect(() => {
    if (document?.id) {
      fetchChatHistory(document.id);
    }
  }, [document?.id, fetchChatHistory]);

  if (!document) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <DocumentHeader document={document} onBack={onBack} />
      <SubTabBar activeTab={activeSubTab} onTabChange={handleTabChange} />
      <TabContent activeTab={activeSubTab} />
    </div>
  );
});

DocViewerInner.propTypes = {
  onBack: PropTypes.func.isRequired,
};

DocViewerInner.displayName = 'DocViewerInner';

// ═══════════════════════════════════════════════════════════════
// Main Component (with provider)
// ═══════════════════════════════════════════════════════════════

/**
 * DocViewer - Document viewer with summary, entities, and chat tabs
 * 
 * This component wraps the inner component with DocumentProvider to manage
 * document state and operations. The context reduces prop drilling between
 * the viewer and its child components.
 * 
 * @param {Object} props - Component props
 * @param {Object} [props.document] - Document data to view
 * @param {string} props.document.id - Unique document identifier
 * @param {string} props.document.original_name - Original file name
 * @param {number} [props.document.word_count] - Word count
 * @param {number} [props.document.page_count] - Page count
 * @param {number} [props.document.file_size] - File size in bytes
 * @param {string} [props.document.status] - Document status ('processing', 'ready', 'error')
 * @param {string} [props.document.summary] - Document summary
 * @param {Array|Object} [props.document.entities] - Extracted entities
 * @param {Function} props.onBack - Callback when back button is clicked
 * @returns {JSX.Element} Document viewer component
 */
function DocViewer({
  document,
  onBack,
}) {
  return (
    <DocumentProvider document={document}>
      <DocViewerInner onBack={onBack} />
    </DocumentProvider>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

DocViewer.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string.isRequired,
    original_name: PropTypes.string.isRequired,
    word_count: PropTypes.number,
    page_count: PropTypes.number,
    file_size: PropTypes.number,
    status: PropTypes.oneOf(['processing', 'ready', 'error']),
    summary: PropTypes.string,
    entities: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  }),
  onBack: PropTypes.func.isRequired,
};

DocViewer.defaultProps = {
  document: null,
};

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

export default memo(DocViewer);
