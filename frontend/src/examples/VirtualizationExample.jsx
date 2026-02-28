/**
 * VIRTUALIZATION EXAMPLE
 * 
 * Prompt: "Can you implement virtualization for my DocumentList.jsx so it 
 * only renders the 10 rows visible in the viewport?"
 * 
 * This example shows:
 * 1. Basic list virtualization with fixed heights
 * 2. Dynamic height virtualization
 * 3. Virtualized grid layout
 * 4. Infinite scroll + virtualization
 */

import { useRef, useState, useCallback, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  useVirtualizedList, 
  useDynamicVirtualizedList,
  useInfiniteVirtualizedList 
} from '../hooks/useVirtualizedList';

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: BASIC VIRTUALIZED LIST (Fixed Height)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * DocumentListBasic - Simple virtualized list for documents
 * Renders only visible items + overscan buffer
 */
function DocumentListBasic({ documents, onSelect }) {
  const parentRef = useRef(null);

  // Configure the virtualizer
  const virtualizer = useVirtualizer({
    count: documents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Fixed row height in pixels
    overscan: 5, // Render 5 items above and below viewport
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      style={{
        height: '400px', // Fixed container height
        overflow: 'auto', // Enable scrolling
        border: '1px solid #ccc',
      }}
    >
      {/* Spacer element sets the total scrollable height */}
      <div style={{ height: `${totalSize}px`, position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const doc = documents[virtualItem.index];
          
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                padding: '16px',
                borderBottom: '1px solid #eee',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
              onClick={() => onSelect?.(doc)}
            >
              <span style={{ fontSize: '24px' }}>icon</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{doc.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {doc.size} - {doc.date}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: DOCUMENT LIST WITH THE CUSTOM HOOK (SIMPLIFIED API)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * DocumentList - Production-ready virtualized document list
 * Uses our custom useVirtualizedList hook
 */
function DocumentList({ documents, onSelect, onDelete }) {
  const {
    containerRef,
    virtualItems,
    totalHeight,
    scrollToIndex,
  } = useVirtualizedList({
    items: documents,
    itemHeight: 72,
    overscan: 8,
  });

  // Scroll to specific document
  const scrollToDocument = useCallback((index) => {
    scrollToIndex(index, { align: 'center' });
  }, [scrollToIndex]);

  return (
    <div>
      {/* Optional: Jump to controls */}
      <div style={{ marginBottom: '12px' }}>
        <button onClick={() => scrollToDocument(0)}>
          Jump to Top
        </button>
        <button onClick={() => scrollToDocument(documents.length - 1)}>
          Jump to Bottom
        </button>
        <span style={{ marginLeft: '12px', color: '#666' }}>
          Showing {virtualItems.length} of {documents.length} items
        </span>
      </div>

      {/* Virtualized list container */}
      <div
        ref={containerRef}
        style={{
          height: '500px',
          overflow: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
        }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {virtualItems.map((virtualItem) => {
            const doc = documents[virtualItem.index];
            const isEven = virtualItem.index % 2 === 0;

            return (
              <DocumentListItem
                key={virtualItem.key}
                doc={doc}
                index={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  backgroundColor: isEven ? '#f9fafb' : '#ffffff',
                }}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Memoized list item component
const DocumentListItem = memo(function DocumentListItem({
  doc,
  index,
  style,
  onSelect,
  onDelete,
}) {
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid #e5e7eb',
        boxSizing: 'border-box',
      }}
    >
      <span style={{ color: '#9ca3af', marginRight: '12px', fontSize: '14px' }}>
        #{index + 1}
      </span>
      
      <span style={{ fontSize: '20px', marginRight: '12px' }}>
        {getFileIcon(doc.type)}
      </span>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontWeight: 500, 
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {doc.name}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {doc.size} - Modified {doc.modified}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onSelect?.(doc)}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Open
        </button>
        <button
          onClick={() => onDelete?.(doc.id)}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            border: '1px solid #ef4444',
            borderRadius: '4px',
            background: 'white',
            color: '#ef4444',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: DYNAMIC HEIGHT VIRTUALIZATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * ChatMessageList - Virtualized list with variable message heights
 * Each message can have different height based on content
 */
function ChatMessageList({ messages }) {
  const {
    containerRef,
    virtualItems,
    totalHeight,
    measureElement,
    scrollToIndex,
  } = useDynamicVirtualizedList({
    items: messages,
    estimateHeight: 60,
    overscan: 5,
  });

  // Auto-scroll to bottom on new messages
  const prevLength = useRef(messages.length);
  if (messages.length > prevLength.current) {
    requestAnimationFrame(() => {
      scrollToIndex(messages.length - 1, { align: 'end' });
    });
  }
  prevLength.current = messages.length;

  return (
    <div
      ref={containerRef}
      style={{
        height: '600px',
        overflow: 'auto',
        padding: '16px',
        backgroundColor: '#f3f4f6',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const message = messages[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              ref={measureElement}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                padding: '8px 0',
              }}
            >
              <ChatMessage message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: isUser ? '#3b82f6' : '#ffffff',
          color: isUser ? '#ffffff' : '#1f2937',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {message.content}
        </div>
        <div
          style={{
            fontSize: '11px',
            marginTop: '4px',
            opacity: 0.7,
            textAlign: isUser ? 'left' : 'right',
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: VIRTUALIZED GRID
// ═════════════════════════════════════════════════════════════════════════════

/**
 * DocumentGrid - Virtualized grid for thumbnail/document cards
 */
function DocumentGrid({ documents, columnWidth = 200, rowHeight = 150 }) {
  const parentRef = useRef(null);
  const columnCount = 3; // Fixed 3-column grid

  // Calculate row count based on items and columns
  const rowCount = Math.ceil(documents.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 2,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      style={{
        height: '600px',
        overflow: 'auto',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualRows.map((virtualRow) => {
          const rowIndex = virtualRow.index;
          const startIndex = rowIndex * columnCount;
          const rowItems = documents.slice(startIndex, startIndex + columnCount);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                gap: '16px',
                padding: '0 16px',
                boxSizing: 'border-box',
              }}
            >
              {rowItems.map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc}
                  style={{ height: rowHeight - 16 }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocumentCard({ doc, style }) {
  return (
    <div
      style={{
        ...style,
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span style={{ fontSize: '48px', marginBottom: '8px' }}>
        {getFileIcon(doc.type)}
      </span>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        {doc.name}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>
        {doc.size}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: INFINITE SCROLL + VIRTUALIZATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * InfiniteDocumentList - Virtualized list with infinite scroll
 * Loads more documents as user scrolls to bottom
 */
function InfiniteDocumentList({ 
  documents, 
  hasMore, 
  onLoadMore, 
  isLoading 
}) {
  const {
    containerRef,
    virtualItems,
    totalHeight,
    checkLoadMore,
  } = useInfiniteVirtualizedList({
    items: documents,
    itemHeight: 72,
    hasMore,
    onLoadMore,
    loadMoreThreshold: 300, // Load when within 300px of bottom
    overscan: 5,
  });

  // Check for infinite scroll trigger
  const handleScroll = useCallback(() => {
    checkLoadMore();
  }, [checkLoadMore]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: '500px',
        overflow: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map((virtualItem) => {
          const doc = documents[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                padding: '16px',
                borderBottom: '1px solid #e5e7eb',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span>icon</span>
              <div>
                <div>{doc.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {doc.size}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading indicator at bottom */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
            }}
          >
            Loading more...
          </div>
        )}

        {/* End of list message */}
        {!hasMore && documents.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              padding: '16px',
              textAlign: 'center',
              fontSize: '14px',
              color: '#9ca3af',
            }}
          >
            End of list
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function getFileIcon(type) {
  const icons = {
    pdf: 'PDF',
    doc: 'DOC',
    docx: 'DOC',
    xls: 'XLS',
    xlsx: 'XLS',
    ppt: 'PPT',
    image: 'IMG',
    video: 'VID',
    audio: 'AUD',
    zip: 'ZIP',
    default: 'FILE',
  };
  return icons[type] || icons.default;
}

// ═════════════════════════════════════════════════════════════════════════════
// DEMO PAGE
// ═════════════════════════════════════════════════════════════════════════════

export function VirtualizationDemo() {
  const [activeTab, setActiveTab] = useState('list');
  const [documents, setDocuments] = useState(() => generateDocuments(1000));
  const [loadedCount, setLoadedCount] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  // Generate more documents for infinite scroll demo
  const loadMore = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoadedCount(prev => {
        const next = prev + 50;
        return next > documents.length ? documents.length : next;
      });
      setIsLoading(false);
    }, 1000);
  }, [documents.length, isLoading]);

  const visibleDocuments = documents.slice(0, loadedCount);
  const hasMore = loadedCount < documents.length;

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h1>Virtualization Demo</h1>
      <p>
        This page demonstrates different virtualization patterns.
        With 1000 items, virtualization keeps rendering fast by only showing 
        about 10-15 items at a time instead of all 1000.
      </p>

      {/* Tab selector */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
        {[
          { id: 'list', label: 'Basic List' },
          { id: 'dynamic', label: 'Dynamic Heights (Chat)' },
          { id: 'grid', label: 'Grid' },
          { id: 'infinite', label: 'Infinite Scroll' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#3b82f6' : '#e5e7eb',
              color: activeTab === tab.id ? '#ffffff' : '#374151',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
        <strong>Total items:</strong> {documents.length.toLocaleString()} | 
        <strong> Visible:</strong> {activeTab === 'infinite' ? loadedCount : 'about 10-15 (virtualized)'}
      </div>

      {/* Demo content */}
      {activeTab === 'list' && (
        <DocumentList
          documents={documents.slice(0, 100)}
          onSelect={(doc) => console.log('Selected:', doc)}
          onDelete={(id) => console.log('Delete:', id)}
        />
      )}

      {activeTab === 'dynamic' && (
        <ChatMessageList messages={generateChatMessages(200)} />
      )}

      {activeTab === 'grid' && (
        <DocumentGrid documents={documents.slice(0, 50)} />
      )}

      {activeTab === 'infinite' && (
        <InfiniteDocumentList
          documents={visibleDocuments}
          hasMore={hasMore}
          onLoadMore={loadMore}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DATA GENERATORS
// ═════════════════════════════════════════════════════════════════════════════

function generateDocuments(count) {
  const types = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'image', 'zip'];
  const sizes = ['12 KB', '245 KB', '1.2 MB', '5.6 MB', '12.4 MB'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `doc-${i}`,
    name: `Document ${i + 1}.${types[i % types.length]}`,
    type: types[i % types.length],
    size: sizes[i % sizes.length],
    modified: `${Math.floor(Math.random() * 30) + 1} days ago`,
    date: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
  }));
}

function generateChatMessages(count) {
  const messages = [
    { content: 'Hey there!', role: 'user' },
    { content: 'Hi! How can I help you today?', role: 'assistant' },
    { content: 'I need help with a plumbing estimate.', role: 'user' },
    { content: 'I would be happy to help! What are the details?', role: 'assistant' },
    { content: 'It is a 10-unit apartment building, about 12,000 sq ft.', role: 'user' },
    { content: 'Perfect! Let me calculate an estimate for you...', role: 'assistant' },
    { content: 'Based on those specs, here is a rough estimate...', role: 'assistant' },
    { content: 'Yes, can you break down the materials?', role: 'user' },
    { content: 'Sure! Here is the materials breakdown...', role: 'assistant' },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = messages[i % messages.length];
    return {
      id: `msg-${i}`,
      content: template.content,
      role: template.role,
      timestamp: Date.now() - (count - i) * 60000,
    };
  });
}

export default VirtualizationDemo;
