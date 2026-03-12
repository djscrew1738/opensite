/**
 * useHaptic — Semantic haptic feedback patterns
 *
 * Maps named interactions to appropriate vibration patterns.
 * Gracefully degrades on devices without haptic support.
 */

const PATTERNS = {
  // Single taps
  tap:        [10],           // Light navigation tap
  select:     [15],           // Item selection
  confirm:    [20],           // Positive confirmation
  warning:    [30, 60, 30],   // Warning / destructive action
  error:      [40, 40, 40],   // Error / failure
  success:    [10, 50, 10],   // Task completed

  // Rhythmic patterns
  tick:       [5],            // Scroll tick / micro interaction
  doubleTap:  [10, 80, 10],   // Double-tap confirm
  longPress:  [40],           // Long press trigger

  // Notifications
  notification: [20, 40, 20],
  alert:        [30, 60, 30, 60],
};

/**
 * Returns true when the device supports navigator.vibrate
 */
function canVibrate() {
  return typeof window !== 'undefined' && 'vibrate' in window.navigator;
}

/**
 * useHaptic
 *
 * @returns {Object} haptic — { tap, select, confirm, warning, error, success,
 *                              tick, longPress, notification, fire }
 *
 * @example
 * const haptic = useHaptic();
 * <button onClick={haptic.confirm}>Save</button>
 */
export function useHaptic() {
  const fire = (pattern) => {
    if (!canVibrate()) return;
    window.navigator.vibrate(Array.isArray(pattern) ? pattern : [pattern]);
  };

  return {
    fire,
    tap:          () => fire(PATTERNS.tap),
    select:       () => fire(PATTERNS.select),
    confirm:      () => fire(PATTERNS.confirm),
    warning:      () => fire(PATTERNS.warning),
    error:        () => fire(PATTERNS.error),
    success:      () => fire(PATTERNS.success),
    tick:         () => fire(PATTERNS.tick),
    doubleTap:    () => fire(PATTERNS.doubleTap),
    longPress:    () => fire(PATTERNS.longPress),
    notification: () => fire(PATTERNS.notification),
    alert:        () => fire(PATTERNS.alert),
  };
}

export default useHaptic;
