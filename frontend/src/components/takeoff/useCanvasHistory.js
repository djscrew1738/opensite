import { useState, useCallback } from 'react';
import { MAX_HISTORY } from './canvasUtils';

// ---------------------------------------------------------------------------
// Custom hook — undo / redo history for measurements
// ---------------------------------------------------------------------------

export default function useCanvasHistory(onMeasurementsChange) {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((newMeasurements) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const next = [...trimmed, JSON.parse(JSON.stringify(newMeasurements))];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setHistoryIndex(prev => {
      const idx = Math.min(prev + 1, MAX_HISTORY - 1);
      return idx;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onMeasurementsChange(prev);
    }
  }, [history, historyIndex, onMeasurementsChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onMeasurementsChange(next);
    }
  }, [history, historyIndex, onMeasurementsChange]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return { pushHistory, undo, redo, canUndo, canRedo };
}
