/**
 * DEBOUNCING EXAMPLE
 * 
 * Prompt: "Can you add debouncing to my search input so it doesn't fire an 
 * API call on every single keystroke?"
 * 
 * This example shows:
 * 1. Basic search input with debouncing
 * 2. useDebouncedFetch for API calls
 * 3. Form field debouncing
 * 4. Resize/scroll event debouncing
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  useDebounce, 
  useDebouncedCallback, 
  useDebouncedState,
  useDebouncedFetch 
} from '../hooks/useDebounce';

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: BASIC SEARCH WITH DEBOUNCING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * SearchInput - Simple debounced search input
 * Waits for user to stop typing before triggering search
 */
function SearchInput({ onSearch, placeholder = 'Search...', delay = 300 }) {
  const [inputValue, setInputValue] = useState('');
  
  // Debounce the input value
  const debouncedValue = useDebounce(inputValue, delay);

  // Trigger search when debounced value changes
  useEffect(() => {
    onSearch?.(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '16px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          outline: 'none',
        }}
      />
      {/* Show typing indicator */}
      {inputValue !== debouncedValue && (
        <span
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          typing...
        </span>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: ADVANCED SEARCH WITH LOADING STATES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * SearchWithLoading - Shows search with loading and results
 */
function SearchWithLoading() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced callback for search
  const debouncedSearch = useDebouncedCallback(
    async (searchQuery) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      
      try {
        // Simulate API call
        const response = await mockSearchAPI(searchQuery);
        setResults(response);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    400, // Wait 400ms after typing stops
    [setResults, setIsLoading]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div style={{ maxWidth: '500px' }}>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search leads, permits, documents..."
          style={{
            width: '100%',
            padding: '12px 40px 12px 16px',
            fontSize: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            outline: 'none',
          }}
        />
        {isLoading && (
          <LoadingIndicator />
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {results.map((item) => (
            <li
              key={item.id}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {item.type} - {item.location}
              </div>
            </li>
          ))}
        </ul>
      )}

      {query && !isLoading && results.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: USING useDebouncedFetch HOOK
// ═════════════════════════════════════════════════════════════════════════════

/**
 * SearchWithHook - Uses the useDebouncedFetch hook for cleaner code
 */
function SearchWithHook() {
  const [query, setQuery] = useState('');

  const { data, loading, error, execute } = useDebouncedFetch(
    async (searchQuery) => {
      if (!searchQuery.trim()) return [];
      return mockSearchAPI(searchQuery);
    },
    500 // 500ms debounce
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    execute(value);
  };

  return (
    <div style={{ maxWidth: '500px' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search with auto-cancellation..."
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '16px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      />

      {loading && <div style={{ color: '#6b7280' }}>Searching...</div>}
      
      {error && (
        <div style={{ color: '#ef4444', padding: '12px' }}>
          Error: {error.message}
        </div>
      )}

      {data && (
        <div>
          <div style={{ marginBottom: '8px', color: '#6b7280' }}>
            Found {data.length} results
          </div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {data.map((item) => (
              <li
                key={item.id}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  marginBottom: '4px',
                }}
              >
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: FORM FIELD DEBOUNCING (LIVE PREVIEW)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * FormWithLivePreview - Debounced form fields with live preview
 */
function FormWithLivePreview() {
  // Use debounced state for expensive preview updates
  const [name, debouncedName, setName] = useDebouncedState('', 300);
  const [email, debouncedEmail, setEmail] = useDebouncedState('', 300);
  const [message, debouncedMessage, setMessage] = useDebouncedState('', 500);

  // Simulate expensive preview generation
  const preview = generatePreview({
    name: debouncedName,
    email: debouncedEmail,
    message: debouncedMessage,
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Form */}
      <div>
        <h3>Contact Form</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {/* Live Preview */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        <h3>Live Preview</h3>
        <div
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '4px',
            minHeight: '200px',
          }}
          dangerouslySetInnerHTML={{ __html: preview }}
        />
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
          Preview updates are debounced to prevent excessive re-renders
        </p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: RESIZE AND SCROLL DEBOUNCING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * WindowSizeTracker - Efficiently tracks window size
 */
function WindowSizeTracker() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Debounce the resize handler
  const debouncedResize = useDebouncedCallback(
    () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      console.log('[Resize] Updated window size');
    },
    200
  );

  useEffect(() => {
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [debouncedResize]);

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
      }}
    >
      <h4>Window Size (Debounced)</h4>
      <p>Width: {windowSize.width}px</p>
      <p>Height: {windowSize.height}px</p>
      <p style={{ fontSize: '12px', color: '#6b7280' }}>
        Resize your window - updates are debounced to 200ms
      </p>
    </div>
  );
}

/**
 * ScrollProgress - Shows scroll progress with debounced updates
 */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const contentRef = useRef(null);

  const debouncedScroll = useDebouncedCallback(
    () => {
      if (!contentRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrolled)));
    },
    50, // Update every 50ms max
    []
  );

  return (
    <div>
      {/* Progress bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '4px',
          backgroundColor: '#e5e7eb',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#3b82f6',
            transition: 'width 0.1s ease',
          }}
        />
      </div>

      {/* Scrollable content */}
      <div
        ref={contentRef}
        onScroll={debouncedScroll}
        style={{
          height: '200px',
          overflow: 'auto',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
        }}
      >
        {Array.from({ length: 50 }, (_, i) => (
          <p key={i} style={{ marginBottom: '16px' }}>
            Scroll content line {i + 1} - Lorem ipsum dolor sit amet, consectetur 
            adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore.
          </p>
        ))}
      </div>

      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
        Scroll progress: {Math.round(progress)}% (updates debounced)
      </p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: COMPARISON - WITH vs WITHOUT DEBOUNCING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * DebounceComparison - Shows the difference between debounced and non-debounced
 */
function DebounceComparison() {
  const [instantQuery, setInstantQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const [instantCalls, setInstantCalls] = useState(0);
  const [debouncedCalls, setDebouncedCalls] = useState(0);

  // Without debouncing - fires on every keystroke
  const handleInstantChange = (e) => {
    const value = e.target.value;
    setInstantQuery(value);
    setInstantCalls(prev => prev + 1);
    // In real app, this would be an API call
    console.log('[Instant] Searching for:', value);
  };

  // With debouncing - fires only after user stops typing
  const debouncedSearch = useDebouncedCallback(
    (value) => {
      setDebouncedQuery(value);
      setDebouncedCalls(prev => prev + 1);
      console.log('[Debounced] Searching for:', value);
    },
    300
  );

  const handleDebouncedChange = (e) => {
    const value = e.target.value;
    setDebouncedQuery(value); // Update UI immediately
    debouncedSearch(value);   // Debounce the search
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Without Debouncing */}
      <div style={{ padding: '16px', border: '2px solid #ef4444', borderRadius: '8px' }}>
        <h4 style={{ color: '#ef4444', marginTop: 0 }}>Without Debouncing</h4>
        <input
          type="text"
          value={instantQuery}
          onChange={handleInstantChange}
          placeholder="Type here..."
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
          }}
        />
        <div style={{ fontSize: '14px' }}>
          <p><strong>API Calls:</strong> {instantCalls}</p>
          <p style={{ color: '#6b7280' }}>
            Fires on every keystroke! If you type "hello" quickly, 
            that is 5 API calls.
          </p>
        </div>
      </div>

      {/* With Debouncing */}
      <div style={{ padding: '16px', border: '2px solid #10b981', borderRadius: '8px' }}>
        <h4 style={{ color: '#10b981', marginTop: 0 }}>With Debouncing</h4>
        <input
          type="text"
          value={debouncedQuery}
          onChange={handleDebouncedChange}
          placeholder="Type here..."
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
          }}
        />
        <div style={{ fontSize: '14px' }}>
          <p><strong>API Calls:</strong> {debouncedCalls}</p>
          <p style={{ color: '#6b7280' }}>
            Waits 300ms after you stop typing. Type "hello" quickly, 
            that is only 1 API call!
          </p>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function LoadingIndicator() {
  return (
    <span
      style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '16px',
        height: '16px',
        border: '2px solid #e5e7eb',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    >
      <style>{`
        @keyframes spin {
          to { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MOCK DATA & HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function mockSearchAPI(query) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const mockData = [
        { id: 1, name: 'Plumbing Permit #2024-001', type: 'Permit', location: 'Dallas' },
        { id: 2, name: 'ABC Construction LLC', type: 'Builder', location: 'Fort Worth' },
        { id: 3, name: 'Johnson Residence', type: 'Lead', location: 'Plano' },
        { id: 4, name: 'Hotel Renovation Project', type: 'Job', location: 'Arlington' },
        { id: 5, name: 'Commercial Plumbing Quote', type: 'Estimate', location: 'Dallas' },
        { id: 6, name: 'Emergency Repair Request', type: 'Lead', location: 'Irving' },
        { id: 7, name: 'Multi-Family Complex', type: 'Permit', location: 'Frisco' },
        { id: 8, name: 'XYZ Development Corp', type: 'Builder', location: 'McKinney' },
      ];

      const filtered = mockData.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
      );

      resolve(filtered);
    }, 300 + Math.random() * 200); // Random delay 300-500ms
  });
}

function generatePreview({ name, email, message }) {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin: 0;">Contact Form Submission</h2>
        <p style="color: #6b7280; margin: 5px 0 0 0;">${date}</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong style="color: #374151;">From:</strong><br>
        <span style="color: #1f2937;">${name || '<em style="color: #9ca3af;">Not provided</em>'}</span>
        ${email ? `<br><span style="color: #6b7280;">${email}</span>` : ''}
      </div>
      
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
        <strong style="color: #374151;">Message:</strong><br>
        <p style="color: #1f2937; margin: 8px 0 0 0; white-space: pre-wrap;">
          ${message || '<em style="color: #9ca3af;">No message provided</em>'}
        </p>
      </div>
    </div>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// DEMO PAGE
// ═════════════════════════════════════════════════════════════════════════════

export function DebouncingDemo() {
  const [activeDemo, setActiveDemo] = useState('basic');

  const demos = [
    { id: 'basic', label: 'Basic Search', component: SearchWithLoading },
    { id: 'hook', label: 'useDebouncedFetch Hook', component: SearchWithHook },
    { id: 'form', label: 'Form with Live Preview', component: FormWithLivePreview },
    { id: 'events', label: 'Window Events', component: () => (
      <div style={{ display: 'grid', gap: '24px' }}>
        <WindowSizeTracker />
        <ScrollProgress />
      </div>
    )},
    { id: 'comparison', label: 'With vs Without', component: DebounceComparison },
  ];

  const ActiveComponent = demos.find(d => d.id === activeDemo)?.component;

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h1>Debouncing Demo</h1>
      <p>
        Debouncing prevents functions from firing too frequently. 
        It is essential for search inputs, resize handlers, and any UI that responds to rapid events.
      </p>

      {/* Demo selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {demos.map(demo => (
          <button
            key={demo.id}
            onClick={() => setActiveDemo(demo.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: activeDemo === demo.id ? '#3b82f6' : '#e5e7eb',
              color: activeDemo === demo.id ? '#ffffff' : '#374151',
              cursor: 'pointer',
            }}
          >
            {demo.label}
          </button>
        ))}
      </div>

      {/* Active demo */}
      <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}

export default DebouncingDemo;
