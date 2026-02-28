import { useCallback, useRef, useEffect, useMemo } from 'react';

/**
 * useMemoizedCallback - Creates a stable callback reference that doesn't change
 * when dependencies change, while still accessing the latest values via a ref.
 * 
 * This is useful when you need to pass a callback to a memoized child component
 * or a dependency array, but the callback's dependencies change frequently.
 * 
 * @param {Function} callback - The callback function
 * @returns {Function} A stable callback reference
 * 
 * @example
 * // Child component won't re-render when parent state changes
 * const Child = memo(({ onClick }) => <button onClick={onClick}>Click</button>);
 * 
 * function Parent() {
 *   const [count, setCount] = useState(0);
 *   
 *   // Without useMemoizedCallback: Child re-renders every time count changes
 *   // With useMemoizedCallback: Child never re-renders (stable reference)
 *   const handleClick = useMemoizedCallback(() => {
 *     console.log(count); // Always has access to latest count
 *   });
 *   
 *   return <Child onClick={handleClick} />;
 * }
 */
export function useMemoizedCallback(callback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, []);
}

/**
 * useEventCallback - Similar to useMemoizedCallback but with better naming
 * for event handlers. The callback always has access to latest state/props
 * without causing re-renders of memoized children.
 * 
 * @param {Function} handler - The event handler
 * @returns {Function} Stable handler reference with latest closure
 * 
 * @example
 * function ExpensiveList({ items, onItemClick }) {
 *   // Each item gets a stable callback, preventing unnecessary re-renders
 *   return items.map(item => (
 *     <MemoizedItem 
 *       key={item.id} 
 *       item={item}
 *       onClick={useEventCallback(() => onItemClick(item.id))}
 *     />
 *   ));
 * }
 */
export function useEventCallback(handler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  return useCallback((...args) => {
    const fn = handlerRef.current;
    return fn?.(...args);
  }, []);
}

/**
 * useMemoizedValue - Memoizes a value with deep equality checking
 * 
 * Useful when you have an object/array that gets recreated on every render
 * but you need it to be stable for dependency arrays or memoized children.
 * 
 * @param {any} value - The value to memoize
 * @returns {any} The memoized value (stable reference if equal)
 * 
 * @example
 * const config = useMemoizedValue({
 *   timeout: 5000,
 *   retries: 3,
 *   enabled: isActive
 * });
 * 
 * // useEffect only runs when actual values change, not reference
 * useEffect(() => {
 *   setupService(config);
 * }, [config]);
 */
export function useMemoizedValue(value) {
  const ref = useRef(value);

  // Only update the ref if the value has actually changed
  if (!deepEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}

/**
 * useMemoizedSelector - Memoizes a selector function result
 * 
 * Similar to Redux's createSelector, but as a hook. Only recalculates
 * when the selected values actually change.
 * 
 * @param {Function} selector - Function that extracts/computes values
 * @param {Array} deps - Dependencies that trigger recalculation
 * @returns {any} The memoized selection result
 * 
 * @example
 * const activeUsers = useMemoizedSelector(
 *   (users) => users.filter(u => u.isActive).map(u => u.name),
 *   [users]
 * );
 */
export function useMemoizedSelector(selector, deps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => selector(deps), deps);
}

/**
 * Deep equality check for useMemoizedValue
 * @param {any} a - First value
 * @param {any} b - Second value
 * @returns {boolean} Whether values are deeply equal
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}
