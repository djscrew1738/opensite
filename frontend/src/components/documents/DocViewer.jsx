import { useState } from 'react';
import {
  ChevronLeft,
  BookOpen,
  Tags,
  MessageSquare,
  FileText,
  Hash,
  Type,
} from 'lucide-react';
import DocSummary from './DocSummary';
import DocEntities from './DocEntities';
import DocChat from './DocChat';

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const SUB_TABS = [
  { key: 'summary', label: 'Summary', icon: BookOpen },
  { key: 'entities', label: 'Entities', icon: Tags },
  { key: 'chat', label: 'Chat', icon: MessageSquare },
];

export default function DocViewer({
  document,
  onBack,
  onSummarize,
  onExtract,
  onChat,
  onClearChat,
  chatHistory,
  isAiLoading,
}) {
  const [activeSubTab, setActiveSubTab] = useState('summary');

  if (!document) return null;

  const isDocumentReady = document?.status === 'ready';

  const metadataPills = [
    document.word_count && {
      icon: Type,
      label: `${document.word_count.toLocaleString()} words`,
    },
    document.page_count && {
      icon: FileText,
      label: `${document.page_count} ${document.page_count === 1 ? 'page' : 'pages'}`,
    },
    document.file_size && {
      icon: Hash,
      label: formatFileSize(document.file_size),
    },
  ].filter(Boolean);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{
          backgroundColor: '#111318',
          borderColor: '#1F2430',
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors shrink-0"
          style={{ color: '#94A3B8' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#181C24';
            e.currentTarget.style.color = '#F1F5F9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94A3B8';
          }}
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex flex-col min-w-0 flex-1">
          <h2
            className="text-sm font-semibold truncate"
            style={{ color: '#F1F5F9' }}
            title={document.original_name}
          >
            {document.original_name}
          </h2>

          {metadataPills.length > 0 && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {metadataPills.map((pill, i) => {
                const Icon = pill.icon;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: '#181C24',
                      color: '#64748B',
                    }}
                  >
                    <Icon size={12} />
                    {pill.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sub-tab bar */}
      <div
        className="flex border-b"
        style={{
          backgroundColor: '#111318',
          borderColor: '#1F2430',
        }}
      >
        {SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 text-xs font-medium transition-colors relative"
              style={{
                color: isActive ? '#3B82F6' : '#64748B',
                borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#94A3B8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#64748B';
                }
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ backgroundColor: '#0A0B0D' }}
      >
        {activeSubTab === 'summary' && (
          <DocSummary
            document={document}
            onSummarize={onSummarize}
            isLoading={isAiLoading}
            isDocumentReady={isDocumentReady}
          />
        )}
        {activeSubTab === 'entities' && (
          <DocEntities
            document={document}
            onExtract={onExtract}
            isLoading={isAiLoading}
            isDocumentReady={isDocumentReady}
          />
        )}
        {activeSubTab === 'chat' && (
          <DocChat
            document={document}
            onChat={onChat}
            onClearChat={onClearChat}
            chatHistory={chatHistory}
            isLoading={isAiLoading}
            isDocumentReady={isDocumentReady}
          />
        )}
      </div>
    </div>
  );
}
