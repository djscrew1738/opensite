import { useContext, createContext, useState, useCallback } from 'react';

/**
 * PageHeaderContext - Allows child pages to communicate with the layout header
 */
export const PageHeaderContext = createContext(null);

/**
 * usePageHeader - Hook for pages to set header title and actions
 * 
 * Usage:
 * ```jsx
 * function JobsPage() {
 *   const { setTitle, setActions } = usePageHeader();
 *   
 *   useEffect(() => {
 *     setTitle('Active Jobs');
 *     setActions(
 *       <button onClick={handleCreate}>New Job</button>
 *     );
 *     
 *     // Cleanup when unmounting
 *     return () => {
 *       setActions(null);
 *     };
 *   }, []);
 * }
 * ```
 */
export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  
  if (!context) {
    // Return no-ops if not inside provider (for testing or standalone use)
    return {
      setTitle: () => {},
      setActions: () => {},
      setBreadcrumb: () => {},
      reset: () => {},
    };
  }
  
  return context;
}

/**
 * usePageHeaderState - Internal hook for Layout to manage header state
 */
export function usePageHeaderState() {
  const [title, setTitle] = useState(null);
  const [actions, setActions] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState(null);
  
  const reset = useCallback(() => {
    setTitle(null);
    setActions(null);
    setBreadcrumb(null);
  }, []);
  
  return {
    title,
    actions,
    breadcrumb,
    setTitle,
    setActions,
    setBreadcrumb,
    reset,
  };
}

export default usePageHeader;
