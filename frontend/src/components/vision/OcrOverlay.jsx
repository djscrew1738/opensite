import { useState, useMemo } from 'react';
import { FileText, X, ChevronRight, Search, Eye, EyeOff } from 'lucide-react';

/**
 * OcrOverlay - Displays OCR text extracted from blueprints
 * 
 * Features:
 * - Text boxes positioned at detected locations
 * - Search/filter functionality
 * - Highlight on hover
 * - Toggle visibility
 */

export default function OcrOverlay({ 
  data, 
  scale = 1,
  width,
  height,
  onTextClick,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Parse OCR data if it's a string
  const ocrItems = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data.text) {
      // Single item or structured format
      return data.regions || data.items || [data];
    }
    return [];
  }, [data]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return ocrItems;
    return ocrItems.filter(item => 
      (item.text || item.content || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [ocrItems, searchQuery]);

  if (!visible || filteredItems.length === 0) return null;

  return (
    <>
      {/* OCR text boxes on the blueprint */}
      {filteredItems.map((item, index) => {
        const id = item.id || `ocr-${index}`;
        const text = item.text || item.content || item.word || '';
        const bbox = item.bbox || item.boundingBox || item.box;
        
        if (!bbox) return null;

        const [x, y, w, h] = Array.isArray(bbox) 
          ? bbox 
          : [bbox.x, bbox.y, bbox.width, bbox.height];

        const isHovered = hoveredId === id;

        return (
          <div
            key={id}
            className="absolute cursor-pointer transition-all duration-200 group"
            style={{
              left: x * scale,
              top: y * scale,
              width: w * scale,
              height: h * scale,
            }}
            onMouseEnter={() => setHoveredId(id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onTextClick?.(item)}
          >
            {/* Highlight box */}
            <div 
              className={`absolute inset-0 rounded border transition-all
                         ${isHovered 
                           ? 'bg-yellow-400/40 border-yellow-500' 
                           : 'bg-blue-400/20 border-blue-400/50 group-hover:bg-blue-400/30'}`}
            />
            
            {/* Text label (only on hover or if large enough) */}
            {(isHovered || h * scale > 20) && (
              <div 
                className="absolute -top-6 left-0 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] rounded
                           whitespace-nowrap z-10 shadow-md"
                style={{ fontSize: `${Math.min(10, h * scale * 0.5)}px` }}
              >
                {text.length > 30 ? text.slice(0, 30) + '...' : text}
              </div>
            )}
          </div>
        );
      })}

      {/* OCR Panel (sidebar) */}
      {expanded && (
        <div className="absolute top-2 right-2 w-64 max-h-[80%] 
                        bg-white/95 dark:bg-surface-800/95 backdrop-blur-sm
                        rounded-xl shadow-xl border border-surface-200 dark:border-surface-700
                        flex flex-col z-20">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                OCR Text
              </span>
              <span className="text-xs text-surface-400">
                ({filteredItems.length})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVisible(!visible)}
                className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
                title={visible ? 'Hide overlay' : 'Show overlay'}
              >
                {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-surface-200 dark:border-surface-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
              <input
                type="text"
                placeholder="Search text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg
                           bg-surface-100 dark:bg-surface-700
                           border-none outline-none
                           text-surface-700 dark:text-surface-300
                           placeholder:text-surface-400"
              />
            </div>
          </div>

          {/* Text list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-64">
            {filteredItems.map((item, index) => {
              const id = item.id || `ocr-${index}`;
              const text = item.text || item.content || item.word || '';
              const isHovered = hoveredId === id;

              return (
                <div
                  key={id}
                  className={`p-2 rounded-lg text-xs cursor-pointer transition-colors
                             ${isHovered 
                               ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                               : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'}`}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onTextClick?.(item)}
                >
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-50" />
                    <span className="line-clamp-2">{text}</span>
                  </div>
                  {item.confidence && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="flex-1 h-1 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${item.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-surface-400">
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-4 text-surface-400 text-xs">
                No text found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle button when collapsed */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="absolute top-2 right-2 p-2 rounded-lg
                     bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm
                     shadow-lg border border-surface-200 dark:border-surface-700
                     text-surface-600 dark:text-surface-400
                     hover:text-primary-600 dark:hover:text-primary-400
                     z-10"
          title="Show OCR panel"
        >
          <FileText className="w-4 h-4" />
          {filteredItems.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 
                             bg-primary-500 text-white text-[10px] rounded-full
                             flex items-center justify-center">
              {filteredItems.length}
            </span>
          )}
        </button>
      )}
    </>
  );
}

/**
 * Simple inline OCR text display (for use within nodes)
 */
export function OcrTextLine({ text, bbox, scale = 1, isHovered, onHover }) {
  if (!bbox) return null;

  const [x, y, w, h] = Array.isArray(bbox) ? bbox : [bbox.x, bbox.y, bbox.width, bbox.height];

  return (
    <div
      className={`absolute transition-all duration-200
                 ${isHovered ? 'bg-yellow-400/50 z-10' : 'bg-transparent'}`}
      style={{
        left: x * scale,
        top: y * scale,
        width: w * scale,
        height: h * scale,
      }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {isHovered && (
        <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-blue-600 text-white text-[8px] rounded whitespace-nowrap">
          {text}
        </div>
      )}
    </div>
  );
}
